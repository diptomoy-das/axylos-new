/**
 * Elsa X402 Payment Client
 * 
 * Handles x402 micropayment protocol for ELSA DeFi API calls.
 * Uses viem for signing (matching elsa-openclaw's approach).
 * Non-custodial: private keys never leave this process.
 * 
 * Reference: https://github.com/HeyElsa/elsa-openclaw
 * API: https://x402-api.heyelsa.ai
 */

const axios = require('axios');
const { ethers } = require('ethers');
const crypto = require('crypto');

// Budget tracking
const DEFAULT_BUDGET = {
    maxPerCall: 0.05,    // $0.05 max per API call
    maxPerDay: 2.0,      // $2.00 daily limit
    maxCallsPerMin: 30,  // 30 requests per minute
};

// Official tool costs from SKILL.md
const TOOL_COSTS = {
    elsa_search_token: 0.002,
    elsa_get_token_price: 0.002,
    elsa_get_balances: 0.002,
    elsa_get_portfolio: 0.002,
    elsa_analyze_wallet: 0.005,
    elsa_get_swap_quote: 0.002,
    elsa_execute_swap_dry_run: 0.005,
    elsa_get_limit_orders: 0.002,
    elsa_get_perp_positions: 0.002,
    elsa_get_transaction_history: 0.002,
    elsa_create_limit_order: 0.05,
    elsa_cancel_limit_order: 0.01,
    elsa_open_perp_position: 0.05,
    elsa_close_perp_position: 0.05,
    elsa_execute_swap_confirmed: 0.05,
    elsa_pipeline_get_status: 0.002,
    elsa_pipeline_submit_tx_hash: 0.005,
    elsa_pipeline_run_and_wait: 0.01,
    elsa_budget_status: 0.0,
};

class ElsaX402Client {
    /**
     * @param {Object} config
     * @param {string} config.paymentPrivateKey - Private key for x402 API payments
     * @param {string} [config.tradePrivateKey] - Separate key for signing trades (falls back to paymentPrivateKey)
     * @param {string} [config.apiUrl] - ELSA API URL
     * @param {string} [config.chain] - Default chain (base, ethereum, etc.)
     * @param {Object} [config.budget] - Budget limits
     */
    constructor(config) {
        this.apiUrl = config.apiUrl || 'https://x402-api.heyelsa.ai';
        this.chain = config.chain || 'base';

        // Payment wallet (for API micro-payments)
        this.paymentSigner = new ethers.Wallet(config.paymentPrivateKey);
        this.paymentAddress = this.paymentSigner.address;

        // Trade wallet (for actual swap execution)
        this.tradeSigner = config.tradePrivateKey
            ? new ethers.Wallet(config.tradePrivateKey)
            : this.paymentSigner;
        this.tradeAddress = this.tradeSigner.address;

        // Budget controls (matching elsa-openclaw defaults)
        this.budget = { ...DEFAULT_BUDGET, ...config.budget };

        // Session tracking
        this.session = {
            startTime: Date.now(),
            callCount: 0,
            totalSpent: 0,
            callLog: [],
            minuteCallTimestamps: [],
        };
    }

    // ─── Payment Token ──────────────────────────────────────────

    /**
     * Generate X402 payment token (signed by payment wallet)
     * Matches the x402-axios header format
     */
    async generatePaymentToken(endpoint, amount) {
        const payload = {
            endpoint,
            amount: ethers.parseUnits(amount.toString(), 6).toString(), // USDC (6 decimals)
            wallet: this.paymentAddress,
            nonce: Date.now(),
            chainId: 8453, // Base
            timestamp: Math.floor(Date.now() / 1000),
        };

        const message = JSON.stringify(payload);
        const signature = await this.paymentSigner.signMessage(message);

        const token = {
            header: { alg: 'ECDSA', typ: 'JWT', kid: this.paymentAddress },
            payload,
            signature,
        };

        return Buffer.from(JSON.stringify(token)).toString('base64');
    }

    // ─── Budget Check ───────────────────────────────────────────

    /**
     * Check if a call is within budget limits
     */
    checkBudget(toolName) {
        const cost = TOOL_COSTS[toolName] || 0.01;

        // Per-call limit
        if (cost > this.budget.maxPerCall) {
            throw new Error(`Tool ${toolName} cost ($${cost}) exceeds per-call limit ($${this.budget.maxPerCall})`);
        }

        // Daily limit
        if (this.session.totalSpent + cost > this.budget.maxPerDay) {
            throw new Error(`Daily budget limit reached ($${this.session.totalSpent.toFixed(4)} / $${this.budget.maxPerDay})`);
        }

        // Rate limit
        const now = Date.now();
        this.session.minuteCallTimestamps = this.session.minuteCallTimestamps.filter(t => now - t < 60000);
        if (this.session.minuteCallTimestamps.length >= this.budget.maxCallsPerMin) {
            throw new Error(`Rate limit exceeded (${this.budget.maxCallsPerMin} calls/minute)`);
        }

        return cost;
    }

    // ─── Core API Call ──────────────────────────────────────────

    /**
     * Make a paid API call to ELSA x402
     */
    async callTool(toolName, params) {
        const cost = this.checkBudget(toolName);

        try {
            const paymentToken = await this.generatePaymentToken(toolName, cost);

            const response = await axios.post(
                `${this.apiUrl}/api/${toolName}`,
                params,
                {
                    headers: {
                        'X-PAYMENT': paymentToken,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            // Track successful call
            const now = Date.now();
            this.session.callCount++;
            this.session.totalSpent += cost;
            this.session.minuteCallTimestamps.push(now);
            this.session.callLog.push({
                tool: toolName,
                cost,
                timestamp: now,
                success: true,
            });

            return {
                ok: true,
                data: response.data,
                billing: { estimated_cost_usd: cost, tool: toolName },
                meta: { latency_ms: Date.now() - now },
            };
        } catch (error) {
            // Track failed call (still counts for rate limiting)
            this.session.minuteCallTimestamps.push(Date.now());
            this.session.callLog.push({
                tool: toolName,
                cost: 0,
                timestamp: Date.now(),
                success: false,
                error: error.message,
            });

            if (error.response?.status === 402) {
                return {
                    ok: false,
                    error: 'Payment Required - Top up USDC at https://x402.heyelsa.ai/',
                    billing: { estimated_cost_usd: cost },
                };
            }

            return {
                ok: false,
                error: error.message,
                billing: { estimated_cost_usd: cost },
            };
        }
    }

    // ─── Read-Only Tools ────────────────────────────────────────

    async searchToken(query, limit = 10) {
        return this.callTool('elsa_search_token', { query, limit });
    }

    async getTokenPrice(tokenAddress, chain) {
        return this.callTool('elsa_get_token_price', {
            token_address: tokenAddress,
            chain: chain || this.chain,
        });
    }

    async getBalances(walletAddress) {
        return this.callTool('elsa_get_balances', {
            wallet_address: walletAddress || this.tradeAddress,
        });
    }

    async getPortfolio(walletAddress) {
        return this.callTool('elsa_get_portfolio', {
            wallet_address: walletAddress || this.tradeAddress,
        });
    }

    async analyzeWallet(walletAddress) {
        return this.callTool('elsa_analyze_wallet', {
            wallet_address: walletAddress || this.tradeAddress,
        });
    }

    async getSwapQuote(params) {
        return this.callTool('elsa_get_swap_quote', {
            from_chain: params.fromChain || this.chain,
            from_token: params.fromToken,
            from_amount: params.fromAmount.toString(),
            to_chain: params.toChain || this.chain,
            to_token: params.toToken,
            wallet_address: params.walletAddress || this.tradeAddress,
            slippage: params.slippage || 0.5,
        });
    }

    async executeSwapDryRun(params) {
        return this.callTool('elsa_execute_swap_dry_run', {
            from_chain: params.fromChain || this.chain,
            from_token: params.fromToken,
            from_amount: params.fromAmount.toString(),
            to_chain: params.toChain || this.chain,
            to_token: params.toToken,
            wallet_address: params.walletAddress || this.tradeAddress,
            slippage: params.slippage || 0.5,
        });
    }

    async getTransactionHistory(walletAddress, chain, limit = 20) {
        return this.callTool('elsa_get_transaction_history', {
            wallet_address: walletAddress || this.tradeAddress,
            chain: chain || this.chain,
            limit,
        });
    }

    async getLimitOrders(walletAddress, chain) {
        return this.callTool('elsa_get_limit_orders', {
            wallet_address: walletAddress || this.tradeAddress,
            chain: chain || this.chain,
        });
    }

    async getPerpPositions(walletAddress) {
        return this.callTool('elsa_get_perp_positions', {
            wallet_address: walletAddress || this.tradeAddress,
        });
    }

    async budgetStatus() {
        return {
            ok: true,
            data: {
                spent_today_usd: this.session.totalSpent,
                remaining_today_usd: this.budget.maxPerDay - this.session.totalSpent,
                calls_last_minute: this.session.minuteCallTimestamps.filter(t => Date.now() - t < 60000).length,
                total_calls: this.session.callCount,
                last_calls: this.session.callLog.slice(-5),
            },
        };
    }

    // ─── Execution Tools ────────────────────────────────────────

    async executeSwapConfirmed(params) {
        return this.callTool('elsa_execute_swap_confirmed', {
            from_chain: params.fromChain || this.chain,
            from_token: params.fromToken,
            from_amount: params.fromAmount.toString(),
            to_chain: params.toChain || this.chain,
            to_token: params.toToken,
            wallet_address: params.walletAddress || this.tradeAddress,
            slippage: params.slippage || 0.5,
            confirmation_token: params.confirmationToken,
        });
    }

    async pipelineGetStatus(pipelineId) {
        return this.callTool('elsa_pipeline_get_status', { pipeline_id: pipelineId });
    }

    async pipelineSubmitTxHash(taskId, txHash) {
        return this.callTool('elsa_pipeline_submit_tx_hash', {
            task_id: taskId,
            tx_hash: txHash,
        });
    }

    async pipelineRunAndWait(pipelineId, options = {}) {
        return this.callTool('elsa_pipeline_run_and_wait', {
            pipeline_id: pipelineId,
            timeout_seconds: options.timeout || 180,
            poll_interval_seconds: options.pollInterval || 3,
            mode: options.mode || 'local_signer',
        });
    }

    async createLimitOrder(params) {
        return this.callTool('elsa_create_limit_order', {
            wallet_address: params.walletAddress || this.tradeAddress,
            chain: params.chain || this.chain,
            from_token: params.fromToken,
            to_token: params.toToken,
            from_amount: params.fromAmount.toString(),
            limit_price: params.limitPrice.toString(),
            expiry_hours: params.expiryHours || 24,
        });
    }

    async cancelLimitOrder(orderId, walletAddress, chain) {
        return this.callTool('elsa_cancel_limit_order', {
            wallet_address: walletAddress || this.tradeAddress,
            order_id: orderId,
            chain: chain || this.chain,
        });
    }

    async openPerpPosition(params) {
        return this.callTool('elsa_open_perp_position', {
            wallet_address: params.walletAddress || this.tradeAddress,
            market: params.market,
            side: params.side,
            size_usd: params.sizeUsd.toString(),
            leverage: params.leverage || 1,
            take_profit: params.takeProfit?.toString(),
            stop_loss: params.stopLoss?.toString(),
        });
    }

    async closePerpPosition(positionId, closePercentage = 100) {
        return this.callTool('elsa_close_perp_position', {
            wallet_address: this.tradeAddress,
            position_id: positionId,
            close_percentage: closePercentage,
        });
    }

    // ─── 4-Step Swap Flow ───────────────────────────────────────

    /**
     * Execute the recommended 4-step swap flow:
     *   1. Get Quote → 2. Dry Run → 3. Confirm → 4. Execute Pipeline
     * 
     * @param {Object} params - Swap parameters
     * @param {boolean} [autoConfirm=false] - Skip user confirmation step
     * @returns {Object} Full swap result with all step data
     */
    async executeFullSwap(params, autoConfirm = false) {
        // Step 1: Get Quote
        const quote = await this.getSwapQuote(params);
        if (!quote.ok) return { step: 1, error: quote.error, quote };

        // Step 2: Dry Run
        const dryRun = await this.executeSwapDryRun(params);
        if (!dryRun.ok) return { step: 2, error: dryRun.error, quote, dryRun };

        const pipelineId = dryRun.data?.pipeline_id;
        const confirmationToken = dryRun.data?.confirmation_token;

        if (!autoConfirm) {
            // Return for user confirmation
            return {
                step: 3,
                status: 'awaiting_confirmation',
                quote,
                dryRun,
                pipelineId,
                confirmationToken,
                message: 'Dry run successful. Call confirmSwap() to execute.',
            };
        }

        // Step 4: Execute Pipeline
        if (pipelineId) {
            const execution = await this.pipelineRunAndWait(pipelineId);
            return {
                step: 4,
                status: execution.ok ? 'completed' : 'failed',
                quote,
                dryRun,
                execution,
                pipelineId,
            };
        } else {
            // Fallback: confirmed swap
            const confirmed = await this.executeSwapConfirmed({
                ...params,
                confirmationToken,
            });
            return {
                step: 4,
                status: confirmed.ok ? 'completed' : 'failed',
                quote,
                dryRun,
                execution: confirmed,
            };
        }
    }

    // ─── Session Info ───────────────────────────────────────────

    getSessionStats() {
        return {
            totalSpent: this.session.totalSpent,
            callCount: this.session.callCount,
            uptimeMs: Date.now() - this.session.startTime,
            remainingBudget: this.budget.maxPerDay - this.session.totalSpent,
            paymentWallet: this.paymentAddress,
            tradeWallet: this.tradeAddress,
        };
    }
}

module.exports = { ElsaX402Client, TOOL_COSTS, DEFAULT_BUDGET };
