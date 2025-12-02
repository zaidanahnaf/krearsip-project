// scripts/blockMeta.js
import { ethers } from "ethers";
import "dotenv/config";

const RPC = process.env.SEPOLIA_RPC;
const TX = process.argv[2]; // tx hash lewat argumen

if (!RPC || !TX) {
  console.error("Usage: node scripts/blockMeta.js <TX_HASH>");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC);

(async () => {
  const rc = await provider.getTransactionReceipt(TX);
  if (!rc) throw new Error("Receipt belum tersedia / tx salah");
  const blk = await provider.getBlock(rc.blockNumber);
  const iso = new Date(Number(blk.timestamp) * 1000).toISOString();

  console.log(JSON.stringify({
    tx_hash: TX,
    block_number: rc.blockNumber,
    waktu_blok_iso: iso
  }, null, 2));
})();
