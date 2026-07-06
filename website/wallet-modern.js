// Modern EIP-6963 Wallet Connection System
// Complete overhaul using industry standard multi-wallet discovery

class ModernWalletConnector {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
    this.userAddress = null;
    this.chainId = null;
    this.listeners = [];
    
    this.init();
  }

  init() {
    // Listen for wallet announcements (EIP-6963)
    window.addEventListener("eip6963:announceProvider", (event) => {
      this.handleWalletAnnouncement(event);
    });

    // Request all wallets to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Mobile detection
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Add mobile wallet options only after checking for existing wallets
    if (this.isMobile) {
      setTimeout(() => {
        this.addMobileWalletFallbacks();
      }, 1500);
    }

    // Fallback for legacy window.ethereum
    if (window.ethereum && !this.providers.size) {
      setTimeout(() => {
        if (!this.providers.size) {
          this.addLegacyProvider();
        }
      }, 100);
    }
    
    // Give mobile wallets time to load, then add fallbacks
    setTimeout(() => {
      this.addMobileWalletFallbacks();
    }, 1000);
  }

  handleWalletAnnouncement(event) {
    const { info, provider } = event.detail;
    
    // Prevent duplicates
    if (this.providers.has(info.uuid)) {
      return;
    }

    console.log('Discovered wallet:', info.name);
    this.providers.set(info.uuid, {
      info,
      provider,
      connected: false
    });

    this.renderWalletOptions();
  }

  addLegacyProvider() {
    if (window.ethereum) {
      const legacyInfo = {
        uuid: 'legacy-ethereum',
        name: window.ethereum.isMetaMask ? 'MetaMask' : 'Ethereum Wallet',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzI1MjkyRSIvPgo8cGF0aCBkPSJNOC41IDEwLjVMMTYgNkwyMy41IDEwLjVWMjEuNUwxNiAyNkw4LjUgMjEuNVYxMC41WiIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+',
        rdns: 'legacy.ethereum'
      };

      this.providers.set('legacy-ethereum', {
        info: legacyInfo,
        provider: window.ethereum,
        connected: false
      });

      this.renderWalletOptions();
    }
  }

  addMobileWalletOptions() {
    // Check if we already have MetaMask or other wallets detected
    const hasMetaMask = Array.from(this.providers.values()).some(w => 
      w.info.name.includes('MetaMask') || (w.provider && w.provider.isMetaMask)
    );
    
    const mobileWallets = [];
    
    // Only add MetaMask mobile option if not already detected
    if (!hasMetaMask) {
      mobileWallets.push({
        uuid: 'mobile-metamask',
        name: 'MetaMask (Open App)',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzE2ODNGRiIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGRjY5NDciIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+CjxyZWN0IHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgcng9IjgiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNnB4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIj5NPC90ZXh0Pgo8L3N2Zz4=',
        rdns: 'io.metamask.mobile',
        isMobile: true,
        deepLink: 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname
      });
    }
    
    // Always add Phantom as it's not typically detected on mobile browsers
    mobileWallets.push({
      uuid: 'mobile-phantom',
      name: 'Phantom (Open App)',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzQ5NDA5NSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTZweCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+UDwvdGV4dD4KPC9zdmc+',
      rdns: 'app.phantom.mobile',
      isMobile: true,
      deepLink: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href) + '?ref=moonpod'
    });

    mobileWallets.forEach(wallet => {
      if (!this.providers.has(wallet.uuid)) {
        this.providers.set(wallet.uuid, {
          info: wallet,
          provider: null,
          connected: false,
          isMobile: true
        });
      }
    });

    this.renderWalletOptions();
  }

  addMobileWalletFallbacks() {
    // Only add mobile deep links if we have detected wallets but none support mobile properly
    if (this.providers.size > 0 && this.isMobile) {
      const hasMetaMask = Array.from(this.providers.values()).some(w => 
        w.info.name.includes('MetaMask')
      );
      
      // Add mobile deep link version of MetaMask if only desktop version detected
      if (!hasMetaMask) {
        const mobileMetaMask = {
          uuid: 'mobile-metamask-deeplink',
          name: 'MetaMask Mobile',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzE2ODNGRiIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGRjY5NDciIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+CjxyZWN0IHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgcng9IjgiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNnB4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIj5NPC90ZXh0Pgo8L3N2Zz4=',
          rdns: 'io.metamask.mobile.deeplink',
          isMobile: true,
          deepLink: 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname
        };

        this.providers.set('mobile-metamask-deeplink', {
          info: mobileMetaMask,
          provider: null,
          connected: false,
          isMobile: true
        });
      }
      
      // Always add Phantom mobile for mobile users
      if (!this.providers.has('mobile-phantom-deeplink')) {
        const mobilePhantom = {
          uuid: 'mobile-phantom-deeplink',
          name: 'Phantom Mobile',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzQ5NDA5NSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTZweCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+UDwvdGV4dD4KPC9zdmc+',
          rdns: 'app.phantom.mobile.deeplink',
          isMobile: true,
          deepLink: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href) + '?ref=moonpod'
        };

        this.providers.set('mobile-phantom-deeplink', {
          info: mobilePhantom,
          provider: null,
          connected: false,
          isMobile: true
        });
      }

      this.renderWalletOptions();
    } else if (this.providers.size === 0 && this.isMobile) {
      // No wallets detected at all - add mobile options
      this.addMobileWalletOptions();
    }
  }

  renderWalletOptions() {
    const container = document.getElementById('wallet-options-container');
    if (!container) {
      this.createWalletUI();
      return;
    }

    container.innerHTML = '';
    
    this.providers.forEach((wallet, uuid) => {
      const button = document.createElement('button');
      button.className = 'wallet-option-btn';
      
      // Add mobile-specific styling and indicators
      const mobileIndicator = wallet.isMobile ? '<span class="mobile-indicator">📱</span>' : '';
      const walletType = wallet.isMobile ? 'mobile-wallet' : 'desktop-wallet';
      
      button.innerHTML = `
        <img src="${wallet.info.icon}" alt="${wallet.info.name}" class="wallet-icon" />
        <span class="wallet-name">${wallet.info.name} ${mobileIndicator}</span>
        ${wallet.connected ? '<span class="connected-indicator">✓</span>' : ''}
      `;
      
      button.className += ` ${walletType}`;
      button.onclick = () => this.connectWallet(uuid);
      container.appendChild(button);
    });

    // Show wallet selection if we have multiple options
    const walletSection = document.getElementById('wallet-selection-section');
    if (walletSection) {
      walletSection.style.display = this.providers.size > 0 ? 'block' : 'none';
    }
  }

  createWalletUI() {
    const connectBtn = document.getElementById('connect-btn');
    if (!connectBtn) return;

    // Replace the old connect button with new wallet selection
    const walletSection = document.createElement('div');
    walletSection.id = 'wallet-selection-section';
    walletSection.innerHTML = `
      <div class="wallet-selection-header">
        <h3>Choose Your Wallet</h3>
      </div>
      <div id="wallet-options-container" class="wallet-options-grid">
      </div>
    `;

    connectBtn.parentNode.insertBefore(walletSection, connectBtn);
    connectBtn.style.display = 'none';

    this.renderWalletOptions();
  }

  // Add proper disconnect method
  async disconnect() {
    console.log('🔌 Disconnecting wallet...');
    
    // Clear all provider states
    this.providers.forEach((wallet, uuid) => {
      wallet.connected = false;
    });
    
    // Clear current connection
    this.currentProvider = null;
    this.userAddress = null;
    this.chainId = null;
    
    // Remove account change listeners
    this.listeners.forEach(listener => {
      if (this.currentProvider && this.currentProvider.removeListener) {
        this.currentProvider.removeListener('accountsChanged', listener);
        this.currentProvider.removeListener('chainChanged', listener);
      }
    });
    this.listeners = [];
    
    // Update UI
    this.renderWalletOptions();
    
    // Notify main app
    if (window.handleWalletDisconnected) {
      window.handleWalletDisconnected();
    }
    
    console.log('✅ Wallet disconnected successfully');
  }

  async connectWallet(uuid) {
    const wallet = this.providers.get(uuid);
    if (!wallet) {
      console.error('Wallet not found:', uuid);
      return;
    }

    try {
      this.setStatus('Connecting to ' + wallet.info.name + '...', 'processing');

      // Handle mobile wallet deep links
      if (wallet.isMobile && wallet.info.deepLink) {
        this.handleMobileWalletConnection(wallet);
        return;
      }

      // Handle WalletConnect
      if (uuid === 'mobile-walletconnect') {
        await this.connectViaWalletConnect();
        return;
      }

      // Standard wallet connection
      if (!wallet.provider) {
        throw new Error('Wallet provider not available');
      }

      // Request account access
      const accounts = await wallet.provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      // Set up provider
      this.currentProvider = wallet.provider;
      this.userAddress = accounts[0];

      // Get network info
      const chainId = await wallet.provider.request({
        method: 'eth_chainId'
      });
      this.chainId = parseInt(chainId, 16);

      // Mark as connected
      wallet.connected = true;
      this.providers.forEach((w, id) => {
        if (id !== uuid) w.connected = false;
      });

      // Set up event listeners
      this.setupProviderListeners();

      // Update UI
      this.updateConnectedUI();
      this.setStatus('Connected to ' + wallet.info.name, 'success');

      // Save connection
      localStorage.setItem('moonpod-connected-wallet', uuid);
      localStorage.setItem('moonpod-user-address', this.userAddress);

      console.log('Successfully connected to:', wallet.info.name);
      console.log('Address:', this.userAddress);
      console.log('Chain ID:', this.chainId);

    } catch (error) {
      console.error('Connection failed:', error);
      
      let message = 'Connection failed';
      if (error.code === 4001) {
        message = 'Connection rejected by user';
      } else if (error.code === -32002) {
        message = 'Connection request already pending';
      } else if (error.message) {
        message = error.message;
      }

      this.setStatus(message, 'error');
    }
  }

  setupProviderListeners() {
    if (!this.currentProvider) return;

    // Account changes - properly detect wallet switches
    const accountChangeListener = (accounts) => {
      console.log('🔄 Account changed:', accounts);
      if (accounts.length === 0) {
        this.disconnect();
      } else if (accounts[0] !== this.userAddress) {
        console.log('👤 Wallet switched from', this.userAddress, 'to', accounts[0]);
        this.userAddress = accounts[0];
        localStorage.setItem('moonpod-user-address', this.userAddress);
        this.updateConnectedUI();
        
        // Notify main app of account change
        if (window.handleAccountChanged) {
          window.handleAccountChanged(accounts[0]);
        }
      }
    };
    
    this.currentProvider.on?.('accountsChanged', accountChangeListener);
    this.listeners.push(accountChangeListener);

    // Chain changes
    this.currentProvider.on?.('chainChanged', (chainId) => {
      this.chainId = parseInt(chainId, 16);
      this.updateConnectedUI();
      
      // Update testnet toggle
      const testnetToggle = document.getElementById('testnet-toggle');
      if (testnetToggle) {
        testnetToggle.checked = this.chainId === 11155111;
      }
    });

    // Disconnection
    this.currentProvider.on?.('disconnect', () => {
      this.disconnect();
    });
  }

  updateConnectedUI() {
    // Update wallet status
    const walletStatus = document.getElementById('wallet-status');
    const walletAddress = document.getElementById('wallet-address');
    const networkInfo = document.getElementById('network-info');

    if (walletStatus && walletAddress) {
      walletStatus.style.display = 'block';
      walletAddress.textContent = this.formatAddress(this.userAddress);
    }

    if (networkInfo) {
      const networkName = this.getNetworkName(this.chainId);
      networkInfo.textContent = `Network: ${networkName}`;
    }

    // Hide wallet selection, show status
    const walletSection = document.getElementById('wallet-selection-section');
    if (walletSection) {
      walletSection.style.display = 'none';
    }

    // Enable claim button
    const claimBtn = document.getElementById('claim-btn');
    if (claimBtn) {
      claimBtn.disabled = false;
    }

    // Re-render wallet options to show connection status
    this.renderWalletOptions();
  }



  async switchNetwork(targetChainId) {
    if (!this.currentProvider) return false;

    try {
      await this.currentProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      if (error.code === 4902 && targetChainId === 11155111) {
        // Add Sepolia network
        try {
          await this.currentProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH', 
                decimals: 18
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getNetworkName(chainId) {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai'
    };
    return networks[chainId] || `Chain ${chainId}`;
  }

  setStatus(message, type) {
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) {
      statusMsg.textContent = message;
      statusMsg.className = `status-msg ${type}`;
      statusMsg.style.display = 'block';

      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          statusMsg.style.display = 'none';
        }, 3000);
      }
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Public API methods
  getProvider() {
    return this.currentProvider;
  }

  getAddress() {
    return this.userAddress;
  }

  getChainId() {
    return this.chainId;
  }

  isConnected() {
    return !!this.currentProvider && !!this.userAddress;
  }

  handleMobileWalletConnection(wallet) {
    console.log('🔗 Opening mobile wallet:', wallet.info.name);
    
    // For mobile, we open the deep link and provide instructions
    this.setStatus('Opening ' + wallet.info.name + ' app...', 'processing');
    
    // Open the wallet app
    window.location.href = wallet.info.deepLink;
    
    // Provide user guidance
    setTimeout(() => {
      this.setStatus('Please complete connection in ' + wallet.info.name + ' app, then return here', 'processing');
      
      // Set up detection for when user returns
      this.setupMobileConnectionDetection();
    }, 1000);
  }

  setupMobileConnectionDetection() {
    // Check if wallet becomes available when user returns
    const checkForWallet = () => {
      if (window.ethereum) {
        console.log('🎯 Wallet detected after mobile deep link');
        // Try to connect with the detected wallet
        this.addLegacyProvider();
        this.setStatus('Wallet detected! Click Connect to finish setup.', 'success');
      }
    };

    // Check when page becomes visible again (user returns from wallet app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(checkForWallet, 500);
      }
    });
    
    // Also check periodically for a short time
    let attempts = 0;
    const interval = setInterval(() => {
      checkForWallet();
      attempts++;
      if (attempts > 10) {
        clearInterval(interval);
        this.setStatus('Having trouble connecting? Try the steps again or use WalletConnect', 'warning');
      }
    }, 2000);
  }

  async connectViaWalletConnect() {
    try {
      this.setStatus('Initializing WalletConnect...', 'processing');
      
      // Basic WalletConnect implementation
      if (typeof WalletConnectProvider !== 'undefined') {
        const provider = new WalletConnectProvider({
          rpc: {
            1: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            11155111: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
          }
        });

        await provider.enable();
        this.currentProvider = provider;
        
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });
        
        this.userAddress = accounts[0];
        this.setStatus('Connected via WalletConnect!', 'success');
        this.updateConnectedUI();
      } else {
        throw new Error('WalletConnect not available');
      }
    } catch (error) {
      console.error('WalletConnect failed:', error);
      this.setStatus('WalletConnect unavailable. Please try a direct wallet connection.', 'error');
    }
  }
}

// Global wallet connector instance
window.modernWallet = new ModernWalletConnector();