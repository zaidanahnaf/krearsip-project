// scripts/register.js (ethers murni)
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import "dotenv/config";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { SEPOLIA_RPC, PRIVATE_KEY } = process.env;
if (!SEPOLIA_RPC || !PRIVATE_KEY) throw new Error("SEPOLIA_RPC/PRIVATE_KEY belum di .env");

// GANTI setelah deploy:
const CONTRACT = "0xE312851899a6daEeC8DC5Aa9857eC0F2e8dE8eF7";
const FILE_HASH_HEX = "54ffb192af390bd8118f5243fb8ca0b721e86a56554c4b888d6d1478045e9cef";
const TITLE = "Kau dan Aku";

if (!/^([0-9a-f]{64})$/i.test(FILE_HASH_HEX)) throw new Error("FILE_HASH_HEX harus 64 hex (tanpa 0x)");

const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// muat ABI saja (bytecode tidak perlu utk call)
const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "Krearsip.sol", "Krearsip.json");
const { abi } = JSON.parse(readFileSync(artifactPath, "utf8"));

async function main() {
  const contract = new ethers.Contract(CONTRACT, abi, wallet);
  const tx = await contract.registerWork("0x" + FILE_HASH_HEX, TITLE);
  console.log("Tx sent:", tx.hash);
  const rc = await tx.wait();
  const blk = await provider.getBlock(rc.blockNumber);
  const iso = new Date(blk.timestamp * 1000).toISOString();

  console.log("\nRESULT");
  console.log("contract:", CONTRACT);
  console.log("tx_hash :", tx.hash);
  console.log("isoTime :", iso);
}

main().catch((e) => { console.error(e); process.exit(1); });
