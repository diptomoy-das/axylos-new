/**
 * Express Router for OpenClaw + Agent DNS Settlement
 * 
 * Exposes all ELSA x402 tools as REST endpoints plus
 * Agent DNS negotiation and natural language commands.
 * 
 * Tools reference: https://github.com/HeyElsa/elsa-openclaw/blob/main/SKILL.md
 */

const express = require('express');

/**
 * @param {import('./ElsaX402PaymentClient').ElsaX402Client} elsa
 * @param {import('./OpenClawAgent').OpenClawAgent} agent
 * @param {Object} config
 */
function createRouter(elsa, agent, config) {
    const router = express.Router();

    // ─── Health & Status ────────────────────────────────────────

    router.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            agentType: agent.type,
            chain: agent.chain,
            walletAddress: elsa.paymentAddress,
            tradeWallet: elsa.tradeAddress,
            uptime: Math.round((Date.now() - elsa.session.startTime) / 1000),
            elsa: {
                apiUrl: elsa.apiUrl,
                dashboard: 'https://x402.heyelsa.ai/',
                docs: 'https://x402.heyelsa.ai/docs',
                connected: true,
            },
        });
    });

    router.get('/agent/status', async (req, res) => {
        try {
            const status = await agent.getStatus();
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/budget/status', async (req, res) => {
        try {
            const budget = await elsa.budgetStatus();
            res.json({
                apiUrl: elsa.apiUrl,
                dashboard: 'https://x402.heyelsa.ai/',
                walletAddress: elsa.paymentAddress,
                chain: agent.chain,
                sessionStats: {
                    ...budget.data,
                    totalSpent: elsa.session.totalSpent,
                    callCount: elsa.session.callCount,
                },
                costPerOperation: {
                    getPrice: '$0.002',
                    getPortfolio: '$0.002',
                    getSwapQuote: '$0.002',
                    executeSwap: '$0.005 (dry-run) or $0.05 (confirmed)',
                    analyzeWallet: '$0.005',
                    getYieldSuggestions: '$0.002',
                    createLimitOrder: '$0.05',
                    openPerpPosition: '$0.05',
                },
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ─── Token & Portfolio Tools ────────────────────────────────

    router.get('/search/:query', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const result = await elsa.searchToken(req.params.query, limit);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/price/:token', async (req, res) => {
        try {
            const chain = req.query.chain || agent.chain;
            const result = await elsa.getTokenPrice(req.params.token, chain);

            if (!result.ok) {
                return res.status(502).json({
                    error: 'upstream_failure',
                    detail: result.error || 'Price unavailable'
                });
            }
            res.json({
                ok: true,
                token: req.params.token,
                price: result.data.current_price || result.data.price,
                data: result.data,
                cost: result.billing?.estimated_cost_usd,
                chain,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/portfolio', async (req, res) => {
        try {
            const wallet = req.query.wallet || elsa.tradeAddress;
            const [portfolio, analysis] = await Promise.all([
                elsa.getPortfolio(wallet),
                elsa.analyzeWallet(wallet),
            ]);
            res.json({
                portfolio: portfolio.ok ? portfolio.data : { status: 'demo mode' },
                analysis: analysis.ok ? analysis.data : { status: 'demo mode' },
                totalCost: 0.007, // portfolio + analyze
                endpoint: 'portfolio analysis',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/balances', async (req, res) => {
        try {
            const wallet = req.query.wallet || elsa.tradeAddress;
            const result = await elsa.getBalances(wallet);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/transactions', async (req, res) => {
        try {
            const wallet = req.query.wallet || elsa.tradeAddress;
            const chain = req.query.chain || agent.chain;
            const limit = parseInt(req.query.limit) || 20;
            const result = await elsa.getTransactionHistory(wallet, chain, limit);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ─── Trading ────────────────────────────────────────────────

    router.post('/quote/swap', async (req, res) => {
        const { fromToken, toToken, amount, chain, slippage } = req.body;
        if (!fromToken || !toToken || !amount) {
            return res.status(400).json({ error: 'Missing required fields: fromToken, toToken, amount' });
        }
        try {
            const result = await elsa.getSwapQuote({
                fromToken,
                toToken,
                fromAmount: amount,
                fromChain: chain || agent.chain,
                toChain: chain || agent.chain,
                slippage: slippage || 0.5,
            });
            res.json({
                ...result,
                fromToken,
                toToken,
                amount,
                chain: chain || agent.chain,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/trade/propose', async (req, res) => {
        const { fromToken, toToken, amount, maxPrice, minPrice } = req.body;
        if (!fromToken || !toToken || !amount) {
            return res.status(400).json({ error: 'Missing required fields: fromToken, toToken, amount' });
        }
        try {
            const proposal = {
                fromToken,
                toToken,
                amount,
                chain: agent.chain,
                maxPrice: maxPrice || Infinity,
                minPrice: minPrice || 0,
            };
            const decision = await agent.decideOnTrade(proposal);
            res.json({
                proposal,
                agentType: agent.type,
                decision,
                costForAnalysis: 0.002,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/trade/execute', async (req, res) => {
        const { fromToken, toToken, amount, slippage } = req.body;
        if (!fromToken || !toToken || !amount) {
            return res.status(400).json({ error: 'Missing required fields: fromToken, toToken, amount' });
        }
        try {
            const result = await agent.executeTrade({
                fromToken, toToken, amount,
                chain: agent.chain,
                slippage: slippage || 0.5,
            });
            res.json({
                execution: result,
                costForDryRun: 0.007,
                costForConfirmed: 0.05,
                ready: result.success,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/trades', (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        res.json({
            count: agent.trades.length,
            trades: agent.getTradeHistory(limit),
            agentType: agent.type,
        });
    });

    // ─── Limit Orders ──────────────────────────────────────────

    router.post('/limit-order', async (req, res) => {
        const { fromToken, toToken, amount, limitPrice, expiryHours } = req.body;
        if (!fromToken || !toToken || !amount || !limitPrice) {
            return res.status(400).json({ error: 'Missing required fields: fromToken, toToken, amount, limitPrice' });
        }
        try {
            const result = await agent.createLimitOrder({
                fromToken, toToken, amount, limitPrice,
                expiryHours: expiryHours || 24,
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/limit-orders', async (req, res) => {
        try {
            const result = await agent.getLimitOrders(req.query.wallet);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ─── Perpetual Futures ─────────────────────────────────────

    router.post('/perp/open', async (req, res) => {
        const { market, side, sizeUsd, leverage, takeProfit, stopLoss } = req.body;
        if (!market || !side || !sizeUsd) {
            return res.status(400).json({ error: 'Missing required fields: market, side, sizeUsd' });
        }
        try {
            const result = await agent.openPerpPosition({
                market, side, sizeUsd,
                leverage: leverage || 1,
                takeProfit, stopLoss,
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/perp/close', async (req, res) => {
        const { positionId, closePercentage } = req.body;
        if (!positionId) {
            return res.status(400).json({ error: 'Missing required field: positionId' });
        }
        try {
            const result = await agent.closePerpPosition(positionId, closePercentage || 100);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/perp/positions', async (req, res) => {
        try {
            const result = await agent.getPerpPositions(req.query.wallet);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ─── Yield ─────────────────────────────────────────────────

    router.get('/yield/suggestions', async (req, res) => {
        try {
            const wallet = req.query.wallet || elsa.tradeAddress;
            const result = await elsa.analyzeWallet(wallet);
            res.json({
                suggestions: result.ok ? result.data : [
                    { protocol: 'Aave', token: 'USDC', apy: 8.5, risk: 'low' },
                    { protocol: 'Curve', token: 'USDC', apy: 12.3, risk: 'medium' },
                ],
                cost: 0.005,
                chain: agent.chain,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // ─── OpenClaw Natural Language ──────────────────────────────

    router.post('/openclaw/command', async (req, res) => {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ error: 'Missing required field: command' });
        }
        try {
            const lc = command.toLowerCase();

            // Price queries
            if (lc.includes('price') || lc.match(/\b(weth|eth|btc|usdc)\b/)) {
                const tokenMatch = lc.match(/\b(weth|wbtc|usdc|dai|link|uni|aave|matic)\b/i);
                const token = tokenMatch ? tokenMatch[1].toUpperCase() : 'WETH';
                const result = await elsa.getTokenPrice(token);
                return res.json({
                    command,
                    action: 'get_price',
                    response: result.ok
                        ? `${token}: $${result.data?.current_price || result.data?.price || result.data?.usd_price}`
                        : `${token}: price unavailable`,
                    data: result.data,
                    cost: 0.002,
                });
            }

            // Portfolio queries
            if (lc.includes('portfolio') || lc.includes('balance') || lc.includes('wallet')) {
                const result = await elsa.getPortfolio();
                return res.json({
                    command,
                    action: 'get_portfolio',
                    response: result.ok ? result.data : { status: 'demo mode' },
                    cost: 0.002,
                });
            }

            // Yield / farming queries
            if (lc.includes('yield') || lc.includes('farm') || lc.includes('apy')) {
                const result = await elsa.analyzeWallet();
                return res.json({
                    command,
                    action: 'analyze_yield',
                    response: result.ok ? result.data : [{ protocol: 'Aave', apy: 8.5 }],
                    cost: 0.005,
                });
            }

            // Swap / trade queries
            if (lc.includes('swap') || lc.includes('trade') || lc.includes('buy') || lc.includes('sell')) {
                return res.json({
                    command,
                    action: 'trade',
                    response: 'Use the trading endpoints for swaps:',
                    hint: 'POST /trade/propose or POST /trade/execute with fromToken, toToken, amount',
                    endpoints: {
                        propose: 'POST /trade/propose',
                        execute: 'POST /trade/execute',
                        quote: 'POST /quote/swap',
                        limitOrder: 'POST /limit-order',
                    },
                });
            }

            // Perp queries
            if (lc.includes('perp') || lc.includes('futures') || lc.includes('leverage') || lc.includes('long') || lc.includes('short')) {
                return res.json({
                    command,
                    action: 'perpetuals',
                    response: 'Use the perpetuals endpoints:',
                    endpoints: {
                        open: 'POST /perp/open',
                        close: 'POST /perp/close',
                        positions: 'GET /perp/positions',
                    },
                });
            }

            // Search queries
            if (lc.includes('search') || lc.includes('find') || lc.includes('token')) {
                const queryMatch = lc.match(/(?:search|find)\s+(\w+)/);
                if (queryMatch) {
                    const result = await elsa.searchToken(queryMatch[1]);
                    return res.json({ command, action: 'search', data: result.data, cost: 0.002 });
                }
            }

            // Unknown command
            res.json({
                command,
                response: 'Command received. Available commands:',
                availableCommands: [
                    'Check price of WETH',
                    'Show my portfolio',
                    'Get yield suggestions',
                    'Swap USDC to WETH',
                    'Open long ETH position',
                    'Search token USDC',
                    'Check budget status',
                ],
                elsaDocs: 'https://x402.heyelsa.ai/docs',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = { createRouter };
