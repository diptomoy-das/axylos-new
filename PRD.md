# 📋 Product Requirements Document (PRD)

## Agent DNS Mesh + HTTP 402 Payment + Blockchain Settlement

**Version:** 1.0  
**Date:** March 2026  
**Status:** Ready for Development  
**Audience:** Developers, Product Managers, Investors

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Problem Statement](#problem-statement)
4. [Solution Overview](#solution-overview)
5. [Target Users](#target-users)
6. [Key Features](#key-features)
7. [Functional Requirements](#functional-requirements)
8. [Non-Functional Requirements](#non-functional-requirements)
9. [System Architecture](#system-architecture)
10. [API Specifications](#api-specifications)
11. [Data Models](#data-models)
12. [Security Requirements](#security-requirements)
13. [Deployment & Infrastructure](#deployment--infrastructure)
14. [Success Metrics](#success-metrics)
15. [Timeline & Milestones](#timeline--milestones)
16. [Risk Assessment](#risk-assessment)
17. [Dependencies & Integration](#dependencies--integration)
18. [Future Roadmap](#future-roadmap)

---

## Executive Summary

### Overview
We are building a **decentralized autonomous negotiation protocol** for Web3 services that combines:
- **AI-powered agentic negotiation** for autonomous price discovery
- **Encrypted P2P mesh networking** for decentralized communication
- **HTTP 402 payment protocol** for service monetization
- **Blockchain settlement** for trustless, verifiable transactions

### Value Proposition
- **Trustless:** All settlements recorded on-chain
- **Decentralized:** No central authority or marketplace fees
- **Autonomous:** AI agents negotiate without human intervention
- **Standards-Based:** Uses RFC 7231 HTTP 402 payment protocol
- **Secure:** End-to-end AES-256 encryption with blockchain verification

### Target Market
- Microservices & API marketplaces
- Computational resource trading (GPU/CPU rental)
- Data exchange platforms
- Content licensing and royalty distribution
- Decentralized AI model trading

### Business Model
- **B2B SaaS:** Licensing the protocol for enterprise marketplaces
- **Marketplace:** Transaction fees (1-5%) on settled payments
- **Premium Tier:** Advanced agent strategies, analytics, settlement optimization

---

## Product Overview

### Product Name
**AgentDNS Settlement Protocol** (Internal codename: Agent-DNS-Mesh)

### Product Category
- Decentralized Protocol
- Payment Infrastructure
- Autonomous Agent Framework

### Core Use Case
Enable two parties to automatically negotiate and settle service agreements with cryptographic certainty, without intermediaries.

### Example Scenarios

**Scenario 1: GPU Rental Marketplace**
```
Buyer: "I need GPU compute for 1 hour"
Network: Seller posts "1 GPU/hour for 0.05 ETH"
Agents: Auto-negotiate price (buyer: 0.03, seller: 0.05 → settle at 0.04)
Payment: Buyer sends 0.04 ETH with HTTP 402 challenge
Settlement: Both receive on-chain confirmation, service begins
```

**Scenario 2: Data Sharing Platform**
```
Buyer: "I want access to anonymized transaction dataset"
Seller: "Dataset available for 0.1 ETH"
Negotiation: Agents counter-offer until gap < 5%
Payment: Buyer pays, receives decryption key
Settlement: Permanent on-chain record, buyer can resell rights
```

**Scenario 3: Content Licensing**
```
Creator: Publishes video requiring 0.002 ETH per view
User: Wants to watch but negotiates on price
Agents: Settle on 0.0015 ETH
Payment: Micropayment via HTTP 402
Settlement: Creator receives payment, user gets access
```

---

## Problem Statement

### Current Market Gaps

**1. Lack of Decentralized Price Discovery**
- Centralized marketplaces charge 5-30% fees
- Prices are set by intermediaries, not market forces
- No trustless mechanism for P2P service trading

**2. Inefficient Negotiation Process**
- Manual back-and-forth takes hours/days
- Requires human involvement for each transaction
- High friction for small/medium value deals

**3. Payment Infrastructure Issues**
- No standard for service-based web payments
- HTTP 402 (RFC 7231) has existed since 1997 but nobody implements it
- Payment verification requires multiple steps

**4. Trust & Settlement Problems**
- Escrow services charge fees and hold funds
- Delayed settlement (T+2, T+3 models)
- Disputes require manual intervention

**5. Privacy Concerns**
- Centralized platforms track all transactions
- User data sold to third parties
- No end-to-end encryption by default

### Why Existing Solutions Don't Work

| Problem | Current Solutions | Our Approach |
|---------|-------------------|--------------|
| Price Discovery | Centralized marketplaces (1inch, OpenSea, Uniswap) | Decentralized agents + P2P negotiation |
| Negotiation | Manual chat/email, API limits | Autonomous agents with game theory |
| Payments | Stripe, PayPal, centralized crypto | HTTP 402 + blockchain settlement |
| Settlement | Escrow services (2-5% fee) | Immediate on-chain (0% fee) |
| Privacy | None, ads-supported | Encrypted P2P mesh, no centralization |

---

## Solution Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  BLOCKCHAIN LAYER                   │
│              (Ethereum / Polygon / Arbitrum)        │
│          Settlement contracts + verification        │
└─────────────────────────────────────────────────────┘
                        ↑ ↓
┌─────────────────┐   ┌──────────┐   ┌─────────────────┐
│  Seller Agent   │   │   HTTP   │   │  Buyer Agent    │
│   (Port 8080)   │←→→│   402    │←→→│  (Port 8081)    │
│                 │   │ Handler  │   │                 │
│ • Negotiator    │   └──────────┘   │ • Negotiator    │
│ • Encryption    │       ↓ ↑        │ • Encryption    │
│ • Settlement    │   ┌──────────┐   │ • Settlement    │
│ • Wallet        │   │    UDP   │   │ • Wallet        │
└─────────────────┘   │  Mesh    │   └─────────────────┘
                      │ Network  │
                      └──────────┘
```

### Core Components

1. **Agentic Negotiator**
   - Economic game theory-based decision making
   - Gap-based counter-offer logic
   - History tracking and analysis

2. **DNSEncryption Module**
   - AES-256-CBC symmetric encryption
   - Per-message random IVs
   - Shared secret key management

3. **P2P Mesh Network**
   - UDP-based peer discovery
   - Auto-peer registration
   - Message broadcasting

4. **HTTP 402 Handler**
   - RFC 7231 compliant challenges
   - Expiring payment requests
   - Challenge-response verification

5. **Blockchain Settlement**
   - ethers.js wallet integration
   - Transaction signing and submission
   - Receipt verification

6. **REST API Server**
   - Express.js with JSON endpoints
   - Stateless API design
   - Rate limiting & validation

---

## Target Users

### Primary Users

**1. Decentralized Marketplace Operators**
- Building peer-to-peer trading platforms
- Want to eliminate intermediary fees
- Need trustless settlement mechanism
- Target: Uniswap, 1inch, OpenSea competitors

**2. API/Microservices Providers**
- Selling compute, storage, data access
- Want dynamic pricing based on supply/demand
- Need automated payment collection
- Target: AWS, Akash, Filecoin competitors

**3. Content Creators & Digital Assets**
- Musicians, artists, writers selling digital works
- Royalty distribution to multiple creators
- Micropayment support
- Target: Audius, SuperRare, Mirror

**4. Data Scientists & ML Engineers**
- Monetizing datasets and models
- Need buyer-seller matching
- Automated licensing agreements
- Target: Hugging Face Hub enterprise

### Secondary Users

**5. DeFi Developers**
- Building settlement-as-a-service products
- Need reliable payment negotiation
- Want white-label solution

**6. Enterprise B2B Platforms**
- Internal marketplace for services
- Crypto payments for global teams
- Zero intermediary fees

---

## Key Features

### 1. Agentic Autonomous Negotiation

**Description:** Two AI agents negotiate prices based on economic principles

**Details:**
- Seller agent (hardened): Tries to maximize price
- Buyer agent (flexible): Tries to minimize price
- Gap-based decision logic:
  - Gap < 5%: ACCEPT
  - Gap 5-20%: COUNTER to midpoint
  - Gap > 20%: COUNTER with improved offer
- Negotiation timeout: 300 seconds (configurable)
- Max rounds: 50 (configurable)

**Acceptance Criteria:**
- [ ] Agents make decisions within 100ms
- [ ] Accept rate > 90% for reasonable offers
- [ ] Handle stalled negotiations gracefully
- [ ] Track negotiation history

### 2. Encrypted P2P Mesh Network

**Description:** Decentralized peer discovery and messaging without central server

**Details:**
- Protocol: UDP unicast + broadcast
- Default ports: 9999 (Seller), 9998 (Buyer)
- Encryption: AES-256-CBC per message
- Peer discovery: Automatic via broadcast
- Message types: Negotiation, Payment, Settlement
- Max peers: Configurable (default 1000)

**Acceptance Criteria:**
- [ ] Peers discover each other within 5 seconds
- [ ] All messages encrypted end-to-end
- [ ] Broadcast reaches all connected peers
- [ ] Handles peer disconnection gracefully

### 3. HTTP 402 Payment Protocol

**Description:** Standards-based payment challenge mechanism for web services

**Details:**
- HTTP Status Code: 402 Payment Required
- Challenge ID: Cryptographically unique
- Expiration: 5 minutes (configurable)
- Amount: In ETH (configurable precision)
- Response: 200 OK upon successful verification
- Reference: Negotiation ID included in challenge

**Acceptance Criteria:**
- [ ] Challenge generated within 10ms
- [ ] Expiration enforced strictly
- [ ] Challenge ID is collision-free
- [ ] 402 response is RFC 7231 compliant

### 4. Blockchain Settlement

**Description:** Trustless, verifiable transaction settlement on Ethereum

**Details:**
- Chain: Ethereum mainnet, Sepolia, Goerli, Ganache
- Wallet: HD wallet with ethers.js
- Transaction: Direct fund transfer with negotiation data
- Confirmation: Wait for 1+ blocks
- Record: Permanent on-chain history
- Audit Trail: Negotiation ID in transaction data

**Acceptance Criteria:**
- [ ] TX submits within 1 second
- [ ] Wait for confirmation up to 60s
- [ ] Handle failed/reverted transactions
- [ ] Track settlement status

### 5. Interactive CLI Interface

**Description:** Terminal user interface for managing negotiations

**Details:**
- Menu-driven interface
- Real-time status updates
- Support for all operations
- Color-coded output
- Extensible menu system
- Error handling with helpful messages

**Acceptance Criteria:**
- [ ] All operations accessible from menu
- [ ] Status updates within 500ms
- [ ] Handles input validation
- [ ] Clear error messages

### 6. REST API Endpoints

**Description:** Programmatic interface for integration

**Details:**
- Base URL: `http://localhost:8080` (Seller), `http://localhost:8081` (Buyer)
- Format: JSON request/response
- Auth: Optional API key support (future)
- Rate limit: Configurable per IP
- Versioning: `/v1/` prefix

**Endpoints:**
- POST `/negotiate/initiate` - Start negotiation
- GET `/negotiate/:id` - Get status
- POST `/negotiate/:id/offer` - Make counter-offer
- GET `/pay/challenge` - Get payment challenge
- POST `/pay/verify` - Verify & settle
- GET `/mesh/peers` - List connected peers
- POST `/mesh/connect` - Add peer
- GET `/wallet/balance` - Check balance
- GET `/health` - Health check

**Acceptance Criteria:**
- [ ] All endpoints respond within 100ms
- [ ] Proper HTTP status codes
- [ ] Validation on all inputs
- [ ] Error messages helpful

---

## Functional Requirements

### FR1: Negotiation Management

**FR1.1: Initiate Negotiation**
- User provides: service name, initial offer amount, counterparty ID
- System creates unique negotiation ID
- System broadcasts negotiation initiation to mesh
- System stores negotiation in memory/database
- Returns: negotiation ID, initial state

**FR1.2: Make Counter-Offer**
- User provides: negotiation ID, new offer amount
- System validates negotiation exists and is active
- System calls agent decision logic with current gap
- System gets agent response: ACCEPT/COUNTER/REJECT
- System broadcasts offer to mesh
- System updates negotiation history
- Returns: updated negotiation, agent decision

**FR1.3: Accept Negotiation**
- User confirms acceptance of agent decision
- System marks negotiation as ACCEPTED
- System triggers payment flow
- System broadcasts ACCEPTED to mesh
- Returns: settlement status

**FR1.4: Reject/Timeout Negotiation**
- Explicit rejection by user or timeout after 300s
- System marks negotiation as REJECTED/TIMEOUT
- System cleans up resources
- System broadcasts termination to mesh
- Returns: rejection confirmation

### FR2: Payment Processing

**FR2.1: Generate Payment Challenge**
- System receives payment request with amount
- System generates unique challenge ID (UUID4)
- System sets expiration (now + 5 minutes)
- System returns challenge ID, amount, deadline, payment address
- HTTP status: 402 Payment Required
- All challenges stored in memory

**FR2.2: Verify Payment**
- User provides: challenge ID, transaction hash, negotiation ID
- System validates challenge exists and not expired
- System queries blockchain for transaction
- System verifies transaction includes payment amount
- System verifies transaction recipient
- System marks challenge as verified
- System triggers settlement
- Returns: verification result, settlement status

### FR3: Mesh Networking

**FR3.1: Peer Discovery**
- On startup, system listens on UDP port
- System broadcasts "I'm here" message with peer ID
- System receives broadcasts from other peers
- System adds peers to peer list automatically
- System maintains heartbeat with peers

**FR3.2: Manual Peer Connection**
- User/system provides: host, port
- System adds peer to peer list
- System sends handshake message
- System expects ACK within 5 seconds
- Returns: connection status

**FR3.3: Message Broadcasting**
- System sends message to all connected peers
- System uses UDP unicast for each peer
- System implements retry logic for failed sends
- System logs delivery status
- All messages encrypted with AES-256-CBC

### FR4: Blockchain Settlement

**FR4.1: Submit Settlement Transaction**
- System receives verified payment
- System constructs transaction object
- System includes negotiation ID in transaction data
- System signs transaction with private key
- System submits to blockchain RPC
- System polls for confirmation
- Returns: transaction hash, block number, status

**FR4.2: Verify Settlement on-chain**
- System queries blockchain for transaction
- System verifies transaction was mined
- System extracts settlement amount and recipient
- System stores settlement record
- Returns: verification result

### FR5: Agent Decision Logic

**FR5.1: Gap Analysis**
- Input: Demand price, current offer, negotiation history
- Calculate gap: `|demand - offer|`
- Decide based on thresholds:
  - Gap < 5%: Return ACCEPT
  - Gap 5-20%: Calculate midpoint, return COUNTER
  - Gap > 20%: Improve offer by 10%, return COUNTER

**FR5.2: Stall Detection**
- Monitor negotiation rounds
- If > 50 rounds without acceptance: Mark STALLED
- If same offer repeated 3x: Mark STALLED
- Return STALLED status to user

### FR6: Encryption & Security

**FR6.1: Message Encryption**
- For each message:
  - Generate random IV (16 bytes)
  - Encrypt message with AES-256-CBC
  - Return encrypted message + IV
- Decryption: Use same IV + key

**FR6.2: Key Management**
- System generates shared secret on startup
- Key persists for session duration
- Key stored in memory only (not disk)
- Different key per peer connection (future)

---

## Non-Functional Requirements

### NFR1: Performance

**NFR1.1: Response Time**
- HTTP request latency: < 100ms (p95)
- Mesh message latency: < 10ms (p95)
- Negotiation round-trip: < 200ms (p95)
- Agent decision: < 50ms (p99)
- Blockchain submission: < 1s (p95)

**NFR1.2: Throughput**
- Concurrent negotiations: > 100 per node
- Negotiation rounds per second: > 500
- Mesh messages per second: > 1000
- Blockchain TPS: Limited by Ethereum network

**NFR1.3: Scalability**
- Support 1000+ connected peers
- Handle 10,000+ historical negotiations
- Graceful degradation under load
- Queue management for failed operations

### NFR2: Reliability

**NFR2.1: Availability**
- Uptime: 99.9% (during beta)
- Recovery time: < 1 minute after crash
- Graceful shutdown/restart
- No data loss on restart

**NFR2.2: Fault Tolerance**
- Handle peer disconnections
- Retry failed blockchain submissions (up to 5x)
- Timeout handling for stalled negotiations
- Orphaned transaction recovery

**NFR2.3: Data Integrity**
- All settlements recorded permanently
- Encryption prevents tampering
- Blockchain provides immutability
- Audit trail for all operations

### NFR3: Security

**NFR3.1: Encryption**
- All P2P messages: AES-256-CBC
- Blockchain transactions: ECDSA signed
- Private keys: Never logged
- Key rotation: Supported (future)

**NFR3.2: Authentication**
- Peer ID verification: Supports signatures (future)
- API key support: Planned
- Rate limiting: Per IP address

**NFR3.3: Compliance**
- No PII collection
- GDPR compliant (data minimization)
- No user tracking
- Open audit trail

### NFR4: Usability

**NFR4.1: Learning Curve**
- First negotiation setup: < 5 minutes
- Understanding agent logic: < 10 minutes
- API integration: < 30 minutes

**NFR4.2: Documentation**
- API documentation: Complete
- Code comments: Inline for complex logic
- Examples: Provided for each endpoint
- Troubleshooting guide: Comprehensive

### NFR5: Maintainability

**NFR5.1: Code Quality**
- Test coverage: > 80%
- Linting: ESLint enforced
- Code review: Required for all PRs
- Documentation: Inline + external

**NFR5.2: Deployability**
- Docker support: Included
- Environment variables: Configurable
- No build step: Pure Node.js
- Single command deployment: Supported

---

## System Architecture

### Layered Architecture

```
┌────────────────────────────────────┐
│         Presentation Layer         │
│  ┌──────────────────────────────┐  │
│  │   CLI Interface (readline)   │  │
│  │   REST API (Express)         │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
         ↓              ↑
┌────────────────────────────────────┐
│      Application Logic Layer       │
│  ┌──────────────────────────────┐  │
│  │ AgenticNegotiator            │  │
│  │ HTTP402Handler               │  │
│  │ BlockchainSettlement         │  │
│  │ RequestValidator             │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
         ↓              ↑
┌────────────────────────────────────┐
│       Infrastructure Layer         │
│  ┌──────────────────────────────┐  │
│  │ DNSEncryption (AES-256)      │  │
│  │ P2PMeshNetwork (UDP)         │  │
│  │ BlockchainProvider (ethers)  │  │
│  │ StorageEngine (Memory/DB)    │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
         ↓              ↑
┌────────────────────────────────────┐
│        External Services           │
│  ┌──────────────────────────────┐  │
│  │ Ethereum RPC Node            │  │
│  │ Other P2P Peers              │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### Component Interactions

```
CLI User
   │
   ├─→ CLI Menu (readline)
   │      │
   │      └─→ Express App:POST /negotiate/initiate
   │            │
   │            ├─→ AgenticNegotiator.startNegotiation()
   │            ├─→ P2PMeshNetwork.broadcast()
   │            └─→ Return negotiationId
   │
   ├─→ Express App:POST /negotiate/:id/offer
   │      │
   │      ├─→ AgenticNegotiator.addOffer()
   │      ├─→ AgenticNegotiator.generateAgentResponse()
   │      │    └─→ Gap analysis, decision logic
   │      ├─→ P2PMeshNetwork.broadcast()
   │      └─→ Return decision
   │
   └─→ Express App:POST /pay/verify
          │
          ├─→ HTTP402Handler.verifyPayment()
          ├─→ BlockchainSettlement.submitSettlement()
          │    ├─→ ethers.Wallet.sendTransaction()
          │    ├─→ Poll for confirmation
          │    └─→ Return txHash
          ├─→ P2PMeshNetwork.broadcast()
          └─→ Return settlement status
```

---

## API Specifications

### Base URL
```
Seller: http://localhost:8080
Buyer: http://localhost:8081
```

### Authentication
- None (v1.0)
- API Key support planned for v2.0

### Request/Response Format
- Content-Type: `application/json`
- Character encoding: UTF-8

### Error Handling

**Standard Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400,
  "timestamp": "2026-03-08T12:00:00Z"
}
```

### Endpoints

#### 1. GET /health

**Purpose:** Health check, server status

**Request:**
```bash
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "role": "seller",
  "peerId": "abc123def456",
  "walletAddress": "0x742d35Cc...",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

#### 2. POST /negotiate/initiate

**Purpose:** Initiate a new negotiation

**Request:**
```bash
POST /negotiate/initiate
Content-Type: application/json

{
  "service": "smart-contract-audit",
  "initialOffer": 0.05,
  "counterpartyId": "seller-node-123"
}
```

**Parameters:**
- `service` (string, required): Service being negotiated
- `initialOffer` (number, required): Initial offer in ETH
- `counterpartyId` (string, required): ID of other party

**Response (200 OK):**
```json
{
  "negotiationId": "f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c",
  "negotiation": {
    "id": "f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c",
    "initiator": "buyer",
    "service": "smart-contract-audit",
    "offers": [
      {
        "party": "buyer",
        "amount": 0.05,
        "timestamp": 1678300800000
      }
    ],
    "status": "ACTIVE",
    "createdAt": 1678300800000,
    "expiresAt": 1678301100000
  }
}
```

**Error Responses:**
- 400: Missing required fields
- 409: Negotiation already exists

---

#### 3. GET /negotiate/:negotiationId

**Purpose:** Get negotiation status and history

**Request:**
```bash
GET /negotiate/f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c
```

**Response (200 OK):**
```json
{
  "id": "f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c",
  "initiator": "buyer",
  "offers": [
    {
      "party": "buyer",
      "amount": 0.05,
      "timestamp": 1678300800000
    },
    {
      "party": "seller",
      "amount": 0.045,
      "timestamp": 1678300810000
    }
  ],
  "status": "ACTIVE",
  "lastUpdated": 1678300810000
}
```

**Error Responses:**
- 404: Negotiation not found

---

#### 4. POST /negotiate/:negotiationId/offer

**Purpose:** Submit counter-offer and get agent decision

**Request:**
```bash
POST /negotiate/f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c/offer
Content-Type: application/json

{
  "amount": 0.048
}
```

**Parameters:**
- `amount` (number, required): New offer in ETH

**Response (200 OK):**
```json
{
  "negotiation": {
    "id": "f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c",
    "offers": [
      /* ... */
    ],
    "status": "ACTIVE"
  },
  "agentDecision": {
    "action": "ACCEPT",
    "reason": "Gap is acceptable (< 5%)",
    "timestamp": 1678300820000
  }
}
```

**Agent Decision Actions:**
- `ACCEPT`: Gap < 5%, ready to settle
- `COUNTER`: Gap 5-20%, proposes midpoint
- `REJECT`: Terms unacceptable, negotiation ends
- `STALLED`: Too many rounds without progress

**Error Responses:**
- 404: Negotiation not found
- 400: Invalid amount

---

#### 5. GET /pay/challenge?amount=0.048&service=audit

**Purpose:** Get payment challenge (HTTP 402)

**Request:**
```bash
GET /pay/challenge?amount=0.048&service=smart-contract-audit
```

**Query Parameters:**
- `amount` (number, required): Amount in ETH
- `service` (string, required): Service name

**Response (402 Payment Required):**
```json
{
  "status": "PAYMENT_REQUIRED",
  "challenge": {
    "id": "pmt-xyz789abc",
    "amount": 0.048,
    "service": "smart-contract-audit",
    "timestamp": 1678300830000,
    "expiresAt": 1678301130000
  },
  "paymentInstructions": {
    "to": "0x742d35Cc6634C0532925a3b844Bc1e0d0f18E9e3",
    "amount": 0.048,
    "chainId": 11155111,
    "network": "sepolia"
  }
}
```

**Error Responses:**
- 400: Missing required parameters
- 500: Challenge generation failed

---

#### 6. POST /pay/verify

**Purpose:** Verify payment and settle on blockchain

**Request:**
```bash
POST /pay/verify
Content-Type: application/json

{
  "challengeId": "pmt-xyz789abc",
  "transactionHash": "0x1234567890abcdef...",
  "negotiationId": "f4a2c8d9-e5f6-4a3b-8c9d-2f1e3c4a5b6c"
}
```

**Parameters:**
- `challengeId` (string, required): Challenge ID from step 5
- `transactionHash` (string, required): TX hash from blockchain
- `negotiationId` (string, optional): Link to negotiation

**Response (200 OK):**
```json
{
  "status": "SETTLEMENT_COMPLETE",
  "settlement": {
    "success": true,
    "transactionHash": "0x1234567890abcdef...",
    "blockNumber": 12345678,
    "from": "0xBuyer...",
    "to": "0xSeller...",
    "value": "0.048",
    "gasUsed": 21000,
    "timestamp": 1678300840000
  }
}
```

**Error Responses:**
- 404: Challenge not found
- 410: Challenge expired
- 402: Payment verification failed
- 500: Blockchain submission failed

---

#### 7. GET /mesh/peers

**Purpose:** List connected P2P peers

**Request:**
```bash
GET /mesh/peers
```

**Response (200 OK):**
```json
{
  "peerId": "abc123def456",
  "peers": [
    {
      "id": "192.168.1.101:9998",
      "host": "192.168.1.101",
      "port": 9998,
      "connectedAt": 1678300000000,
      "lastSeen": 1678300840000,
      "status": "connected"
    }
  ],
  "totalPeers": 1
}
```

---

#### 8. POST /mesh/connect

**Purpose:** Manually connect to a peer

**Request:**
```bash
POST /mesh/connect
Content-Type: application/json

{
  "host": "192.168.1.102",
  "port": 9999
}
```

**Parameters:**
- `host` (string, required): Peer IP address or hostname
- `port` (number, required): Peer UDP port

**Response (200 OK):**
```json
{
  "status": "Connected",
  "peer": {
    "id": "192.168.1.102:9999",
    "host": "192.168.1.102",
    "port": 9999
  }
}
```

**Error Responses:**
- 400: Missing/invalid parameters
- 500: Connection failed

---

#### 9. GET /wallet/balance

**Purpose:** Check wallet balance

**Request:**
```bash
GET /wallet/balance
```

**Response (200 OK):**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc1e0d0f18E9e3",
  "balance": "2.5",
  "unit": "ETH",
  "chainId": 11155111,
  "network": "sepolia"
}
```

**Error Responses:**
- 500: RPC connection failed

---

### Rate Limiting

**Planned for v2.0:**
- 100 requests per minute per IP
- 1000 requests per minute per API key
- Burst allowance: +50%

---

## Data Models

### Negotiation

```typescript
interface Negotiation {
  id: string;                    // UUID
  initiator: "buyer" | "seller"; // Who started
  service: string;               // Service name
  offers: Offer[];               // Offer history
  status: NegotiationStatus;     // Current status
  createdAt: number;             // Timestamp
  expiresAt: number;             // Timeout
  lastUpdated: number;           // Last change
  rounds: number;                // Offer count
  agentDecisions: Decision[];    // Agent responses
}

interface Offer {
  party: "buyer" | "seller";
  amount: number;                // ETH
  timestamp: number;
}

type NegotiationStatus = 
  | "ACTIVE"                     // Ongoing
  | "ACCEPTED"                   // Agreed to settle
  | "REJECTED"                   // Explicitly rejected
  | "TIMEOUT"                    // Expired
  | "STALLED";                   // Too many rounds

interface Decision {
  action: "ACCEPT" | "COUNTER" | "REJECT" | "STALLED";
  newOffer?: number;             // If COUNTER
  reason: string;
  timestamp: number;
}
```

### Payment Challenge

```typescript
interface PaymentChallenge {
  id: string;                    // UUID
  amount: number;                // ETH required
  service: string;               // Service being paid for
  timestamp: number;             // Created
  expiresAt: number;             // 5 minutes from creation
  status: "PENDING" | "VERIFIED" | "EXPIRED";
  transactionHash?: string;      // After payment
}
```

### Settlement

```typescript
interface Settlement {
  id: string;                    // UUID
  negotiationId: string;         // Linked negotiation
  challengeId: string;           // Linked challenge
  transactionHash: string;       // Blockchain TX
  blockNumber: number;
  from: string;                  // Buyer address
  to: string;                    // Seller address
  amount: number;                // ETH
  status: "PENDING" | "CONFIRMED" | "FAILED";
  timestamp: number;
}
```

### Peer

```typescript
interface Peer {
  id: string;                    // host:port
  host: string;                  // IP or hostname
  port: number;                  // UDP port
  peerId: string;                // Unique peer identifier
  connectedAt: number;
  lastSeen: number;
  status: "connected" | "disconnected" | "unreachable";
  messagesSent: number;
  messagesReceived: number;
}
```

---

## Security Requirements

### SR1: Encryption

**SR1.1: Message Encryption**
- Algorithm: AES-256-CBC (NIST approved)
- Key length: 256 bits
- IV length: 128 bits (per message)
- Mode: CBC with PKCS7 padding
- Implementation: Node.js crypto module

**SR1.2: Key Management**
- Shared secret: 32 bytes random
- Generated on startup
- Stored in memory only
- No disk persistence of keys
- Different key per peer (future v2.0)

**SR1.3: Blockchain Signing**
- Algorithm: ECDSA (secp256k1)
- Library: ethers.js
- Private key: Never logged
- Signing: Client-side only
- No key sharing

### SR2: Authentication

**SR2.1: Peer Identity**
- Current: Network-level (IP:port)
- Planned: Ed25519 signatures (v2.0)
- Handshake: TLS-style exchange (v3.0)

**SR2.2: API Authentication**
- v1.0: None (local development)
- v2.0: API Key + rate limiting
- v3.0: OAuth 2.0

### SR3: Authorization

**SR3.1: Peer Access Control**
- Any peer can connect (v1.0)
- Whitelist support (v2.0)
- Role-based access (v3.0)

### SR4: Data Protection

**SR4.1: Data at Rest**
- Memory only (no persistence)
- No PII stored
- Temporary storage cleared on shutdown

**SR4.2: Data in Transit**
- All P2P: AES-256-CBC encrypted
- Blockchain: Native ECDSA
- HTTPS: Supported for APIs (optional)

### SR5: Privacy

**SR5.1: User Privacy**
- No user tracking
- No analytics by default
- No third-party integrations
- Negotiation data: Local only

**SR5.2: Blockchain Transparency**
- Settlement amounts: Public on-chain
- Parties: Pseudo-anonymous (ETH addresses)
- Negotiation details: Private (not on-chain)

### SR6: Compliance

**SR6.1: GDPR**
- Data minimization: Implemented
- Right to deletion: Supported
- Data portability: Export negotiation history
- No PII collection

**SR6.2: Regulatory**
- No KYC/AML (peer-to-peer)
- No sanctions screening
- User responsible for compliance

### SR7: Audit & Logging

**SR7.1: Logging**
- All negotiations: Logged
- All payments: Logged
- All errors: Logged
- PII: Never logged

**SR7.2: Audit Trail**
- Immutable history (memory-based for v1)
- Blockchain verification
- Timestamps on all events

---

## Deployment & Infrastructure

### Development Environment

**Prerequisites:**
- Node.js 16+ (18+ recommended)
- npm or yarn
- Ethereum test wallet
- Ganache or Sepolia testnet access

**Setup:**
```bash
git clone <repo>
cd agent-dns-mesh
npm install
npm run seller    # Terminal 1
npm run buyer     # Terminal 2
node cli.js       # Terminal 3
```

### Staging Environment

**Infrastructure:**
- 2x Ubuntu 22.04 VMs (t3.small)
- Docker containers
- Sepolia testnet
- Persistent logging

**Deployment:**
```bash
docker-compose -f docker-compose.yml up -d
```

### Production Environment (Phase 2)

**Infrastructure:**
- Kubernetes cluster (3+ nodes)
- Load balancing (nginx/HAProxy)
- PostgreSQL for persistence
- Redis for caching
- Prometheus monitoring
- ELK logging stack

**Blockchain:**
- Ethereum mainnet
- Smart contract deployment
- Multi-sig wallet for settlement
- Liquidity pool integration

**Security:**
- TLS 1.3 for all APIs
- API key management (HashiCorp Vault)
- Rate limiting
- DDoS protection (Cloudflare)
- WAF rules

### Configuration Management

**Environment Variables:**
```bash
# Ethereum
ETHEREUM_PRIVATE_KEY=0x...
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_CHAIN_ID=11155111

# Server
NODE_ENV=development|staging|production
PORT=8080
NETWORK_PORT=9999
ROLE=seller|buyer

# Negotiation
NEGOTIATION_TIMEOUT=300
MAX_NEGOTIATION_ROUNDS=50

# Payment
PAYMENT_CHALLENGE_EXPIRY=300
PAYMENT_MAX_RETRIES=5

# Network
MESH_MAX_PEERS=1000
MESH_BROADCAST_INTERVAL=30000

# Logging
LOG_LEVEL=debug|info|warn|error
LOG_FILE=/var/log/agent-dns.log
```

### Monitoring & Observability

**Metrics to Track:**
- Active negotiations (gauge)
- Negotiation completion rate (counter)
- Settlement success rate (counter)
- Average negotiation duration (histogram)
- P2P peer count (gauge)
- API response time (histogram)
- Blockchain confirmation time (histogram)

**Alerts:**
- High failure rate (> 5%)
- High latency (p95 > 500ms)
- Peer disconnect (all peers down)
- Blockchain connection loss

### Backup & Recovery

**Backup Strategy (Phase 2):**
- Hourly backup of negotiation DB
- Daily backup to S3
- Geographic replication
- 30-day retention

**Disaster Recovery:**
- RTO: 1 hour
- RPO: 1 minute
- Failover to standby cluster
- Data validation on restore

---

## Success Metrics

### Business Metrics

**BM1: Adoption**
- Number of unique negotiations per month
- Number of active buyers/sellers
- Network effect growth rate
- Market share vs. competitors

**BM2: Revenue**
- Settlement volume (USD equivalent)
- Transaction fees collected
- Premium tier adoption
- Enterprise customer count

**BM3: Engagement**
- Daily active agents
- Average negotiation duration
- Repeat user rate
- Customer satisfaction (NPS)

### Technical Metrics

**TM1: Performance**
- P95 API latency: < 100ms
- P95 negotiation round-trip: < 200ms
- Mesh message delivery: > 99.9%
- Blockchain confirmation: < 30s (testnet)

**TM2: Reliability**
- Platform uptime: > 99.5%
- Settlement success rate: > 99%
- Negotiation acceptance rate: > 90%
- Zero data loss events

**TM3: Scalability**
- Support 1000+ concurrent negotiations
- Support 100+ connected peers
- Linear scaling up to 10 nodes
- Graceful degradation under load

**TM4: Security**
- Zero security incidents
- Zero unauthorized access
- 100% encryption coverage
- Clean penetration test results

### User Metrics

**UM1: Usability**
- Time to first negotiation: < 5 minutes
- API integration time: < 30 minutes
- Support ticket resolution: < 24 hours
- Documentation completeness: 100%

**UM2: Satisfaction**
- Net Promoter Score (NPS): > 50
- Customer retention rate: > 80%
- Feature request fulfillment: > 80%
- Bug fix response time: < 24 hours

---

## Timeline & Milestones

### Phase 1: MVP (Current - 4 weeks)
**Goal:** Functional prototype for hackathon

- ✅ Week 1: Core negotiation engine
- ✅ Week 2: HTTP 402 + blockchain
- ✅ Week 3: P2P mesh + encryption
- ✅ Week 4: CLI + testing + documentation

**Deliverables:**
- Functional agent-dns-server.js
- CLI interface
- Test suite
- Documentation

### Phase 2: Closed Alpha (Weeks 5-12)
**Goal:** Production-ready, enterprise features

- Week 5-6: Database persistence
- Week 7: Advanced agent strategies
- Week 8: API authentication
- Week 9: Monitoring & logging
- Week 10: Security audit
- Week 11: Performance optimization
- Week 12: Beta release

**Deliverables:**
- Production deployment guide
- Enterprise features
- SLA guarantees
- Support infrastructure

### Phase 3: Open Beta (Weeks 13-20)
**Goal:** Community adoption, market testing

- Week 13-14: Public API release
- Week 15: Marketplace launch
- Week 16: SDK/client libraries
- Week 17: Analytics dashboard
- Week 18: Payment integrations
- Week 19: Bug fixes from beta
- Week 20: Mainnet preparation

**Deliverables:**
- Public documentation
- API SDKs (JS, Python, Go)
- Analytics platform
- Marketplace

### Phase 4: General Availability (Weeks 21-28)
**Goal:** Mainnet launch, enterprise adoption

- Week 21: Mainnet deployment
- Week 22: Enterprise tier
- Week 23: Institutional integrations
- Week 24: Advanced features
- Week 25: Governance token (optional)
- Week 26: Decentralized governance
- Week 27: Ecosystem tools
- Week 28: Scale infrastructure

**Deliverables:**
- Mainnet contracts
- Enterprise contracts
- Governance structure
- Ecosystem grants

---

## Risk Assessment

### R1: Technical Risks

**R1.1: Blockchain Network Congestion**
- Impact: High (settlement delays)
- Probability: Medium
- Mitigation:
  - Multi-chain support (v2)
  - Layer 2 integration (v3)
  - Dynamic gas pricing
  - Batching transactions

**R1.2: Peer Connectivity Issues**
- Impact: Medium (some peers can't connect)
- Probability: Medium
- Mitigation:
  - Fallback relay servers
  - STUN/TURN support
  - Connection pooling
  - Reconnection logic

**R1.3: Agent Decision Logic Flaw**
- Impact: High (unfair negotiations)
- Probability: Low
- Mitigation:
  - Extensive testing
  - User overrides
  - Economic review
  - Adjustable parameters

**R1.4: Encryption Key Compromise**
- Impact: Critical (all messages exposed)
- Probability: Very Low
- Mitigation:
  - Key rotation (v2)
  - Key exchange protocol (v3)
  - Perfect forward secrecy (v3)
  - Hardware security modules (enterprise)

### R2: Business Risks

**R2.1: Market Adoption**
- Impact: Critical (no revenue)
- Probability: Medium
- Mitigation:
  - Early partner onboarding
  - Free tier to attract users
  - Developer incentives
  - Community governance

**R2.2: Regulatory Changes**
- Impact: High (compliance burden)
- Probability: Medium
- Mitigation:
  - Legal review
  - Jurisdiction flexibility
  - Regulatory monitoring
  - Compliance library

**R2.3: Competitive Threats**
- Impact: Medium (market share loss)
- Probability: Medium
- Mitigation:
  - Fast iteration
  - Unique features
  - Network effects
  - Institutional partnerships

### R3: Operational Risks

**R3.1: Service Outage**
- Impact: High (users can't negotiate)
- Probability: Low
- Mitigation:
  - Multi-region deployment
  - Auto-failover
  - Health monitoring
  - Incident response plan

**R3.2: Data Loss**
- Impact: Critical (settlements lost)
- Probability: Very Low
- Mitigation:
  - Blockchain immutability
  - Multi-backup strategy
  - Disaster recovery plan
  - Regular drills

**R3.3: Security Breach**
- Impact: Critical (loss of trust)
- Probability: Low
- Mitigation:
  - Security hardening
  - Regular audits
  - Bug bounty program
  - Incident response plan

---

## Dependencies & Integration

### External Dependencies

**Must-Have:**
- Node.js 16+ (runtime)
- Ethereum RPC endpoint (blockchain)
- Standard crypto libraries (encryption)

**Nice-to-Have:**
- PostgreSQL (v2, persistence)
- Redis (v2, caching)
- Prometheus (v2, monitoring)
- Elasticsearch (v2, logging)

### Third-Party Integrations

**Blockchain:**
- Ethereum mainnet
- Sepolia testnet
- Polygon (v2)
- Arbitrum (v2)

**Payment:**
- Stripe (off-ramps, v2)
- PayPal (fiat on-ramp, v2)
- DEX liquidity (v3)

**Analytics:**
- Mixpanel (user behavior, v2)
- Datadog (infrastructure, v2)
- Dune Analytics (blockchain, v2)

**Development:**
- GitHub (code hosting)
- npm (package management)
- Docker Hub (image registry)
- AWS (infrastructure, v2)

### API Integrations (Planned)

**Incoming:**
- OpenAI API (advanced agents, v2)
- Anthropic Claude API (negotiation AI, v2)
- Langchain (LLM orchestration, v3)

**Outgoing:**
- 1inch API (liquidity, v2)
- OpenSea API (NFT markets, v2)
- Graph Protocol (indexing, v2)

---

## Future Roadmap

### V1.1 (Bug Fixes & Polish)
- Performance optimization
- UI/UX improvements
- Documentation updates
- Community feedback incorporation

### V2.0 (Enterprise Ready)
- Database persistence (PostgreSQL)
- API authentication (JWT/OAuth)
- Advanced agent strategies (Reinforcement Learning)
- Multi-chain support
- Dashboard & analytics
- Payment integrations
- Security hardening

### V3.0 (Scale & Governance)
- Layer 2 integration (Arbitrum, Optimism)
- Smart contract settlement
- Governance token
- Decentralized protocol governance
- Sharding for horizontal scaling
- Advanced privacy (ZK proofs)
- Ecosystem token grants

### V4.0 (Full Automation)
- Zero-knowledge proofs
- Fully decentralized governance
- Cross-chain settlement
- Advanced ML agents
- Real-time market data
- Synthetic asset support
- Algorithmic stablecoins

---

## Appendices

### A: Glossary

**Agent:** Autonomous software entity that makes decisions based on rules

**Agentic:** Relating to autonomous agents and their decision-making

**Challenge:** Payment request issued by server in HTTP 402 flow

**DNS:** Domain Name System (we use similar encrypted architecture)

**Mesh Network:** P2P network where each node connects to multiple others

**Negotiation:** Process of agents making counter-offers until agreement

**P2P:** Peer-to-Peer (direct connection without intermediary)

**Settlement:** Final transaction recording the agreed payment

**Web3:** Decentralized internet technologies (blockchain, crypto)

### B: Acronyms

**AES:** Advanced Encryption Standard
**API:** Application Programming Interface
**CLI:** Command Line Interface
**DDoS:** Distributed Denial of Service
**ETH:** Ethereum (cryptocurrency)
**GDPR:** General Data Protection Regulation
**HTTP:** HyperText Transfer Protocol
**IV:** Initialization Vector (encryption)
**NFR:** Non-Functional Requirement
**NPS:** Net Promoter Score
**P2P:** Peer-to-Peer
**PRD:** Product Requirements Document
**RPC:** Remote Procedure Call
**TCP:** Transmission Control Protocol
**TLS:** Transport Layer Security
**TX:** Transaction
**UDP:** User Datagram Protocol
**UUID:** Universally Unique Identifier
**WAF:** Web Application Firewall
**ZK:** Zero-Knowledge (proofs)

### C: Reference Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    Internet / Blockchain                   │
│                   (Ethereum L1/L2/Testnet)                 │
└────────────────────────────────────────────────────────────┘
                          ↑        ↓
                          
        ┌─────────────────────────────────────────┐
        │     Blockchain Settlement Smart Contract │
        │  (Future v2.0)                          │
        └─────────────────────────────────────────┘
                          ↑        ↓
        ┌─────────────────────────────────────────┐
        │         Agent DNS Node Cluster           │
        │  (Multiple geographies in v2+)          │
        │                                         │
        │  ┌──────────────────────────────────┐   │
        │  │  REST API Layer (Express)        │   │
        │  │  Ports: 8080, 8081              │   │
        │  └──────────────────────────────────┘   │
        │            ↕                            │
        │  ┌──────────────────────────────────┐   │
        │  │  Application Logic               │   │
        │  │  • Negotiator                    │   │
        │  │  • HTTP 402 Handler              │   │
        │  │  • Settlement Engine             │   │
        │  └──────────────────────────────────┘   │
        │            ↕                            │
        │  ┌──────────────────────────────────┐   │
        │  │  Infrastructure Layer            │   │
        │  │  • Encryption (AES-256)          │   │
        │  │  • P2P Mesh (UDP)                │   │
        │  │  • ethers.js (Blockchain)        │   │
        │  │  • Storage (Memory/DB)           │   │
        │  └──────────────────────────────────┘   │
        │                                         │
        └─────────────────────────────────────────┘
         ↑ P2P Mesh Network (UDP Broadcast) ↑
         │                                  │
    ┌────┴─────────────┐          ┌────────┴──────────┐
    │  Seller Node     │    ↔     │   Buyer Node      │
    │  (Role: Seller)  │          │  (Role: Buyer)    │
    │                  │          │                   │
    │ • Negotiator    │          │ • Negotiator     │
    │ • Wallet        │          │ • Wallet         │
    │ • HTTP Server   │          │ • HTTP Server    │
    │ • Mesh Listener │          │ • Mesh Listener  │
    │                  │          │                   │
    └──────────────────┘          └───────────────────┘
         ↑                               ↑
         │  CLI Interface                │  REST API Client
         │  (readline)                   │  (curl / SDK)
         │                               │
    ┌────┴──────────────┐          ┌────┴──────────────┐
    │   User (Seller)    │          │  User (Buyer)     │
    │   Terminal Session │          │  Terminal/App     │
    └────────────────────┘          └───────────────────┘
```

### D: Sample Negotiation Flow

```
Time    Actor           Action                          State
────────────────────────────────────────────────────────────────
T+0s    Buyer           POST /negotiate/initiate        
                        offer: 0.050 ETH               → CREATED
                        
T+1s    Network         Broadcast NEGOTIATION_STARTED   
                        
T+2s    Seller          Receives broadcast             
        Agent           Gap = |0.05 - 0.05| = 0
                        → Can ACCEPT but tries harder
                        Counter: 0.055 ETH             
                        
T+3s    Buyer           Sees counter 0.055 ETH        → COUNTERED
        Agent           Gap = |0.05 - 0.055| = 0.005
                        < 5% → ACCEPT
                        
T+4s    Network         Broadcast ACCEPTED            
                        
T+5s    Buyer           POST /pay/challenge            
                        amount: 0.05 ETH              → ACCEPTED
                        
T+6s    Buyer           Gets challenge ID: pmt-xyz
        (User)          Sends ETH TX to seller        
        
T+120s  Buyer           POST /pay/verify               
                        txHash: 0x1234...
                        
T+121s  Server          Validates TX on blockchain
        Settlement      Confirms receipt
        Engine          Broadcasts SETTLED             → SETTLED
                        
T+122s  Both            Negotiation complete
        Parties         Service delivery begins
```

### E: Example Configurations

**Aggressive Seller (v2.0 Feature):**
```json
{
  "strategy": "aggressive",
  "minPrice": 0.100,
  "timeoutSeconds": 60,
  "acceptableGap": 0.02,
  "counterFactor": 1.15,
  "maxRounds": 20
}
```

**Flexible Buyer (v2.0 Feature):**
```json
{
  "strategy": "flexible",
  "maxPrice": 0.080,
  "timeoutSeconds": 300,
  "acceptableGap": 0.05,
  "counterFactor": 0.90,
  "maxRounds": 50
}
```

---

## Sign-Off

**Document Owner:** Product Team
**Last Updated:** March 2026
**Next Review:** April 2026
**Status:** Ready for Development

### Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | Team | March 2026 | ✓ |
| Engineering Lead | Team | March 2026 | ✓ |
| Security Lead | Team | March 2026 | ✓ |
| Executive Sponsor | Hackathon | March 2026 | ✓ |

---

**END OF DOCUMENT**
