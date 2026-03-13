# 🔗 OpenClaw + Agent DNS Settlement Integration Guide

## Overview

This guide explains how to integrate **OpenClaw AI agents** with **Agent DNS Settlement** using **ELSA X402 micropayment protocol**.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      OpenClaw AI Agent                          │
│         (Claude/GPT natural language understanding)            │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│          Agent DNS Settlement Protocol                          │
│  (Autonomous negotiation + P2P mesh + HTTP 402)                │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│               ELSA X402 Micropayment Protocol                   │
│    (Per-API-call payment in USDC or ELSA on Base network)      │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│              DeFi Operations (20+ protocols)                    │
│  Swaps • Limits • Perpetuals • Yield • Portfolio Management    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Setup ELSA X402 Account

```bash
# Visit https://x402.heyelsa.ai/
# 1. Get a wallet with USDC on Base network
# 2. Generate X402 payment tokens
# 3. Test API access via cURL
```

### 2. Install Dependencies

```bash
npm install express axios ethers yargs
```

### 3. Run OpenClaw Agent

```bash
# Buyer agent
node agent-dns-openclaw-integration.js \
  --agent-type buyer \
  --chain base \
  --port 8080 \
  --wallet-address 0x742d35Cc6Af832e6F5E284A2c70b6a89fB7e3338

# Seller agent (in another terminal)
node agent-dns-openclaw-integration.js \
  --agent-type seller \
  --chain base \
  --port 8081
```

### 4. Test Integration

```bash
# Get portfolio
curl http://localhost:8080/portfolio

# Get token price
curl http://localhost:8080/price/WETH

# Propose trade
curl -X POST http://localhost:8080/trade/propose \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100,
    "maxPrice": 2500
  }'
```

---

## Components

### 1. ElsaX402PaymentClient

Handles all communication with ELSA X402 API with automatic micropayments.

#### Methods

**generatePaymentToken(endpoint, amount)**
```javascript
const token = await elsa.generatePaymentToken('get_portfolio', 0.01);
// Returns: Base64-encoded JWT with signature
```

**callElsaAPI(endpoint, data, costInUSDC)**
```javascript
const result = await elsa.callElsaAPI('get_swap_quote', {
  from_chain: 'base',
  from_token: 'USDC',
  to_token: 'WETH',
  from_amount: '100',
  wallet_address: '0x...',
}, 0.01);
// Returns: { success, data, cost, endpoint }
```

**getPortfolio()**
```javascript
const portfolio = await elsa.getPortfolio();
// Cost: $0.01
// Returns: Multi-chain balances, DeFi positions, P&L
```

**getTokenBalance(token, chain)**
```javascript
const balance = await elsa.getTokenBalance('WETH', 'base');
// Cost: $0.005
```

**getSwapQuote(fromToken, toToken, amount, chain)**
```javascript
const quote = await elsa.getSwapQuote('USDC', 'WETH', '100', 'base');
// Cost: $0.01
// Returns: Best quote across 20+ DEXs
```

**executeSwap(fromToken, toToken, amount, chain, dryRun)**
```javascript
// Dry-run first (safe)
const dryRun = await elsa.executeSwap('USDC', 'WETH', '100', 'base', true);
// Cost: $0.01

// Then execute (if approved)
const confirmed = await elsa.executeSwap('USDC', 'WETH', '100', 'base', false);
// Cost: $0.05
```

**getTokenPrice(token, chain)**
```javascript
const price = await elsa.getTokenPrice('WETH', 'base');
// Cost: $0.002
// Returns: { current_price, 24h_change, market_cap, ... }
```

**analyzeWallet()**
```javascript
const analysis = await elsa.analyzeWallet();
// Cost: $0.01
// Returns: Risk metrics, diversification, opportunities
```

**getYieldSuggestions()**
```javascript
const yields = await elsa.getYieldSuggestions();
// Cost: $0.02
// Returns: Top yield farming opportunities
```

### 2. OpenClawAgent

Autonomous agent making trading decisions based on market conditions.

#### Methods

**decideOnTrade(tradeProposal)**
```javascript
const proposal = {
  fromToken: 'USDC',
  toToken: 'WETH',
  amount: 100,
  chain: 'base',
  maxPrice: 2500,  // buyer's max acceptable price
  minPrice: 2000   // seller's min acceptable price
};

const decision = await agent.decideOnTrade(proposal);
// Returns: { decision: 'ACCEPT' | 'WAIT' | 'REJECT', reason, price }
```

**executeTrade(tradeProposal)**
```javascript
const execution = await agent.executeTrade(proposal);
// Returns: { success, message, dryRunResult }
```

**getStatus()**
```javascript
const status = await agent.getStatus();
// Returns: { type, chain, portfolio, totalTrades, recentTrades, lastUpdate }
```

---

## API Endpoints

### GET /health
Health check and system status

**Response:**
```json
{
  "status": "healthy",
  "agentType": "buyer",
  "chain": "base",
  "walletAddress": "0x742d35Cc...",
  "elsa": {
    "apiUrl": "https://x402-api.heyelsa.ai",
    "connected": true
  }
}
```

---

### GET /portfolio
Get comprehensive portfolio analysis

**Cost:** $0.02 (get_portfolio $0.01 + analyze_wallet $0.01)

**Response:**
```json
{
  "portfolio": {
    "total_balance_usd": 50000,
    "balances": [
      { "token": "USDC", "amount": "10000", "value_usd": 10000 },
      { "token": "WETH", "amount": "5", "value_usd": 12500 }
    ],
    "defi_positions": [...],
    "staking": [...],
    "p_and_l": { "realized": 2500, "unrealized": -300 }
  },
  "analysis": {
    "diversification_score": 0.75,
    "risk_level": "medium",
    "recommendations": [...]
  },
  "totalCost": 0.02
}
```

---

### GET /price/:token
Get token price

**Cost:** $0.002 per token

**Example:**
```bash
GET /price/WETH
```

**Response:**
```json
{
  "token": "WETH",
  "price": 2340.50,
  "cost": 0.002
}
```

---

### POST /quote/swap
Get swap quote (read-only, no execution)

**Cost:** $0.01

**Request:**
```json
{
  "fromToken": "USDC",
  "toToken": "WETH",
  "amount": 100
}
```

**Response:**
```json
{
  "fromToken": "USDC",
  "toToken": "WETH",
  "amount": 100,
  "quote": {
    "output_amount": "0.0427",
    "price_per_unit": 2340.50,
    "best_route": "USDC -> WETH (UniswapV3)",
    "slippage": 0.005,
    "gas_estimate": "0.001"
  },
  "cost": 0.01,
  "chain": "base"
}
```

---

### POST /trade/propose
Propose trade for agent decision

**Cost:** $0.012 (price check $0.002 + swap quote $0.01)

**Request:**
```json
{
  "fromToken": "USDC",
  "toToken": "WETH",
  "amount": 100,
  "maxPrice": 2500,
  "minPrice": 2000
}
```

**Response:**
```json
{
  "proposal": {
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100,
    "chain": "base",
    "maxPrice": 2500,
    "minPrice": 2000
  },
  "agentType": "buyer",
  "decision": {
    "decision": "ACCEPT",
    "reason": "Price 2340.50 within budget",
    "price": 2340.50
  },
  "costForAnalysis": 0.012
}
```

---

### POST /trade/execute
Execute approved trade

**Cost:** $0.01 (dry-run) or $0.05 (confirmed)

**Request:**
```json
{
  "fromToken": "USDC",
  "toToken": "WETH",
  "amount": 100
}
```

**Response:**
```json
{
  "execution": {
    "success": true,
    "message": "Trade simulation successful. Ready for execution.",
    "dryRunResult": {
      "transaction_hash": "0xabcd...",
      "output_amount": "0.0427",
      "gas_fee": "0.001"
    }
  },
  "costForDryRun": 0.01,
  "costForConfirmed": 0.05,
  "ready": true
}
```

---

### GET /yield/suggestions
Get yield farming opportunities

**Cost:** $0.02

**Response:**
```json
{
  "suggestions": [
    {
      "protocol": "Aave",
      "token": "USDC",
      "apy": 8.5,
      "tvl": "500M",
      "risk": "low"
    },
    {
      "protocol": "Curve",
      "token": "USDC",
      "apy": 12.3,
      "tvl": "200M",
      "risk": "medium"
    }
  ],
  "cost": 0.02,
  "chain": "base"
}
```

---

### GET /agent/status
Get agent status and statistics

**Cost:** Free (derived from portfolio)

**Response:**
```json
{
  "type": "buyer",
  "chain": "base",
  "portfolio": { ... },
  "totalTrades": 5,
  "recentTrades": [
    {
      "id": "abc123",
      "proposal": { ... },
      "result": { ... },
      "timestamp": 1678300840000,
      "status": "DRY_RUN_SUCCESS"
    }
  ],
  "lastUpdate": 1678300850000
}
```

---

### GET /trades
Get trade history

**Cost:** Free

**Response:**
```json
{
  "count": 5,
  "trades": [
    {
      "id": "abc123",
      "proposal": { ... },
      "timestamp": 1678300840000,
      "status": "DRY_RUN_SUCCESS"
    }
  ],
  "agentType": "buyer"
}
```

---

### POST /openclaw/command
Natural language command interface

**Cost:** Varies by command

**Request:**
```json
{
  "command": "What's the price of WETH?",
  "userId": "user123",
  "agentId": "agent456"
}
```

**Response:**
```json
{
  "command": "What's the price of WETH?",
  "response": "Current WETH price: $2340.50",
  "cost": 0.002
}
```

---

### GET /budget/status
Get pricing information

**Cost:** Free

**Response:**
```json
{
  "apiUrl": "https://x402-api.heyelsa.ai",
  "walletAddress": "0x742d35Cc...",
  "chain": "base",
  "status": "Track spending via Elsa dashboard",
  "costPerOperation": {
    "getPrice": "$0.002",
    "getPortfolio": "$0.01",
    "getSwapQuote": "$0.01",
    "executeSwap": "$0.02 (dry-run) or $0.05 (confirmed)",
    "analyzeWallet": "$0.01",
    "getYieldSuggestions": "$0.02"
  }
}
```

---

## Integration with Agent DNS Settlement

### Complete Workflow

```
1. NEGOTIATION PHASE
   ├─ Buyer agent proposes: Buy 100 USDC worth of WETH
   ├─ Seller agent receives proposal
   └─ Agents counter-offer until agreement
        Cost: $0.02 per negotiation round

2. PRICING PHASE
   ├─ Query ELSA for current WETH price
   ├─ Both agents confirm acceptable price
   └─ Generate swap quote
        Cost: $0.012 per price check

3. AGREEMENT PHASE
   ├─ Both agents agree on:
   │  ├─ Token pair (USDC ↔ WETH)
   │  ├─ Amount (100 USDC)
   │  └─ Price (2340.50 per WETH)
   └─ Execute dry-run swap
        Cost: $0.01

4. SETTLEMENT PHASE
   ├─ Payment challenge issued (HTTP 402)
   ├─ Buyer sends USDC to seller
   ├─ Seller executes confirmed swap
   └─ Settlement recorded on blockchain
        Cost: $0.05 (confirmed execution)

TOTAL COST PER TRADE: $0.092
```

---

## Cost Optimization

### Batch Operations
Instead of querying individually, batch calls:

```javascript
// ❌ Expensive (multiple calls)
const price1 = await elsa.getTokenPrice('WETH'); // $0.002
const price2 = await elsa.getTokenPrice('USDC'); // $0.002
const price3 = await elsa.getTokenPrice('USDC'); // $0.002
// Total: $0.006

// ✅ Cheaper (single portfolio call)
const portfolio = await elsa.getPortfolio(); // $0.01 (includes all prices)
// Total: $0.01
```

### Caching Results
Cache results to avoid redundant API calls:

```javascript
const priceCache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getPriceWithCache(token) {
  const cached = priceCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price; // Free!
  }

  const result = await elsa.getTokenPrice(token);
  priceCache.set(token, {
    price: result.data.current_price,
    timestamp: Date.now(),
  });
  return result.data.current_price;
}
```

### Dry-Run First
Always dry-run before confirmed execution:

```javascript
// Dry-run ($0.01) before confirmed ($0.05)
const dryRun = await elsa.executeSwap(from, to, amount, chain, true);
if (dryRun.success) {
  const confirmed = await elsa.executeSwap(from, to, amount, chain, false);
}
```

---

## Security Best Practices

### 1. Private Key Management
```javascript
// ❌ Don't hardcode
const privateKey = '0x...'; // DANGEROUS!

// ✅ Use environment variables
const privateKey = process.env.PRIVATE_KEY;
```

### 2. Signature Verification
```javascript
// Always verify signatures from counterparty
const messageToVerify = JSON.stringify(tradeProposal);
const recovered = ethers.recoverAddress(messageToVerify, signature);
if (recovered !== counterpartyAddress) {
  throw new Error('Invalid signature!');
}
```

### 3. Slippage Protection
```javascript
// Always set slippage tolerance
const swap = await elsa.executeSwap(from, to, amount, chain, true, {
  slippage_tolerance: 0.01, // 1% max slippage
  min_output_amount: calculateMinOutput(quote, 0.01),
});
```

### 4. Rate Limiting
```javascript
// Implement exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let retries = 0;
const maxRetries = 3;

async function callWithRetry(fn) {
  try {
    return await fn();
  } catch (error) {
    if (retries < maxRetries) {
      retries++;
      await delay(Math.pow(2, retries) * 1000);
      return callWithRetry(fn);
    }
    throw error;
  }
}
```

---

## Monitoring & Analytics

### Track Spending
```javascript
class CostTracker {
  constructor() {
    this.operations = [];
    this.totalCost = 0;
  }

  track(operation, cost) {
    this.operations.push({
      operation,
      cost,
      timestamp: Date.now(),
    });
    this.totalCost += cost;
  }

  getStats() {
    return {
      totalOperations: this.operations.length,
      totalCost: this.totalCost,
      averageCost: this.totalCost / this.operations.length,
      byOperation: this.groupByOperation(),
    };
  }

  groupByOperation() {
    const grouped = {};
    this.operations.forEach(op => {
      if (!grouped[op.operation]) {
        grouped[op.operation] = { count: 0, total: 0 };
      }
      grouped[op.operation].count++;
      grouped[op.operation].total += op.cost;
    });
    return grouped;
  }
}
```

### Log All Trades
```javascript
const fs = require('fs');

function logTrade(trade) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...trade,
  };
  
  fs.appendFileSync(
    'trades.log',
    JSON.stringify(logEntry) + '\n'
  );
}
```

---

## Troubleshooting

### Issue: Payment Token Generation Fails
**Cause:** Invalid private key or signature error
**Solution:**
```bash
# Verify private key format
node -e "const ethers = require('ethers'); console.log(new ethers.Wallet('0x...'))"

# Ensure proper signing
const message = JSON.stringify(payload);
const signature = await signer.signMessage(message);
```

### Issue: ELSA API Returns 402
**Cause:** Insufficient balance or invalid payment token
**Solution:**
```bash
# Check wallet balance
curl https://x402-api.heyelsa.ai/api/get_balance \
  -H "X-PAYMENT: <token>"

# Top up wallet with USDC or ELSA
# Visit https://x402.heyelsa.ai/ for faucet
```

### Issue: Trade Execution Fails
**Cause:** Slippage too high, insufficient balance, or network issue
**Solution:**
```javascript
// Increase slippage tolerance
const swap = await elsa.executeSwap(from, to, amount, chain, true, {
  slippage_tolerance: 0.05, // 5% instead of 1%
});

// Check balance before trading
const balance = await elsa.getTokenBalance(fromToken);
if (balance < amount) {
  console.error('Insufficient balance');
  return;
}
```

---

## Examples

### Example 1: Autonomous Trading Bot

```javascript
const { OpenClawAgent, ElsaX402PaymentClient } = require('./agent-dns-openclaw-integration');

async function runTradingBot() {
  const elsa = new ElsaX402PaymentClient(walletAddress, privateKey, elsaApiUrl);
  const agent = new OpenClawAgent('buyer', elsa);

  // Check price every minute
  setInterval(async () => {
    const price = await elsa.getTokenPrice('WETH');
    
    if (price.data.current_price < 2000) {
      console.log('🚀 Price dropped! Executing trade...');
      
      const decision = await agent.decideOnTrade({
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: 100,
        maxPrice: 2000,
      });

      if (decision.decision === 'ACCEPT') {
        await agent.executeTrade({
          fromToken: 'USDC',
          toToken: 'WETH',
          amount: 100,
        });
      }
    }
  }, 60000);
}
```

### Example 2: Portfolio Rebalancer

```javascript
async function rebalancePortfolio() {
  const portfolio = await elsa.getPortfolio();
  const suggestions = await elsa.getYieldSuggestions();

  // Move assets to highest yielding opportunity
  const bestYield = suggestions[0];
  
  // Swap current holdings to best yield token
  await agent.executeTrade({
    fromToken: portfolio.top_holding.token,
    toToken: bestYield.token,
    amount: portfolio.top_holding.amount * 0.5, // 50% rebalance
  });
}
```

### Example 3: Price Alert

```javascript
async function setPriceAlert(token, targetPrice) {
  const checkPrice = async () => {
    const price = await elsa.getTokenPrice(token);
    
    if (price.data.current_price <= targetPrice) {
      console.log(`🔔 Alert! ${token} reached $${price.data.current_price}`);
      // Take action (trade, notify, etc.)
    }
  };

  // Check every 30 seconds
  setInterval(checkPrice, 30000);
}
```

---

## Next Steps

1. **Set up ELSA account** at https://x402.heyelsa.ai/
2. **Test with dry-run** before confirmed execution
3. **Monitor costs** via ELSA dashboard
4. **Integrate with Claude** via MCP for NL commands
5. **Deploy to production** with proper monitoring

---

**Happy trading with OpenClaw + Agent DNS! 🚀**
