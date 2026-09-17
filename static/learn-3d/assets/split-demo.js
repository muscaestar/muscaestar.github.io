/* 可复用交互演示组件 — 上下分屏布局
 *
 * 用法：
 *   const demo = new SplitDemo({
 *     topRatio: 0.55,          // 上半占比
 *     bottomLabel: '2D 编辑器',
 *     topLabel: '3D 视图',
 *   });
 *   demo.addHandle({ x: 0, y: 0, color: '#f44', label: '(0,0)', onDrag: (x, y) => {} });
 *   demo.init3D((scene, camera, renderer) => { ... });
 *   demo.start();
 */

class SplitDemo {
  constructor(opts = {}) {
    this.topRatio = opts.topRatio || 0.55;
    this.topLabel = opts.topLabel || '3D 视图';
    this.bottomLabel = opts.bottomLabel || '2D 编辑器';
    this.handles = [];
    this._dragIdx = -1;

    // 创建 DOM
    this._buildDOM();
    this._build3D();
    this._bindEvents();
  }

  _buildDOM() {
    const container = document.getElementById('app') || document.body;
    container.innerHTML = '';
    container.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;background:#0d1117;overflow:hidden;';

    // 上半 — 3D
    this.topEl = document.createElement('div');
    this.topEl.style.cssText = `flex:0 0 ${this.topRatio * 100}%;position:relative;overflow:hidden;`;
    container.appendChild(this.topEl);

    // 分割线
    const divider = document.createElement('div');
    divider.style.cssText = 'height:2px;background:#30363d;flex-shrink:0;';
    container.appendChild(divider);

    // 下半 — 2D 编辑
    this.botEl = document.createElement('div');
    this.botEl.style.cssText = 'flex:1;position:relative;overflow:hidden;';
    container.appendChild(this.botEl);

    // 标签
    for (const [el, text] of [[this.topEl, this.topLabel], [this.botEl, this.bottomLabel]]) {
      const label = document.createElement('div');
      label.textContent = text;
      label.style.cssText = 'position:absolute;top:8px;left:12px;z-index:5;font-size:11px;color:#58a6ff;font-weight:600;background:rgba(0,0,0,.5);padding:3px 8px;border-radius:6px;pointer-events:none;';
      el.appendChild(label);
    }
  }

  _build3D() {
    // iSH 兼容
    const S = 0.5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    const el = this.renderer.domElement;
    el.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;';
    this.topEl.appendChild(el);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(2.5, 2, 2.5);

    // 默认光照
    this.scene.add(new THREE.AmbientLight(0x8899bb, 1.5));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    // OrbitControls
    if (typeof OrbitControls !== 'undefined') {
      this.controls = new OrbitControls(this.camera, el);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.enablePan = false;
    }

    this._S = S;
    this._fitRenderer();
  }

  _fitRenderer() {
    const w = this.topEl.clientWidth;
    const h = this.topEl.clientHeight;
    this.renderer.setSize(w, h, false);
    const el = this.renderer.domElement;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.transform = `translate(${w * 0.25}px, ${h * 0.25}px) scale(${this._S})`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // 添加 2D 手柄（DOM 元素，大点击区域）
  addHandle(opts) {
    const h = {
      x: opts.x || 0,      // 0~1 归一化坐标
      y: opts.y || 0,
      color: opts.color || '#58a6ff',
      label: opts.label || '',
      size: opts.size || 28,  // 触摸区域直径
      onDrag: opts.onDrag || (() => {}),
      el: null,
    };

    const el = document.createElement('div');
    el.style.cssText = `
      position:absolute;
      width:${h.size}px;height:${h.size}px;
      border-radius:50%;
      background:${h.color};
      border:3px solid rgba(255,255,255,0.8);
      box-shadow:0 0 12px ${h.color}40;
      cursor:grab;
      touch-action:none;
      z-index:10;
      transform:translate(-50%,-50%);
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:700;color:#fff;
      user-select:none;
      -webkit-user-select:none;
    `;
    el.textContent = h.label;

    // 外圈触摸区域（不可见但增大点击范围）
    const touchArea = document.createElement('div');
    touchArea.style.cssText = `
      position:absolute;
      width:${h.size * 2.5}px;height:${h.size * 2.5}px;
      border-radius:50%;
      transform:translate(-50%,-50%);
      left:50%;top:50%;
      pointer-events:none;
    `;
    el.appendChild(touchArea);

    this.botEl.appendChild(el);
    h.el = el;
    this.handles.push(h);
    this._positionHandle(h);
    return h;
  }

  _positionHandle(h) {
    const w = this.botEl.clientWidth;
    const hgt = this.botEl.clientHeight;
    const px = h.x * w;
    const py = h.y * hgt;
    h.el.style.left = px + 'px';
    h.el.style.top = py + 'px';
  }

  _bindEvents() {
    let dragHandle = null;

    const getPos = (e) => {
      const rect = this.botEl.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return [cx / rect.width, cy / rect.height];
    };

    const onDown = (e) => {
      const [nx, ny] = getPos(e);
      // 找最近的手柄
      let bestDist = 0.12; // 归一化触摸半径
      for (let i = 0; i < this.handles.length; i++) {
        const h = this.handles[i];
        const d = Math.hypot(nx - h.x, ny - h.y);
        if (d < bestDist) {
          bestDist = d;
          dragHandle = h;
        }
      }
      if (dragHandle) {
        e.preventDefault();
        e.stopPropagation();
        dragHandle.el.style.cursor = 'grabbing';
        dragHandle.el.style.boxShadow = `0 0 20px ${dragHandle.color}80`;
      }
    };

    const onMove = (e) => {
      if (!dragHandle) return;
      e.preventDefault();
      const [nx, ny] = getPos(e);
      dragHandle.x = Math.max(0, Math.min(1, nx));
      dragHandle.y = Math.max(0, Math.min(1, ny));
      this._positionHandle(dragHandle);
      dragHandle.onDrag(dragHandle.x, dragHandle.y);
    };

    const onUp = () => {
      if (dragHandle) {
        dragHandle.el.style.cursor = 'grab';
        dragHandle.el.style.boxShadow = `0 0 12px ${dragHandle.color}40`;
        dragHandle = null;
      }
    };

    // 同时监听 pointer 和 touch 事件
    this.botEl.addEventListener('pointerdown', onDown);
    this.botEl.addEventListener('pointermove', onMove);
    this.botEl.addEventListener('pointerup', onUp);
    this.botEl.addEventListener('touchstart', onDown, { passive: false });
    this.botEl.addEventListener('touchmove', onMove, { passive: false });
    this.botEl.addEventListener('touchend', onUp);
  }

  // 初始化 3D 场景内容（回调）
  init3D(fn) {
    fn(this.scene, this.camera, this.renderer);
    this._fitRenderer();
  }

  // 启动动画循环
  start(onFrame) {
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.elapsedTime;
      if (this.controls) this.controls.update();
      if (onFrame) onFrame(dt, t);
      // 每帧强制更新 UV（如果存在）
      if (window.__boxGeo) {
        window.__boxGeo.attributes.uv.needsUpdate = true;
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    window.addEventListener('resize', () => {
      this._fitRenderer();
      this.handles.forEach(h => this._positionHandle(h));
    });
  }

  // 设置 2D 编辑器的背景内容（图片/渐变/文字）
  setBottomContent(html) {
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;';
    div.innerHTML = html;
    this.botEl.appendChild(div);
    return div;
  }

  // 设置 2D 编辑器的背景 canvas（绘制纹理预览等）
  setBottomCanvas(drawFn) {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    this.botEl.insertBefore(cv, this.botEl.firstChild?.nextSibling);

    const redraw = () => {
      const w = this.botEl.clientWidth;
      const h = this.botEl.clientHeight;
      cv.width = w * 2;
      cv.height = h * 2;
      const ctx = cv.getContext('2d');
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      drawFn(ctx, w, h);
    };
    redraw();
    window.addEventListener('resize', redraw);
    return { canvas: cv, redraw };
  }
}
