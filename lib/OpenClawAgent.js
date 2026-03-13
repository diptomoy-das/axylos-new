/**
 * OpenClaw Agent
 * 
 * Autonomous trading agent that uses ELSA X402 tools for DeFi operations.
 * Implements buyer and seller negotiation logic with the real OpenClaw tool catalog.
 * 
 * Tools used:
 * - elsa_get_token_price → Market price discovery
 * - elsa_get_swap_quote → Optimal routing + pricing
 * - elsa_execute_swap_dry_run → Simulation
 * - elsa_pipeline_run_and_wait → Execution
 * - elsa_get_portfolio → Portfolio analysis
 * - elsa_analyze_wallet → Risk assessment
 * - elsa_create_limit_order → Limit orders
 * - elsa_open_perp_position → Perpetual futures
 * 
 * Reference: https://github.com/HeyElsa/elsa-openclaw
 */

const crypto = require('crypto');
const axios = require('axios'); // Added for Groq API

if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY not set — AI brain disabled, using fallback');
}
class OpenClawAgent {
    /**
     * @param {string} type - 'buyer' or 'seller'
     * @param {import('./ElsaX402PaymentClient').ElsaX402Client} elsa - ELSA client
     * @param {Object} [config] - Agent configuration
     */
    constructor(type, elsa, config = {}) {
        this.type = type;
        this.elsa = elsa;
        this.chain = config.chain || 'base';
        this.trades = [];
        this.createdAt = Date.now();

        // Agent strategy config
        this.config = {
            budget: config.budget || 10000,
            acceptableGapPercent: config.acceptableGapPercent || 5,
            counterGapPercent: config.counterGapPercent || 20,
            maxNegotiationRounds: config.maxNegotiationRounds || 50,
            executionMode: config.executionMode || 'dry_run', // 'dry_run' | 'confirmed'
            ...config,
        };
    }

    // ─── Trade Decision Logic ───────────────────────────────────

    /**
     * Decide whether to accept, counter, or reject a trade proposal.
     * Uses real ELSA price data when available.
     */
    async decideOnTrade(proposal) {
        let marketPrice;
        const maxRetries = 2;
        const baseDelay = 500;
        let priceSuccess = false;
        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const priceResult = await this.elsa.getTokenPrice(
                    proposal.toTokenAddress || proposal.toToken,
                    proposal.chain || this.chain
                );

                if (priceResult.ok && priceResult.data) {
                    marketPrice = parseFloat(
                        priceResult.data.current_price ||
                        priceResult.data.price ||
                        priceResult.data.usd_price
                    );
                    if (!isNaN(marketPrice) && marketPrice > 0) {
                        priceSuccess = true;
                        break;
                    }
                } else if (!priceResult.ok) {
                    lastError = new Error(priceResult.error || 'Failed to fetch price');
                }
            } catch (error) {
                lastError = error;
            }
            if (!priceSuccess && attempt < maxRetries) {
                await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
            }
        }

        if (!priceSuccess) {
            return {
                decision: 'REJECT',
                error: 'price_unavailable',
                reason: lastError ? `Failed fetching price: ${lastError.message}` : 'Could not fetch a valid market price from ELSA API after retries.',
                source: 'heyelsa.ai'
            };
        }

        const offerPrice = proposal.maxPrice || proposal.minPrice || marketPrice;

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return this._fallbackDecision(offerPrice, marketPrice, proposal);
        }

        try {
            const lastCounter = this.trades.length > 0 ? (this.trades[this.trades.length - 1].proposal.maxPrice || 'none') : 'none';
            const systemPrompt = "You are a DeFi trade negotiation agent. Respond only in JSON.";
            const userPrompt = `Role: ${this.type}. My budget: ${this.config.budget}. Their offer: ${offerPrice}.
Last counter: ${lastCounter}. Token market price: ${marketPrice}.
Decide: accept, counter with a price, or reject. JSON only. Format: { "action": "accept"|"counter"|"reject", "price": number, "reasoning": "string" }`;

            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.1-70b-versatile',
                    max_tokens: 256,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'content-type': 'application/json'
                    }
                }
            );

            const content = response.data.choices[0].message.content;
            let jsonString = content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            }
            const decisionData = JSON.parse(jsonString);

            return {
                decision: decisionData.action.toUpperCase(),
                reason: decisionData.reasoning,
                price: decisionData.price || offerPrice,
                marketPrice
            };
        } catch (error) {
            console.error('Claude API call failed, falling back to basic logic:', error.message);
            return this._fallbackDecision(offerPrice, marketPrice, proposal);
        }
    }

    _fallbackDecision(offerPrice, marketPrice, proposal) {
        const gap = Math.abs(marketPrice - offerPrice);
        const gapPercent = marketPrice > 0 ? (gap / marketPrice) * 100 : 0;
        if (this.type === 'buyer') {
            return this._buyerDecision(offerPrice, marketPrice, gapPercent, proposal);
        } else {
            return this._sellerDecision(offerPrice, marketPrice, gapPercent, proposal);
        }
    }

    _buyerDecision(offerPrice, marketPrice, gapPercent, proposal) {
        if (offerPrice >= this.config.budget) {
            return {
                decision: 'REJECT',
                reason: `Price $${offerPrice} exceeds budget $${this.config.budget}`,
                price: marketPrice,
                marketPrice,
            };
        }

        if (gapPercent < this.config.acceptableGapPercent) {
            return {
                decision: 'ACCEPT',
                reason: `Market price $${marketPrice}, gap ${gapPercent.toFixed(1)}% < ${this.config.acceptableGapPercent}%`,
                price: offerPrice,
                marketPrice,
            };
        } else if (gapPercent < this.config.counterGapPercent) {
            const counterPrice = (offerPrice + marketPrice) / 2;
            return {
                decision: 'COUNTER',
                reason: `Countering to midpoint $${counterPrice.toFixed(2)}`,
                price: counterPrice,
                marketPrice,
            };
        } else {
            return {
                decision: 'COUNTER',
                reason: `Gap ${gapPercent.toFixed(1)}% too large, improving offer by 5%`,
                price: offerPrice * 1.05,
                marketPrice,
            };
        }
    }

    _sellerDecision(offerPrice, marketPrice, gapPercent, proposal) {
        const minPrice = proposal.minPrice || this.config.budget * 0.9;

        if (offerPrice < minPrice) {
            return {
                decision: 'REJECT',
                reason: `Offer $${offerPrice} below minimum $${minPrice}`,
                price: marketPrice,
                marketPrice,
            };
        }

        if (gapPercent < this.config.acceptableGapPercent) {
            return {
                decision: 'ACCEPT',
                reason: `Price $${offerPrice} acceptable, gap ${gapPercent.toFixed(1)}%`,
                price: offerPrice,
                marketPrice,
            };
        } else {
            const counterPrice = offerPrice * 1.05;
            return {
                decision: 'COUNTER',
                reason: `Asking 5% higher: $${counterPrice.toFixed(2)}`,
                price: counterPrice,
                marketPrice,
            };
        }
    }

    // ─── Trade Execution ────────────────────────────────────────

    /**
     * Execute a trade using the 4-step ELSA swap flow:
     *   1. Get Quote
     *   2. Dry Run
     *   3. (Optional) User Confirmation
     *   4. Execute Pipeline
     */
    async executeTrade(proposal) {
        const tradeId = crypto.randomBytes(8).toString('hex');

        try {
            // Use the full swap flow
            const result = await this.elsa.executeFullSwap({
                fromToken: proposal.fromToken || proposal.fromTokenAddress,
                toToken: proposal.toToken || proposal.toTokenAddress,
                fromAmount: proposal.amount,
                fromChain: proposal.chain || this.chain,
                toChain: proposal.chain || this.chain,
                slippage: proposal.slippage || 0.5,
            }, this.config.executionMode === 'confirmed');

            const trade = {
                id: tradeId,
                proposal,
                result,
                timestamp: Date.now(),
                status: result.status || (result.step < 4 ? 'DRY_RUN' : 'EXECUTED'),
                agentType: this.type,
            };

            this.trades.push(trade);

            return {
                success: result.step >= 2,
                tradeId,
                step: result.step,
                status: trade.status,
                quote: result.quote,
                dryRun: result.dryRun,
                execution: result.execution,
                pipelineId: result.pipelineId,
                confirmationToken: result.confirmationToken,
                message: result.message || (result.step >= 4 ? 'Trade executed' : 'Dry run completed'),
            };
        } catch (error) {
            return {
                success: false,
                tradeId,
                error: error.message,
            };
        }
    }

    // ─── Limit Orders ──────────────────────────────────────────

    /**
     * Create a limit order via ELSA
     */
    async createLimitOrder(params) {
        return this.elsa.createLimitOrder({
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.amount,
            limitPrice: params.limitPrice,
            chain: params.chain || this.chain,
            expiryHours: params.expiryHours || 24,
        });
    }

    /**
     * Get active limit orders
     */
    async getLimitOrders(walletAddress) {
        return this.elsa.getLimitOrders(walletAddress);
    }

    // ─── Perpetual Futures ──────────────────────────────────────

    /**
     * Open a perpetual futures position
     */
    async openPerpPosition(params) {
        return this.elsa.openPerpPosition({
            market: params.market,
            side: params.side,
            sizeUsd: params.sizeUsd,
            leverage: params.leverage || 1,
            takeProfit: params.takeProfit,
            stopLoss: params.stopLoss,
        });
    }

    /**
     * Close a perp position
     */
    async closePerpPosition(positionId, closePercent = 100) {
        return this.elsa.closePerpPosition(positionId, closePercent);
    }

    /**
     * Get open perp positions
     */
    async getPerpPositions(walletAddress) {
        return this.elsa.getPerpPositions(walletAddress);
    }

    // ─── Agent Status ───────────────────────────────────────────

    async getStatus() {
        let portfolio;
        try {
            const result = await this.elsa.getPortfolio();
            if (result.ok) portfolio = result.data;
            else throw new Error(result.error || 'Failed to fetch portfolio');
        } catch (error) {
            portfolio = { error: 'upstream_failure', detail: error.message };
        }

        return {
            type: this.type,
            chain: this.chain,
            executionMode: this.config.executionMode,
            portfolio,
            totalTrades: this.trades.length,
            recentTrades: this.trades.slice(-5),
            lastUpdate: Date.now(),
            uptime: Date.now() - this.createdAt,
            sessionStats: this.elsa.getSessionStats(),
        };
    }

    getTradeHistory(limit) {
        if (limit) return this.trades.slice(-limit);
        return [...this.trades];
    }
}

module.exports = { OpenClawAgent };
