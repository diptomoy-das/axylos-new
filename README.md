# 🚀 Agent DNS + HTTP 402 + Blockchain Settlement Mesh Network

An agentic encrypted DNS server that enables peer-to-peer negotiation with HTTP 402 payments and blockchain settlement. Perfect for hackathons.

```
┌─────────────────────────────────────────┐
│   Laptop 1 (SELLER)                     │
│   ┌─────────────────────────────────┐   │
│   │ Agent DNS Server (Port 8080)    │   │
│   │ P2P Mesh (Port 9999)            │   │
│   │ Negotiator Agent (Hardened)     │   │
│   │ HTTP 402 Payment Handler        │   │
│   │ Blockchain Settlement Engine    │   │
│   └─────────────────────────────────┘   │
│              ↕ UDP Mesh ↕                │
│   ┌─────────────────────────────────┐   │
│   │ Laptop 2 (BUYER)                │   │
│   │ Agent DNS Server (Port 8081)    │   │
│   │ P2P Mesh (Port 9998)            │   │
│   │ Negotiator Agent (Flexible)     │   │
│   │ HTTP 402 Payment Handler        │   │
│   │ Blockchain Settlement Engine    │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 📋 Features

✅ **Agentic Negotiation**: AI agents negotiate prices autonomously  
✅ **Encrypted DNS**: AES-256 encrypted DNS-over-HTTPS style communication  
✅ **HTTP 402 Payments**: Standard payment protocol for web services  
✅ **Blockchain Settlement**: Auto-settle negotiations on Ethereum  
✅ **P2P Mesh Network**: UDP-based peer discovery and messaging  
✅ **Dual Role Support**: Seller/Buyer agents with different strategies  
✅ **CLI Interface**: Interactive terminal UI to manage negotiations  
✅ **Two-Laptop Demo**: Easy setup for hackathon demos  

## 🛠 Installation

### Prerequisites
- Node.js 16+ 
- Ethereum test wallet with test ETH (Sepolia/Goerli)
- Two laptops/machines with network connectivity

### Setup

```bash
# Clone or download the project
cd agent-dns-mesh

# Install dependencies
npm install

# Set your Anthropic API key (optional, for advanced features)
export ANTHROPIC_API_KEY="your-key-here"
```

## 🚀 Quick Start (Single Machine Demo)

### Terminal 1: Start Seller Agent
```bash
npm run seller
# Starts on http://localhost:8080
# Mesh on 0.0.0.0:9999
```

### Terminal 2: Start Buyer Agent
```bash
npm run buyer
# Starts on http://localhost:8081
# Mesh on 0.0.0.0:9998
# Connects to seller on localhost:9999
```

### Terminal 3: Interact with CLI
```bash
# As Buyer
node cli.js --server http://localhost:8081 --role buyer

# As Seller
node cli.js --server http://localhost:8080 --role seller
```

## 🌐 Two-Laptop Setup (Actual Hackathon Demo)

### Laptop 1 (Seller) - IP: 192.168.1.100

```bash
# Get your IP
ifconfig | grep "inet "  # Linux/Mac
ipconfig              # Windows

npm run seller
# Server: http://192.168.1.100:8080
# Mesh: 0.0.0.0:9999
```

### Laptop 2 (Buyer) - IP: 192.168.1.101

```bash
# Connect to Seller's mesh network
npm run buyer
# But first set PEER_IP environment variable:

PEER_IP=192.168.1.100 node agent-dns-server.js \
  --port 8081 \
  --network-port 9998 \
  --role buyer \
  --peer 192.168.1.100:9999

# Or use the CLI to connect:
node cli.js --server http://localhost:8081 --role buyer
# Then select option [7] to connect to peer
```

## 📖 Usage Examples

### Example 1: Complete Negotiation Flow

```bash
# Terminal 1: Check seller status
curl http://localhost:8080/health

# Terminal 2: Buyer initiates negotiation
curl -X POST http://localhost:8081/negotiate/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "service": "dns-query-service",
    "initialOffer": 0.01,
    "counterpartyId": "seller-node-123"
  }'

# Response:
# {
#   "negotiationId": "abc123def456...",
#   "negotiation": {
#     "id": "abc123def456...",
#     "offers": [{ "party": "buyer", "amount": 0.01, "timestamp": ... }],
#     "status": "ACTIVE"
#   }
# }

# Terminal 2: Buyer makes improved offer
curl -X POST http://localhost:8081/negotiate/abc123def456/offer \
  -H "Content-Type: application/json" \
  -d '{ "amount": 0.015 }'

# Response shows agent's counter-decision:
# {
#   "agentDecision": {
#     "action": "COUNTER",
#     "newOffer": 0.012,
#     "reason": "Counter to midpoint for faster settlement",
#     "timestamp": ...
#   }
# }

# Continue negotiating until ACCEPT
```

### Example 2: HTTP 402 Payment Challenge

```bash
# Get payment challenge
curl "http://localhost:8081/pay/challenge?amount=0.01&service=dns"

# Response:
# {
#   "status": "PAYMENT_REQUIRED",
#   "challenge": {
#     "id": "payment-challenge-xyz",
#     "amount": 0.01,
#     "service": "dns",
#     "expiresAt": 1234567890
#   },
#   "paymentInstructions": {
#     "to": "0x742d35Cc6634C0532925a3b844Bc1e0d0f18E9e3",
#     "amount": 0.01
#   }
# }
```

### Example 3: Blockchain Settlement

```bash
# After payment is made on-chain, verify and settle
curl -X POST http://localhost:8081/pay/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challengeId": "payment-challenge-xyz",
    "transactionHash": "0xabcd1234...",
    "negotiationId": "nego-abc123"
  }'

# Response:
# {
#   "status": "SETTLEMENT_COMPLETE",
#   "success": true,
#   "transactionHash": "0xabcd5678...",
#   "blockNumber": 12345678,
#   "negotiationId": "nego-abc123"
# }
```

### Example 4: P2P Mesh Network

```bash
# Check connected peers
curl http://localhost:8080/mesh/peers

# Response:
# {
#   "peerId": "abc123def456",
#   "peers": [
#     { "id": "192.168.1.101:9998", "host": "192.168.1.101", "port": 9998 }
#   ]
# }

# Manually connect to a peer (if not auto-discovered)
curl -X POST http://localhost:8080/mesh/connect \
  -H "Content-Type: application/json" \
  -d '{
    "host": "192.168.1.102",
    "port": 9999
  }'
```

### Example 5: Check Wallet

```bash
curl http://localhost:8080/wallet/balance

# Response:
# {
#   "address": "0x742d35Cc6634C0532925a3b844Bc1e0d0f18E9e3",
#   "balance": "2.5 ETH"
# }
```

## 🎯 CLI Interactive Mode

Run the CLI for an interactive experience:

```bash
node cli.js --server http://localhost:8081 --role buyer
```

Menu options:
- **[1]** Check if server is running
- **[2]** Start a new negotiation
- **[3]** Make a counter offer
- **[4]** Check negotiation status
- **[5]** Request payment challenge
- **[6]** Verify payment & settle on blockchain
- **[7]** Connect to another peer
- **[8]** View all mesh peers
- **[9]** Check wallet balance

## 🔐 Encryption Details

The system uses **AES-256-CBC** for encrypted communication:

```javascript
// Shared encryption in P2P messages
const encryption = new DNSEncryption(sharedSecret);
const encrypted = encryption.encrypt(data);
const decrypted = encryption.decrypt(encrypted.encrypted, encrypted.iv);
```

## 🤖 Agentic Negotiation Logic

The agents follow a simple but effective strategy:

**Seller Agent (Hardened)**:
- Asks for higher prices
- Slow to negotiate
- Prefers to reject unless gap < 5%

**Buyer Agent (Flexible)**:
- Starts with lower offers
- Quick to compromise
- Seeks midpoint solution

This creates realistic negotiations! Example:

```
Round 1: Buyer offers 0.01 ETH
         Seller counters: 0.015 ETH
         
Round 2: Buyer counters: 0.012 ETH
         Seller accepts (gap < 5%)
         
✅ Settlement: 0.012 ETH on blockchain
```

## 🧪 Testing

### Scenario 1: Two-Agent Negotiation
```bash
# Seller
npm run seller

# Buyer (in another terminal)
npm run buyer

# Buyer CLI (in third terminal)
node cli.js --server http://localhost:8081 --role buyer
# Select [2] Initiate Negotiation
# Service: "smart-contract-analysis"
# Initial Offer: 0.05
```

### Scenario 2: Mesh Network Discovery
Start both servers, they'll discover each other via mesh protocol. Verify with:
```bash
curl http://localhost:8080/mesh/peers
```

### Scenario 3: Payment Flow
```bash
# Get challenge
curl "http://localhost:8081/pay/challenge?amount=0.01&service=test"

# Simulate payment on test network (use Faucet for ETH)
# Then verify
curl -X POST http://localhost:8081/pay/verify \
  -d '{"challengeId":"...", "transactionHash":"0x..."}'
```

## 🏗 Architecture

### Core Components

1. **AgenticNegotiator**
   - Manages negotiation state
   - Generates agent decisions
   - Tracks offer history

2. **DNSEncryption**
   - AES-256-CBC encryption/decryption
   - IV generation for each message
   - Shared secret management

3. **P2PMeshNetwork**
   - UDP-based peer communication
   - Automatic peer discovery
   - Message broadcasting

4. **HTTP402Handler**
   - Payment challenge generation
   - Challenge expiration (5 min default)
   - Payment verification

5. **BlockchainSettlement**
   - Ethereum wallet integration
   - Transaction submission
   - Settlement tracking

6. **Express API Server**
   - RESTful endpoints
   - JSON request/response
   - Status codes (402 for payment required)

## 🌍 Environment Variables

```bash
# Required for production
ANTHROPIC_API_KEY="sk-..."          # Claude API for advanced negotiation
ETHEREUM_PRIVATE_KEY="0x..."        # Wallet private key
ETHEREUM_RPC_URL="https://..."      # Ethereum RPC endpoint

# Optional
NODE_ENV="production"               # Set to 'production' for safety
LOG_LEVEL="info"                    # debug, info, warn, error
```

## 🐛 Debugging

### Enable Verbose Logging
```bash
# Add to the top of agent-dns-server.js
process.env.DEBUG = '*';
```

### Check Network Connectivity
```bash
# Verify mesh port is open
lsof -i :9999
netstat -an | grep 9999
```

### Test Blockchain Connection
```bash
# Quick balance check
curl http://localhost:8080/wallet/balance
```

### Capture Network Traffic
```bash
# Monitor mesh messages (if UDP debug enabled)
tcpdump -i lo port 9999
```

## 📊 Expected Output

When you run `npm run buyer`:

```
╔═══════════════════════════════════════════════════════════════╗
║  Agent DNS + HTTP 402 + Blockchain Settlement                ║
║  Role: BUYER                                                  ║
║  Port: 8081                                                   ║
║  Network Port: 9998                                           ║
╚═══════════════════════════════════════════════════════════════╝

✅ P2P Mesh listening on port 9998
✅ Connected to peer: 192.168.1.100:9999

🚀 HTTP 402 Server running on http://localhost:8081
🔐 Encrypted DNS ready
💰 Blockchain: http://localhost:8545
👛 Wallet: 0x742d35Cc6634C0532925a3b844Bc1e0d0f18E9e3

📖 Available endpoints:
  POST /negotiate/initiate
  GET  /negotiate/:negotiationId
  POST /negotiate/:negotiationId/offer
  GET  /pay/challenge?amount=0.01&service=dns
  POST /pay/verify
  POST /mesh/connect
  GET  /wallet/balance
```

## 🎓 Hackathon Tips

1. **Demo Wallets**: Use testnet faucets to get free test ETH
2. **Local Blockchain**: Run Ganache or Hardhat node for instant transactions
3. **Mesh Discovery**: Have both servers start before making requests
4. **Visual Aid**: Show the mesh network with `GET /mesh/peers`
5. **Payment Flow**: Most impressive part—show HTTP 402 → blockchain settlement
6. **Agent Decisions**: Pretty-print agent logic decisions for judges

## 🚀 Future Enhancements

- [ ] Integrate Claude API for actual AI negotiation
- [ ] Support multiple negotiation rounds with learning
- [ ] Add order book for batch negotiations
- [ ] Implement reputation system
- [ ] Support multiple blockchains (Polygon, Arbitrum, etc)
- [ ] WebSocket support for real-time updates
- [ ] Persistent negotiation database
- [ ] Agent strategy templates (aggressive, conservative, balanced)

## 📝 License

MIT - Use freely for hackathons!

## 🤝 Contributing

Found a bug? Want to add features? Create an issue or PR!

---

**Built for Hackathons | Ethereum | Agents | P2P Networks**
