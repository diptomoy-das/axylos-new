#!/usr/bin/env node

/**
 * OpenClaw + Agent DNS Integration Tests
 * Run this while the server is running in another terminal
 */

const axios = require('axios');
const assert = require('assert');

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
let passCount = 0;
let failCount = 0;

// Test utilities
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

async function request(method, path, data = null) {
  try {
    const config = { method, url: `${BASE_URL}${path}` };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Tests
async function runTests() {
  console.log(`
🧪 OpenClaw + Agent DNS Integration Tests

   Target: ${BASE_URL}
   Time: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HEALTH & STATUS TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  // Health check
  await test('GET /health returns healthy status', async () => {
    const res = await request('GET', '/health');
    assert.strictEqual(res.status, 'healthy', 'Status should be healthy');
    assert.ok(res.agentType, 'Should have agentType');
    assert.ok(res.chain, 'Should have chain');
  });

  await test('GET /health includes ELSA heyelsa.ai dashboard URL', async () => {
    const res = await request('GET', '/health');
    assert.ok(res.elsa.dashboard, 'Should have ELSA dashboard URL');
    assert.ok(res.elsa.dashboard.includes('x402.heyelsa.ai'), 'Should reference X402');
  });

  await test('GET /budget/status returns cost structure', async () => {
    const res = await request('GET', '/budget/status');
    assert.ok(res.costPerOperation, 'Should have cost structure');
    assert.ok(res.costPerOperation.getPrice, 'Should have getPrice cost');
  });

  await test('GET /budget/status includes session stats', async () => {
    const res = await request('GET', '/budget/status');
    assert.ok(res.sessionStats, 'Should have session stats');
    assert.ok(typeof res.sessionStats.spent_today_usd === 'number', 'Should have spent today amount');
    assert.ok(typeof res.sessionStats.total_calls === 'number', 'Should have API call count');
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PORTFOLIO & ANALYTICS TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await test('GET /portfolio returns portfolio data', async () => {
    const res = await request('GET', '/portfolio');
    assert.ok(res.portfolio, 'Should have portfolio');
    assert.ok(res.analysis, 'Should have analysis');
    assert.strictEqual(res.totalCost, 0.007, 'Cost should be $0.007');
  });

  await test('GET /price/:token returns token price', async () => {
    const res = await request('GET', '/price/WETH');
    assert.ok(res.token, 'Should have token');
    assert.ok(typeof res.price === 'number', 'Should have numeric price');
    assert.ok(res.cost, 'Should have cost');
  });

  await test('GET /yield/suggestions returns yield opportunities', async () => {
    const res = await request('GET', '/yield/suggestions');
    assert.ok(Array.isArray(res.suggestions), 'Should have suggestions array');
    assert.ok(res.cost, 'Should have cost');
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TRADING TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await test('POST /quote/swap validates required fields', async () => {
    try {
      await request('POST', '/quote/swap', {});
      throw new Error('Should have failed validation');
    } catch (error) {
      assert.ok(error.message.includes('400') || error.message.includes('Missing'), 'Should return 400');
    }
  });

  await test('POST /quote/swap returns swap quote', async () => {
    const res = await request('POST', '/quote/swap', {
      fromToken: 'USDC',
      toToken: 'WETH',
      amount: 100,
    });
    assert.ok(res.fromToken, 'Should have fromToken');
    assert.ok(res.toToken, 'Should have toToken');
    assert.ok(res.data !== undefined || res.error, 'Should have quote data or an error state');
  });

  await test('POST /trade/propose validates required fields', async () => {
    try {
      await request('POST', '/trade/propose', {});
      throw new Error('Should have failed validation');
    } catch (error) {
      assert.ok(error.message.includes('400') || error.message.includes('Missing'), 'Should return 400');
    }
  });

  await test('POST /trade/propose returns agent decision', async () => {
    const res = await request('POST', '/trade/propose', {
      fromToken: 'USDC',
      toToken: 'WETH',
      amount: 100,
      maxPrice: 2500,
    });
    assert.ok(res.proposal, 'Should have proposal');
    assert.ok(res.decision, 'Should have decision');
    assert.ok(['ACCEPT', 'COUNTER', 'REJECT'].includes(res.decision.decision), 'Decision should be valid');
  });

  await test('POST /trade/execute validates required fields', async () => {
    try {
      await request('POST', '/trade/execute', {});
      throw new Error('Should have failed validation');
    } catch (error) {
      assert.ok(error.message.includes('400') || error.message.includes('Missing'), 'Should return 400');
    }
  });

  await test('POST /trade/execute returns execution result', async () => {
    const res = await request('POST', '/trade/execute', {
      fromToken: 'USDC',
      toToken: 'WETH',
      amount: 100,
    });
    assert.ok(res.execution, 'Should have execution');
    assert.ok(res.costForDryRun, 'Should have dry-run cost');
    assert.ok(res.costForConfirmed, 'Should have confirmed cost');
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ADVANCED TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await test('GET /trades returns trade history', async () => {
    const res = await request('GET', '/trades');
    assert.ok(typeof res.count === 'number', 'Should have count');
    assert.ok(Array.isArray(res.trades), 'Should have trades array');
    assert.ok(res.agentType, 'Should have agent type');
  });

  await test('POST /openclaw/command validates required fields', async () => {
    try {
      await request('POST', '/openclaw/command', {});
      throw new Error('Should have failed validation');
    } catch (error) {
      assert.ok(error.message.includes('400') || error.message.includes('Missing'), 'Should return 400');
    }
  });

  await test('POST /openclaw/command handles price queries', async () => {
    const res = await request('POST', '/openclaw/command', {
      command: 'What is the price of WETH?',
    });
    assert.ok(res.command, 'Should echo command');
    assert.ok(res.response, 'Should have response');
    assert.ok(res.cost, 'Should have cost');
  });

  await test('GET /agent/status returns agent statistics', async () => {
    const res = await request('GET', '/agent/status');
    assert.ok(res.type, 'Should have agent type');
    assert.ok(res.chain, 'Should have chain');
    assert.ok(typeof res.totalTrades === 'number', 'Should have trade count');
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ Passed: ${passCount}
   ❌ Failed: ${failCount}
   📊 Total:  ${passCount + failCount}

`);

  if (failCount === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failCount} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error.message);
  process.exit(1);
});
