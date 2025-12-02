// scripts/deploy.js (ethers murni)
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import "dotenv/config";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { SEPOLIA_RPC, PRIVATE_KEY } = process.env;
if (!SEPOLIA_RPC || !PRIVATE_KEY) throw new Error("SEPOLIA_RPC/PRIVATE_KEY belum di .env");

const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// muat ABI + bytecode dari artifact
const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "KrearsipV2.sol", "KrearsipV2.json");
const { abi, bytecode } = JSON.parse(readFileSync(artifactPath, "utf8"));

async function main() {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("KrearsipV2 deployed at:", addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
