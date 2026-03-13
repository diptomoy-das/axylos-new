#!/usr/bin/env node

/**
 * OpenClaw + Agent DNS Settlement Integration
 * CORRECT VERSION - Uses x402-axios interceptor as per official ELSA docs
 *
 * Official docs: https://x402.heyelsa.ai/docs
 * ELSA API: https://x402-api.heyelsa.ai/api/
 */

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
require('dotenv').config();

// ─── x402-axios + viem imports ─────────────────────────────────────────────
let withPaymentInterceptor, createWalletClient, http, base, privateKeyToAccount;
try {
  ({ withPaymentInterceptor } = require('x402-axios'));
  ({ createWalletClient, http } = require('viem'));
  ({ base } = require('viem/chains'));
  ({ privateKeyToAccount } = require('viem/accounts'));
} catch (e) {
  console.error('❌ Missing x402-axios or viem. Run: npm install x402-axios viem');
  process.exit(1);
}

// ============ CONFIG ============
const argv = yargs(hideBin(process.argv))
  .option('agent-type', { default: process.env.AGENT_TYPE || 'buyer', type: 'string' })
  .option('chain', { default: process.env.CHAIN || 'base', type: 'string' })
  .option('port', { default: parseInt(process.env.PORT) || 8080, type: 'number' })
  .option('elsa-api-url', { default: process.env.ELSA_API_URL || 'https://x402-api.heyelsa.ai', type: 'string' })
  .option('private-key', { type: 'string' })
  .option('wallet-address', { type: 'string' })
  .argv;

const AGENT_TYPE = argv['agent-type'];
const CHAIN = argv.chain;
const PORT = argv.port;
const ELSA_API_URL = argv['elsa-api-url'];

// Normalize private key to have 0x prefix
const rawKey = argv['private-key'] || process.env.PRIVATE_KEY || crypto.randomBytes(32).toString('hex');
const PRIVATE_KEY = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`);

// Known token addresses on Base
const TOKEN_ADDRESSES = {
  WETH: '0x4200000000000000000000000000000000000006',
  ETH:  '0x4200000000000000000000000000000000000006',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  DAI:  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
  LINK: '0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196',
  UNI:  '0xc3de830ea07524a0761646a6a4e4be0e114a3c83',
  AAVE: '0xa89b728708Be04f57c7a33C6a6d4b4b9A64e0D24',
};

// Resolve symbol → address (or return as-is if already an address)
function resolveTokenAddress(symbolOrAddress) {
  if (!symbolOrAddress) return symbolOrAddress;
  if (symbolOrAddress.startsWith('0x')) return symbolOrAddress;
  const upper = symbolOrAddress.toUpperCase();
  return TOKEN_ADDRESSES[upper] || symbolOrAddress;
}

// Session tracking
const session = {
  startTime: Date.now(),
  apiCalls: 0,
  totalCost: 0,
  trades: [],
};

// ============ ELSA X402 CLIENT (Official pattern) ============
function createElsaClient() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  // Create axios instance with x402 payment interceptor
  const client = withPaymentInterceptor(
    axios.create({ baseURL: ELSA_API_URL }),
    walletClient
  );

  return {
    walletAddress: account.address,
    client,
    async callAPI(endpoint, data, cost = 0.002) {
      session.apiCalls++;
      session.totalCost += cost;
      try {
        const response = await client.post(`/api/${endpoint}`, data);
        return { ok: true, data: response.data, cost };
      } catch (error) {
        const status = error.response?.status;
        const detail = error.response?.data || error.message;
        return {
          ok: false,
          error: typeof detail === 'string' ? detail : JSON.stringify(detail),
          status,
          cost,
        };
      }
    },
    async getTokenPrice(tokenSymbolOrAddress, chain) {
      const addr = resolveTokenAddress(tokenSymbolOrAddress);
      return this.callAPI('get_token_price', { token_address: addr, chain: chain || CHAIN }, 0.002);
    },
    async searchToken(query, limit = 10) {
      return this.callAPI('search_token', { symbol_or_address: query, limit }, 0.002);
    },
    async getPortfolio(walletAddress) {
      return this.callAPI('get_portfolio', { wallet_address: walletAddress || this.walletAddress }, 0.002);
    },
    async getBalances(walletAddress) {
      return this.callAPI('get_balances', { wallet_address: walletAddress || this.walletAddress }, 0.002);
    },
    async analyzeWallet(walletAddress) {
      return this.callAPI('analyze_wallet', { wallet_address: walletAddress || this.walletAddress }, 0.005);
    },
    async getSwapQuote(fromToken, toToken, amount, chain) {
      return this.callAPI('get_swap_quote', {
        from_chain: chain || CHAIN,
        from_token: resolveTokenAddress(fromToken),
        to_token: resolveTokenAddress(toToken),
        from_amount: amount.toString(),
        wallet_address: this.walletAddress,
        slippage: 2.0,
      }, 0.002);
    },
    async executeSwapDryRun(fromToken, toToken, amount, chain) {
      return this.callAPI('execute_swap', {
        from_chain: chain || CHAIN,
        from_token: resolveTokenAddress(fromToken),
        to_token: resolveTokenAddress(toToken),
        from_amount: amount.toString(),
        wallet_address: this.walletAddress,
        slippage: 2.0,
        dry_run: true,
      }, 0.005);
    },
    async getTransactionHistory(walletAddress, chain, limit = 20) {
      return this.callAPI('get_transaction_history', {
        wallet_address: walletAddress || this.walletAddress,
        chain: chain || CHAIN,
        limit,
      }, 0.002);
    },
    async getLimitOrders(walletAddress) {
      return this.callAPI('get_limit_orders', {
        wallet_address: walletAddress || this.walletAddress,
      }, 0.002);
    },
    async getPerpPositions(walletAddress) {
      return this.callAPI('get_perp_positions', {
        wallet_address: walletAddress || this.walletAddress,
      }, 0.002);
    },
    async getYieldSuggestions(walletAddress) {
      return this.callAPI('get_yield_suggestions', {
        wallet_address: walletAddress || this.walletAddress,
      }, 0.002);
    },
    async createLimitOrder(fromToken, toToken, amount, limitPrice, expiryHours = 24) {
      return this.callAPI('create_limit_order', {
        from_chain: CHAIN,
        from_token: resolveTokenAddress(fromToken),
        to_token: resolveTokenAddress(toToken),
        from_amount: amount.toString(),
        limit_price: limitPrice.toString(),
        wallet_address: this.walletAddress,
        valid_for_hours: expiryHours,
        dry_run: false,
      }, 0.05);
    },
    async openPerpPosition(market, side, sizeUsd, leverage, takeProfit, stopLoss) {
      return this.callAPI('open_perp_position', {
        wallet_address: this.walletAddress,
        market,
        side,
        size_usd: sizeUsd.toString(),
        leverage: leverage || 1,
        take_profit: takeProfit?.toString(),
        stop_loss: stopLoss?.toString(),
      }, 0.05);
    },
    async closePerpPosition(positionId, closePercentage = 100) {
      return this.callAPI('close_perp_position', {
        wallet_address: this.walletAddress,
        position_id: positionId,
        close_percentage: closePercentage,
      }, 0.05);
    },
    getBudgetStatus() {
      return {
        spent_today_usd: session.totalCost,
        remaining_usd: Math.max(0, 2.0 - session.totalCost),
        api_calls: session.apiCalls,
        uptime_seconds: Math.round((Date.now() - session.startTime) / 1000),
        trades: session.trades.length,
      };
    },
  };
}

// ============ OPENCLAW AGENT ============
class OpenClawAgent {
  constructor(type, elsa) {
    this.type = type;
    this.elsa = elsa;
    this.trades = [];
    this.config = { budget: 10000, acceptableGapPercent: 5, counterGapPercent: 20 };
  }

  async decideOnTrade(proposal) {
    const priceResult = await this.elsa.getTokenPrice(proposal.toToken);
    if (!priceResult.ok) {
      return { decision: 'REJECT', reason: `Price unavailable: ${priceResult.error}`, source: 'error' };
    }

    const marketPrice = parseFloat(
      priceResult.data?.current_price || priceResult.data?.price || priceResult.data?.usd_price ||
      priceResult.data?.result?.price || priceResult.data?.result?.current_price
    );

    if (!marketPrice || isNaN(marketPrice)) {
      return { decision: 'REJECT', reason: 'Cannot parse market price from ELSA response', raw: priceResult.data };
    }

    const offerPrice = proposal.maxPrice || proposal.minPrice || marketPrice;
    const gap = Math.abs(marketPrice - offerPrice);
    const gapPercent = (gap / marketPrice) * 100;

    // Try Groq AI
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        const gRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.1-70b-versatile',
            max_tokens: 256,
            messages: [
              { role: 'system', content: 'You are a DeFi trade negotiation agent. Respond only in JSON.' },
              {
                role: 'user',
                content: `Role: ${this.type}. Budget: $${this.config.budget}. Their offer: $${offerPrice}. Market price: $${marketPrice}. Gap: ${gapPercent.toFixed(1)}%.
Decide: accept, counter, or reject. Format: { "action": "accept"|"counter"|"reject", "price": number, "reasoning": "string" }`
              }
            ]
          },
          { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        const m = gRes.data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (m) {
          const d = JSON.parse(m[0]);
          return { decision: d.action.toUpperCase(), reason: d.reasoning, price: d.price || offerPrice, marketPrice, source: 'groq-ai' };
        }
      } catch (e) {
        console.warn('⚠️  Groq fallback to rules:', e.message.substring(0, 60));
      }
    }

    // Rule-based fallback
    if (gapPercent < this.config.acceptableGapPercent) {
      return { decision: 'ACCEPT', reason: `Gap ${gapPercent.toFixed(1)}% within threshold`, price: offerPrice, marketPrice, source: 'rules' };
    } else if (gapPercent < this.config.counterGapPercent) {
      return { decision: 'COUNTER', reason: `Counter to midpoint $${((offerPrice + marketPrice) / 2).toFixed(2)}`, price: (offerPrice + marketPrice) / 2, marketPrice, source: 'rules' };
    }
    return { decision: 'COUNTER', reason: `Gap too large, improving 5%`, price: offerPrice * 1.05, marketPrice, source: 'rules' };
  }

  async executeTrade(proposal) {
    const tradeId = crypto.randomBytes(8).toString('hex');
    const result = await this.elsa.executeSwapDryRun(proposal.fromToken, proposal.toToken, proposal.amount, proposal.chain);
    const trade = {
      id: tradeId, proposal, result: result.ok ? result.data : null,
      error: result.ok ? null : result.error, timestamp: Date.now(),
      status: result.ok ? 'DRY_RUN_SUCCESS' : 'FAILED',
    };
    this.trades.push(trade);
    session.trades.push(trade);
    return {
      success: result.ok, tradeId, status: trade.status,
      dryRunResult: result.data, error: result.error,
      message: result.ok ? 'Dry-run simulation succeeded. Ready for confirmed execution.' : `Failed: ${result.error}`,
    };
  }

  async getStatus() {
    const portfolio = await this.elsa.getPortfolio();
    return {
      type: this.type, chain: CHAIN, walletAddress: this.elsa.walletAddress,
      portfolio: portfolio.ok ? portfolio.data : { error: portfolio.error },
      totalTrades: this.trades.length, recentTrades: this.trades.slice(-5),
      sessionCost: session.totalCost, apiCalls: session.apiCalls, uptime: Date.now() - session.startTime,
    };
  }
}

// ============ EXPRESS APP ============
const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Upstream failure logger
app.use((req, res, next) => {
  const orig = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 500 || res.statusCode === 502) {
      const log = `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode}: ${body?.detail || body?.error || ''}\n`;
      fs.appendFileSync('upstream_failures.log', log);
    }
    return orig(body);
  };
  next();
});

// ─── Init ──────────────────────────────────────────────────────────────────

let elsa, agent;
try {
  elsa = createElsaClient();
  agent = new OpenClawAgent(AGENT_TYPE, elsa);
} catch (e) {
  console.error('❌ Failed to initialize ELSA client:', e.message);
  process.exit(1);
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           OpenClaw + Agent DNS (ELSA X402)                     ║
╠════════════════════════════════════════════════════════════════╣
║  Agent: ${AGENT_TYPE.toUpperCase().padEnd(51)}║
║  Chain: ${CHAIN.padEnd(51)}║
║  Wallet: ${elsa.walletAddress.substring(0, 42).padEnd(50)}║
║  ELSA:  ${ELSA_API_URL.padEnd(51)}║
╚════════════════════════════════════════════════════════════════╝
`);

// ─── Health ─────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy', agentType: AGENT_TYPE, chain: CHAIN,
    walletAddress: elsa.walletAddress,
    uptime: Math.round((Date.now() - session.startTime) / 1000),
    elsa: { apiUrl: ELSA_API_URL, dashboard: 'https://x402.heyelsa.ai/', docs: 'https://x402.heyelsa.ai/docs' },
    endpoints: [
      'GET /health', 'GET /budget/status', 'GET /agent/status',
      'GET /price/:token (symbol or 0x address)',
      'GET /search/:query', 'GET /portfolio', 'GET /balances',
      'GET /transactions', 'GET /trades', 'GET /yield/suggestions',
      'POST /quote/swap', 'POST /trade/propose', 'POST /trade/execute',
      'POST /limit-order', 'POST /perp/open', 'POST /openclaw/command',
      'POST /negotiate',
    ],
  });
});

app.get('/budget/status', (req, res) => {
  res.json({
    apiUrl: ELSA_API_URL, dashboard: 'https://x402.heyelsa.ai/',
    walletAddress: elsa.walletAddress, chain: CHAIN,
    session: elsa.getBudgetStatus(),
    costPerOperation: {
      getPrice: '$0.002', searchToken: '$0.002', getPortfolio: '$0.002',
      analyzeWallet: '$0.005', getSwapQuote: '$0.002', executeSwapDryRun: '$0.005',
      executeSwapConfirmed: '$0.05', createLimitOrder: '$0.05', openPerpPosition: '$0.05',
    },
  });
});

app.get('/agent/status', async (req, res) => {
  try { res.json(await agent.getStatus()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Price / Token ───────────────────────────────────────────────────────────

app.get('/price/:token', async (req, res) => {
  try {
    const result = await elsa.getTokenPrice(req.params.token, req.query.chain);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    const price = result.data?.current_price || result.data?.price ||
      result.data?.result?.price || result.data?.result?.current_price ||
      result.data?.usd_price;
    res.json({ ok: true, token: req.params.token, price, raw: result.data, cost: result.cost, chain: req.query.chain || CHAIN });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/search/:query', async (req, res) => {
  try {
    const result = await elsa.searchToken(req.params.query, parseInt(req.query.limit) || 10);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/portfolio', async (req, res) => {
  try {
    const wallet = req.query.wallet || elsa.walletAddress;
    const [portfolio, analysis] = await Promise.all([elsa.getPortfolio(wallet), elsa.analyzeWallet(wallet)]);
    res.json({
      portfolio: portfolio.ok ? portfolio.data : { error: portfolio.error },
      analysis: analysis.ok ? analysis.data : { error: analysis.error },
      wallet, chain: CHAIN,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/balances', async (req, res) => {
  try {
    const result = await elsa.getBalances(req.query.wallet);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/transactions', async (req, res) => {
  try {
    const result = await elsa.getTransactionHistory(req.query.wallet, req.query.chain, parseInt(req.query.limit) || 20);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Trading ─────────────────────────────────────────────────────────────────

app.post('/quote/swap', async (req, res) => {
  const { fromToken, toToken, amount, chain } = req.body;
  if (!fromToken || !toToken || !amount) return res.status(400).json({ error: 'Missing: fromToken, toToken, amount' });
  try {
    const result = await elsa.getSwapQuote(fromToken, toToken, amount, chain);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json({ fromToken, toToken, amount, chain: chain || CHAIN, quote: result.data, cost: result.cost });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/trade/propose', async (req, res) => {
  const { fromToken, toToken, amount, maxPrice, minPrice } = req.body;
  if (!fromToken || !toToken || !amount) return res.status(400).json({ error: 'Missing: fromToken, toToken, amount' });
  try {
    const proposal = { fromToken, toToken, amount, chain: CHAIN, maxPrice: maxPrice || Infinity, minPrice: minPrice || 0 };
    const decision = await agent.decideOnTrade(proposal);
    res.json({ proposal, agentType: AGENT_TYPE, decision, costForAnalysis: 0.002 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/trade/execute', async (req, res) => {
  const { fromToken, toToken, amount } = req.body;
  if (!fromToken || !toToken || !amount) return res.status(400).json({ error: 'Missing: fromToken, toToken, amount' });
  try {
    const result = await agent.executeTrade({ fromToken, toToken, amount, chain: CHAIN });
    res.json({ ...result, costForDryRun: 0.005, costForConfirmed: 0.05 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/trades', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  res.json({ count: agent.trades.length, trades: limit ? agent.trades.slice(-limit) : agent.trades, agentType: AGENT_TYPE });
});

// ─── Limit Orders ────────────────────────────────────────────────────────────

app.post('/limit-order', async (req, res) => {
  const { fromToken, toToken, amount, limitPrice, expiryHours } = req.body;
  if (!fromToken || !toToken || !amount || !limitPrice) return res.status(400).json({ error: 'Missing: fromToken, toToken, amount, limitPrice' });
  try {
    const result = await elsa.createLimitOrder(fromToken, toToken, amount, limitPrice, expiryHours || 24);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/limit-orders', async (req, res) => {
  try {
    const result = await elsa.getLimitOrders(req.query.wallet);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Perpetuals ──────────────────────────────────────────────────────────────

app.post('/perp/open', async (req, res) => {
  const { market, side, sizeUsd, leverage, takeProfit, stopLoss } = req.body;
  if (!market || !side || !sizeUsd) return res.status(400).json({ error: 'Missing: market, side, sizeUsd' });
  try {
    const result = await elsa.openPerpPosition(market, side, sizeUsd, leverage || 1, takeProfit, stopLoss);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/perp/positions', async (req, res) => {
  try {
    const result = await elsa.getPerpPositions(req.query.wallet);
    if (!result.ok) return res.status(502).json({ error: 'upstream_failure', detail: result.error });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Yield ───────────────────────────────────────────────────────────────────

app.get('/yield/suggestions', async (req, res) => {
  try {
    const result = await elsa.getYieldSuggestions(req.query.wallet);
    res.json({
      suggestions: result.ok ? result.data : [
        { protocol: 'Aave', token: 'USDC', apy: 8.5, risk: 'low', note: 'Fallback — ELSA API needed' },
        { protocol: 'Curve', token: 'USDC', apy: 12.3, risk: 'medium', note: 'Fallback — ELSA API needed' },
      ],
      cost: result.cost, chain: CHAIN, source: result.ok ? 'elsa-api' : 'fallback',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── OpenClaw Natural Language ────────────────────────────────────────────────

app.post('/openclaw/command', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Missing field: command' });
  const lc = command.toLowerCase();

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        const gRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.1-70b-versatile', max_tokens: 128,
            messages: [
              { role: 'system', content: 'Extract DeFi intent. Return JSON only. Intents: GET_PRICE, GET_PORTFOLIO, GET_YIELD, UNKNOWN. Fields: { "intent": "string", "token": "string|null" }' },
              { role: 'user', content: command }
            ]
          },
          { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        const m = gRes.data.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          switch (parsed.intent) {
            case 'GET_PRICE': {
              const token = parsed.token || 'WETH';
              const pr = await elsa.getTokenPrice(token);
              const price = pr.data?.current_price || pr.data?.price || pr.data?.result?.price;
              return res.json({ command, intent: 'GET_PRICE', response: pr.ok ? `${token}: $${price}` : `Could not fetch ${token}: ${pr.error}`, data: pr.data, cost: pr.cost, source: 'groq-ai' });
            }
            case 'GET_PORTFOLIO': {
              const pr = await elsa.getPortfolio();
              return res.json({ command, intent: 'GET_PORTFOLIO', response: pr.ok ? pr.data : { error: pr.error }, cost: pr.cost, source: 'groq-ai' });
            }
            case 'GET_YIELD': {
              const pr = await elsa.getYieldSuggestions();
              return res.json({ command, intent: 'GET_YIELD', response: pr.ok ? pr.data : { error: pr.error }, cost: pr.cost, source: 'groq-ai' });
            }
          }
        }
      } catch (e) { console.warn('⚠️  Groq failed, keyword fallback:', e.message.substring(0, 60)); }
    }

    // Keyword fallback
    if (lc.match(/\b(price|weth|eth|usdc|btc|dai|link)\b/)) {
      const tokenMatch = lc.match(/\b(weth|wbtc|usdc|dai|link|uni|aave|matic|eth)\b/i);
      const token = tokenMatch ? tokenMatch[1].toUpperCase() : 'WETH';
      const pr = await elsa.getTokenPrice(token);
      const price = pr.data?.current_price || pr.data?.price || pr.data?.result?.price;
      return res.json({ command, intent: 'GET_PRICE', response: pr.ok ? `${token}: $${price}` : `${token}: unavailable — ${pr.error}`, cost: pr.cost, source: 'keyword' });
    }
    if (lc.match(/\b(portfolio|balance|wallet)\b/)) {
      const pr = await elsa.getPortfolio();
      return res.json({ command, intent: 'GET_PORTFOLIO', response: pr.ok ? pr.data : { error: pr.error }, cost: pr.cost, source: 'keyword' });
    }
    if (lc.match(/\b(yield|farm|apy|stake)\b/)) {
      const pr = await elsa.getYieldSuggestions();
      return res.json({ command, intent: 'GET_YIELD', response: pr.ok ? pr.data : { error: pr.error }, cost: pr.cost, source: 'keyword' });
    }

    res.json({
      command, intent: 'UNKNOWN',
      response: "Try: 'Check price of WETH', 'Show my portfolio', 'Get yield suggestions'",
      availableCommands: ['Check price of WETH', 'What is the ETH price?', 'Show my portfolio', 'Get yield suggestions'],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Negotiate ────────────────────────────────────────────────────────────────

app.post('/negotiate', async (req, res) => {
  const { fromToken, toToken, amount, startPrice } = req.body;
  if (!fromToken || !toToken || !amount) return res.status(400).json({ error: 'Missing: fromToken, toToken, amount' });

  const rounds = [];
  try {
    const priceResult = await elsa.getTokenPrice(toToken);
    if (!priceResult.ok) return res.status(502).json({ error: 'Cannot negotiate without market price', detail: priceResult.error });

    const marketPrice = parseFloat(priceResult.data?.current_price || priceResult.data?.price || priceResult.data?.result?.price);
    let currentOffer = parseFloat(startPrice) || marketPrice * 1.1; // seller opens 10% above market

    for (let round = 1; round <= 5; round++) {
      const buyerDecision = await agent.decideOnTrade({ fromToken, toToken, amount, maxPrice: currentOffer, chain: CHAIN });
      rounds.push({ round, role: 'buyer', offer: currentOffer, decision: buyerDecision });

      if (buyerDecision.decision === 'ACCEPT') {
        return res.json({ outcome: 'DEAL', agreedPrice: currentOffer, rounds, marketPrice });
      }
      if (buyerDecision.decision === 'REJECT') {
        return res.json({ outcome: 'NO_DEAL', finalRound: round, rounds, marketPrice });
      }

      currentOffer = currentOffer * 0.97; // seller drops 3% each round
      rounds.push({ round, role: 'seller', counterOffer: currentOffer });
    }
    res.json({ outcome: 'TIMEOUT', lastOffer: currentOffer, rounds, marketPrice });
  } catch (e) { res.status(500).json({ error: e.message, rounds }); }
});

// ============ START ============
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                🚀 OpenClaw Agent RUNNING                       ║
║                                                                ║
║  URL:     http://localhost:${String(PORT).padEnd(35)}║
║  Agent:   ${AGENT_TYPE.padEnd(51)}║
║  Wallet:  ${elsa.walletAddress.padEnd(51)}║
║                                                                ║
║  Quick tests:                                                  ║
║  curl http://localhost:${PORT}/health                          ║
║  curl http://localhost:${PORT}/budget/status                   ║
║  curl http://localhost:${PORT}/price/WETH                      ║
║  curl http://localhost:${PORT}/price/USDC                      ║
║                                                                ║
║  Press Ctrl+C to stop                                          ║
╚════════════════════════════════════════════════════════════════╝
`);
});

process.on('SIGINT', () => {
  console.log(`\n👋 Shutting down...`);
  console.log(`📊 ${session.apiCalls} API calls · $${session.totalCost.toFixed(4)} spent · ${session.trades.length} trades`);
  server.close(() => { console.log('✅ Done.'); process.exit(0); });
});

module.exports = { createElsaClient, OpenClawAgent, app, session };
