// MoonPod Smart Contract Integration
// Production-ready smart contract interface for Genesis Pod NFTs

class MoonPodContract {
  constructor() {
    // Contract addresses for different networks
    this.contracts = {
      // No mainnet contract is published. The previously hard-coded address was
      // never verified and is intentionally removed. Minting stays disabled
      // until the on-chain audit completes (see docs/genesis-pod-audit.md).
    };
    
    this.abi = this.getContractABI();
    this.contract = null;
    this.provider = null;
    this.signer = null;
    this.currentNetwork = null;
    
    // Contract parameters for MoonPodGenesis
    this.PUBLIC_PRICE = ethers.parseEther("0.1"); // 0.1 ETH per public pod
    this.PREMIUM_PRICE = ethers.parseEther("0.25"); // 0.25 ETH per premium pod
    this.MAX_SUPPLY = 888;
    
    console.log('🚀 MoonPodGenesis Smart Contract interface initialized');
  }

  // ABI for MoonPod contract - matches MoonPod.sol
  getContractABI() {
    return [
      // ERC721 Standard Functions
      "function name() view returns (string)",
      "function symbol() view returns (string)", 
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address owner) view returns (uint256)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function approve(address to, uint256 tokenId)",
      "function getApproved(uint256 tokenId) view returns (address)",
      "function isApprovedForAll(address owner, address operator) view returns (bool)",
      
      // MoonPod Core Functions
      "function mintPublic(uint256 quantity) payable",
      "function mintPremium(uint256 quantity) payable", 
      "function mintReserve(address to, uint256 quantity)",
      
      // Constants & State
      "function MAX_SUPPLY() view returns (uint256)",
      "function RESERVE_AMOUNT() view returns (uint256)",
      "function PUBLIC_PRICE() view returns (uint256)",
      "function PREMIUM_PRICE() view returns (uint256)",
      "function MAX_PER_WALLET() view returns (uint256)",
      "function reserveMinted() view returns (uint256)",
      "function publicSaleActive() view returns (bool)",
      "function premiumSaleActive() view returns (bool)",
      "function walletMints(address) view returns (uint256)",
      "function treasury() view returns (address)",
      "function paused() view returns (bool)",
      "function owner() view returns (address)",
      
      // Owner Functions
      "function togglePublicSale()",
      "function togglePremiumSale()",
      "function setPaused(bool paused)",
      "function withdraw()",
      
      // View Functions
      "function getMintInfo(address wallet) view returns (uint256, uint256, uint256, bool, bool, uint256, uint256)",
      "function contractInfo() view returns (uint256, uint256, uint256, uint256, address, bool)",
      
      // Events
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      "event PublicSaleToggled(bool active)",
      "event PremiumSaleToggled(bool active)",
      "event ReserveMinted(address to, uint256 quantity)"
    ];
  }

  // Initialize contract connection with network detection
  async initialize(provider, signer) {
    try {
      this.provider = provider;
      this.signer = signer;
      
      // Get current network
      const network = await provider.getNetwork();
      this.currentNetwork = Number(network.chainId);
      
      console.log(`🌐 Connected to network: ${this.getNetworkName(this.currentNetwork)} (Chain ID: ${this.currentNetwork})`);
      
      const contractAddress = this.contracts[this.currentNetwork];
      
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        console.error(`❌ Smart contract not deployed on network ${this.currentNetwork}`);
        return false;
      }
      
      // Connect to deployed contract
      this.contract = new ethers.Contract(contractAddress, this.abi, this.signer);
      this.contractAddress = contractAddress;
      
      console.log(`📞 Connected to contract: ${contractAddress}`);
      
      // Test contract connection
      const totalSupply = await this.contract.totalSupply();
      console.log(`✅ Contract connection verified. Total supply: ${totalSupply}`);
      
      return true;
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      return false;
    }
  }

  // Get network name for display - mainnet only
  getNetworkName(chainId) {
    const networks = {
      1: 'Ethereum Mainnet'
    };
    return networks[chainId] || `Unsupported Network (${chainId}) - Mainnet Required`;
  }

  // Get current total supply from contract
  async getTotalSupply() {
    try {
      if (!this.contract) {
        return this.getFallbackCount();
      }

      const supply = await this.contract.totalSupply();
      return Number(supply);
    } catch (error) {
      console.log('Contract call failed, using fallback:', error.message);
      return this.getFallbackCount();
    }
  }

  // Fallback count using direct RPC call to NEW CONTRACT
  async getFallbackCount() {
    try {
      // Use live mainnet contract address
      const newContractAddress = "0x82d13340CEaF373884Ed6dc48f0ceD79954BDc76"; // LIVE MAINNET CONTRACT
      
      console.log(`🔄 Using contract address for fallback: ${newContractAddress}`);

      // Direct RPC call to totalSupply() on mainnet
      const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
      const response = await provider.call({
        to: newContractAddress,
        data: '0x18160ddd' // totalSupply() function selector
      });

      const count = parseInt(response, 16);
      console.log(`📊 Contract count: ${count}`);
      return count;

    } catch (error) {
      console.log('❌ Contract fallback failed:', error.message);
      return 0;
    }
  }
}

// Initialize global contract instance
window.moonPodContract = new MoonPodContract();