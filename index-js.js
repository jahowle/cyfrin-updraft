import {
  createWalletClient,
  custom,
  formatEther,
  parseEther,
  defineChain,
  createPublicClient,
} from "https://esm.sh/viem";
import "https://esm.sh/viem/window";
import { abi, contractAddress } from "./constants-js.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
const ethAmountInput = document.getElementById("ethAmount");
const checkFundingButton = document.getElementById("checkFunding");

let walletClient;
let publicClient;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });
    await walletClient.requestAddresses();
    connectButton.innerHTML = "Connected";
  } else {
    connectButton.innerHTML = "Please install MetaMask";
  }
}

async function fund() {
  const ethAmount = ethAmountInput.value;
  console.log(`Funding with ${ethAmount}...`);

  if (typeof window.ethereum !== "undefined") {
    try {
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });
      const [account] = await walletClient.requestAddresses();
      const currentChain = await getCurrentChain(walletClient);

      console.log("Processing transaction...");
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
      const { request } = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName: "fund",
        account,
        chain: currentChain,
        value: parseEther(ethAmount),
      });
      const hash = await walletClient.writeContract(request);
      console.log("Transaction processed: ", hash);
    } catch (error) {
      console.log(error);
    }
  } else {
    fundButton.innerHTML = "Please install MetaMask";
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    try {
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
      const balance = await publicClient.getBalance({
        address: contractAddress,
      });
      console.log(formatEther(balance));
    } catch (error) {
      console.log(error);
    }
  } else {
    balanceButton.innerHTML = "Please install MetaMask";
  }
}

async function withdraw() {
  console.log(`Withdrawing...`);

  if (typeof window.ethereum !== "undefined") {
    try {
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });
      const [account] = await walletClient.requestAddresses();
      const currentChain = await getCurrentChain(walletClient);

      console.log("Processing transaction...");
      const { request } = await publicClient.simulateContract({
        account,
        address: contractAddress,
        abi,
        functionName: "withdraw",
        chain: currentChain,
      });
      const hash = await walletClient.writeContract(request);
      console.log("Transaction processed: ", hash);
    } catch (error) {
      console.log(error);
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask";
  }
}

async function getCurrentChain(client) {
  const chainId = await client.getChainId();
  const currentChain = defineChain({
    id: chainId,
    name: "Custom Chain",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["http://localhost:8545"],
      },
    },
  });
  return currentChain;
}

//Needs to be an async function because it can take a while to get the balance
async function checkFunding() {
  //First checks if Metamask or other wallet is installed by looking at the window object for the ethereum object
  if (typeof window.ethereum !== "undefined") {
    try {
      // If wallet is present, create walletClient first because it is going to read or interact with the wallet
      walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });

      // Create publicClient to read the contract
      publicClient = createPublicClient({
        transport: custom(window.ethereum),
      });

      // Get the account address from the wallet
      const [account] = await walletClient.requestAddresses();

      // Use readContract to call the smart contract function
      const addressBalance = await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getAddressToAmountFunded",
        args: [account], // Pass the account address as an argument
      });

      // Format the balance to be in ETH
      console.log(formatEther(addressBalance));
    } catch (error) {
      console.log(error);
    }
  } else {
    // If wallet is not present, show a message to the user
    balanceButton.innerHTML = "Please install MetaMask";
  }
}

// Event listeners
connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;
checkFundingButton.onclick = checkFunding;
