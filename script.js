/* ==========================================================================
   1. Interactive Form Submission & Backend Integration
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const downloadForm = document.querySelector('.download-form');
  const urlInput = downloadForm ? downloadForm.querySelector('input[type="url"]') : null;
  const downloadBtn = downloadForm ? downloadForm.querySelector('.btn-download') : null;

  if (downloadForm && urlInput && downloadBtn) {
    const btnText = downloadBtn.querySelector('span');

    downloadForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const targetUrl = urlInput.value.trim();
      if (!targetUrl) return;

      // Disable button and update UI state
      downloadBtn.disabled = true;
      if (btnText) btnText.innerText = 'Fetching...';

      try {
        // Send link to the Flask backend route
        const response = await fetch('/api/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: targetUrl }),
        });

        const result = await response.json();

        if (result.success && result.download_url) {
          // Trigger file download / open media link
          window.location.href = result.download_url;
        } else {
          // Display private account / domain rejection / error message
          alert(result.message || 'Unable to download video.');
        }
      } catch (error) {
        alert('Network error. Please make sure the backend server is running and try again.');
      } finally {
        // Re-enable button state
        downloadBtn.disabled = false;
        if (btnText) btnText.innerText = 'Download';
      }
    });
  }
});

/* ==========================================================================
   2. Animated Particle Canvas
   ========================================================================== */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

if (canvas && ctx) {
  let particles = [];
  let mouse = { x: null, y: null, radius: 140 };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.8 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.baseAlpha = Math.random() * 0.4 + 0.1;
      this.alpha = this.baseAlpha;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap around screen edges smoothly
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;

      // Interactive mouse hover response
      if (mouse.x && mouse.y) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          this.alpha = Math.min(0.8, this.baseAlpha + (1 - distance / mouse.radius) * 0.5);
        } else {
          this.alpha = this.baseAlpha;
        }
      } else {
        this.alpha = this.baseAlpha;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${this.alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const isMobile = window.innerWidth < 768;
    const densityDivisor = isMobile ? 36000 : 18000;
    const particleCount = Math.floor((canvas.width * canvas.height) / densityDivisor);

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        let dx = particles[a].x - particles[b].x;
        let dy = particles[a].y - particles[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          let opacity = (1 - distance / 120) * 0.15;
          ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    if (window.innerWidth >= 768) {
      connectParticles();
    }

    requestAnimationFrame(animate);
  }

  // Canvas Initialization
  resizeCanvas();
  initParticles();
  animate();
}