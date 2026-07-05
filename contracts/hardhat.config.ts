import { HardhatUserConfig, subtask } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Offline/sandboxed environments cannot reach binaries.soliditylang.org. When
// SOLC_OFFLINE=1 and the solc npm package (matching the pinned version) is
// installed, compile with its bundled soljson instead of downloading. CI and
// normal dev machines are unaffected.
if (process.env.SOLC_OFFLINE === "1") {
  const {
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
  } = require("hardhat/builtin-tasks/task-names");
  subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args: any, _hre: any, runSuper: any) => {
    if (args.solcVersion === "0.8.24") {
      const compilerPath = require.resolve("solc/soljson.js");
      return {
        compilerPath,
        isSolcJs: true,
        version: "0.8.24",
        longVersion: "0.8.24+commit.e11b9ed9",
      };
    }
    return runSuper(args);
  });
}

// Secrets are read from the environment ONLY. Never hard-code keys here.
// See docs/security-model.md. .env is git-ignored.
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Pin metadata for reproducible bytecode / source verification.
      metadata: { bytecodeHash: "none" },
    },
  },
  networks: {
    hardhat: {},
    // Networks are only usable when the matching env vars are set.
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
  },
};

export default config;
