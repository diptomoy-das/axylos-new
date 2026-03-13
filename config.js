/**
 * Centralized configuration for OpenClaw + Agent DNS Settlement
 * 
 * Loads from:
 *   1. CLI arguments (highest priority)
 *   2. Environment variables
 *   3. Defaults (lowest priority)
 * 
 * ELSA X402 API: https://x402.heyelsa.ai/
 * ELSA X402 Docs: https://x402.heyelsa.ai/docs
 * OpenClaw: https://x402.heyelsa.ai/openclaw
 */

require('dotenv').config();
const crypto = require('crypto');
const { ethers } = require('ethers');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .option('agent-type', {
        describe: 'Agent role: buyer or seller',
        default: process.env.AGENT_TYPE || 'buyer',
        type: 'string',
        choices: ['buyer', 'seller'],
    })
    .option('chain', {
        describe: 'Blockchain network (base, ethereum, arbitrum, polygon, optimism, bsc, avalanche, zksync)',
        default: process.env.CHAIN || 'base',
        type: 'string',
    })
    .option('port', {
        describe: 'HTTP server port',
        default: parseInt(process.env.PORT, 10) || 8080,
        type: 'number',
    })
    .option('elsa-api-url', {
        describe: 'ELSA X402 API URL (heyelsa.ai)',
        default: process.env.ELSA_API_URL || 'https://x402-api.heyelsa.ai',
        type: 'string',
    })
    .option('private-key', {
        describe: 'Ethereum private key for signing X402 payment tokens',
        default: process.env.PRIVATE_KEY,
        type: 'string',
    })
    .option('wallet-address', {
        describe: 'Ethereum wallet address (auto-derived from private-key if omitted)',
        default: process.env.WALLET_ADDRESS,
        type: 'string',
    })
    .help()
    .alias('h', 'help')
    .version('1.0.0')
    .argv;

// Derive wallet address from private key if not provided
// Auto-generate a random key if placeholder or missing
let rawKey = argv['private-key'];
if (!rawKey || rawKey.includes('YOUR_PRIVATE_KEY_HERE') || rawKey.length < 10) {
    rawKey = `0x${crypto.randomBytes(32).toString('hex')}`;
    console.log('⚠️  No valid private key found. Using auto-generated key (demo mode).');
    console.log('   → Set your real key in .env or via --private-key flag');
    console.log(`   → Get one at: https://x402.heyelsa.ai/\n`);
}
const PRIVATE_KEY = rawKey;
const WALLET_ADDRESS = argv['wallet-address'] || new ethers.Wallet(PRIVATE_KEY).address;

const config = {
    // Agent
    AGENT_TYPE: argv['agent-type'],
    CHAIN: argv.chain,
    PORT: argv.port,

    // ELSA X402 (heyelsa.ai)
    ELSA_API_URL: argv['elsa-api-url'],
    ELSA_DASHBOARD_URL: 'https://x402.heyelsa.ai',
    ELSA_DOCS_URL: 'https://x402.heyelsa.ai/docs',
    ELSA_OPENCLAW_URL: 'https://x402.heyelsa.ai/openclaw',
    ELSA_FAUCET_URL: 'https://x402.heyelsa.ai/',

    // Wallet
    PRIVATE_KEY,
    WALLET_ADDRESS,

    // Chain IDs
    CHAIN_IDS: {
        base: 8453,
        ethereum: 1,
        arbitrum: 42161,
        optimism: 10,
        polygon: 137,
        bsc: 56,
        avalanche: 43114,
        zksync: 324,
    },

    // API Cost structure (in USDC)
    COSTS: {
        getTokenPrice: 0.002,
        getPortfolio: 0.01,
        getSwapQuote: 0.01,
        executeSwapDryRun: 0.01,
        executeSwapConfirmed: 0.05,
        analyzeWallet: 0.01,
        getYieldSuggestions: 0.02,
        getTokenBalance: 0.005,
    },

    // Supported chains
    SUPPORTED_CHAINS: ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche', 'zksync'],

    // Supported protocols
    SUPPORTED_PROTOCOLS: {
        dex: ['Uniswap', 'Curve', 'Aave', '1inch', 'Balancer', 'SushiSwap', 'PancakeSwap'],
        perpetuals: ['Hyperliquid', 'Avantis'],
        yield: ['Aave', 'Compound', 'Curve', 'Yearn'],
    },
};

module.exports = config;
