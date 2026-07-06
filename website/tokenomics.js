// Tokenomics Chart
function createTokenChart() {
  const canvas = document.getElementById('tokenChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 120;
  
  const data = [
    { label: 'Public Mint', percentage: 84.5, color: '#00ffef' },    // 750/888 = 84.5%
    { label: 'Premium/Auction', percentage: 9.9, color: '#ff6bcd' }, // 88/888 = 9.9%
    { label: 'Reserved/Airdrops', percentage: 5.6, color: '#00d4ff' } // 50/888 = 5.6%
  ];
  
  let currentAngle = -Math.PI / 2; // Start from top
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw pie slices
  data.forEach((segment, index) => {
    const sliceAngle = (segment.percentage / 100) * 2 * Math.PI;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = segment.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    currentAngle += sliceAngle;
  });
  
  // Draw center circle (larger to give more space for text)
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 255, 239, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw center text with better spacing and smaller fonts
  ctx.fillStyle = '#00ffef';
  ctx.font = 'bold 12px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ffef';
  ctx.shadowBlur = 6;
  ctx.fillText('GENESIS', centerX, centerY - 8);
  ctx.font = 'bold 10px Orbitron, monospace';
  ctx.shadowBlur = 4;
  ctx.fillText('888 PODS', centerX, centerY + 8);
  ctx.shadowBlur = 0;
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add a delay to ensure canvas is rendered
  setTimeout(createTokenChart, 100);
});

// Redraw chart on window resize
window.addEventListener('resize', () => {
  setTimeout(createTokenChart, 100);
});