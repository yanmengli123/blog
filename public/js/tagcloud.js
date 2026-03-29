/* ============================================
   鱼行尺素 - 3D 标签云
   ============================================ */

class TagCloud {
  constructor(container, tags, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.tags   = tags;
    this.radius = options.radius || 120;
    this.depth  = options.depth  || 90;
    this.size   = options.size   || 200; // container size px
    this.maxFont= options.maxFont || 18;
    this.minFont= options.minFont || 10;

    this.init();
  }

  init() {
    this.container.style.cssText = `
      position: relative;
      width: ${this.size}px;
      height: ${this.size}px;
      cursor: pointer;
      user-select: none;
    `;

    // compute font size range
    const counts = this.tags.map(t => t.count);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    this.tags.forEach((tag, i) => {
      const ratio = maxCount === minCount
        ? 0.5
        : (tag.count - minCount) / (maxCount - minCount);
      const fontSize = this.minFont + ratio * (this.maxFont - this.minFont);

      // sphere distribution
      const phi   = Math.acos(-1 + (2 * i) / this.tags.length);
      const theta = Math.sqrt(this.tags.length * Math.PI) * phi;

      const x = this.radius * Math.cos(theta) * Math.sin(phi);
      const y = this.radius * Math.sin(theta) * Math.sin(phi);
      const z = this.radius * Math.cos(phi);

      const el = document.createElement('span');
      el.className = 'tag-item';
      el.textContent = tag.name;
      el.dataset.count = tag.count;
      el.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: ${fontSize}px;
        font-weight: 600;
        color: var(--color-primary, #8b5cf6);
        text-decoration: none;
        padding: 3px 10px;
        border-radius: 20px;
        background: transparent;
        cursor: pointer;
        transform: translate3d(-50%,-50%,${z}px);
        transition: color 0.2s, background 0.2s;
        white-space: nowrap;
      `;

      // hover: highlight
      el.addEventListener('mouseenter', () => {
        el.style.background = 'rgba(139,92,246,0.15)';
        el.style.color = '#8b5cf6';
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'transparent';
        el.style.color = 'var(--color-primary, #8b5cf6)';
      });

      this.container.appendChild(el);
    });

    this.startAnimation();
    this.bindMouse();
  }

  startAnimation() {
    let angleX = 0, angleY = 0;
    const speedX = 0.003, speedY = 0.002;
    const depth = this.depth;

    this._anim = () => {
      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);

      this.container.querySelectorAll('span').forEach((el, i) => {
        const phi   = Math.acos(-1 + (2 * i) / this.tags.length);
        const theta = Math.sqrt(this.tags.length * Math.PI) * phi;

        let x = this.radius * Math.cos(theta) * Math.sin(phi);
        let y = this.radius * Math.sin(theta) * Math.sin(phi);
        let z = this.radius * Math.cos(phi);

        // rotate X
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;
        // rotate Y
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;

        const scale = depth / (depth + z2);
        const opacity = (scale * 0.6 + 0.4).toFixed(3);
        const fontSize = parseFloat(el.style.fontSize);
        el.style.transform = `translate3d(-50%,-50%,${z2}px) scale(${scale})`;
        el.style.opacity = opacity;
        el.style.zIndex = Math.round(scale * 10);
      });

      angleX += speedX;
      angleY += speedY;
      this._rafId = requestAnimationFrame(this._anim);
    };

    this._anim();
  }

  bindMouse() {
    let isDragging = false, lastX = 0, lastY = 0;
    let velX = 0, velY = 0;

    this.container.addEventListener('mousedown', e => {
      isDragging = true;
      lastX = e.clientX; lastY = e.clientY;
      velX = 0; velY = 0;
      cancelAnimationFrame(this._rafId);
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      velX = dx * 0.005; velY = dy * 0.005;
      lastX = e.clientX; lastY = e.clientY;

      // apply drag rotation instantly
      this.container.querySelectorAll('span').forEach((el, i) => {
        const phi   = Math.acos(-1 + (2 * i) / this.tags.length);
        const theta = Math.sqrt(this.tags.length * Math.PI) * phi;
        let x = this.radius * Math.cos(theta) * Math.sin(phi);
        let y = this.radius * Math.sin(theta) * Math.sin(phi);
        let z = this.radius * Math.cos(phi);
        const y1 = y * Math.cos(velX) - z * Math.sin(velX);
        const z1 = y * Math.sin(velX) + z * Math.cos(velX);
        const x2 = x * Math.cos(velY) + z1 * Math.sin(velY);
        const z2 = -x * Math.sin(velY) + z1 * Math.cos(velY);
        const scale = this.depth / (this.depth + z2);
        el.style.transform = `translate3d(-50%,-50%,${z2}px) scale(${scale})`;
        el.style.opacity = (scale * 0.6 + 0.4).toFixed(3);
      });
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      // inertia
      const inertia = () => {
        velX *= 0.95; velY *= 0.95;
        if (Math.abs(velX) < 0.0001 && Math.abs(velY) < 0.0001) {
          this.startAnimation(); return;
        }
        this.container.dispatchEvent(new MouseEvent('mousemove', { clientX: lastX + velX * 200, clientY: lastY + velY * 200 }));
        requestAnimationFrame(inertia);
      };
      inertia();
    });
  }

  destroy() {
    cancelAnimationFrame(this._rafId);
    this.container.innerHTML = '';
  }
}

/* ---- 轻量替代：2D 旋转标签云（无需 3D 变换库） ---- */
function initTagCloud(containerId, tags) {
  const el = document.getElementById(containerId);
  if (!el) return;

  // fallback: simple wrapping layout if canvas approach too heavy
  el.innerHTML = tags.map(t =>
    `<span class="tag-item inline-block px-3 py-1 rounded-full text-sm font-medium cursor-pointer"
            style="color: var(--color-primary,#8b5cf6); background: rgba(139,92,246,0.08);">
      ${t.name}
      <span class="ml-1 opacity-50 text-xs">${t.count}</span>
    </span>`
  ).join('');
}
