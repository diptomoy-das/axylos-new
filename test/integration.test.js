/**
 * Integration tests for OpenClaw + Agent DNS Settlement
 * 
 * Tests all 11 endpoints and ELSA X402 (heyelsa.ai) integration.
 * 
 * PREREQUISITE: Server must be running in another terminal first!
 *   node agent-dns-openclaw-integration.js --agent-type buyer --chain base
 * 
 * Run with: npm test
 *           node test/integration.test.js
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';

// ─── Helpers ─────────────────────────────────────────────────────

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + (url.search || ''),
            method,
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                reject(new Error(
                    `Cannot connect to ${BASE_URL}. Is the server running?\n` +
                    `   Start it first: node agent-dns-openclaw-integration.js --agent-type buyer --chain base`
                ));
            } else {
                reject(err);
            }
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ─── Test Runner ─────────────────────────────────────────────────

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   🧪 OpenClaw + Agent DNS Integration Tests               ║');
    console.log('║   ELSA X402 heyelsa.ai Integration Verification           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`   Target: ${BASE_URL}`);
    console.log('');

    // Pre-flight: check server is reachable
    try {
        await makeRequest('GET', '/health');
        console.log('   🟢 Server connection verified\n');
    } catch (err) {
        console.log('   🔴 Server not reachable!\n');
        console.log(`   ${err.message}\n`);
        process.exit(1);
    }

    for (const t of tests) {
        try {
            await t.fn();
            passed++;
            console.log(`   ✅ ${t.name}`);
        } catch (error) {
            failed++;
            console.log(`   ❌ ${t.name}`);
            console.log(`      Error: ${error.message}`);
        }
    }

    console.log('');
    if (failed === 0) {
        console.log(`   🎉 All tests passed!`);
    }
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total:  ${tests.length}`);
    console.log('');
    process.exit(failed > 0 ? 1 : 0);
}

// ─── Test Cases: Health & Status ─────────────────────────────────

test('GET /health returns healthy status', async () => {
    const res = await makeRequest('GET', '/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'healthy');
    assert.ok(res.data.agentType, 'Should have agentType');
    assert.ok(res.data.chain, 'Should have chain');
    assert.ok(res.data.walletAddress, 'Should have walletAddress');
});

test('GET /health includes ELSA heyelsa.ai config', async () => {
    const res = await makeRequest('GET', '/health');
    assert.ok(res.data.elsa, 'Should have elsa object');
    assert.ok(res.data.elsa.apiUrl.includes('heyelsa.ai'), 'ELSA API should reference heyelsa.ai');
    assert.ok(res.data.elsa.dashboard.includes('heyelsa.ai'), 'Dashboard should reference heyelsa.ai');
    assert.ok(res.data.elsa.docs.includes('heyelsa.ai'), 'Docs should reference heyelsa.ai');
    assert.strictEqual(res.data.elsa.connected, true, 'Should show connected');
});

test('GET /health includes uptime', async () => {
    const res = await makeRequest('GET', '/health');
    assert.strictEqual(typeof res.data.uptime, 'number', 'Should have numeric uptime');
    assert.ok(res.data.uptime >= 0, 'Uptime should be non-negative');
});

// ─── Test Cases: Budget & Pricing ────────────────────────────────

test('GET /budget/status returns cost structure', async () => {
    const res = await makeRequest('GET', '/budget/status');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.apiUrl.includes('heyelsa.ai'), 'API URL should be heyelsa.ai');
    assert.ok(res.data.costPerOperation, 'Should have cost structure');
    assert.ok(res.data.costPerOperation.getPrice, 'Should have getPrice cost');
    assert.ok(res.data.costPerOperation.getPortfolio, 'Should have getPortfolio cost');
    assert.ok(res.data.costPerOperation.getSwapQuote, 'Should have getSwapQuote cost');
    assert.ok(res.data.costPerOperation.executeSwap, 'Should have executeSwap cost');
    assert.ok(res.data.costPerOperation.analyzeWallet, 'Should have analyzeWallet cost');
    assert.ok(res.data.costPerOperation.getYieldSuggestions, 'Should have getYieldSuggestions cost');
});

test('GET /budget/status includes session stats', async () => {
    const res = await makeRequest('GET', '/budget/status');
    assert.ok(res.data.sessionStats !== undefined, 'Should have session stats');
    assert.strictEqual(typeof res.data.sessionStats.totalSpent, 'number', 'totalSpent should be number');
    assert.strictEqual(typeof res.data.sessionStats.callCount, 'number', 'callCount should be number');
});

test('GET /budget/status includes heyelsa.ai dashboard URL', async () => {
    const res = await makeRequest('GET', '/budget/status');
    assert.ok(res.data.dashboard.includes('heyelsa.ai'), 'Dashboard URL should include heyelsa.ai');
});

// ─── Test Cases: Trades ──────────────────────────────────────────

test('GET /trades returns trade history', async () => {
    const res = await makeRequest('GET', '/trades');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.trades), 'Trades should be an array');
    assert.ok(res.data.agentType, 'Should have agentType');
    assert.strictEqual(typeof res.data.count, 'number', 'Count should be a number');
});

test('GET /trades count matches array length', async () => {
    const res = await makeRequest('GET', '/trades');
    assert.strictEqual(res.data.count, res.data.trades.length, 'Count should match trades array length');
});

// ─── Test Cases: Input Validation ────────────────────────────────

test('POST /trade/propose rejects empty body', async () => {
    const res = await makeRequest('POST', '/trade/propose', {});
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error, 'Should return error for missing fields');
    assert.ok(res.data.error.includes('fromToken'), 'Error should mention required fields');
});

test('POST /trade/execute rejects empty body', async () => {
    const res = await makeRequest('POST', '/trade/execute', {});
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error, 'Should return error for missing fields');
});

test('POST /quote/swap rejects empty body', async () => {
    const res = await makeRequest('POST', '/quote/swap', {});
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error, 'Should return error for missing fields');
});

test('POST /openclaw/command rejects empty body', async () => {
    const res = await makeRequest('POST', '/openclaw/command', {});
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error, 'Should return error for missing command');
});

// ─── Test Cases: OpenClaw Natural Language ───────────────────────

test('POST /openclaw/command handles unknown commands gracefully', async () => {
    const res = await makeRequest('POST', '/openclaw/command', {
        command: 'hello world',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.availableCommands, 'Should list available commands');
    assert.ok(Array.isArray(res.data.availableCommands), 'available commands should be array');
    assert.ok(res.data.elsaDocs.includes('heyelsa.ai'), 'Should reference heyelsa.ai docs');
});

test('POST /openclaw/command routes price queries', async () => {
    const res = await makeRequest('POST', '/openclaw/command', {
        command: 'What is the price of WETH?',
    });
    assert.strictEqual(res.status, 200);
    // It will either return a price response or an error from the API (either is fine for routing test)
    assert.ok(res.data.command === 'What is the price of WETH?', 'Should echo back the command');
});

test('POST /openclaw/command routes portfolio queries', async () => {
    const res = await makeRequest('POST', '/openclaw/command', {
        command: 'Show my portfolio balance',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.command === 'Show my portfolio balance', 'Should echo back the command');
});

test('POST /openclaw/command routes yield queries', async () => {
    const res = await makeRequest('POST', '/openclaw/command', {
        command: 'Get yield farming suggestions',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.command === 'Get yield farming suggestions', 'Should echo back the command');
});

test('POST /openclaw/command routes swap queries', async () => {
    const res = await makeRequest('POST', '/openclaw/command', {
        command: 'I want to swap USDC to WETH',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.command === 'I want to swap USDC to WETH', 'Should echo back the command');
    assert.ok(res.data.hint || res.data.response, 'Should have a hint or response for swap');
});

// ─── Test Cases: Agent Status ────────────────────────────────────

test('GET /agent/status returns agent info with session stats', async () => {
    const res = await makeRequest('GET', '/agent/status');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.type, 'Should have agent type');
    assert.ok(res.data.chain, 'Should have chain');
    assert.strictEqual(typeof res.data.totalTrades, 'number', 'totalTrades should be number');
    assert.ok(Array.isArray(res.data.recentTrades), 'recentTrades should be array');
    assert.ok(res.data.lastUpdate, 'Should have lastUpdate timestamp');
    assert.ok(res.data.sessionStats, 'Should include ELSA heyelsa.ai session stats');
});

// ─── Run ─────────────────────────────────────────────────────────
runTests().catch((err) => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
