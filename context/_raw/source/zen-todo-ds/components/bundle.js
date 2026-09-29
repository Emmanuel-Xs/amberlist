/* @ds-bundle: {"format":4,"namespace":"Zen","components":[{"name":"Button"},{"name":"Input"},{"name":"Textarea"},{"name":"Switch"},{"name":"Chip"},{"name":"SearchBar"},{"name":"TaskItem"},{"name":"CategoryCard"},{"name":"ProgressCard"},{"name":"DateStrip"},{"name":"AppNav"},{"name":"AppShell"},{"name":"Icon"},{"name":"Illustration"},{"name":"EmptyState"},{"name":"Skeleton"},{"name":"Toast"},{"name":"Alert"},{"name":"Menu"},{"name":"ConfirmDialog"},{"name":"Dialog"},{"name":"Sheet"},{"name":"Popover"},{"name":"Tooltip"},{"name":"Toaster"}]} */
(function () {
  var R = window.React, h = R.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }

  var P = {
    check: 'M20 6 9 17l-5-5',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
    sliders: 'M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4',
    more: 'M12 5h.01M12 12h.01M12 19h.01',
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    tasks: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
    plus: 'M12 8v8M8 12h8M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z',
    user: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8zM4 21a8 8 0 0 1 16 0',
    bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
    note: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
    droplet: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
    pen: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.6 7.6M11 11a2 2 0 1 0 0-4a2 2 0 1 0 0 4z',
    target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM12 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2z',
    sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    cart: 'M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6M9 21h.01M18 21h.01',
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    trash: 'M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    pin: 'M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z',
    flame: 'M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 4V3z',
    inbox: 'M3 13h5l1 3h6l1-3h5M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    x: 'M18 6 6 18M6 6l12 12',
    chevronRight: 'm9 6 6 6-6 6',
    chevronDown: 'm6 9 6 6 6-6',
    play: 'M7 4v16l13-8z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
    scratch: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
    undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
    copy: 'M9 9h10v10H9zM5 15V5h10'
  };

  function Icon(p) {
    var s = p.size || 20;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: p.strokeWidth || 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', className: cx('zn-icon', p.className), 'aria-hidden': true },
      h('path', { d: P[p.name] || '' }));
  }

  function Button(p) {
    var rest = omit(p, ['variant', 'size', 'block', 'icon', 'className', 'children', 'loading']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      disabled: p.disabled || p.loading, 'aria-busy': p.loading || undefined,
      className: cx('zn-btn', 'zn-btn--' + (p.variant || 'primary'), 'zn-btn--' + (p.size || 'md'), p.block && 'zn-btn--block', !p.children && 'zn-btn--icon-only', p.loading && 'is-loading', p.className)
    }), p.loading ? h('span', { className: 'zn-spinner', 'aria-hidden': true }) : (p.icon && h(Icon, { name: p.icon, size: p.size === 'sm' ? 16 : 20 })), p.children != null && p.children !== false && h('span', { className: 'zn-btn-label' }, p.children));
  }

  // Original illustrations: pastel shapes, on-pastel outlines. 200 x 150 viewBox.
  var S = { stroke: 'var(--on-pastel)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  function f(c) { return { style: { fill: c === 'paper' ? '#fdfcf9' : 'var(--' + c + ')' } }; }
  function sh(tag, fill, attrs) { return h(tag, Object.assign({}, S, fill ? f(fill) : { fill: 'none' }, attrs)); }
  function ground() { return h('ellipse', { cx: 100, cy: 136, rx: 70, ry: 8, style: { fill: 'var(--surface-raised)' } }); }
  var ILLOS = {
    tasks: function () { return [ground(),
      h('circle', { key: 's', cx: 156, cy: 34, r: 14, style: { fill: 'var(--accent)' } }),
      sh('rect', 'lavender', { key: 'b', x: 58, y: 28, width: 84, height: 104, rx: 14 }),
      sh('rect', 'butter', { key: 'c', x: 80, y: 20, width: 40, height: 18, rx: 7 }),
      sh('circle', 'accent', { key: 'k1', cx: 80, cy: 60, r: 8 }), sh('path', null, { key: 'k1c', d: 'M76 60l3 3 5-6' }), sh('path', null, { key: 'l1', d: 'M96 60h30' }),
      sh('circle', 'paper', { key: 'k2', cx: 80, cy: 84, r: 8 }), sh('path', null, { key: 'l2', d: 'M96 84h24' }),
      sh('circle', 'paper', { key: 'k3', cx: 80, cy: 108, r: 8 }), sh('path', null, { key: 'l3', d: 'M96 108h28' })]; },
    done: function () { return [ground(),
      sh('rect', 'mint', { key: 'p1', x: 30, y: 44, width: 28, height: 10, rx: 5, transform: 'rotate(-20 44 49)' }),
      sh('rect', 'lavender', { key: 'p2', x: 146, y: 30, width: 24, height: 10, rx: 5, transform: 'rotate(25 158 35)' }),
      sh('rect', 'sky', { key: 'p3', x: 150, y: 98, width: 26, height: 10, rx: 5, transform: 'rotate(-10 163 103)' }),
      sh('circle', 'peach', { key: 'p4', cx: 42, cy: 104, r: 6 }),
      sh('circle', 'accent', { key: 'c', cx: 100, cy: 74, r: 42 }),
      h('path', { key: 'k', d: 'M80 74l14 14 26-28', fill: 'none', stroke: 'var(--on-pastel)', strokeWidth: 6, strokeLinecap: 'round', strokeLinejoin: 'round' })]; },
    notes: function () { return [ground(),
      sh('rect', 'butter', { key: 'a', x: 46, y: 34, width: 78, height: 96, rx: 12, transform: 'rotate(-8 85 82)' }),
      sh('rect', 'lavender', { key: 'b', x: 72, y: 26, width: 78, height: 96, rx: 12, transform: 'rotate(6 111 74)' }),
      sh('path', null, { key: 'l1', d: 'M88 52h40M86 66h44M84 80h30', transform: 'rotate(6 111 74)' }),
      sh('rect', 'peach', { key: 'p', x: 144, y: 44, width: 14, height: 62, rx: 3, transform: 'rotate(30 151 75)' })]; },
    folder: function () { return [ground(),
      sh('path', 'butter', { key: 'b', d: 'M40 44a8 8 0 0 1 8-8h30l10 10h64a8 8 0 0 1 8 8v70a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z' }),
      h('rect', { key: 'p', x: 62, y: 36, width: 76, height: 58, rx: 6, style: { fill: '#fdfcf9' }, stroke: 'var(--on-pastel)', strokeWidth: 2, strokeDasharray: '5 5' }),
      sh('path', 'accent', { key: 'f', d: 'M34 70a8 8 0 0 1 8-8h116a8 8 0 0 1 8 8l-6 52a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8z' })]; },
    habits: function () { return [ground(),
      h('circle', { key: 's', cx: 150, cy: 38, r: 14, style: { fill: 'var(--accent)' } }),
      sh('path', null, { key: 'st', d: 'M100 100V54', stroke: 'var(--ink)' }),
      sh('ellipse', 'mint', { key: 'l1', cx: 84, cy: 62, rx: 18, ry: 9, transform: 'rotate(-30 84 62)' }),
      sh('ellipse', 'mint', { key: 'l2', cx: 116, cy: 74, rx: 18, ry: 9, transform: 'rotate(30 116 74)' }),
      sh('path', 'peach', { key: 'pot', d: 'M72 98h56l-8 34H80z' }),
      sh('rect', 'peach', { key: 'rim', x: 66, y: 92, width: 68, height: 12, rx: 4 })]; },
    search: function () { return [ground(),
      h('rect', { key: 'd', x: 40, y: 26, width: 104, height: 90, rx: 16, fill: 'none', stroke: 'var(--line-strong)', strokeWidth: 2, strokeDasharray: '6 6' }),
      sh('path', null, { key: 'h', d: 'M128 98l24 24', strokeWidth: 10, stroke: 'var(--ink)' }),
      sh('circle', 'sky', { key: 'g', cx: 108, cy: 76, r: 30 }),
      h('path', { key: 'q', d: 'M98 70a10 10 0 1 1 14 9c-3 2-4 3-4 7M108 94v1', fill: 'none', stroke: 'var(--on-pastel)', strokeWidth: 3, strokeLinecap: 'round' })]; },
    offline: function () { return [ground(),
      sh('path', 'sky', { key: 'c', d: 'M58 104a24 24 0 0 1 4-47 32 32 0 0 1 60-6 26 26 0 0 1 22 53z' }),
      h('path', { key: 's', d: 'M60 36l84 84', stroke: 'var(--danger)', strokeWidth: 6, strokeLinecap: 'round' })]; }
  };
  function Illustration(p) {
    var draw = ILLOS[p.name] || ILLOS.tasks, w = p.width || 200;
    return h('svg', { width: w, height: w * 0.75, viewBox: '0 0 200 150', className: cx('zn-illo', p.className), 'aria-hidden': true }, draw());
  }

  function EmptyState(p) {
    return h('div', { className: cx('zn-empty', p.className) },
      h(Illustration, { name: p.illustration, width: p.illustrationWidth || 180 }),
      h('h3', { className: 'zn-empty-title' }, p.title),
      p.text && h('p', { className: 'zn-empty-text' }, p.text),
      p.children && h('div', { className: 'zn-empty-actions' }, p.children));
  }

  function Skeleton(p) {
    return h('span', { className: cx('zn-skeleton', p.className), 'aria-hidden': true, style: { width: p.width || '100%', height: p.height || 16, borderRadius: p.radius } });
  }

  function Toast(p) {
    var tone = p.tone || 'neutral';
    return h('div', { className: cx('zn-toast', 'zn-toast--' + tone, p.className), role: tone === 'error' ? 'alert' : 'status', 'aria-live': tone === 'error' ? 'assertive' : 'polite' },
      p.icon && h('span', { className: 'zn-toast-icon' }, h(Icon, { name: p.icon, size: 18 })),
      h('span', { className: 'zn-toast-msg' }, p.message),
      p.actionLabel && h('button', { type: 'button', className: 'zn-toast-action', onClick: p.onAction }, p.actionLabel),
      p.onClose !== null && h('button', { type: 'button', className: 'zn-icon-btn', 'aria-label': 'Dismiss', onClick: p.onClose }, h(Icon, { name: 'x', size: 18 })),
      p.duration !== 0 && h('span', { className: 'zn-toast-timer', 'aria-hidden': true, style: { animationDuration: (p.duration || 4000) + 'ms', animationPlayState: p.paused ? 'paused' : 'running' } }));
  }

  function Toaster(p) {
    return h('div', { className: cx('zn-toaster', 'zn-toaster--' + (p.position || 'bottom-center'), p.className) }, p.children);
  }

  // UI sounds, synthesized with Web Audio: no files, no licensing. Quiet by default; off when the user turns Sounds off.
  var audioCtx = null, soundOn = true;
  var SOUNDS = {
    complete: [[784, 0, 0.09], [1175, 0.07, 0.14]],
    undo: [[880, 0, 0.08], [659, 0.06, 0.1]],
    delete: [[330, 0, 0.1], [247, 0.05, 0.14]],
    error: [[311, 0, 0.12], [262, 0.12, 0.16]],
    celebrate: [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.1], [1047, 0.24, 0.24]],
    tap: [[1320, 0, 0.03]]
  };
  function sound(name, opts) {
    if (!soundOn || typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var now = audioCtx.currentTime, vol = (opts && opts.volume) || 0.06;
      (SOUNDS[name] || SOUNDS.tap).forEach(function (n) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0, now + n[1]);
        g.gain.linearRampToValueAtTime(vol, now + n[1] + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(now + n[1]); o.stop(now + n[1] + n[2] + 0.02);
      });
    } catch (e) {}
  }
  sound.enable = function (on) { soundOn = !!on; };

  // Confetti: a short burst of amber and pastel pills. Skipped under prefers-reduced-motion.
  function confetti(opts) {
    opts = opts || {};
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var root = opts.container || document.body;
    var rect = root.getBoundingClientRect ? root.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    var cv = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
    var W = root === document.body ? window.innerWidth : rect.width, H = root === document.body ? window.innerHeight : rect.height;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:' + (root === document.body ? 'fixed' : 'absolute') + ';left:0;top:0;width:' + W + 'px;height:' + H + 'px;pointer-events:none;z-index:9999';
    root.appendChild(cv);
    var cs = getComputedStyle(root), colors = ['--accent', '--lavender', '--butter', '--mint', '--peach', '--sky'].map(function (v) { return cs.getPropertyValue(v).trim() || '#fdb833'; });
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var ox = opts.x != null ? opts.x : W / 2, oy = opts.y != null ? opts.y : H * 0.35, parts = [];
    for (var i = 0; i < (opts.count || 90); i++) {
      var a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7;
      parts.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5, w: 6 + Math.random() * 6, hgt: 3 + Math.random() * 3, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length], round: i % 3 === 0 });
    }
    var start = performance.now(), dur = opts.duration || 1800;
    function frame(t) {
      var k = (t - start) / dur; ctx.clearRect(0, 0, W, H);
      parts.forEach(function (q) {
        q.vy += 0.25; q.vx *= 0.99; q.x += q.vx; q.y += q.vy; q.r += q.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k * k); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillStyle = q.c;
        if (q.round) { ctx.beginPath(); ctx.arc(0, 0, q.hgt, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-q.w / 2, -q.hgt / 2, q.w, q.hgt, q.hgt / 2); else ctx.rect(-q.w / 2, -q.hgt / 2, q.w, q.hgt); ctx.fill(); }
        ctx.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  }

  function Alert(p) {
    var tone = p.tone || 'danger';
    var icon = p.icon || { danger: 'alert', warning: 'alert', success: 'check', info: 'bell' }[tone];
    return h('div', { className: cx('zn-alert', 'zn-alert--' + tone, p.className), role: tone === 'danger' ? 'alert' : 'status' },
      h('span', { className: 'zn-alert-icon' }, h(Icon, { name: icon, size: 20 })),
      h('div', { className: 'zn-alert-body' }, p.title && h('strong', { className: 'zn-alert-title' }, p.title), p.children),
      p.actionLabel && h('button', { type: 'button', className: 'zn-btn zn-btn--ghost zn-btn--sm', onClick: p.onAction }, p.actionIcon && h(Icon, { name: p.actionIcon, size: 16 }), p.actionLabel));
  }

  function Menu(p) {
    return h('div', { className: cx('zn-menu', p.className), role: 'menu', 'aria-label': p.label || 'Actions' },
      (p.items || []).map(function (it, i) {
        if (it.separator) return h('div', { key: 's' + i, className: 'zn-menu-sep', role: 'separator' });
        return h('button', { key: it.label, type: 'button', role: 'menuitem', className: cx('zn-menu-item', it.danger && 'is-danger'), onClick: it.onSelect, disabled: it.disabled },
          it.icon && h(Icon, { name: it.icon, size: 18 }), h('span', null, it.label), it.shortcut && h('kbd', { className: 'zn-menu-kbd' }, it.shortcut));
      }));
  }

  function ConfirmDialog(p) {
    var st = R.useState(''), typed = st[0];
    var needs = p.confirmText, ok = !needs || typed === needs;
    return h('div', { className: cx('zn-dialog', p.className), role: 'alertdialog', 'aria-modal': true, 'aria-labelledby': (p.id || 'cd') + '-t', 'aria-describedby': (p.id || 'cd') + '-d' },
      h('span', { className: 'zn-dialog-icon' }, h(Icon, { name: p.icon || 'trash', size: 22 })),
      h('h2', { className: 'zn-dialog-title', id: (p.id || 'cd') + '-t' }, p.title),
      h('p', { className: 'zn-dialog-text', id: (p.id || 'cd') + '-d' }, p.text),
      needs && h(Input, { id: (p.id || 'cd') + '-in', label: 'Type ' + needs + ' to confirm', value: typed, onChange: function (e) { st[1](e.target.value); }, autoComplete: 'off' }),
      h('div', { className: 'zn-dialog-actions' },
        h(Button, { variant: 'secondary', onClick: p.onCancel, autoFocus: true }, p.cancelLabel || 'Cancel'),
        h(Button, { variant: 'danger-solid', icon: p.confirmIcon || 'trash', disabled: !ok, onClick: p.onConfirm }, p.confirmLabel || 'Delete')));
  }

  function Dialog(p) {
    var id = p.id || 'dlg';
    return h('div', { className: cx('zn-dialog', p.wide && 'zn-dialog--wide', p.className), role: 'dialog', 'aria-modal': true, 'aria-labelledby': id + '-t', 'aria-describedby': p.description ? id + '-d' : undefined },
      h('div', { className: 'zn-dialog-head' },
        h('div', null, h('h2', { className: 'zn-dialog-title', id: id + '-t' }, p.title), p.description && h('p', { className: 'zn-dialog-text', id: id + '-d', style: { marginTop: 4 } }, p.description)),
        p.onClose !== null && h('button', { type: 'button', className: 'zn-icon-btn', 'aria-label': 'Close', onClick: p.onClose }, h(Icon, { name: 'x', size: 20 }))),
      h('div', { className: 'zn-dialog-body' }, p.children),
      p.footer && h('div', { className: 'zn-dialog-actions' }, p.footer));
  }

  function Sheet(p) {
    var id = p.id || 'sheet', side = p.side || 'bottom';
    return h('div', { className: cx('zn-sheet', 'zn-sheet--' + side, p.className), role: 'dialog', 'aria-modal': true, 'aria-labelledby': id + '-t' },
      side === 'bottom' && h('span', { className: 'zn-sheet-grip', 'aria-hidden': true }),
      h('div', { className: 'zn-dialog-head' }, h('h2', { className: 'zn-dialog-title', id: id + '-t' }, p.title),
        h('button', { type: 'button', className: 'zn-icon-btn', 'aria-label': 'Close', onClick: p.onClose }, h(Icon, { name: 'x', size: 20 }))),
      h('div', { className: 'zn-dialog-body' }, p.children),
      p.footer && h('div', { className: 'zn-dialog-actions' }, p.footer));
  }

  function Popover(p) {
    return h('div', { className: cx('zn-popover', p.className), role: 'dialog', 'aria-label': p.label }, p.children);
  }

  function Tooltip(p) {
    return h('span', { className: 'zn-tooltip-wrap' }, p.children,
      p.open !== false && h('span', { className: 'zn-tooltip', role: 'tooltip' }, p.label, p.shortcut && h('kbd', null, p.shortcut)));
  }

  function Field(p, control) {
    return h('div', { className: cx('zn-field', 'zn-field--' + (p.variant || 'line'), p.className) },
      p.label && h('label', { className: 'zn-field-label', htmlFor: p.id }, p.label, p.optional && h('span', { className: 'zn-field-opt' }, ' (Optional)')),
      h('div', { className: 'zn-field-control' }, control, p.trailingIcon && h(Icon, { name: p.trailingIcon, size: 18, className: 'zn-field-trail' })),
      p.hint && h('p', { className: cx('zn-field-hint', p.error && 'is-error') }, p.hint));
  }
  var FIELD_KEYS = ['label', 'hint', 'error', 'optional', 'variant', 'trailingIcon', 'className'];
  function Input(p) { return Field(p, h('input', Object.assign({}, omit(p, FIELD_KEYS), { className: 'zn-input', 'aria-invalid': p.error || undefined }))); }
  function Textarea(p) { return Field(p, h('textarea', Object.assign({ rows: 3 }, omit(p, FIELD_KEYS), { className: 'zn-input zn-textarea', 'aria-invalid': p.error || undefined }))); }

  function Switch(p) {
    var st = R.useState(!!p.defaultChecked), on = p.checked != null ? p.checked : st[0];
    function toggle() { var n = !on; if (p.checked == null) st[1](n); if (p.onCheckedChange) p.onCheckedChange(n); }
    var btn = h('button', { type: 'button', role: 'switch', id: p.id, 'aria-checked': on, 'aria-label': p.label ? undefined : p['aria-label'], className: cx('zn-switch', on && 'is-on'), onClick: toggle, disabled: p.disabled },
      h('span', { className: 'zn-switch-thumb' }));
    if (!p.label) return btn;
    return h('label', { className: 'zn-switch-row' }, h('span', { className: 'zn-switch-label' }, p.icon && h(Icon, { name: p.icon, size: 18 }), p.label), btn);
  }

  function Chip(p) {
    var rest = omit(p, ['selected', 'icon', 'className', 'children']);
    return h('button', Object.assign({ type: 'button', 'aria-pressed': !!p.selected }, rest, { className: cx('zn-chip', p.selected && 'is-selected', p.className) }),
      p.icon && h(Icon, { name: p.icon, size: 16 }), p.children);
  }

  function SearchBar(p) {
    var rest = omit(p, ['onFilter', 'className', 'filterLabel']);
    return h('div', { className: cx('zn-search', p.className), role: 'search' },
      h(Icon, { name: 'search', size: 20, className: 'zn-search-icon' }),
      h('input', Object.assign({ type: 'search', placeholder: 'Search...', 'aria-label': p.placeholder || 'Search' }, rest, { className: 'zn-search-input' })),
      p.onFilter !== null && h('button', { type: 'button', className: 'zn-search-filter', 'aria-label': p.filterLabel || 'Filters', onClick: p.onFilter }, h(Icon, { name: 'sliders', size: 18 })));
  }

  function TaskItem(p) {
    return h('div', { className: cx('zn-task', p.done && 'is-done', p.selected && 'is-selected', p.className) },
      h('button', { type: 'button', role: 'checkbox', 'aria-checked': !!p.done, 'aria-label': (p.done ? 'Mark not done: ' : 'Mark done: ') + p.title, className: 'zn-check', onClick: p.onToggle },
        p.done && h(Icon, { name: 'check', size: 14, strokeWidth: 3 })),
      h('button', { type: 'button', className: 'zn-task-body', onClick: p.onOpen },
        h('span', { className: 'zn-task-title' }, p.title),
        (p.time || p.category || p.hasNote) && h('span', { className: 'zn-task-meta' },
          p.time && h('span', null, p.time),
          p.category && h('span', { className: 'zn-task-tag' }, p.category),
          p.hasNote && h('span', { className: 'zn-task-note', title: 'Has a note' }, h(Icon, { name: 'note', size: 14 }), 'Note'))),
      h('button', { type: 'button', className: 'zn-icon-btn', 'aria-label': 'More actions for ' + p.title, onClick: p.onMenu }, h(Icon, { name: 'more' })));
  }

  function CategoryCard(p) {
    return h('button', { type: 'button', className: cx('zn-cat', 'zn-cat--' + (p.tone || 'lavender'), p.className), onClick: p.onClick },
      h('span', { className: 'zn-cat-title' }, p.title),
      p.count != null && h('span', { className: 'zn-cat-count' }, p.count + (p.count === 1 ? ' task' : ' tasks')),
      h('span', { className: 'zn-cat-art' }, h(Icon, { name: p.icon || 'target', size: 44, strokeWidth: 1.25 })));
  }

  function ProgressCard(p) {
    var v = Math.max(0, Math.min(100, Math.round(p.value || 0)));
    return h('article', { className: cx('zn-progress-card', p.className) },
      h('span', { className: 'zn-progress-icon' }, h(Icon, { name: p.icon || 'target', size: 24 })),
      h('div', { className: 'zn-progress-body' },
        h('h3', { className: 'zn-progress-title' }, p.title),
        p.meta && h('p', { className: 'zn-progress-meta' }, p.meta),
        p.description && h('p', { className: 'zn-progress-desc' }, p.description),
        h('div', { className: 'zn-progress-row' },
          h('div', { className: 'zn-progress-track', role: 'progressbar', 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': p.title + ' progress' },
            h('div', { className: 'zn-progress-fill', style: { width: v + '%' } })),
          h('span', { className: 'zn-progress-value' }, v + '%'))),
      h('button', { type: 'button', className: 'zn-icon-btn', 'aria-label': 'More actions for ' + p.title, onClick: p.onMenu }, h(Icon, { name: 'more' })));
  }

  function DateStrip(p) {
    var days = p.days || [];
    var st = R.useState(p.defaultValue != null ? p.defaultValue : (days[0] && days[0].key));
    var val = p.value != null ? p.value : st[0];
    return h('div', { className: cx('zn-dates', p.className), role: 'listbox', 'aria-label': p.label || 'Pick a day' },
      days.map(function (d) {
        var on = d.key === val;
        return h('button', { key: d.key, type: 'button', role: 'option', 'aria-selected': on, className: cx('zn-date', on && 'is-selected', d.today && 'is-today'),
          onClick: function () { if (p.value == null) st[1](d.key); if (p.onChange) p.onChange(d.key); } },
          h('span', { className: 'zn-date-num' }, d.day), h('span', { className: 'zn-date-wd' }, d.weekday));
      }));
  }

  function AppNav(p) {
    var layout = p.layout || 'auto';
    return h('nav', { className: cx('zn-nav', 'zn-nav--' + layout, p.fixed && 'zn-nav--fixed', p.className), 'aria-label': 'Main' },
      p.brand && h('div', { className: 'zn-nav-brand' }, p.brand),
      h('ul', { className: 'zn-nav-list' }, (p.items || []).map(function (it) {
        var on = it.id === p.active;
        return h('li', { key: it.id }, h('a', { href: it.href || '#', className: cx('zn-nav-item', on && 'is-active'), 'aria-current': on ? 'page' : undefined,
          onClick: p.onSelect ? function (e) { e.preventDefault(); p.onSelect(it.id); } : undefined },
          h(Icon, { name: it.icon, size: 22 }), h('span', { className: 'zn-nav-label' }, it.label)));
      })));
  }

  function AppShell(p) {
    return h('div', { className: cx('zn-shell', 'zn-shell--' + (p.layout || 'auto'), p.aside && 'has-aside', p.className) },
      p.nav, h('main', { className: 'zn-shell-main' }, p.children),
      p.aside && h('aside', { className: 'zn-shell-aside', 'aria-label': p.asideLabel || 'Details' }, p.aside));
  }

  window.Zen = Object.assign(window.Zen || {}, { Button: Button, Input: Input, Textarea: Textarea, Switch: Switch, Chip: Chip, SearchBar: SearchBar, TaskItem: TaskItem,
    CategoryCard: CategoryCard, ProgressCard: ProgressCard, DateStrip: DateStrip, AppNav: AppNav, AppShell: AppShell, Icon: Icon, Illustration: Illustration, EmptyState: EmptyState, Skeleton: Skeleton, Toast: Toast, Alert: Alert, Menu: Menu, ConfirmDialog: ConfirmDialog, Dialog: Dialog, Sheet: Sheet, Popover: Popover, Tooltip: Tooltip, Toaster: Toaster, sound: sound, confetti: confetti });
})();
