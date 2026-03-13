const axios = require('axios');
const { ethers } = require('ethers');

const apiUrls = [
    'https://x402-api.heyelsa.ai',
    'https://x402.heyelsa.ai'
];

const endpoints = [
    'get_token_price',
    'elsa_get_token_price',
    'api/get_token_price',
    'api/elsa_get_token_price'
];

async function test() {
    for (const url of apiUrls) {
        for (const ep of endpoints) {
            try {
                const fullUrl = `${url}/${ep}`;
                console.log(`Testing ${fullUrl}...`);
                const res = await axios.post(fullUrl, {}, { timeout: 2000 });
                console.log(`  Result: ${res.status}`);
            } catch (err) {
                console.log(`  Result: ${err.response ? err.response.status : err.message}`);
            }
        }
    }
}

test();
