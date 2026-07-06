// Enhanced MoonPod presale with proven success patterns
const connectBtn = document.getElementById('connect-btn');
const claimBtn = document.getElementById('claim-btn');
const walletStatus = document.getElementById('wallet-status');
const walletAddressSpan = document.getElementById('wallet-address');
const statusMsg = document.getElementById('status-msg');
const podCounter = document.getElementById('pod-counter');
const progressFill = document.getElementById('progress-fill');
const scarcityWarning = document.getElementById('scarcity-warning');
const networkInfo = document.getElementById('network-info');
const transactionDetails = document.getElementById('transaction-details');
const gasEstimate = document.getElementById('gas-estimate');
const priceUSD = document.getElementById('price-usd');
const recentActivity = document.getElementById('recent-activity');
const activityList = document.getElementById('activity-list');
const liveStatus = document.getElementById('live-status');
const communityCount = document.getElementById('community-count');
const disconnectBtn = document.getElementById('disconnect-btn');
const walletModal = document.getElementById('wallet-modal');
const walletModalClose = document.getElementById('wallet-modal-close');
const walletOptions = document.querySelectorAll('.wallet-option');
// Testnet toggle removed - mainnet only

let signer;
let provider;
let userAddress = null;
let currentPodCount = 0; // ONLY from blockchain - no local storage
let chainId = null;

// Treasury address for receiving funds - Fresh MoonPod treasury address
const RECEIVE_ADDRESS = "0x6dE5dBB2381d8739093008C55AC750C4023922Fe";
const POD_PRICE = "0.1";
const MAX_PODS = 888;

// Network configurations - MAINNET ONLY
const SUPPORTED_NETWORKS = {
  1: 'Ethereum Mainnet'
};

// Mainnet only - testnet functionality removed

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  initializeSiteNavigation();
});

function initializeApp() {
  try {
    console.log('🚀 Starting MoonPod app initialization...');
    
    // Initialize smart contract first
    initializeSmartContract();
    
    // CRITICAL: Get real contract data immediately - NO LOCAL STORAGE
    console.log('🔄 Forcing immediate contract sync...');
    syncContractData();
    
    // Also sync with delay for safety
    setTimeout(() => {
      syncContractData();
    }, 1000);
    
    // Also sync every 30 seconds
    setInterval(syncContractData, 30000);
    
    // Continue with UI setup
    updateUI();
    startLiveFeed();
    simulateActivity();
    initializeEventListeners();
    // Network toggle removed - mainnet only
    
    console.log('📱 Connect button found:', !!connectBtn);
    console.log('🎯 Modal found:', !!document.getElementById('wallet-modal'));
    console.log('💫 MetaMask available:', !!window.ethereum);
    console.log('🦁 Brave browser detected:', navigator.brave && typeof navigator.brave.isBrave === 'function');
    console.log('💻 Platform:', navigator.platform);
    

    
    // Check for existing wallet connection (don't await to prevent blocking)
    checkExistingConnection().catch(err => {
      console.log('Background connection check failed:', err.message);
    });
    
    console.log('🚀 MoonPod Enhanced - Ready for Launch! 🌕');
    console.log('Current pod count from contract:', currentPodCount);
    console.log('No verified Genesis Pod contract published; minting paused.');
    
    // Force immediate counter update to show real data
    setTimeout(() => {
      if (currentPodCount === 0) {
        console.warn('⚠️ Counter still 0, forcing another sync...');
        syncContractData();
      }
    }, 2000);
  } catch (error) {
    console.error('App initialization error:', error);
  }
}

// ALWAYS load from blockchain - no localStorage fallbacks
async function loadPodData() {
  console.log('🚀 Loading ONLY real blockchain data...');
  // Force contract sync immediately - no fallbacks or localStorage
  await syncContractData();
}

// REMOVED localStorage functions - using contract data only

// Check for existing wallet connection
async function checkExistingConnection() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('Existing accounts check:', accounts);
      if (accounts.length > 0) {
        await connectWallet(false); // Don't request permission if already connected
      }
    } catch (error) {
      console.log('No existing connection found:', error.message);
      // Don't show error to user for background connection checks
    }
  } else {
    console.log('MetaMask not detected');
  }
}

// Direct wallet connection (no modal needed)

// Direct MetaMask connection optimized for macOS Brave
async function connectWallet() {
  if (!window.ethereum) {
    setStatus('MetaMask not detected', 'error');
    return;
  }

  try {
    if (connectBtn) {
      connectBtn.disabled = true;
      connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    }

    setStatus('Connecting...', 'processing');

    // Direct connection approach - no browser detection delays
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts?.length) {
      throw new Error('No accounts available');
    }

    // Quick provider setup
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    const network = await provider.getNetwork();
    chainId = Number(network.chainId);

    // Update UI immediately
    updateConnectedUI(userAddress);
    setupWalletEventListeners();

    // Mainnet only - no network switching

    // Save connection
    localStorage.setItem('moonpod-wallet-connected', 'true');
    localStorage.setItem('moonpod-user-address', userAddress);

    setStatus('Connected successfully', 'success');

  } catch (error) {
    console.error('Connection failed:', error);
    
    let msg = 'Connection failed';
    if (error.code === 4001) {
      msg = 'User rejected connection';
    } else if (error.code === -32002) {
      msg = 'Connection already pending';
    }
    
    setStatus(msg, 'error');

    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    }
  }
}

// Check for existing wallet connection on page load  
async function checkExistingConnection() {
  try {
    const saved = localStorage.getItem('moonpod-wallet-connected');
    const savedAddress = localStorage.getItem('moonpod-user-address');
    
    if (saved === 'true' && savedAddress && window.ethereum) {
      console.log('🔍 Checking for existing wallet connection...');
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0 && accounts.includes(savedAddress)) {
        console.log('✅ Found existing connection, reconnecting...');
        
        // Reconnect silently
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        
        const network = await provider.getNetwork();
        chainId = parseInt(network.chainId);
        
        updateConnectedUI(userAddress);
        setupWalletEventListeners();
        return true;
      } else {
        console.log('❌ Saved address not found in current accounts');
        localStorage.removeItem('moonpod-wallet-connected');
        localStorage.removeItem('moonpod-user-address');
      }
    }
  } catch (error) {
    console.log('Background connection check failed:', error);
  }
  return false;
}

// Setup wallet event listeners
function setupWalletEventListeners() {
  if (window.ethereum && !window.ethereum._eventsSetup) {
    // Account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        userAddress = accounts[0];
        if (walletAddressSpan) {
          walletAddressSpan.innerText = formatAddress(userAddress);
        }
        setStatus('Account changed', 'success');
      }
    });

    // Network changes
    window.ethereum.on('chainChanged', (newChainId) => {
      chainId = parseInt(newChainId, 16);
      if (networkInfo) {
        networkInfo.textContent = `Network: ${getNetworkName(chainId)}`;
      }
      setStatus(`Switched to ${getNetworkName(chainId)}`, 'success');
    });

    // Disconnect
    window.ethereum.on('disconnect', handleDisconnect);
    
    // Mark events as setup to prevent duplicates
    window.ethereum._eventsSetup = true;
  }
}

// Handle wallet disconnect
function handleDisconnect() {
  console.log('🔌 Handling wallet disconnect...');
  
  // Disconnect WalletConnect if used
  if (provider && provider._wcProvider && typeof provider._wcProvider.disconnect === 'function') {
    provider._wcProvider.disconnect();
  }
  
  // Clear wallet state
  userAddress = null;
  provider = null;
  signer = null;
  chainId = null;
  
  // Clear stored connection
  localStorage.removeItem('moonpod-wallet-connected');
  localStorage.removeItem('moonpod-user-address');
  
  // Update UI
  if (walletStatus) {
    walletStatus.style.display = "none";
  }
  if (connectBtn) {
    connectBtn.style.display = "block";
    connectBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
    connectBtn.disabled = false;
  }
  if (claimBtn) {
    claimBtn.disabled = true;
  }
  if (transactionDetails) {
    transactionDetails.style.display = "none";
  }
  
  setStatus('Wallet disconnected', 'warning');
  console.log('✅ Wallet disconnect complete');
}

// Update UI when wallet is connected
function updateConnectedUI(address) {
  // Update address display
  if (walletAddressSpan) {
    walletAddressSpan.innerText = formatAddress(address);
  }
  
  // Update network display
  if (networkInfo) {
    networkInfo.textContent = `Network: ${getNetworkName(chainId)}`;
  }
  
  // Show connected state
  if (walletStatus) {
    walletStatus.style.display = "block";
  }
  if (connectBtn) {
    connectBtn.style.display = "none";
  }
  if (claimBtn) {
    claimBtn.disabled = false;
  }
  if (transactionDetails) {
    transactionDetails.style.display = "block";
    updateGasEstimate();
  }
  
  setStatus('Wallet connected successfully! 🚀', 'success');
  console.log('🚀 Wallet connected successfully:', address);
}

// Modern pod claiming with smart contract integration
async function claimPod() {
  // Check if modern wallet is connected
  if (!window.modernWallet || !window.modernWallet.isConnected()) {
    if (window.modernWallet) {
      window.modernWallet.setStatus('Please connect your wallet first', 'error');
    }
    return;
  }

  try {
    window.modernWallet.setStatus('Preparing transaction...', 'processing');
    if (claimBtn) {
      claimBtn.disabled = true;
      claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minting...';
    }

    // Get provider and signer from modern wallet
    const provider = new ethers.BrowserProvider(window.modernWallet.getProvider());
    const signer = await provider.getSigner();

    // Try to use smart contract first
    let usingSmartContract = false;
    let transaction;

    console.log('🔍 Checking smart contract availability...');
    console.log('moonPodContract exists:', typeof window.moonPodContract !== 'undefined');
    
    // Debug current network first
    const currentNetwork = await provider.getNetwork();
    console.log('🌐 BEFORE contract init - Current network:', {
      chainId: Number(currentNetwork.chainId),
      name: currentNetwork.name,
      full: currentNetwork
    });
    
    if (window.moonPodContract) {
      console.log('🔗 Initializing smart contract connection...');
      const contractInitialized = await window.moonPodContract.initialize(provider, signer);
      console.log('Contract initialized:', contractInitialized);
      
      if (contractInitialized && window.moonPodContract.contract) {
        usingSmartContract = true;
        window.modernWallet.setStatus('Minting Genesis Pod via smart contract...', 'processing');
        
        try {
          console.log('🎯 Calling mintPublic function on smart contract...');
          console.log('💰 Sending 0.1 ETH to contract for Genesis Pod mint...');
          
          // Use smart contract mintPublic function (your actual deployed contract)
          transaction = await window.moonPodContract.contract.mintPublic(1, {
            value: ethers.parseEther("0.1"),
            gasLimit: 300000 // Add explicit gas limit
          });
          console.log('✅ Smart contract transaction sent:', transaction.hash);
          
        } catch (contractError) {
          console.error('❌ Smart contract failed:', contractError);
          console.error('❌ Error details:', contractError.message);
          
          // Don't fallback - force user to fix the issue
          throw new Error(`Smart contract transaction failed: ${contractError.message}. Please check your contract deployment and try again.`);
        }
      } else if (!contractInitialized) {
        console.error('❌ Contract initialization failed');
        // Still try to create the contract directly if initialization failed
        if (window.moonPodContract && currentNetwork.chainId === 11155111n) {
          try {
            console.log('🔄 Attempting direct contract connection...');
            const contractAddress = "0x51103A04934C620D9c09e3EcB954b7fb7D4C4c55";
            const contract = new ethers.Contract(contractAddress, window.moonPodContract.abi, signer);
            
            transaction = await contract.mintPublic(1, {
              value: ethers.parseEther("0.1"),
              gasLimit: 300000
            });
            console.log('✅ Direct contract call successful:', transaction.hash);
            usingSmartContract = true;
            
          } catch (directError) {
            console.error('❌ Direct contract call also failed:', directError);
            throw new Error(`Contract connection failed: ${directError.message}`);
          }
        }
      } else {
        console.warn('⚠️ Smart contract not properly initialized');
        // Check if user is on wrong network
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);
        console.log(`🌐 Network check - Current: ${currentChainId}, Expected: 11155111`);
        console.log(`🌐 Network details:`, network);
        
        if (currentChainId !== 11155111) {
          console.error(`❌ Wrong network detected: ${currentChainId} (${window.moonPodContract?.getNetworkName(currentChainId) || 'Unknown'})`);
          throw new Error(`Wrong network! Please switch to Sepolia testnet. Currently on: ${window.moonPodContract?.getNetworkName(currentChainId) || currentChainId}`);
        }
      }
    } else {
      console.warn('⚠️ Smart contract not available');
    }

    // CRITICAL: Block direct transfers - force smart contract use only
    if (!usingSmartContract) {
      console.error('❌ CRITICAL: Smart contract MUST be used for NFT minting.');
      console.error('❌ Direct transfers are permanently disabled to prevent scam-like behavior.');
      throw new Error('Smart contract connection required. Please switch to Sepolia testnet (Chain ID: 11155111) where the MoonPod contract is deployed at 0x51103A04934C620D9c09e3EcB954b7fb7D4C4c55');
    }
    
    window.modernWallet.setStatus('Transaction sent! Waiting for confirmation...', 'processing');
    console.log('Transaction hash:', transaction.hash);

    // Wait for confirmation
    const receipt = await transaction.wait();
    console.log('Transaction confirmed:', receipt);

    // Get real token ID and update display with contract data
    let tokenId = 'Genesis Pod';
    let realPodCount = currentPodCount + 1; // fallback
    
    try {
      // Get real contract data
      const totalSupply = await window.moonPodContract.contract.totalSupply();
      realPodCount = Number(totalSupply);
      console.log('📊 Real contract supply after mint:', realPodCount);
      
      // Parse transaction receipt for token ID
      if (receipt.logs && receipt.logs.length > 0) {
        const contract = window.moonPodContract.contract;
        const parsedLogs = receipt.logs.map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        }).filter(log => log !== null);
        
        const podMintedEvent = parsedLogs.find(log => log.name === 'PodMinted');
        if (podMintedEvent) {
          tokenId = `MoonPod #${podMintedEvent.args.tokenId}`;
          console.log('🎯 Actual minted token:', tokenId);
        }
      }
    } catch (e) {
      console.warn('Could not get real contract data:', e);
      realPodCount = podsClaimed + 1;
    }
    
    // Update display with real contract data
    updatePodCounter(realPodCount);
    updateProgressBar(realPodCount);
    updateScarcityWarning(realPodCount);
    saveToLocalStorage();
    
    // Show success with actual token ID
    window.modernWallet.setStatus(`🎉 ${tokenId} minted successfully! TX: ${transaction.hash.slice(0, 10)}...`, 'success');
    showCelebration();
    
    // Add to activity feed
    addRecentClaim(transaction.hash);
    
  } catch (error) {
    console.error('Claim failed:', error);
    
    let errorMessage = 'Transaction failed';
    if (error.code === 4001) {
      errorMessage = 'Transaction rejected by user';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient ETH balance';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    window.modernWallet.setStatus(errorMessage, 'error');
    
  } finally {
    // Re-enable claim button
    if (claimBtn) {
      claimBtn.disabled = false;
      claimBtn.innerHTML = '<i class="fas fa-rocket"></i> Claim Genesis Pod (0.1 ETH)';
    }
  }
}

// NEW: Use smart contract integration for pod claiming
async function claimPodWithContract() {
  if (!userAddress || !signer) {
    setStatus('Please connect wallet first', 'error');
    return;
  }

  try {
    if (claimBtn) {
      claimBtn.disabled = true;
      claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minting...';
    }

    setStatus('Preparing transaction...', 'processing');

    // Initialize smart contract if not already done
    if (!moonPodContract.contract) {
      await moonPodContract.initialize(provider, signer);
    }

    // Use smart contract to claim pods
    const result = await moonPodContract.mintPublic(1);

    if (result.success) {
      // Update local counters
      podsClaimed += result.quantity;
      updatePodCounter();
      updateProgressBar();
      updateScarcityWarning();
      saveToLocalStorage();

      // Show success
      const txMessage = result.simulated ? 
        `Genesis Pod minted! Future airdrops unlocked! (Simulated: ${result.transactionHash.slice(0, 10)}...)` :
        `Genesis Pod minted! Future airdrops unlocked! TX: ${result.transactionHash.slice(0, 10)}...`;
      
      setStatus(txMessage, 'success');
      showCelebration();

    } else {
      setStatus(result.error || 'Transaction failed', 'error');
    }

  } catch (error) {
    console.error('Smart contract claim error:', error);
    setStatus('Claim failed: ' + error.message, 'error');
  } finally {
    if (claimBtn) {
      claimBtn.innerHTML = '<i class="fas fa-rocket"></i> Mint Genesis Pod';
      claimBtn.disabled = false;
    }
  }
}

// Handle successful pod claim
function handleSuccessfulClaim(txHash) {
  podsClaimed++;
  updatePodCounter();
  updateProgressBar();
  updateScarcityWarning();
  saveToLocalStorage();
  
  setStatus('🚀 Pod Claimed Successfully! Welcome to MoonPod! 🌕', 'success');
  
  // Add to recent activity
  addRecentClaim(txHash);
  
  // Show celebration
  showCelebration();
}

// Add claim to recent activity
function addRecentClaim(txHash) {
  if (!recentActivity || !activityList) return;
  
  const userAddress = window.modernWallet ? window.modernWallet.getAddress() : null;
  if (!userAddress) return;
  
  const claim = {
    address: formatAddress(userAddress),
    txHash: txHash,
    timestamp: Date.now(),
    podNumber: podsClaimed
  };
  
  // Create activity item
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div>
      <span class="activity-address">${claim.address}</span>
      <span> claimed Pod #${claim.podNumber}</span>
    </div>
    <div class="activity-time">just now</div>
  `;
  
  activityList.insertBefore(item, activityList.firstChild);
  recentActivity.style.display = 'block';
  
  // Keep only last 10 items
  const items = activityList.children;
  if (items.length > 10) {
    activityList.removeChild(items[items.length - 1]);
  }
}

// Update gas estimate
async function updateGasEstimate() {
  if (!gasEstimate || !provider) return;
  
  try {
    const transaction = {
      to: RECEIVE_ADDRESS,
      value: ethers.parseEther(POD_PRICE)
    };
    
    const gasEstimateValue = await provider.estimateGas(transaction);
    const feeData = await provider.getFeeData();
    
    const totalGasCost = gasEstimateValue * (feeData.gasPrice || feeData.maxFeePerGas);
    const gasCostEth = ethers.formatEther(totalGasCost);
    
    gasEstimate.textContent = `~${parseFloat(gasCostEth).toFixed(4)} ETH`;
  } catch (error) {
    console.error('Gas estimation error:', error);
    gasEstimate.textContent = '~0.002 ETH (estimated)';
  }
}

// Update pod counter with animation - accepts real contract count
function updatePodCounter(realCount = null) {
  return; // honest mode: static notice in the counter, no live numbers
  const displayCount = realCount !== null ? realCount : currentPodCount;
  
  const allCounters = document.querySelectorAll('.pod-counter, .hero .pod-counter');
  allCounters.forEach(counter => {
    if (counter) {
      counter.textContent = `${displayCount}/888`;
    }
  });
  
  // Legacy support for single podCounter element
  if (typeof podCounter !== 'undefined' && podCounter) {
    podCounter.textContent = `${displayCount}/888`;
    
    // Animate the counter
    podCounter.style.animation = 'pulse 0.6s ease-in-out';
    setTimeout(() => {
      podCounter.style.animation = '';
    }, 600);
  }
  
  console.log('Pod counter updated to:', displayCount, '/888');
}

// Update progress bar - accepts real contract count
function updateProgressBar(realCount = null) {
  return; // honest mode
  if (!progressFill) return;
  const displayCount = realCount !== null ? realCount : currentPodCount;
  const percentage = (displayCount / MAX_PODS) * 100;
  progressFill.style.width = `${percentage}%`;
}

// Update scarcity warning - accepts real contract count
function updateScarcityWarning(realCount = null) {
  return; // honest mode: scarcity element removed from markup
  if (!scarcityWarning) return;
  const displayCount = realCount !== null ? realCount : currentPodCount;
  const remaining = MAX_PODS - displayCount;
  if (remaining <= 50) {
    scarcityWarning.style.display = 'block';
    scarcityWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Only ${remaining} pods remaining!`;
  }
}

// Enhanced status message system
function setStatus(message, type = '') {
  if (!statusMsg) return;
  
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type}`;
  
  // Add loading icon for processing
  if (type === 'processing') {
    statusMsg.innerHTML = `<i class="fas fa-spinner loading"></i> ${message}`;
  }
  
  // Auto-clear success messages
  if (type === 'success') {
    setTimeout(() => {
      if (statusMsg && statusMsg.classList.contains('success')) {
        statusMsg.textContent = '';
        statusMsg.className = 'status-msg';
      }
    }, 5000);
  }
}



// Update entire UI
function updateUI() {
  updatePodCounter();
  updateProgressBar();
  updateScarcityWarning();
  
  // Update USD price display
  if (priceUSD) {
    priceUSD.textContent = '≈ $400 USD';
  }
  
  // Set up wallet button click handlers
  setupWalletButtons();
}

// Setup wallet button event listeners (legacy function - now handled by initializeEventListeners)
function setupWalletButtons() {
  console.log('setupWalletButtons called - now handled by initializeEventListeners');
}

// Start live feed rotation
function startLiveFeed() {
  if (!liveStatus) return;
  
  const messages = [
    'MISSION LOG: Prelaunch phase active...',
    'MISSION LOG: Contracts verified on Sepolia testnet...',
    'MISSION LOG: 46 automated tests passing...',
    'MISSION LOG: Security review ahead of mainnet...',
    'MISSION LOG: Genesis minting paused pending audit...'
  ];
  
  let currentIndex = 0;
  setInterval(() => {
    liveStatus.textContent = messages[currentIndex];
    currentIndex = (currentIndex + 1) % messages.length;
  }, 4000);
}

// Simulate community activity for engagement
function simulateActivity() {
  return; // honest mode: no simulated community activity

  if (!communityCount) return;
  
  let count = 12847;
  setInterval(() => {
    if (Math.random() < 0.3) { // 30% chance
      count += Math.floor(Math.random() * 5) + 1;
      communityCount.textContent = `${count.toLocaleString()} Explorers`;
    }
  }, 10000);
  
  // Simulate occasional pod claims (but keep realistic)
  if (podsClaimed < 100) { // Keep it realistic, not near max
    setTimeout(() => {
      if (Math.random() < 0.1) { // 10% chance
        simulatePodClaim();
      }
    }, Math.random() * 60000 + 30000); // 30-90 seconds
  }
}

// Simulate pod claim for demo
function simulatePodClaim() {
  return; // honest mode: no fake mint feed

  const demoAddresses = [
    '0x1234...5678',
    '0xabcd...ef01',
    '0x9876...5432',
    '0xfedc...ba98'
  ];
  
  const randomAddress = demoAddresses[Math.floor(Math.random() * demoAddresses.length)];
  podsClaimed++;
  updatePodCounter();
  updateProgressBar();
  updateScarcityWarning();
  saveToLocalStorage();
  
  // Add to recent activity if elements exist
  if (recentActivity && activityList) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div>
        <span class="activity-address">${randomAddress}</span>
        <span> claimed Pod #${podsClaimed}</span>
      </div>
      <div class="activity-time">just now</div>
    `;
    
    activityList.insertBefore(item, activityList.firstChild);
    recentActivity.style.display = 'block';
    
    const items = activityList.children;
    if (items.length > 10) {
      activityList.removeChild(items[items.length - 1]);
    }
  }
  
  // Schedule next simulation (but keep realistic)
  if (podsClaimed < 100) { // Keep it realistic, not near max
    setTimeout(() => {
      if (Math.random() < 0.15) {
        simulatePodClaim();
      }
    }, Math.random() * 120000 + 60000);
  }
}

// Show celebration effect
function showCelebration() {
  const celebration = document.createElement('div');
  celebration.innerHTML = '🎉🚀🌕';
  celebration.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    z-index: 9999;
    pointer-events: none;
    animation: celebrationPop 2s ease-out forwards;
  `;
  
  document.body.appendChild(celebration);
  
  setTimeout(() => {
    if (document.body.contains(celebration)) {
      document.body.removeChild(celebration);
    }
  }, 2000);
}

// Utility functions
function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getNetworkName(chainId) {
  return SUPPORTED_NETWORKS[chainId] || `Unknown Network (${chainId})`;
}

// Testnet toggle removed - mainnet only deployment

// Network switching removed - mainnet only

// Contract address management removed - mainnet only

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialize event listeners once DOM is loaded
function initializeEventListeners() {
  console.log('🎯 Setting up event listeners...');
  
  // Token Hero Section buttons
  const buyTokenBtn = document.getElementById('buy-token-btn');
  const tokenDocsBtn = document.getElementById('token-docs-btn');
  
  if (buyTokenBtn && !buyTokenBtn._listenerAdded) {
    buyTokenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const heroSection = document.querySelector('.hero');
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    buyTokenBtn._listenerAdded = true;
  }
  
  if (tokenDocsBtn && !tokenDocsBtn._listenerAdded) {
    tokenDocsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const litepaperSection = document.querySelector('.litepaper-section');
      if (litepaperSection) {
        litepaperSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    tokenDocsBtn._listenerAdded = true;
  }
  
  // Connect button - direct wallet connection
  if (connectBtn && !connectBtn._listenerAdded) {
    console.log('✅ Adding click listener to connect button');
    connectBtn.addEventListener('click', (e) => {
      console.log('🖱️ Connect button clicked!');
      e.preventDefault();
      connectWallet();
    });
    connectBtn._listenerAdded = true;
  } else {
    console.log('❌ Connect button not found or already has listener');
  }
  
  // Claim button
  if (claimBtn && !claimBtn._listenerAdded) {
    console.log('✅ Adding click listener to claim button');
    claimBtn.addEventListener('click', (e) => {
      console.log('🚀 Claim button clicked!');
      e.preventDefault();
      claimPod();
    });
    claimBtn._listenerAdded = true;
  } else {
    console.log('❌ Claim button not found or already has listener');
  }

  // Wallet modal event listeners
  const modalClose = document.getElementById('wallet-modal-close');
  if (modalClose && !modalClose._listenerAdded) {
    modalClose.addEventListener('click', hideWalletModal);
    modalClose._listenerAdded = true;
  }

  const modal = document.getElementById('wallet-modal');
  if (modal && !modal._listenerAdded) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) hideWalletModal();
    });
    modal._listenerAdded = true;
  }

  // Wallet option selection
  const walletOpts = document.querySelectorAll('.wallet-option');
  walletOpts.forEach(option => {
    if (!option._listenerAdded) {
      option.addEventListener('click', (e) => {
        const walletType = e.currentTarget.dataset.wallet;
        connectWallet(walletType);
      });
      option._listenerAdded = true;
    }
  });

  // Disconnect button
  const discBtn = document.getElementById('disconnect-btn');
  if (discBtn && !discBtn._listenerAdded) {
    discBtn.addEventListener('click', handleDisconnect);
    discBtn._listenerAdded = true;
  }
}

// Add celebration animation CSS
const celebrationStyle = document.createElement('style');
celebrationStyle.textContent = `
  @keyframes celebrationPop {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1) translateY(-100px);
    }
  }
  
  .loading {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(celebrationStyle);

// Handle wallet disconnection
function handleWalletDisconnected() {
  userAddress = null;
  signer = null;
  provider = null;
  chainId = null;
  
  updateDisconnectedUI();
  setStatus('Wallet disconnected', 'info');
}

// Handle account changes in MetaMask
function handleAccountChanged(newAddress) {
  console.log('👤 Account changed to:', newAddress);
  userAddress = newAddress;
  
  // Update UI with new address
  const walletAddress = document.getElementById('wallet-address');
  if (walletAddress) {
    walletAddress.textContent = formatAddress(newAddress);
  }
  
  // Don't reload pod data for account changes - keep global counter
  setStatus('Wallet account switched', 'success');
}

// Initialize smart contract
function initializeSmartContract() {
  if (typeof MoonPodContract !== 'undefined') {
    window.moonPodContract = new MoonPodContract();
    console.log('✅ Smart contract system initialized');
  } else {
    console.warn('⚠️ Smart contract class not available');
  }
}

// CRITICAL: Always sync display with real contract data - NO LOCAL STORAGE
async function syncContractData() {
  // Honest mode: the Genesis Pod contract is pending an on-chain audit and no
  // verified address is published, so there is nothing trustworthy to sync.
  // The counter shows a static "minting paused" notice instead.
  console.log('Contract sync disabled: Genesis Pod contract pending audit.');
  return;
  
  // Try to connect to Ethereum even without wallet connected
  let provider;
  
  // Use public RPC for read-only contract calls - mainnet only
  provider = new ethers.JsonRpcProvider('https://ethereum-rpc.publicnode.com');
  console.log('Using mainnet public RPC provider');
  
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    console.log('🌐 Connected to network:', network.name, 'Chain ID:', chainId);
    
    // Only mainnet contract - testnet removed
    const contractAddress = "0x82d13340CEaF373884Ed6dc48f0ceD79954BDc76"; // LIVE MAINNET CONTRACT
    
    // Mainnet only - no testnet support
    console.log('🌍 Mainnet contract deployed:', contractAddress);
    
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      console.warn('No contract deployed on this network');
      updatePodCounter(0);
      return;
    }
    
    console.log('📞 Calling contract at:', contractAddress);
    
    const contract = new ethers.Contract(contractAddress, [
      "function totalSupply() view returns (uint256)"
    ], provider);
    
    const totalSupply = await contract.totalSupply();
    const realCount = Number(totalSupply);
    
    console.log('📊 SUCCESS! Real contract supply:', realCount);
    
    // Update display with ONLY real blockchain data
    currentPodCount = realCount; // Update global state
    updatePodCounter(realCount);
    updateProgressBar(realCount);
    updateScarcityWarning(realCount);
    
  } catch (e) {
    console.error('❌ Contract sync failed:', e.message);
    // Force to 0 if we can't get real data - no fake numbers
    updatePodCounter(0);
    updateProgressBar(0);
    updateScarcityWarning(0);
  }
}

// Simple social icons initialization
function initializeSocialIcons() {
  const socialContainer = document.getElementById('social-icons-top');
  if (socialContainer) {
    console.log('Social media icons ready');
  }
}

setTimeout(initializeSocialIcons, 100);

// Expose functions to window for wallet connector
window.handleWalletDisconnected = handleWalletDisconnected;
window.handleAccountChanged = handleAccountChanged;

// ========================================
// SITE NAVIGATION & UI ENHANCEMENTS
// ========================================

function initializeSiteNavigation() {
  console.log('🧭 Initializing site navigation...');
  
  // Sticky Header Scroll Effect
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
  
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (mobileNav.classList.contains('active')) {
        icon.className = 'fas fa-times';
      } else {
        icon.className = 'fas fa-bars';
      }
    });
    
    // Close mobile nav when clicking a link
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
      });
    });
  }
  
  // Smooth Scroll for Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Header Connect Wallet Button - use same logic as main connect button
  const headerConnectBtn = document.getElementById('header-connect-btn');
  const mainConnectBtn = document.getElementById('connect-btn');
  
  if (headerConnectBtn) {
    headerConnectBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('🔗 Header connect button clicked');
      
      // Trigger click on main connect button to use existing logic
      if (mainConnectBtn) {
        mainConnectBtn.click();
      } else if (window.ethereum) {
        // Fallback: direct connection
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            console.log('Connected via header:', accounts[0]);
          }
        } catch (err) {
          console.error('Connection failed:', err);
        }
      }
    });
  }
  
  // Presale CTA Button - Scroll to Genesis Pods
  const presaleCtaBtn = document.getElementById('presale-cta-btn');
  if (presaleCtaBtn) {
    presaleCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const genesisPods = document.getElementById('genesis-pods');
      if (genesisPods) {
        genesisPods.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  
  // Token How Button - Scroll to How It Works
  const tokenHowBtn = document.getElementById('token-how-btn');
  if (tokenHowBtn) {
    tokenHowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const howItWorks = document.getElementById('how-it-works');
      if (howItWorks) {
        howItWorks.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  
  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        // Close other open FAQs
        faqItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
          }
        });
        
        // Toggle current FAQ
        item.classList.toggle('active');
      });
    }
  });
  
  // Update header connect button state when wallet connects
  function updateHeaderWalletState(connected, address = null) {
    if (headerConnectBtn) {
      if (connected && address) {
        const shortAddress = address.substring(0, 6) + '...' + address.substring(address.length - 4);
        headerConnectBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span>' + shortAddress + '</span>';
        headerConnectBtn.style.background = 'linear-gradient(135deg, #00ff88, #00cc66)';
      } else {
        headerConnectBtn.innerHTML = '<i class="fas fa-wallet"></i> <span>Connect Wallet</span>';
        headerConnectBtn.style.background = 'linear-gradient(135deg, #00d4ff, #0099cc)';
      }
    }
  }
  
  // Expose function globally
  window.updateHeaderWalletState = updateHeaderWalletState;
  
  console.log('✅ Site navigation initialized');
}