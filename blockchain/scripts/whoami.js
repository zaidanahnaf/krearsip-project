import "dotenv/config";
import { ethers } from "ethers";

const { SEPOLIA_RPC, PRIVATE_KEY } = process.env;
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const main = async () => {
  const net = await provider.getNetwork();
  const addr = await wallet.getAddress();
  const bal  = await provider.getBalance(addr);

  console.log("RPC URL:", SEPOLIA_RPC);
  console.log("Network:", net.name, "chainId:", Number(net.chainId));
  console.log("Address:", addr);
  console.log("Balance:", ethers.formatEther(bal), "ETH");
};
main().catch(console.error);
