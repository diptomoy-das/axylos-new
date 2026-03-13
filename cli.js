#!/usr/bin/env node

/**
 * CLI Client for Agent DNS Mesh Network
 * Interact with buyer/seller agents from terminal
 * 
 * Usage:
 *   node cli.js --server http://localhost:8080 --role seller
 */

const axios = require('axios');
const readline = require('readline');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('server', { describe: 'Server URL', default: 'http://localhost:8080', type: 'string' })
  .option('role', { describe: 'Your role (seller/buyer)', default: 'buyer', type: 'string' })
  .argv;

const API_BASE = argv.server;
const ROLE = argv.role;

let activeNegotiationId = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function checkHealth() {
  try {
    const res = await axios.get(`${API_BASE}/health`);
    console.log('\n✅ Server Health:', res.data);
    return true;
  } catch (e) {
    console.error('❌ Server unreachable:', e.message);
    return false;
  }
}

async function initiateNegotiation() {
  const service = await prompt('Service (e.g., "dns-query"): ');
  const offer = parseFloat(await prompt('Initial offer (ETH): '));
  const counterpartyId = await prompt('Counterparty ID: ');

  try {
    const res = await axios.post(`${API_BASE}/negotiate/initiate`, {
      service,
      initialOffer: offer,
      counterpartyId
    });

    activeNegotiationId = res.data.negotiationId;
    console.log('\n✅ Negotiation initiated!');
    console.log(`📋 Negotiation ID: ${activeNegotiationId}`);
    console.log(`📊 Initial Offer: ${offer} ETH`);
    console.log(`🎯 Status:`, res.data.negotiation);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function makeOffer() {
  if (!activeNegotiationId) {
    console.log('❌ No active negotiation. Start one first with "initiate"');
    return;
  }

  const amount = parseFloat(await prompt('Your offer (ETH): '));

  try {
    const res = await axios.post(`${API_BASE}/negotiate/${activeNegotiationId}/offer`, {
      amount
    });

    console.log('\n✅ Offer submitted!');
    console.log('🤖 Agent Decision:', res.data.agentDecision);
    if (res.data.agentDecision.action === 'ACCEPT') {
      console.log('🎉 NEGOTIATION ACCEPTED!');
    }
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function getNegotiationStatus() {
  const negoId = await prompt('Negotiation ID: ');

  try {
    const res = await axios.get(`${API_BASE}/negotiate/${negoId}`);
    console.log('\n📊 Negotiation Status:');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function requestPayment() {
  const amount = await prompt('Amount (ETH): ');
  const service = await prompt('Service: ');

  try {
    const res = await axios.get(`${API_BASE}/pay/challenge`, {
      params: { amount, service }
    });

    console.log('\n💰 Payment Challenge Generated!');
    console.log('Challenge ID:', res.data.challenge.id);
    console.log('Amount:', res.data.challenge.amount, 'ETH');
    console.log('Pay to:', res.data.paymentInstructions.to);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function verifyPayment() {
  const challengeId = await prompt('Challenge ID: ');
  const txHash = await prompt('Transaction Hash: ');
  const negoId = await prompt('Negotiation ID (optional): ');

  try {
    const res = await axios.post(`${API_BASE}/pay/verify`, {
      challengeId,
      transactionHash: txHash,
      negotiationId: negoId || null
    });

    console.log('\n✅ Payment Verified!');
    console.log('Settlement:', res.data);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function connectPeer() {
  const host = await prompt('Peer Host: ');
  const port = parseInt(await prompt('Peer Port: '));

  try {
    const res = await axios.post(`${API_BASE}/mesh/connect`, { host, port });
    console.log('\n✅', res.data);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function getPeers() {
  try {
    const res = await axios.get(`${API_BASE}/mesh/peers`);
    console.log('\n👥 Mesh Peers:');
    console.log('Your ID:', res.data.peerId);
    console.log('Connected peers:');
    res.data.peers.forEach((p) => {
      console.log(`  - ${p.id} (${p.host}:${p.port})`);
    });
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function getBalance() {
  try {
    const res = await axios.get(`${API_BASE}/wallet/balance`);
    console.log('\n👛 Wallet Balance:');
    console.log('Address:', res.data.address);
    console.log('Balance:', res.data.balance);
  } catch (e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

async function showMenu() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         Agent DNS Mesh - ${ROLE.toUpperCase().padEnd(39)}║
║         Server: ${API_BASE.padEnd(45)}║
╚════════════════════════════════════════════════════════════╝

[1] Check Server Health
[2] Initiate Negotiation
[3] Make Counter Offer
[4] Check Negotiation Status
[5] Request Payment Challenge
[6] Verify Payment (Settle on Blockchain)
[7] Connect to Peer
[8] View Mesh Peers
[9] Check Wallet Balance
[0] Exit

`);

  const choice = await prompt('Choose action: ');

  switch (choice) {
    case '1':
      await checkHealth();
      break;
    case '2':
      await initiateNegotiation();
      break;
    case '3':
      await makeOffer();
      break;
    case '4':
      await getNegotiationStatus();
      break;
    case '5':
      await requestPayment();
      break;
    case '6':
      await verifyPayment();
      break;
    case '7':
      await connectPeer();
      break;
    case '8':
      await getPeers();
      break;
    case '9':
      await getBalance();
      break;
    case '0':
      console.log('👋 Goodbye!');
      process.exit(0);
    default:
      console.log('❌ Invalid choice');
  }

  console.log('\n' + '─'.repeat(60));
  await showMenu();
}

async function main() {
  console.log(`🚀 Connecting to ${API_BASE}...\n`);

  const healthy = await checkHealth();
  if (!healthy) {
    process.exit(1);
  }

  await showMenu();
}

main().catch(console.error);

process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});
