// Real-time ETH Price Feed
class PriceFeed {
  constructor() {
    this.ethPrice = null;
    this.lastUpdated = null;
    this.updateInterval = null;
    this.apiEndpoint = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
  }

  async fetchEthPrice() {
    try {
      console.log('🔄 Fetching ETH price...');
      const response = await fetch(this.apiEndpoint);
      const data = await response.json();
      
      if (data.ethereum && data.ethereum.usd) {
        this.ethPrice = data.ethereum.usd;
        this.lastUpdated = new Date();
        console.log('✅ ETH price updated:', `$${this.ethPrice}`);
        this.updatePriceDisplay();
        return this.ethPrice;
      } else {
        console.log('⚠️ Invalid price data received');
        this.showPriceError();
      }
    } catch (error) {
      console.log('❌ ETH price fetch failed:', error.message);
      this.showPriceError();
    }
  }

  updatePriceDisplay() {
    if (!this.ethPrice) {
      console.log('⚠️ No ETH price available for display');
      return;
    }

    console.log('💰 Updating price displays with ETH =', `$${this.ethPrice}`);

    // Update price displays throughout the site
    const priceElements = document.querySelectorAll('.eth-price');
    priceElements.forEach(element => {
      element.textContent = `$${this.ethPrice.toLocaleString()}`;
    });

    // Update USD equivalents
    const basePrice = this.ethPrice * 0.1; // 0.1 ETH base price
    const premiumPrice = this.ethPrice * 0.25; // 0.25 ETH premium price

    console.log('💎 Base price (0.1 ETH):', `$${basePrice.toFixed(0)}`);
    console.log('💎 Premium price (0.25 ETH):', `$${premiumPrice.toFixed(0)}`);

    const basePriceElements = document.querySelectorAll('.base-price-usd');
    basePriceElements.forEach(element => {
      element.textContent = `≈ $${basePrice.toFixed(0)}`;
    });

    const premiumPriceElements = document.querySelectorAll('.premium-price-usd');
    premiumPriceElements.forEach(element => {
      element.textContent = `≈ $${premiumPrice.toFixed(0)}+`;
    });

    // Update price display in hero section
    const heroPrice = document.querySelector('.price-usd');
    if (heroPrice) {
      heroPrice.textContent = `≈ $${basePrice.toFixed(0)} USD`;
    }

    // Update last updated time
    const lastUpdateElements = document.querySelectorAll('.price-last-updated');
    lastUpdateElements.forEach(element => {
      element.textContent = `Updated: ${this.lastUpdated.toLocaleTimeString()}`;
    });

    console.log('✅ Price display updated successfully');
  }

  showPriceError() {
    console.log('🚨 Price feed error - using fallback prices');
    
    // Use fallback prices instead of showing "unavailable"
    const fallbackEthPrice = 2500; // Conservative ETH price fallback
    
    const basePrice = fallbackEthPrice * 0.1; // 0.1 ETH base price
    const premiumPrice = fallbackEthPrice * 0.25; // 0.25 ETH premium price

    const basePriceElements = document.querySelectorAll('.base-price-usd');
    basePriceElements.forEach(element => {
      element.textContent = `≈ $${basePrice.toFixed(0)}`;
    });

    const premiumPriceElements = document.querySelectorAll('.premium-price-usd');
    premiumPriceElements.forEach(element => {
      element.textContent = `≈ $${premiumPrice.toFixed(0)}+`;
    });

    // Update price display in hero section
    const heroPrice = document.querySelector('.price-usd');
    if (heroPrice) {
      heroPrice.textContent = `≈ $${basePrice.toFixed(0)} USD`;
    }
  }

  startPriceUpdates() {
    // Initial fetch
    this.fetchEthPrice();
    
    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      this.fetchEthPrice();
    }, 30000);
  }

  stopPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Initialize price feed when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const priceFeed = new PriceFeed();
  priceFeed.startPriceUpdates();
  
  // Store globally for potential use in other scripts
  window.ethPriceFeed = priceFeed;
});

// Handle page visibility changes to pause/resume updates
document.addEventListener('visibilitychange', () => {
  if (window.ethPriceFeed) {
    if (document.hidden) {
      window.ethPriceFeed.stopPriceUpdates();
    } else {
      window.ethPriceFeed.startPriceUpdates();
    }
  }
});