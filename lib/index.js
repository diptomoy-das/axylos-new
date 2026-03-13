/**
 * OpenClaw + Agent DNS Settlement - Core Library
 * 
 * Provides the ELSA X402 payment client, OpenClaw agent,
 * and Express router for the integration.
 * 
 * Based on the real OpenClaw tool catalog:
 * https://github.com/HeyElsa/elsa-openclaw
 */

const { ElsaX402Client, TOOL_COSTS, DEFAULT_BUDGET } = require('./ElsaX402PaymentClient');
const { OpenClawAgent } = require('./OpenClawAgent');
const { createRouter } = require('./routes');

module.exports = {
    ElsaX402Client,
    OpenClawAgent,
    createRouter,
    TOOL_COSTS,
    DEFAULT_BUDGET,
};
