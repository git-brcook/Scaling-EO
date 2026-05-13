/* ============ PROGRESS BAR + NAV ============ */
const progressBar = document.getElementById('progressBar');
const topnav = document.getElementById('topnav');
function onScroll() {
  const h = document.documentElement;
  const total = h.scrollHeight - h.clientHeight;
  const pct = Math.max(0, Math.min(1, (h.scrollTop || document.body.scrollTop) / total));
  progressBar.style.width = (pct * 100).toFixed(2) + '%';
  topnav.classList.toggle('scrolled', (h.scrollTop || document.body.scrollTop) > 12);
}
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============ NAV ACTIVE LINK ============ */
const navLinks = [...document.querySelectorAll('nav.top a[data-link]')];
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
function syncNav() {
  const y = (document.documentElement.scrollTop || document.body.scrollTop) + 120;
  let active = -1;
  sections.forEach((s, i) => { if (s && s.offsetTop <= y) active = i; });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === active));
}
document.addEventListener('scroll', syncNav, { passive: true });
syncNav();

/* ============ REVEAL ON SCROLL ============ */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      // run any registered callbacks
      const cb = e.target.__onIn;
      if (typeof cb === 'function') { cb(); e.target.__onIn = null; }
    }
  }
}, { threshold: 0.18 });
document.querySelectorAll('.reveal, .strike').forEach(el => io.observe(el));

/* ============ HERO GAP CHART (animated) ============ */
(function gapChart() {
  const svg = document.getElementById('gapChart');
  const linear = document.getElementById('linePathLinear');
  const power  = document.getElementById('linePathPower');
  // build power curve: y starts near baseline (y=320) and rises sharply
  // x: 60 -> 880 (820 wide), y: 320 -> 40 (top)
  let d = '';
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = 60 + t * 820;
    const v = Math.pow(t, 3); // 0..1
    const y = 320 - v * 280;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }
  power.setAttribute('d', d);
  const pLen = power.getTotalLength();
  power.style.strokeDasharray = pLen;
  power.style.strokeDashoffset = pLen;

  // observe
  let ran = false;
  const wrap = svg.closest('.reveal');
  function run() {
    if (ran) return; ran = true;
    // linear animate
    linear.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)';
    linear.style.strokeDashoffset = '0';
    // power animate
    power.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.7,.2,1) .2s';
    power.style.strokeDashoffset = '0';
    // end markers
    setTimeout(() => {
      const eL = document.getElementById('endLinear'); eL.setAttribute('r', '5');
      eL.style.transition = 'r .3s ease';
      document.getElementById('lblLinear').style.transition = 'opacity .5s ease';
      document.getElementById('lblLinear').style.opacity = '1';
    }, 1300);
    setTimeout(() => {
      const eP = document.getElementById('endPower'); eP.setAttribute('r', '7');
      eP.style.transition = 'r .3s ease';
      document.getElementById('lblPower').style.transition = 'opacity .5s ease';
      document.getElementById('lblPower').style.opacity = '1';
    }, 1900);

    // count up
    const span = document.getElementById('gapMult');
    let start = null;
    const dur = 1400;
    function step(ts) {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      span.textContent = Math.round(ease * 10);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (wrap) wrap.__onIn = run;
})();

/* ============ DIST CHART (Bell + Power) ============ */
(function distChart() {
  const bell = document.getElementById('bellPath');
  const power = document.getElementById('powerPath');
  // build bell: gaussian centered at x=550, baseline 340
  function bellY(x) {
    const m = 550, s = 130, A = 220;
    return 340 - A * Math.exp(-0.5 * Math.pow((x - m) / s, 2));
  }
  let bd = '';
  for (let x = 60; x <= 1040; x += 6) {
    bd += (x === 60 ? 'M' : 'L') + x + ',' + bellY(x).toFixed(2);
  }
  bd += ' L1040,340 L60,340 Z';
  bell.setAttribute('d', bd);
  let blen = bell.getTotalLength();
  bell.style.strokeDasharray = blen;
  bell.style.strokeDashoffset = blen;

  // power: decays from left, with long tail
  function powY(x) {
    const t = (x - 60) / 980; // 0..1
    return 340 - 240 * Math.exp(-6 * t) - 20 * Math.exp(-1.2 * t);
  }
  let pd = '';
  for (let x = 60; x <= 1040; x += 6) {
    pd += (x === 60 ? 'M' : 'L') + x + ',' + powY(x).toFixed(2);
  }
  pd += ' L1040,340 L60,340 Z';
  power.setAttribute('d', pd);
  let plen = power.getTotalLength();
  power.style.strokeDasharray = plen;
  power.style.strokeDashoffset = plen;

  // animation on reveal
  const wrap = bell.closest('.reveal');
  function run() {
    bell.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1)';
    bell.style.strokeDashoffset = '0';
    power.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1) .2s';
    power.style.strokeDashoffset = '0';
    setTimeout(() => {
      document.getElementById('bellAnnotation').style.transition = 'opacity .6s';
      document.getElementById('bellAnnotation').style.opacity = '1';
    }, 900);
    setTimeout(() => {
      document.getElementById('powerAnnotation').style.transition = 'opacity .6s';
      document.getElementById('powerAnnotation').style.opacity = '1';
    }, 1300);
  }
  if (wrap) wrap.__onIn = run;

  // toggle
  document.querySelectorAll('[data-dist]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-dist]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.dist;
      bell.style.transition = 'opacity .4s ease';
      power.style.transition = 'opacity .4s ease';
      bell.style.opacity  = mode === 'power' ? 0.1 : 1;
      power.style.opacity = mode === 'bell'  ? 0.1 : 1;
      document.getElementById('bellAnnotation').style.opacity  = mode === 'power' ? 0 : 1;
      document.getElementById('powerAnnotation').style.opacity = mode === 'bell'  ? 0 : 1;
    });
  });
})();

/* ============ PAST/PRESENT/FUTURE TIMELINE ============ */
(function ppf() {
  const line = document.getElementById('ppfLine');
  const wrap = line.closest('.reveal');
  function run() {
    line.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)';
    line.style.strokeDashoffset = '0';
    setTimeout(() => {
      document.getElementById('ppfNodes').style.transition = 'opacity .5s';
      document.getElementById('ppfNodes').style.opacity = '1';
      document.getElementById('ppfLabels').style.transition = 'opacity .5s';
      document.getElementById('ppfLabels').style.opacity = '1';
      document.getElementById('ppfSubA').style.transition = 'opacity .5s';
      document.getElementById('ppfSubA').style.opacity = '1';
      document.getElementById('ppfSubB').style.transition = 'opacity .5s .1s';
      document.getElementById('ppfSubB').style.opacity = '1';
      document.getElementById('ppfSubC').style.transition = 'opacity .5s .2s';
      document.getElementById('ppfSubC').style.opacity = '1';
    }, 800);
  }
  if (wrap) wrap.__onIn = run;
})();

/* ============ MASTERY OF PAST TABS ============ */
(function tabs() {
  const QS = {
    '5y': {
      anchor: 'May 2021',
      items: [
        ['Where were you in life and business?'],
        ['What\'s DIFFERENT now vs. May 2021?'],
        ['How are YOU different now vs. May 2021?'],
        ['Biggest growth and results created since then?'],
        ['Most powerful experiences?'],
        ['Most unexpected changes?'],
        ['What were the "big rocks" of the previous 5 years?']
      ]
    },
    '1y': {
      anchor: 'May 2025',
      items: [
        ['Where were you in life and business?'],
        ['What\'s DIFFERENT now vs. May 2025?'],
        ['How are YOU different now vs. May 2025?'],
        ['Biggest growth and results created since then?'],
        ['Most powerful experiences?'],
        ['Most unexpected changes?'],
        ['What were the "big rocks" of the previous year?']
      ]
    },
    '90d': {
      anchor: 'Feb 2026',
      items: [
        ['Where were you in life and business?'],
        ['What\'s DIFFERENT now vs. Feb 2026?'],
        ['How are YOU different now vs. Feb 2026?'],
        ['Biggest growth and results created since then?'],
        ['Most powerful experiences?'],
        ['Most unexpected changes?'],
        ['What were the "big rocks" of the previous 90 days?']
      ]
    }
  };
  const list = document.getElementById('qList');
  function render(key) {
    const set = QS[key];
    list.innerHTML = set.items.map((it, i) =>
      `<div class="q"><div class="n">0${i+1}</div><div class="t">${it[0]}</div></div>`
    ).join('');
  }
  render('5y');
  document.querySelectorAll('.tabs [data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs [data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.tab);
    });
  });
})();

/* ============ INTERACTIVE BELL TIERS ============ */
(function tiers() {
  const svg = document.getElementById('tierChart');
  const bell = document.getElementById('tierBell');
  const fill = document.getElementById('tierFill');
  const mark = document.getElementById('tierMark');
  const dot  = document.getElementById('tierDot');
  const lbl  = document.getElementById('tierLabel');
  const pct  = document.getElementById('tierPct');

  // bell with long tail (log scale presentation)
  const W = 1100, baseY = 310, topPad = 30;
  function bY(x) {
    // skewed log-normal-ish curve, peak left of center
    const t = (x - 60) / 980; // 0..1
    const k = 5.2;
    const peak = 0.18;
    const v = Math.pow(t / peak, 1.6) * Math.exp(k * (1 - t / peak));
    const norm = v / (Math.pow(1, 1.6) * Math.exp(0));
    return baseY - Math.min(260, 260 * norm);
  }
  // build bell path
  let bd = '';
  for (let x = 60; x <= 1040; x += 4) {
    bd += (x === 60 ? 'M' : 'L') + x + ',' + bY(x).toFixed(2);
  }
  bell.setAttribute('d', bd);

  // tier x positions (left to right) — based roughly on log of revenue
  const tiers = [
    { x: 230,  label: '$50k median',      pct: '≈ 50th percentile', sx: 60,   ex: 360 },
    { x: 460,  label: '$500k small biz',  pct: 'Top ~30%',          sx: 360,  ex: 620 },
    { x: 720,  label: '$5m operator',     pct: 'Top ~4%',           sx: 620,  ex: 850 },
    { x: 960,  label: '$50m+ tail',       pct: 'Top ~0.4%',         sx: 850,  ex: 1040 }
  ];

  function setTier(i) {
    const t = tiers[i];
    // build fill segment of bell between sx and ex
    let p = `M${t.sx},${baseY} `;
    for (let x = t.sx; x <= t.ex; x += 4) p += `L${x},${bY(x).toFixed(2)} `;
    p += `L${t.ex},${baseY} Z`;
    fill.setAttribute('d', p);

    const cy = bY(t.x);
    mark.setAttribute('x1', t.x); mark.setAttribute('x2', t.x);
    mark.setAttribute('y1', cy);  mark.setAttribute('y2', baseY);
    dot.setAttribute('cx', t.x);  dot.setAttribute('cy', cy);
    lbl.setAttribute('x', t.x);   lbl.setAttribute('y', Math.max(28, cy - 22));
    lbl.textContent = t.label;
    pct.setAttribute('x', t.x);   pct.setAttribute('y', Math.max(48, cy - 6));
    pct.textContent = t.pct;
  }
  setTier(0);

  document.querySelectorAll('[data-tier]').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tier]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTier(parseInt(btn.dataset.tier, 10));
    });
  });

  // animate bell stroke + counters on reveal
  const wrap = svg.closest('.reveal');
  function run() {
    const len = bell.getTotalLength();
    bell.style.strokeDasharray = len;
    bell.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      bell.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.7,.2,1)';
      bell.style.strokeDashoffset = '0';
    });
    // count stat A from 0 -> 34
    function counter(id, to, suffix, dur, decimals=0) {
      const el = document.getElementById(id);
      let start;
      function step(ts) {
        if (start == null) start = ts;
        const t = Math.min(1, (ts - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        const v = (to * e).toFixed(decimals);
        el.innerHTML = v + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    counter('cmpA', 34,   '<span class="unit">M</span>',   1400);
    counter('cmpB', 76,   '<span class="unit">%</span>',   1400);
    counter('cmpC', 0.04, '<span class="unit">%</span>',   1600, 2);
  }
  if (wrap) wrap.__onIn = run;
})();

/* ============ FLOOR BARS ============ */
(function floor() {
  const g = document.getElementById('floorBars');
  // 18 activities — most fall below the floor (golden line at y=160)
  const N = 18;
  const W = 1100, baseY = 280, floorY = 160;
  const xPad = 60, w = (W - xPad * 2) / N - 6;
  const seed = [0.18,0.42,0.31,0.55,0.74,0.38,0.62,0.27,0.45,0.31,0.91,0.34,0.49,0.22,0.83,0.41,0.29,0.97];
  let html = '';
  for (let i = 0; i < N; i++) {
    const x = xPad + i * ((W - xPad * 2) / N);
    const h = seed[i] * 230;
    const y = baseY - h;
    const above = (baseY - h) < floorY;
    const fill = above ? 'var(--gold)' : 'var(--slate)';
    const op   = above ? 1 : 0.45;
    html += `<rect data-i="${i}" x="${x}" y="${baseY}" width="${w}" height="0" fill="${fill}" opacity="${op}" rx="1"/>`;
    html += `<rect class="target" data-target-i="${i}" data-final-y="${y}" data-final-h="${h}" x="${x}" y="${baseY}" width="${w}" height="0" fill="transparent"/>`;
  }
  g.innerHTML = html;

  const svg = document.getElementById('floorSvg');
  const wrap = svg.closest('.reveal');
  function run() {
    const rects = g.querySelectorAll('rect[data-i]');
    rects.forEach((r, i) => {
      const t = parseInt(r.getAttribute('data-i'), 10);
      const finalH = seed[t] * 230;
      const finalY = baseY - finalH;
      r.style.transition = `y .9s cubic-bezier(.2,.7,.2,1) ${i*0.04}s, height .9s cubic-bezier(.2,.7,.2,1) ${i*0.04}s`;
      r.setAttribute('y', finalY);
      r.setAttribute('height', finalH);
    });
    // floor line
    const fl = document.getElementById('floorLine');
    fl.setAttribute('y1', floorY);
    fl.setAttribute('y2', floorY);
    fl.setAttribute('x2', 60);
    fl.style.transition = 'x2 1.2s cubic-bezier(.2,.7,.2,1) .8s';
    requestAnimationFrame(() => fl.setAttribute('x2', 1040));
    setTimeout(() => {
      const lab = document.getElementById('floorLineLabel');
      lab.style.transition = 'opacity .5s ease';
      lab.style.opacity = '1';
    }, 1800);
  }
  if (wrap) wrap.__onIn = run;
})();

/* ============ FLYWHEEL ROTATION + SYNC ============ */
(function flywheel() {
  const ring = document.getElementById('flyRing');
  const pointer = document.getElementById('flyPointer');
  const nodes = document.querySelectorAll('#flywheelList .node');
  const svg = document.getElementById('flywheel');
  const wrap = svg.closest('.reveal');

  // ring fill anim
  let started = false;
  function run() {
    if (started) return; started = true;
    ring.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1)';
    ring.style.strokeDashoffset = '0';
    auto();
  }
  if (wrap) wrap.__onIn = run;

  const angles = [-90, 0, 90, 180]; // top, right, bottom, left
  let active = 0;
  function setActive(i) {
    active = i;
    nodes.forEach((n, k) => n.classList.toggle('active', k === i));
    const a = angles[i];
    pointer.style.transition = 'transform 1s cubic-bezier(.2,.7,.2,1)';
    pointer.style.transformOrigin = '250px 250px';
    pointer.style.transform = `rotate(${a + 90}deg)`;
  }

  let timer;
  function auto() {
    clearInterval(timer);
    timer = setInterval(() => setActive((active + 1) % 4), 2800);
  }
  nodes.forEach((n, i) => {
    n.addEventListener('click', () => { setActive(i); auto(); });
    n.addEventListener('mouseenter', () => { setActive(i); auto(); });
  });
})();