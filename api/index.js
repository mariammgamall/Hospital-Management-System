const app = require('../backend/src/app');
const { autoSeedDefaultUsers } = require('../backend/src/utils/autoSeed');

// Automatically initialize default accounts and seed mock records on boot
autoSeedDefaultUsers().catch(console.error);

module.exports = app;
