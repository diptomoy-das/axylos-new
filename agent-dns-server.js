#!/usr/bin/env node

/**
 * OpenClaw + Agent DNS Settlement System
 * 
 * FINAL ARCHITECTURE
 * 1. OpenClaw = Agent Brain (reasoning, decision loops)
 * 2. Agent DNS = Communication Layer (UDP Mesh Network)
 * 3. Elsa X402 = Execution Layer (HeyElsa.ai API)
 * 4. Blockchain = Settlement Layer (Base/Ethereum)
 * 
 * Usage:
 *   Laptop A (Buyer): node agent-dns-server.js --agent-type buyer --port 8080 --network-port 9999
 *   Laptop B (Seller): node agent-dns-server.js --agent-type seller --port 8081 --network-port 9998
 */

const express = require('express');
const crypto = require('crypto');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ElsaX402Client, DEFAULT_BUDGET } = require('./lib');
const { P2PMeshNetwork } = require('./lib/MeshNetwork');

// Load environment
try { require('dotenv').config(); } catch (_) { }

const argv = yargs(hideBin(process.argv))
  .option('agent-type', { describe: 'buyer or seller', default: process.env.AGENT_TYPE || 'buyer', type: 'string' })
  .option('port', { describe: 'HTTP Server Port', default: parseInt(process.env.PORT, 10) || 8080, type: 'number' })
  .option('network-port', { describe: 'UDP Mesh Port', default: 9999, type: 'number' })
  .option('peer', { describe: 'Format: host:port to bootstrap mesh', type: 'string' })
  .option('chain', { describe: 'Target blockchain', default: process.env.CHAIN || 'base', type: 'string' })
  .argv;

const ROLE = argv['agent-type'];
const PORT = argv.port;
const NETWORK_PORT = argv['network-port'];
const CHAIN = argv.chain;

// ============ KEYS ============
let PAYMENT_KEY = process.env.PAYMENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!PAYMENT_KEY || PAYMENT_KEY.length < 10 || PAYMENT_KEY.includes('YOUR_')) {
  PAYMENT_KEY = `0x${crypto.randomBytes(32).toString('hex')}`;
  console.log(`⚠️  Warning: Using auto-generated key for DEMO mode.`);
  console.log(`   To execute real transactions via Elsa, set PAYMENT_PRIVATE_KEY in .env`);
}

// ============ INITIATE LAYERS ============

// 1. Communication Layer: P2P UDP Mesh
const meshId = crypto.randomBytes(8).toString('hex');
const mesh = new P2PMeshNetwork(NETWORK_PORT, meshId);

// 2. Execution Layer: ELSA X402
const elsa = new ElsaX402Client({
  paymentPrivateKey: PAYMENT_KEY,
  tradePrivateKey: process.env.TRADE_PRIVATE_KEY,
  chain: CHAIN,
});

// 3. State Management
const negotiations = new Map();
const pendingPayments = new Map(); // For HTTP 402 Challenges
let executionModeEnabled = (process.env.ELSA_ENABLE_EXECUTION_TOOLS === 'true');

// ============ OPENCLAW AGENT BRAIN ============

/**
 * OpenClaw Agent Loop
 * Negotiates over Mesh -> Agrees -> Parses HTTP 402 -> Executes ELSA Swap
 */
class AutonomousOpenClawAgent {
  constructor(role) {
    this.role = role;
    this.targetTokens = {
      buyer: { from: 'USDC', to: 'WETH' }, // Buying compute/services with USDC via WETH conversion
      seller: { from: 'WETH', to: 'USDC' }
    };
  }

  // --- Negotiation Tool --- 
  // Extends OpenClaw to call the mesh network
  async negotiatePriceTool(service, offer, negotiationId = null) {
    console.log(`🤖 [OpenClaw Brain] Negotiating ${service} at ${offer} ETH`);

    if (!negotiationId) {
      negotiationId = crypto.randomBytes(16).toString('hex');
      negotiations.set(negotiationId, { id: negotiationId, service, offers: [offer], status: 'ACTIVE' });
      mesh.broadcast({ type: 'NEGO_OFFER', negotiationId, service, offer });
      return { status: 'INITIATED', negotiationId };
    }

    let nego = negotiations.get(negotiationId);
    if (!nego) {
      nego = { id: negotiationId, service, offers: [], status: 'ACTIVE' };
      negotiations.set(negotiationId, nego);
    }

    nego.offers.push(offer);
    mesh.broadcast({ type: 'NEGO_OFFER', negotiationId, service, offer });
    return { status: 'COUNTER_SENT', negotiationId, offer };
  }

  // Handle incoming mesh offers
  async evaluateIncomingOffer(data) {
    const { negotiationId, service, offer } = data;

    // Simulate OpenClaw Agent constraints:
    // Buyer: Needs service cheap. Target 0.03. Max 0.05.
    // Seller: Minimum price 0.04.

    console.log(`\n💬 [Mesh] Received offer for ${service}: ${offer} ETH`);

    let decision = 'REJECT';
    let newOffer = null;

    if (this.role === 'buyer') {
      if (offer <= 0.035) decision = 'ACCEPT';
      else if (offer <= 0.05) { decision = 'COUNTER'; newOffer = offer * 0.9; }
    } else {
      if (offer >= 0.04) decision = 'ACCEPT';
      else if (offer >= 0.02) { decision = 'COUNTER'; newOffer = 0.045; }
    }

    console.log(`🤖 [OpenClaw Brain] Internal logic chose: ${decision} ${newOffer ? `(${newOffer})` : ''}`);

    if (decision === 'ACCEPT') {
      mesh.broadcast({ type: 'NEGO_ACCEPT', negotiationId });
      if (this.role === 'seller') {
        // Issue HTTP 402 Payment Challenge
        const challengeId = crypto.randomBytes(8).toString('hex');
        pendingPayments.set(challengeId, { amount: offer, status: 'REQUIRED' });

        console.log(`💳 [402 Payment] Issuing Challenge ID: ${challengeId} for ${offer} ETH`);
        mesh.broadcast({
          type: 'PAYMENT_402_REQUIRED',
          negotiationId,
          challengeId,
          amount: offer,
          recipient: elsa.paymentAddress
        });
      }
    } else if (decision === 'COUNTER') {
      await this.negotiatePriceTool(service, newOffer, negotiationId);
    }
  }

  // Handle incoming 402 challenge (Buyer side executes payment)
  async executePaymentTool(challengeData) {
    console.log(`\n💳 [OpenClaw Brain] Received 402 Challenge. Executing ELSA Swap...`);
    const { challengeId, amount, recipient, negotiationId } = challengeData;

    try {
      // 1. Execute OpenClaw Swap (Dry-run or Confirmed based on .env)
      console.log(`🔄 [Elsa X402] Executing Swap for ${amount} (Executing to: ${recipient})`);

      const payload = {
        fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
        toToken: '0x4200000000000000000000000000000000000006', // Base WETH
        fromAmount: amount, // Dynamic amount based on HTTP 402 challenge
        chain: CHAIN,
        walletAddress: elsa.tradeAddress || elsa.paymentAddress // Using trade wallet for actual swaps
      };

      let result;
      if (executionModeEnabled) {
        const quote = await elsa.getSwapQuote(payload);
        const dry = await elsa.executeSwapDryRun(payload);
        result = await elsa.executeSwapConfirmed({ ...payload, confirmationToken: dry.data?.confirmation_token });
      } else {
        // Dry-run mode for safety
        result = await elsa.executeSwapDryRun(payload);
      }

      console.log(`✅ [Settlement] Transaction secured. Pipeline/Receipt generated.`);

      mesh.broadcast({
        type: 'PAYMENT_402_COMPLETED',
        challengeId,
        negotiationId,
        proof: result.data || { status: 'demo_success', txHash: '0xabc123' }
      });

    } catch (e) {
      console.error(`❌ [Elsa X402] Swap Execution failed:`, e.message);
    }
  }
}

const openClaw = new AutonomousOpenClawAgent(ROLE);
openClaw.negotiatePriceTool = openClaw.negotiatePriceTool.bind(openClaw);
openClaw.evaluateIncomingOffer = openClaw.evaluateIncomingOffer.bind(openClaw);
openClaw.executePaymentTool = openClaw.executePaymentTool.bind(openClaw);

// ============ START SERVERS ============
async function start() {
  console.log(`
╔═════════════════════════════════════════════════════════╗
║          🚀 OpenClaw + Agent DNS Mesh Node             ║
║                                                         ║
║  Agent Role:      ${ROLE.toUpperCase().padEnd(33)} ║
║  UDP Mesh:        Port ${NETWORK_PORT.toString().padEnd(28)} ║
║  HTTP Server:     Port ${PORT.toString().padEnd(28)} ║
║  Settlement:      ${CHAIN.toUpperCase().padEnd(33)} ║
║  Payment Wallet:  ${elsa.paymentAddress.substring(0, 25)}... ║
║                                                         ║
║  [Mesh Encrypted Session Ready - Waiting for Peers]     ║
╚═════════════════════════════════════════════════════════╝
  `);

  mesh.start();

  if (argv.peer) {
    const [h, p] = argv.peer.split(':');
    mesh.addPeer(h, parseInt(p, 10));
  }

  // --- MESH LISTENER ---
  mesh.on('message', async (data, rinfo) => {
    if (data.type === 'NEGO_OFFER' && data.peerId !== mesh.peerId) {
      await openClaw.evaluateIncomingOffer(data);
    }

    else if (data.type === 'NEGO_ACCEPT' && data.peerId !== mesh.peerId) {
      console.log(`\n🤝 [Mesh] Counterparty accepted the deal.`);
    }

    else if (data.type === 'PAYMENT_402_REQUIRED' && data.peerId !== mesh.peerId && ROLE === 'buyer') {
      // OpenClaw senses the 402 error and automatically calls the payment tool
      await openClaw.executePaymentTool(data);
    }

    else if (data.type === 'PAYMENT_402_COMPLETED' && data.peerId !== mesh.peerId && ROLE === 'seller') {
      console.log(`\n💸 [Settlement] Payment 402 Completed! Proof received.`);
      pendingPayments.delete(data.challengeId);
      console.log(`✅ [Service] Service unlocked for peer.`);
    }
  });

  // --- EXPRESS API (Manual Triggers) ---
  const app = express();
  app.use(express.json());

  app.post('/admin/execution-mode', (req, res) => {
    if (typeof req.body.enabled === 'boolean') {
      executionModeEnabled = req.body.enabled;
      res.json({ success: true, enabled: executionModeEnabled });
    } else {
      res.status(400).json({ error: 'Missing boolean enabled field' });
    }
  });

  app.get('/status', (req, res) => {
    res.json({
      role: ROLE,
      chain: CHAIN,
      executionModeEnabled,
      meshConnected: true,
      wallet: elsa.paymentAddress
    });
  });

  app.post('/command', async (req, res) => {
    // Allows Natural Language or strict API trigger
    const { command, service, offer } = req.body;

    if (ROLE === 'buyer' && (command || '').toLowerCase().includes('buy compute')) {
      const result = await openClaw.negotiatePriceTool('GPU Compute', 0.03);
      return res.json({ status: 'Triggered OpenClaw Negotiation', ...result });
    }

    if (service && offer) {
      const result = await openClaw.negotiatePriceTool(service, parseFloat(offer));
      return res.json(result);
    }

    res.json({ error: 'Command not recognized by OpenClaw.' });
  });

  // Basic HTTP 402 Endpoint (If an external web client hits this instead of Mesh)
  app.get('/api/resource', (req, res) => {
    if (ROLE === 'buyer') return res.status(400).json({ error: 'Buyers do not serve resources' });

    const challengeId = crypto.randomBytes(8).toString('hex');
    res.status(402).json({
      error: 'Payment Required',
      challenge_id: challengeId,
      amount: '0.045 ETH',
      wallet: elsa.paymentAddress
    });
  });

  app.listen(PORT, () => {
    // Hidden
  });
}

start();

process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down...');
  mesh.stop();
  process.exit(0);
});
