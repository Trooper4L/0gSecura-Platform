require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // 0G Galileo Testnet
    "og-galileo": {
      url: "https://evmrpc-testnet.0g.ai",
      accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : [],
      chainId: 16601,
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
      timeout: 60000
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Hardhat network
    hardhat: {
      chainId: 16601 // Mock 0G chain ID for testing
    }
  },
  etherscan: {
    // Note: 0G Network may not have etherscan integration yet
    // This can be updated when block explorer API is available
    apiKey: {
      "og-galileo": "dummy-key" // Placeholder
    },
    customChains: [
      {
        network: "og-galileo",
        chainId: 16601,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/api", // May not work initially
          browserURL: "https://chainscan-galileo.0g.ai"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  },
  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
