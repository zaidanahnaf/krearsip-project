// hardhat.config.js
import "@nomicfoundation/hardhat-ethers";   // WAJIB agar hre.ethers ada
import "dotenv/config";

const { SEPOLIA_RPC, PRIVATE_KEY } = process.env;

/** @type import("hardhat/config").HardhatUserConfig */
export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
