// Icons, charts and small DOM helpers.

const P = {
  pulse: 'M3 12h4l2.5-6 4 12 2.5-6H21',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  dumbbell: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  apple: 'M12 7.5c-1.8-1.6-6.2-1.6-6.8 2.6C4.6 14.6 7.6 20.5 10 20.8c.9.1 1.3-.5 2-.5s1.1.6 2 .5c2.4-.3 5.4-6.2 4.8-10.7-.6-4.2-5-4.2-6.8-2.6zM12 7.5c0-2.2 1-3.7 3-4.5',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  plus: 'M12 5v14M5 12h14',
  chevL: 'M15 18l-6-6 6-6',
  chevR: 'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  barcode: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13.5 8v8M17 8v8',
  flame: 'M12 3c1 3.2 5 5.2 5 10.2a5 5 0 0 1-10 0c0-2.2 1-3.7 2-4.7 0 2 1 3.2 2 3.2 0-3.2-1-5.2 1-8.7z',
  egg: 'M12 3c-3.5 0-6 5.2-6 9.2a6 6 0 0 0 12 0C18 8.2 15.5 3 12 3z',
  check: 'M5 12.5l4.5 4.5L19.5 7',
  x: 'M6 6l12 12M18 6 6 18',
  scale: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 10a4 4 0 0 1 8 0M12 10l1.6-2.2',
  body: 'M12 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM6 10h12M12 10v4.5M9 21l3-6.5 3 6.5',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  sparkles: 'M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM21 21l-4.5-4.5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  coffee: 'M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2 2 0 0 1 0 4H17M8 3.5v2.5M12 3.5v2.5',
  bowl: 'M3 11h18a9 9 0 0 1-18 0zM8 7.5c0-1 1-1 1-2.2M12 7.5c0-1 1-1 1-2.2M16 7.5c0-1 1-1 1-2.2',
  moon: 'M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  target: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM12 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
  info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 11v6M12 7.5v.5',
  refresh: 'M20 11a8 8 0 0 0-14.8-4M4 4v4h4M4 13a8 8 0 0 0 14.8 4M20 20v-4h-4',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  image: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 8.5a1 1 0 1 1 0 .01',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  fork: 'M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.2 1.2-3.5 3.6-3.5 7v3H17',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  camera: 'M4 8h3l2-3h6l2 3h3v12H4zM12 10.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
  share: 'M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v8h14v-8',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 21h7M9.5 17h5v4h-5z',
  crown: 'M3.5 8l4.5 4 4-7 4 7 4.5-4-2 10h-13zM5.5 21h13',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  bars: 'M5 20v-6M10 20V9M15 20v-9M20 20V5',
  drop: 'M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z',
  person: 'M12 3a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 3zM8.5 9.5h7l-1 6h-1.2L13 21h-2l-.3-5.5H9.5z',
  calc: 'M6 3h12v18H6zM8.5 6h7v3h-7zM9 12.5h.01M12 12.5h.01M15 12.5h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01M9 18.5h.01M12 18.5h.01M15 18.5h.01',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  heart: 'M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z',
  ruler: 'M9 3h6M9 21h6M12 3v18',
};

export const icon = (name, size = 20, cls = '') =>
  `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || ''}"/></svg>`;

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmt = (n, d = 0) => {
  const v = Number(n) || 0;
  return v.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
};

// ---------- charts ----------

/** Progress ring. value/max, CSS color variable name. */
export function ring(value, max, color, size = 60, stroke = 6, label = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const over = max > 0 && value > max * 1.05;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${over ? 'var(--warn)' : color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

export function sparkline(values, color = 'var(--accent)', w = 84, h = 30) {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length < 2) return `<svg width="${w}" height="${h}"></svg>`;
  const min = Math.min(...v), max = Math.max(...v);
  const span = max - min || 1;
  const pts = v.map((y, i) => `${((i / (v.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((y - min) / span) * (h - 6)).toFixed(1)}`);
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/**
 * Line chart with crosshair hover. points: [{label, value, tip}]
 * Call bindLineCharts(root) after inserting into the DOM.
 */
export function lineChart(points, { unit = '', color = 'var(--accent)', target = null, height = 220, decimals = 1 } = {}) {
  if (points.length < 2) {
    return `<div class="chart-empty">${icon('chart', 22)}<span>Log at least two days to see a trend.</span></div>`;
  }
  // Size the drawing to the screen so axis text stays readable on phones.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 860;
  const W = narrow ? Math.max(300, Math.round(window.innerWidth - 66)) : 640;
  const H = narrow ? 200 : height, L = 40, R = 14, T = 14, B = 28;
  const vals = points.map((p) => p.value).concat(target != null ? [target] : []);
  let min = Math.min(...vals), max = Math.max(...vals);
  const pad = (max - min) * 0.15 || Math.max(1, Math.abs(max) * 0.05);
  min -= pad; max += pad;
  const x = (i) => L + (i / (points.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const ticks = 4;
  let grid = '';
  for (let i = 0; i <= ticks; i++) {
    const v = min + ((max - min) * i) / ticks;
    grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 8}" y="${y(v) + 4}" class="axis" text-anchor="end">${fmt(v, max - min < 10 ? 1 : 0)}</text>`;
  }
  const step = Math.max(1, Math.ceil(points.length / (narrow ? 4 : 6)));
  let xl = '';
  points.forEach((p, i) => {
    if (i % step === 0 || i === points.length - 1) {
      if (i !== points.length - 1 && points.length - 1 - i < step * 0.6) return;
      const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle';
      xl += `<text x="${x(i)}" y="${H - 8}" class="axis" text-anchor="${anchor}">${esc(p.label)}</text>`;
    }
  });
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const area = `${d}L${x(points.length - 1).toFixed(1)},${H - B}L${L},${H - B}Z`;
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  const tgt = target != null
    ? `<line x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}" class="target"/><text x="${W - R}" y="${y(target) - 6}" class="axis" text-anchor="end">target ${fmt(target)}</text>`
    : '';
  const dots = points.length <= 40
    ? points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.2" fill="${color}" stroke="var(--card)" stroke-width="2"/>`).join('')
    : '';
  const data = points.map((p, i) => ({ x: x(i), y: y(p.value), t: p.tip || `${p.label}: ${fmt(p.value, decimals)}${unit}` }));
  return `<div class="linechart" data-points='${esc(JSON.stringify(data))}' data-w="${W}" data-h="${H}">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Trend chart">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}${tgt}
      <path d="${area}" fill="url(#${id})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      <line class="xhair" x1="0" x2="0" y1="${T}" y2="${H - B}" style="display:none"/>
      <circle class="xdot" r="5" fill="${color}" stroke="var(--card)" stroke-width="2" style="display:none"/>
      ${xl}
    </svg>
    <div class="tip" style="display:none"></div>
  </div>`;
}

export function bindLineCharts(root) {
  root.querySelectorAll('.linechart').forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    const pts = JSON.parse(el.dataset.points);
    const W = Number(el.dataset.w);
    const svg = el.querySelector('svg');
    const hair = el.querySelector('.xhair');
    const dot = el.querySelector('.xdot');
    const tip = el.querySelector('.tip');
    const move = (ev) => {
      const rect = svg.getBoundingClientRect();
      const scale = rect.width / W;
      const mx = (ev.clientX - rect.left) / scale;
      let best = 0;
      pts.forEach((p, i) => { if (Math.abs(p.x - mx) < Math.abs(pts[best].x - mx)) best = i; });
      const p = pts[best];
      hair.setAttribute('x1', p.x); hair.setAttribute('x2', p.x); hair.style.display = '';
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.style.display = '';
      tip.textContent = p.t;
      tip.style.display = '';
      const left = Math.min(rect.width - tip.offsetWidth - 4, Math.max(4, p.x * scale - tip.offsetWidth / 2));
      tip.style.left = left + 'px';
      tip.style.top = Math.max(0, p.y * scale - 44) + 'px';
    };
    const leave = () => { hair.style.display = 'none'; dot.style.display = 'none'; tip.style.display = 'none'; };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerdown', move);
    svg.addEventListener('pointerleave', leave);
  });
}

// ---------- toast ----------
export function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
}
