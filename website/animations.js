// Space-themed background animation
class SpaceAnimation {
  constructor() {
    this.canvas = document.getElementById('space-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.astronauts = [];
    this.meteors = [];
    
    this.resizeCanvas();
    this.createStars();
    this.createAstronauts();
    this.createMeteors();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    this.animate();
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createStars() {
    const numStars = Math.floor((this.canvas.width * this.canvas.height) / 8000);
    this.stars = [];
    
    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }
  
  createAstronauts() {
    const numAstronauts = 3;
    this.astronauts = [];
    
    for (let i = 0; i < numAstronauts; i++) {
      this.astronauts.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.6 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }
  }
  
  createMeteors() {
    this.meteors = [];
    // Meteors are created dynamically
  }
  
  createMeteor() {
    if (Math.random() < 0.003) { // 0.3% chance per frame
      this.meteors.push({
        x: this.canvas.width + 50,
        y: Math.random() * this.canvas.height * 0.5,
        speedX: -(Math.random() * 3 + 2),
        speedY: Math.random() * 2 + 1,
        size: Math.random() * 3 + 1,
        life: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }
  }
  
  updateStars() {
    this.stars.forEach(star => {
      star.twinklePhase += star.twinkleSpeed;
      star.opacity = 0.3 + Math.sin(star.twinklePhase) * 0.5;
    });
  }
  
  updateAstronauts() {
    this.astronauts.forEach(astronaut => {
      astronaut.x += astronaut.speedX;
      astronaut.y += astronaut.speedY;
      astronaut.rotation += astronaut.rotationSpeed;
      
      // Wrap around screen
      if (astronaut.x < -20) astronaut.x = this.canvas.width + 20;
      if (astronaut.x > this.canvas.width + 20) astronaut.x = -20;
      if (astronaut.y < -20) astronaut.y = this.canvas.height + 20;
      if (astronaut.y > this.canvas.height + 20) astronaut.y = -20;
    });
  }
  
  updateMeteors() {
    this.meteors = this.meteors.filter(meteor => {
      meteor.x += meteor.speedX;
      meteor.y += meteor.speedY;
      meteor.life -= meteor.decay;
      
      return meteor.life > 0 && meteor.x > -50;
    });
  }
  
  drawStars() {
    this.stars.forEach(star => {
      this.ctx.save();
      this.ctx.globalAlpha = star.opacity;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow effect for larger stars
      if (star.size > 1.5) {
        this.ctx.globalAlpha = star.opacity * 0.3;
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }
  
  drawAstronauts() {
    this.astronauts.forEach(astronaut => {
      this.ctx.save();
      this.ctx.globalAlpha = astronaut.opacity;
      this.ctx.translate(astronaut.x, astronaut.y);
      this.ctx.rotate(astronaut.rotation);
      
      // Draw simple astronaut shape
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, -astronaut.size * 0.3, astronaut.size * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fillRect(-astronaut.size * 0.3, -astronaut.size * 0.1, astronaut.size * 0.6, astronaut.size * 0.8);
      
      // Add subtle glow
      this.ctx.globalAlpha = astronaut.opacity * 0.5;
      this.ctx.fillStyle = '#00d4ff';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, astronaut.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  drawMeteors() {
    this.meteors.forEach(meteor => {
      this.ctx.save();
      this.ctx.globalAlpha = meteor.life;
      
      // Draw meteor trail
      const gradient = this.ctx.createLinearGradient(
        meteor.x, meteor.y,
        meteor.x + meteor.speedX * 10, meteor.y + meteor.speedY * 10
      );
      gradient.addColorStop(0, '#ff6b35');
      gradient.addColorStop(0.5, '#ffa502');
      gradient.addColorStop(1, 'transparent');
      
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = meteor.size;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(meteor.x, meteor.y);
      this.ctx.lineTo(meteor.x + meteor.speedX * 10, meteor.y + meteor.speedY * 10);
      this.ctx.stroke();
      
      // Draw meteor core
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(meteor.x, meteor.y, meteor.size * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.createMeteor();
    
    this.updateStars();
    this.updateAstronauts();
    this.updateMeteors();
    
    this.drawStars();
    this.drawAstronauts();
    this.drawMeteors();
    
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SpaceAnimation();
});

// Utility function for smooth number animations
function animateNumber(element, start, end, duration = 1000) {
  const startTime = performance.now();
  const startValue = parseInt(start);
  const endValue = parseInt(end);
  const difference = endValue - startValue;
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(startValue + (difference * easeOutCubic));
    
    element.textContent = element.textContent.replace(/\d+/, currentValue);
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

// Export for use in other modules
window.SpaceAnimation = SpaceAnimation;
window.animateNumber = animateNumber;
