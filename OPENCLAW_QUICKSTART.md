# 🚀 OpenClaw + Agent DNS Settlement - Quick Start

## What You're Getting

A **complete integration** between:
- **OpenClaw AI agents** (autonomous trading decisions)
- **Agent DNS Settlement** (P2P negotiation)
- **ELSA X402 payments** (micropayments for DeFi operations)

---

## 3-Minute Setup

### Step 1: Prerequisites
```bash
# You have these already
npm install
```

### Step 2: Set Up ELSA Account
```bash
# Visit: https://x402.heyelsa.ai/
# 1. Create wallet with USDC on Base network
# 2. Generate X402 payment token
# 3. Save your private key
```

### Step 3: Start Agent
```bash
# Buyer agent
node agent-dns-openclaw-integration.js \
  --agent-type buyer \
  --chain base \
  --wallet-address 0x742d35Cc6Af832e6F5E284A2c70b6a89fB7e3338 \
  --private-key 0x...

# Response:
# ✅ OpenClaw Agent DNS Started
# 🚀 Server: http://localhost:8080
```

### Step 4: Test It
```bash
# Check portfolio
curl http://localhost:8080/portfolio

# Get price
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

## How It Works

### Flow Diagram

```
1. User/OpenClaw
   ↓ "Buy WETH if price < 2500"
   
2. Agent DNS Settlement
   ├─ Proposes trade to counterparty
   ├─ Negotiates price
   └─ Reaches agreement
   
3. ELSA X402 API Calls
   ├─ Get current WETH price ($0.002)
   ├─ Get swap quote ($0.01)
   └─ Execute swap ($0.05)
   
4. Blockchain
   ├─ Settlement recorded
   ├─ Tokens swapped
   └─ Portfolio updated
```

---

## Cost Examples

### Scenario 1: Price Check
```
GET /price/WETH
Cost: $0.002
Time: ~1 second
```

### Scenario 2: Portfolio Analysis
```
GET /portfolio
Calls:
  - get_portfolio: $0.01
  - analyze_wallet: $0.01
Total Cost: $0.02
```

### Scenario 3: Trade Execution
```
POST /trade/propose → POST /trade/execute

Calls:
  1. get_token_price: $0.002
  2. get_swap_quote: $0.01
  3. execute_swap (dry-run): $0.01
  4. execute_swap (confirmed): $0.05
  
Total Cost: $0.072 per trade
```

---

## Available Commands

### Portfolio & Analytics
```bash
# Get full portfolio analysis
curl http://localhost:8080/portfolio

# Get token price
curl http://localhost:8080/price/WETH

# Get swap quote
curl -X POST http://localhost:8080/quote/swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100
  }'

# Get yield suggestions
curl http://localhost:8080/yield/suggestions
```

### Trading
```bash
# Agent decides on trade
curl -X POST http://localhost:8080/trade/propose \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100,
    "maxPrice": 2500,
    "minPrice": 2000
  }'

# Execute trade
curl -X POST http://localhost:8080/trade/execute \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100
  }'
```

### Status & History
```bash
# Check agent status
curl http://localhost:8080/agent/status

# View trade history
curl http://localhost:8080/trades

# Get pricing info
curl http://localhost:8080/budget/status
```

---

## Integration with Agent DNS

### Traditional Agent DNS Flow
```
Negotiation → HTTP 402 Payment → Blockchain Settlement
```

### With OpenClaw
```
OpenClaw Command
  ↓ (natural language)
Agent DNS Negotiation
  ↓ (agent decides)
ELSA X402 API Calls
  ↓ (execute trade)
Blockchain Settlement
  ↓ (record transaction)
Portfolio Updated
```

---

## Real-World Examples

### Example 1: Buy ETH When Price Drops
```bash
# Propose trade to agent
curl -X POST http://localhost:8080/trade/propose \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100,
    "maxPrice": 2000,
    "minPrice": 1500
  }'

# Agent checks current price
# If price < 2000: Decision = ACCEPT
# If price > 2000: Decision = WAIT

# If ACCEPT, execute trade
curl -X POST http://localhost:8080/trade/execute \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "WETH",
    "amount": 100
  }'
```

### Example 2: Monitor Portfolio
```bash
# Every minute, check portfolio
while true; do
  curl http://localhost:8080/portfolio
  sleep 60
done
```

### Example 3: Yield Farming Opportunity
```bash
# Get yield suggestions
curl http://localhost:8080/yield/suggestions

# Response shows best opportunities (Aave 8.5%, Curve 12.3%, etc.)
# Agent can auto-execute swap to best yield token
```

---

## Environment Variables

```bash
# Required
export WALLET_ADDRESS=0x742d35Cc6Af832e6F5E284A2c70b6a89fB7e3338
export PRIVATE_KEY=0x...

# Optional
export ELSA_API_URL=https://x402-api.heyelsa.ai  # Default
export PORT=8080                                  # Default
export AGENT_TYPE=buyer                          # Default
export CHAIN=base                                # Default
```

---

## Troubleshooting

### Problem: "Cannot generate payment token"
**Solution:** Verify your private key format
```bash
node -e "const ethers = require('ethers'); const w = new ethers.Wallet('0x...'); console.log(w.address)"
```

### Problem: "Insufficient balance"
**Solution:** Top up USDC on Base network
- Faucet: https://x402.heyelsa.ai/
- Or use Stargate bridge

### Problem: "API returns 402"
**Solution:** Verify X402 payment token generation
- Check ELSA dashboard: https://x402.heyelsa.ai/
- Confirm USDC balance on Base

---

## Common Use Cases

### 1. **Autonomous Trading Bot**
- Monitors prices every minute
- Auto-executes when thresholds hit
- Fully autonomous decisions

### 2. **Portfolio Tracker**
- Real-time balance updates
- Risk analysis
- P&L reports
- All via ELSA APIs

### 3. **Yield Optimizer**
- Finds best yield farming opportunities
- Auto-swaps to highest APY tokens
- Rebalances weekly

### 4. **Price Alerts**
- Monitor specific tokens
- Execute trades on price triggers
- Via agent negotiation

---

## File Structure

```
agent-dns-mesh/
├── agent-dns-openclaw-integration.js  ← Main integration
├── OPENCLAW_INTEGRATION_GUIDE.md      ← Full documentation
├── OPENCLAW_QUICKSTART.md             ← This file
└── Original files...
```

---

## Next Steps

1. ✅ Set up ELSA X402 account
2. ✅ Run `agent-dns-openclaw-integration.js`
3. ✅ Test with `/portfolio` endpoint
4. ✅ Try `/trade/propose` with safe amounts
5. ✅ Integrate with Claude via MCP
6. ✅ Deploy to production

---

## Resources

- **ELSA X402 Docs:** https://x402.heyelsa.ai/docs
- **OpenClaw:** https://x402.heyelsa.ai/openclaw
- **Agent DNS PRD:** See PRD.md
- **Integration Guide:** See OPENCLAW_INTEGRATION_GUIDE.md

---

## Support

If you encounter issues:

1. Check `/health` endpoint
2. Review error logs
3. Verify ELSA API connection
4. Confirm X402 payment token format
5. Check wallet balance on Base

---

**You're all set! Start with `/portfolio` to verify integration.** 🚀
