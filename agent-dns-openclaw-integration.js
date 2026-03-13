#!/usr/bin/env node

/**
 * OpenClaw + Agent DNS Settlement Integration
 * 
 * Production-ready server integrating with the real OpenClaw protocol.
 * Uses the ELSA x402 DeFi API for micropayments on Base.
 * 
 * Based on: https://github.com/HeyElsa/elsa-openclaw
 * API: https://x402-api.heyelsa.ai
 * 
 * Features:
 * - 15+ ELSA x402 DeFi tools (search, price, portfolio, swaps, perps, limits)
 * - Autonomous buyer/seller agents with gap-based negotiation
 * - 4-step swap flow: Quote → Dry Run → Confirm → Execute Pipeline
 * - Budget controls ($0.05/call, $2/day, 30/min rate limit)
 * - Non-custodial: private keys never leave this process
 * - Separate payment & trade wallets supported
 * 
 * Usage:
 *   node agent-dns-openclaw-integration.js --agent-type buyer --chain base
 *   node agent-dns-openclaw-integration.js --agent-type seller --chain base --port 8081
 */

const express = require('express');
const crypto = require('crypto');
const { ethers } = require('ethers');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Load .env if dotenv is available
try { require('dotenv').config(); } catch (_) { /* optional */ }

const { ElsaX402Client, OpenClawAgent, createRouter, TOOL_COSTS } = require('./lib');

// ============ CONFIG ============
const argv = yargs(hideBin(process.argv))
  .option('agent-type', { describe: 'buyer or seller', default: process.env.AGENT_TYPE || 'buyer', type: 'string' })
  .option('chain', { describe: 'blockchain chain', default: process.env.CHAIN || 'base', type: 'string' })
  .option('port', { describe: 'Server port', default: parseInt(process.env.PORT, 10) || 8080, type: 'number' })
  .option('elsa-api-url', { describe: 'ELSA X402 API URL', default: process.env.ELSA_API_URL || 'https://x402-api.heyelsa.ai', type: 'string' })
  .option('private-key', { describe: 'Payment private key', default: process.env.PAYMENT_PRIVATE_KEY || process.env.PRIVATE_KEY, type: 'string' })
  .option('trade-key', { describe: 'Trade private key (optional, falls back to payment key)', default: process.env.TRADE_PRIVATE_KEY, type: 'string' })
  .option('wallet-address', { describe: 'Wallet address', default: process.env.WALLET_ADDRESS, type: 'string' })
  .option('execution-mode', { describe: 'dry_run or confirmed', default: process.env.EXECUTION_MODE || 'dry_run', type: 'string' })
  .help()
  .argv;

const AGENT_TYPE = argv['agent-type'];
const CHAIN = argv.chain;
const PORT = argv.port;
const ELSA_API_URL = argv['elsa-api-url'];

// Auto-generate key if missing/placeholder
let PAYMENT_KEY = argv['private-key'];
if (!PAYMENT_KEY || PAYMENT_KEY.includes('YOUR_') || PAYMENT_KEY.length < 10) {
  PAYMENT_KEY = `0x${crypto.randomBytes(32).toString('hex')}`;
  console.log('⚠️  No valid private key found. Running in demo mode.');
  console.log('   → Set PAYMENT_PRIVATE_KEY in .env or via --private-key');
  console.log('   → Fund your wallet at: https://x402.heyelsa.ai/\n');
}

// ============ INITIALIZE ============
const elsa = new ElsaX402Client({
  paymentPrivateKey: PAYMENT_KEY,
  tradePrivateKey: argv['trade-key'],
  apiUrl: ELSA_API_URL,
  chain: CHAIN,
});

const agent = new OpenClawAgent(AGENT_TYPE, elsa, {
  chain: CHAIN,
  executionMode: argv['execution-mode'],
});

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           OpenClaw + Agent DNS Settlement System               ║
║           Powered by ELSA X402 (heyelsa.ai)                   ║
║                                                                ║
║  Agent: ${AGENT_TYPE.toUpperCase().padEnd(49)}║
║  Chain: ${CHAIN.padEnd(51)}║
║  Mode:  ${argv['execution-mode'].padEnd(50)}║
║  Payment Wallet: ${elsa.paymentAddress.substring(0, 26).padEnd(37)}...║
║  Trade Wallet:   ${elsa.tradeAddress.substring(0, 26).padEnd(37)}...║
║  ELSA API: ${ELSA_API_URL.padEnd(47)}║
╚════════════════════════════════════════════════════════════════╝
`);

// ============ EXPRESS APP ============
const app = express();
app.use(express.json());
app.use('/', createRouter(elsa, agent, { CHAIN, ELSA_API_URL }));

// ============ SERVER ============
let server;

function start() {
  return new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
      const tools = Object.keys(TOOL_COSTS).length;
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║              🚀 OpenClaw Agent DNS Started                     ║
║                                                                ║
║  Server: http://localhost:${String(PORT).padEnd(36)}║
║  Tools:  ${String(tools + ' ELSA x402 DeFi tools loaded').padEnd(48)}║
║                                                                ║
║  📊 Read-Only Endpoints:                                      ║
║  GET  /health                      (status)                   ║
║  GET  /search/:query               (search tokens)            ║
║  GET  /price/:token                (token price)              ║
║  GET  /portfolio                   (portfolio analysis)       ║
║  GET  /balances                    (wallet balances)           ║
║  GET  /transactions                (tx history)               ║
║  GET  /yield/suggestions           (yield opportunities)      ║
║  GET  /budget/status               (budget & costs)           ║
║  GET  /agent/status                (agent info)               ║
║  GET  /trades                      (trade history)            ║
║  GET  /limit-orders                (active limit orders)      ║
║  GET  /perp/positions              (open perp positions)      ║
║                                                                ║
║  🔄 Trading Endpoints:                                        ║
║  POST /quote/swap                  (swap quote)               ║
║  POST /trade/propose               (agent decision)           ║
║  POST /trade/execute               (4-step swap flow)         ║
║  POST /limit-order                 (create limit order)       ║
║  POST /perp/open                   (open perp position)       ║
║  POST /perp/close                  (close perp position)      ║
║  POST /openclaw/command            (natural language)         ║
║                                                                ║
║  💡 API Costs (ELSA X402 via heyelsa.ai):                    ║
║  • Token search/price/portfolio: ~$0.002                      ║
║  • Wallet analysis: ~$0.005                                   ║
║  • Swap dry-run: ~$0.005                                      ║
║  • Swap execution: ~$0.05                                     ║
║  • Limit order / Perp: ~$0.05                                 ║
║                                                                ║
║  🔗 Resources:                                                ║
║  • Dashboard: https://x402.heyelsa.ai/                        ║
║  • GitHub:    https://github.com/HeyElsa/elsa-openclaw        ║
║                                                                ║
║  ✅ Ready. Press Ctrl+C to stop.                              ║
╚════════════════════════════════════════════════════════════════╝
      `);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} already in use! Try: --port ${PORT + 1}`);
      } else {
        console.error(`\n❌ Server error: ${err.message}`);
      }
      reject(err);
    });
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  const stats = elsa.getSessionStats();
  console.log(`\n👋 Shutting down OpenClaw Agent...`);
  console.log(`📊 Session: ${stats.callCount} API calls, $${stats.totalSpent.toFixed(4)} spent, ${Math.round(stats.uptimeMs / 1000)}s uptime`);
  if (server) {
    server.close(() => {
      console.log('🔒 Server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
});

module.exports = { ElsaX402Client, OpenClawAgent, app, elsa, agent };
