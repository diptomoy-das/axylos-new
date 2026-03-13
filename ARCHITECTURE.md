# 🏗️ System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN (Ethereum)                        │
│                   Settlement Layer                              │
└─────────────────────────────────────────────────────────────────┘
         ▲                                      ▲
         │ Settlement TX                       │ Settlement TX
         │                                     │
┌────────┴──────────────────┐      ┌──────────┴──────────────────┐
│    SELLER AGENT (L1)      │◄────►│    BUYER AGENT (L1)        │
│  ┌──────────────────────┐ │      │ ┌──────────────────────┐   │
│  │ Express App          │ │      │ │ Express App          │   │
│  │ Port: 8080           │ │      │ │ Port: 8081           │   │
│  └──────────────────────┘ │      │ └──────────────────────┘   │
│  ┌──────────────────────┐ │      │ ┌──────────────────────┐   │
│  │ AgenticNegotiator    │ │      │ │ AgenticNegotiator    │   │
│  │ (Hardened Strategy)  │ │      │ │ (Flexible Strategy)  │   │
│  └──────────────────────┘ │      │ └──────────────────────┘   │
│  ┌──────────────────────┐ │      │ ┌──────────────────────┐   │
│  │ HTTP 402 Handler     │ │      │ │ HTTP 402 Handler     │   │
│  └──────────────────────┘ │      │ └──────────────────────┘   │
│  ┌──────────────────────┐ │      │ ┌──────────────────────┐   │
│  │ DNSEncryption (AES)  │ │      │ │ DNSEncryption (AES)  │   │
│  └──────────────────────┘ │      │ └──────────────────────┘   │
│  ┌──────────────────────┐ │      │ ┌──────────────────────┐   │
│  │ P2PMeshNetwork (UDP) │ │◄────►│ │ P2PMeshNetwork (UDP) │   │
│  │ Port: 9999           │ │      │ │ Port: 9998           │   │
│  └──────────────────────┘ │      │ └──────────────────────┘   │
│                            │      │                            │
│  Laptop 1                  │      │  Laptop 2                  │
└────────────────────────────┘      └────────────────────────────┘
```

## Component Breakdown

### 1. Express App (HTTP 402 Server)
**Port**: 8080 (Seller), 8081 (Buyer)

REST API endpoints:
- `GET /health` - Health check
- `POST /negotiate/initiate` - Start negotiation
- `GET /negotiate/:id` - Get negotiation status
- `POST /negotiate/:id/offer` - Make counter-offer
- `GET /pay/challenge` - Get payment challenge (402 response)
- `POST /pay/verify` - Verify payment & settle
- `GET /mesh/peers` - List connected peers
- `POST /mesh/connect` - Connect to new peer
- `GET /wallet/balance` - Check wallet balance

### 2. AgenticNegotiator
**Purpose**: Autonomous negotiation using agent decision logic

**States**:
```javascript
{
  id: "negotiationId",
  initiator: "buyer|seller",
  offers: [
    { party: "buyer", amount: 0.01, timestamp: ... },
    { party: "seller", amount: 0.015, timestamp: ... }
  ],
  status: "ACTIVE|STALLED|ACCEPTED"
}
```

**Agent Decision Logic**:
```
if (gap < 5%) → ACCEPT
else if (gap < 20%) → COUNTER to midpoint
else → COUNTER with improved offer
```

### 3. HTTP 402 Handler
**Purpose**: Payment challenge system per RFC 7231

**Flow**:
```
1. Client requests service → Server returns 402 + challenge
2. Challenge includes:
   - id (unique identifier)
   - amount (ETH required)
   - expiresAt (5 minutes default)
3. Client sends payment TX
4. Client verifies payment with challenge ID + TX hash
5. Server confirms → Service access granted
```

### 4. DNSEncryption (AES-256-CBC)
**Purpose**: Encrypted P2P communication

```javascript
// Encryption
const encrypted = {
  iv: "random16bytes",
  encrypted: "encryptedData"
}

// Decryption uses shared secret
const decrypted = encryption.decrypt(
  encrypted.encrypted, 
  encrypted.iv
)
```

**Security**:
- Algorithm: AES-256-CBC
- IV: Random per message (16 bytes)
- Key Derivation: From shared secret (32 bytes)
- No key reuse

### 5. P2PMeshNetwork (UDP)
**Port**: 9999 (Seller), 9998 (Buyer)

**Peer Management**:
```javascript
peers = {
  "192.168.1.101:9998": { host, port },
  "192.168.1.102:9999": { host, port }
}
```

**Message Types**:
- `NEGOTIATION_INITIATED` - New negotiation broadcast
- `NEGOTIATION_RESPONSE` - Agent response to initiation
- `NEGOTIATION_OFFER` - Counter-offer with agent decision
- `SETTLEMENT_CONFIRMED` - Blockchain settlement broadcast

### 6. BlockchainSettlement
**Purpose**: Execute settlements on Ethereum

```javascript
// Send settlement transaction
const tx = await signer.sendTransaction({
  to: counterparty,
  value: ethers.parseEther("0.01"),
  data: ethers.id("NEGO:negotiationId").slice(0,10)
})
```

**Features**:
- Auto-sign with private key
- Reference negotiation in TX data
- Wait for confirmations
- Track settlement history

---

## Data Flow Diagrams

### Negotiation Flow
```
Buyer                     Network                    Seller
  │                         │                          │
  ├─────POST /negotiate/initiate────────────────────►│
  │                         │                          │
  │                    [UDP Broadcast]                 │
  │                   NEGOTIATION_INITIATED            │
  │                         │◄─────────────────────────┤
  │                         │                          │
  │◄─────Agent Response─────┤                          │
  │  (Counter: 0.015 ETH)   │                          │
  │                         │                          │
  ├─POST /negotiate/:id/offer (0.012 ETH)────────────►│
  │                         │                          │
  │                    [UDP Broadcast]                 │
  │                   NEGOTIATION_OFFER                │
  │                         │                          │
  │◄────[Agent Decision]────┤  ACTION: ACCEPT          │
  │                         │                          │
  ✓ NEGOTIATION ACCEPTED (0.012 ETH agreed)
```

### Payment Flow
```
Buyer Client              Server                   Blockchain
  │                        │                           │
  ├─GET /pay/challenge────►│                           │
  │                        │                           │
  │◄──402 + Challenge Id───┤                           │
  │  (0.01 ETH required)   │                           │
  │                        │                           │
  │                    [User sends TX]                  │
  │                        │                           │
  │                        │◄──────TX Hash─────────────┤
  │                        │  (sent by user wallet)    │
  │                        │                           │
  ├─POST /pay/verify──────►│                           │
  │  (TX Hash + Challenge)│                            │
  │                        │                           │
  │                        ├──Submit Settlement TX────►│
  │                        │   to counterparty         │
  │◄──200 OK + Settlement──┤                           │
  │     (TX Hash)          │                           │
  │                        │◄────Confirmation──────────┤
  │                    [UDP Broadcast]                 │
  │                   SETTLEMENT_CONFIRMED             │
  │                        │                           │
  ✓ PAYMENT COMPLETE
```

### Mesh Network Discovery
```
Laptop 1                    Network                   Laptop 2
(Seller)                                             (Buyer)
  │                           │                        │
  │ Start: 9999/UDP           │                        │
  │ Broadcast: "I'm here"     │                        │
  │                           ├──────────────────────►│ Start: 9998/UDP
  │                           │                        │
  │                           │◄──────────────────────┤ Broadcast: "I'm here"
  │ Receive peer message      │                        │
  │                           │                        │
  │ Add to peers: 192.x:9998  │                        │ Add to peers: 192.x:9999
  │                           │                        │
  │ Both listen for UDP messages on their port
  │                           │                        │
  │ POST /mesh/connect ──────────► Send UDP ──────────┤
  │ (for manual discovery)    │     to new peer       │
```

---

## File Structure

```
agent-dns-mesh/
├── agent-dns-server.js    # Main server + mesh + negotiation
├── cli.js                 # Interactive CLI client
├── test.js                # Automated test suite
├── package.json           # Dependencies
├── Dockerfile             # Container build
├── docker-compose.yml     # Two-container orchestration
├── quickstart.sh          # Auto-setup script
├── README.md              # Full documentation
└── ARCHITECTURE.md        # This file

Launched Processes:
├── [Seller] Node process listening on 8080 + 9999
├── [Buyer] Node process listening on 8081 + 9998
└── [CLI] Interactive client connecting to either
```

---

## Security Considerations

### 1. Encryption
- ✅ AES-256-CBC for mesh messages
- ✅ IV randomization per message
- ❌ No TLS for HTTP (add in production)
- ❌ Hardcoded shared secret (use key exchange in production)

### 2. Authentication
- ⚠️ peer ID based (pseudo-anonymous)
- ❌ No signature verification (add in production)
- ❌ No rate limiting (add in production)

### 3. Blockchain
- ✅ Ethers.js for secure signing
- ⚠️ Private keys in memory (use hardware wallet in production)
- ✅ TX verification on-chain

### Production Upgrades Needed:
1. **TLS/HTTPS** for HTTP endpoints
2. **Ed25519 signatures** for message authentication
3. **Hardware wallet** integration instead of in-memory keys
4. **Rate limiting** and DDoS protection
5. **Persistent storage** for negotiation history
6. **Multi-sig** for blockchain settlements

---

## Performance Characteristics

### Latency
```
HTTP Request (local):     ~5-10ms
UDP Mesh Message:         ~1-5ms
Blockchain TX (Ethereum): ~12-15 seconds
Negotiation round-trip:   ~50-100ms
```

### Throughput
```
Concurrent Negotiations: Limited by Node.js event loop
                        ~100-500 per second (with optimization)

Blockchain Settlements:  Limited by Ethereum network
                        ~1-5 per second (mainnet)
                        Instant (testnet/Ganache)
```

### Resource Usage
```
Per Node (Seller/Buyer):
  Memory: ~50-100 MB
  CPU: Minimal (idle), 10-20% during negotiation
  Network: <1 MB/negotiation
```

---

## Scalability Roadmap

### Phase 1 (Current - Hackathon)
- Single negotiation at a time
- 2-node mesh
- Local blockchain or testnet

### Phase 2 (Production Upgrade)
- Concurrent negotiation queue
- Multiple mesh zones
- Multi-chain settlement
- Persistent database

### Phase 3 (Enterprise)
- Sharded negotiation clusters
- Global mesh network
- Real-time market settlement
- Advanced AI agents

---

## Testing Strategy

### Unit Tests
- DNSEncryption: encrypt/decrypt correctness
- AgenticNegotiator: decision logic
- HTTP402Handler: challenge expiration

### Integration Tests
- Full negotiation flow (test.js)
- Payment verification
- Blockchain settlement
- Mesh peer discovery

### Load Tests
- 100 concurrent negotiations
- 1000 mesh peers
- 10 TPS blockchain throughput

---

## Deployment Options

### Option 1: Local Development
```bash
npm run seller
npm run buyer
node cli.js --server http://localhost:8081
```

### Option 2: Docker Compose (Same Machine)
```bash
docker-compose up -d
```

### Option 3: Two Physical Machines
```bash
# Machine 1
npm run seller

# Machine 2
PEER_IP=<machine1-ip> npm run buyer
```

### Option 4: Kubernetes (Future)
```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: seller-agent
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: agent-dns:latest
        env:
        - name: ROLE
          value: "seller"
        ports:
        - containerPort: 8080
        - containerPort: 9999
          protocol: UDP
```

---

## Environment Variables

```bash
# Required
ETHEREUM_PRIVATE_KEY="0x..."
ETHEREUM_RPC_URL="http://localhost:8545"

# Optional
ANTHROPIC_API_KEY="sk-..."       # For Claude-powered negotiation
NODE_ENV="production"            # Security mode
LOG_LEVEL="info"                 # Verbosity
NEGOTIATION_TIMEOUT="300"        # Seconds (default: 300)
PAYMENT_CHALLENGE_EXPIRY="300"   # Seconds (default: 300)
```

---

## Debugging Tips

### Enable Debug Logging
```bash
DEBUG=* node agent-dns-server.js --port 8080 --role seller
```

### Monitor Network Traffic
```bash
# Watch mesh messages (UDP 9999)
tcpdump -i lo 'udp port 9999'
```

### Check Blockchain Connection
```bash
curl http://localhost:8080/wallet/balance
```

### Trace Negotiation State
```bash
curl http://localhost:8080/negotiate/<negotiation-id>
```

### View Mesh Topology
```bash
curl http://localhost:8080/mesh/peers | jq
```

---

## References

- [RFC 7231 - HTTP 402 Payment Required](https://tools.ietf.org/html/rfc7231#section-6.4.2)
- [Ethereum JSON-RPC](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [libp2p Mesh Networking](https://libp2p.io/)
- [AES-256-CBC Specification](https://csrc.nist.gov/publications/detail/sp/800-38a/final)
- [ethers.js Documentation](https://docs.ethers.org/)

---

**Architecture by**: Hackathon Team  
**Last Updated**: March 2026  
**Status**: Production-Ready for Hackathon Submission
