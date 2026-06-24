import { createWalletClient, custom, type WalletClient } from "viem";
import sepolia from "./deployments/sepolia.json";
import mainnet from "./deployments/mainnet.json";
import "./style.css";

type Deployment = typeof mainnet;

// --- Active deployment selection -------------------------------------------------
// The website is driven entirely by versioned deployment records. It never hard-codes
// addresses. Prefer a live mainnet deployment, then testnet, otherwise prelaunch.
function pickActive(): Deployment {
  if (mainnet.status !== "not-deployed") return mainnet as Deployment;
  if (sepolia.status !== "not-deployed") return sepolia as Deployment;
  return mainnet as Deployment; // prelaunch placeholder (mainnet target, nothing deployed)
}

const active = pickActive();
const isPrelaunch = active.status === "not-deployed";
const presaleEnabled = !isPrelaunch && active.presale.enabled === true;

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
};

// --- Render top state banner -----------------------------------------------------
function renderBanner() {
  const el = document.getElementById("state-banner")!;
  let label: string;
  let cls: string;
  if (isPrelaunch) {
    label = "PRELAUNCH — no token deployed, no sale live";
    cls = "banner-prelaunch";
  } else if (active.network !== "mainnet") {
    label = `TESTNET (${CHAIN_NAMES[active.chainId] ?? active.network}) — test funds only`;
    cls = "banner-testnet";
  } else {
    label = presaleEnabled ? "MAINNET — sale live" : "MAINNET — sale not live";
    cls = "banner-mainnet";
  }
  el.className = cls;
  el.textContent = label;
}

// --- Render hero facts from the active record ------------------------------------
function renderFacts() {
  const status = document.getElementById("f-status")!;
  const supply = document.getElementById("f-supply")!;
  const network = document.getElementById("f-network")!;
  const contract = document.getElementById("f-contract")!;

  if (isPrelaunch) {
    status.textContent = "Prelaunch — not deployed";
    supply.textContent = "Pending approval";
    network.textContent = "Ethereum (TBD)";
    contract.textContent = "Not yet deployed";
    return;
  }

  status.textContent = presaleEnabled ? "Live" : "Deployed — sale not live";
  network.textContent = CHAIN_NAMES[active.chainId] ?? active.network;
  const tokenAddr = active.contracts.MoonPodToken;
  if (tokenAddr) {
    const link = `${active.explorer}/address/${tokenAddr}`;
    contract.innerHTML = `<a href="${link}" target="_blank" rel="noopener noreferrer">${shorten(tokenAddr)}</a>`;
    supply.textContent = "See verified contract";
  } else {
    contract.textContent = "Not yet deployed";
    supply.textContent = "Pending approval";
  }
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// --- Wallet connection (read-only; no transactions are possible in prelaunch) ----
let walletClient: WalletClient | null = null;

function getProvider(): any | null {
  return (window as any).ethereum ?? null;
}

async function connect() {
  const btn = document.getElementById("connect-btn") as HTMLButtonElement;
  const note = document.getElementById("hero-note")!;
  const provider = getProvider();

  if (!provider) {
    note.textContent =
      "No Ethereum wallet detected. Install a browser wallet (e.g. MetaMask) to connect.";
    return;
  }

  try {
    walletClient = createWalletClient({ transport: custom(provider) });
    const [account] = await walletClient.requestAddresses();
    const chainId = await walletClient.getChainId();
    btn.textContent = shorten(account);
    btn.classList.add("connected");

    const chainName = CHAIN_NAMES[chainId] ?? `chain ${chainId}`;

    if (presaleEnabled && chainId !== active.chainId) {
      note.innerHTML = `Connected to <strong>${chainName}</strong>, but this sale runs on <strong>${
        CHAIN_NAMES[active.chainId] ?? active.network
      }</strong>. Switch networks before interacting.`;
    } else if (isPrelaunch) {
      note.innerHTML = `Connected to <strong>${chainName}</strong>. MoonPod is in prelaunch — there is nothing to buy or mint yet, so no transaction can be sent from this site.`;
    } else {
      note.innerHTML = `Connected to <strong>${chainName}</strong>.`;
    }
  } catch (err: any) {
    if (err?.code === 4001) {
      note.textContent = "Connection request was rejected.";
    } else {
      note.textContent = "Could not connect to your wallet. Please try again.";
      console.error("Wallet connection failed:", err);
    }
  }
}

function wireEvents() {
  document.getElementById("connect-btn")!.addEventListener("click", connect);
  const provider = getProvider();
  if (provider?.on) {
    provider.on("accountsChanged", () => window.location.reload());
    provider.on("chainChanged", () => window.location.reload());
  }
}

renderBanner();
renderFacts();
wireEvents();
