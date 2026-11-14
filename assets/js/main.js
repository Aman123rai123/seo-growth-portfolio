(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const closeMenu = () => { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', links).forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Active section in nav
  const navMap = new Map($$('a[href^="#"]', links).map(a => [a.getAttribute('href').slice(1), a]));
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navMap.forEach(a => a.classList.remove('is-active'));
      const a = navMap.get(en.target.id);
      if (a && !a.classList.contains('nav__cta')) a.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const el = document.getElementById(id); if (el) secObs.observe(el); });

  /* ---------- Typing search bar ---------- */
  const typed = $('#typed');
  const queries = ['seo executive noida', 'technical seo audit expert', 'on-page seo specialist', 'local seo & google business profile', 'aeo and geo for ai search', 'grow organic traffic'];
  if (!reduce) (async () => {
    let i = 0;
    await sleep(1600);
    for (;;) {
      const q = queries[i++ % queries.length];
      for (let n = typed.textContent.length; n >= 0; n--) { typed.textContent = typed.textContent.slice(0, n); await sleep(28); }
      for (let n = 1; n <= q.length; n++) { typed.textContent = q.slice(0, n); await sleep(55 + Math.random() * 45); }
      await sleep(2200);
    }
  })();

  /* ---------- Count-up stats ---------- */
  const countUp = el => {
    const to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) return;
    const dur = 1200; let start;
    const step = t => {
      start ??= t;
      const p = Math.min(1, Math.max(0, (t - start) / dur));
      el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = pre + '0' + suf;
    requestAnimationFrame(step);
  };
  const statObs = new IntersectionObserver(es => {
    if (es[0].isIntersecting) { statObs.disconnect(); $$('[data-count]').forEach(countUp); }
  }, { threshold: 0.4 });
  statObs.observe($('#stats'));

  /* ---------- Tabs ---------- */
  const tabs = $$('.tabs [role="tab"]');
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  // Deep links (#technical, #onpage, #offpage) open the right tab
  const openFromHash = () => {
    const t = tabs.find(x => x.getAttribute('aria-controls') === location.hash.slice(1));
    if (t) { select(t); $('#pillars').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  };
  addEventListener('hashchange', openFromHash);
  $$('a[href="#technical"], a[href="#onpage"], a[href="#offpage"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); openFromHash();
  }));
  if (location.hash) openFromHash();

  /* ---------- Audit demo ---------- */
  const ISSUES = [
    { sev: 'high', t: '38 pages return 404 (broken internal links)', fix: 'Links updated, 301s added', tag: 'Technical' },
    { sev: 'high', t: '112 pages "Crawled – not indexed"', fix: 'Thin pages merged, sitemap cleaned', tag: 'Technical' },
    { sev: 'high', t: 'LCP 4.1s on mobile product pages', fix: 'WebP + lazy-load, LCP 2.1s', tag: 'Core Web Vitals' },
    { sev: 'med', t: '64 duplicate title tags', fix: 'Unique, keyword-led titles', tag: 'On-Page' },
    { sev: 'med', t: '91 missing meta descriptions', fix: 'CTR-focused descriptions written', tag: 'On-Page' },
    { sev: 'med', t: 'Redirect chains (3+ hops) on 22 URLs', fix: 'Single 301 to final URL', tag: 'Technical' },
    { sev: 'med', t: 'No Product / FAQ schema', fix: 'JSON-LD added, rich results valid', tag: 'Schema' },
    { sev: 'low', t: '27 orphan pages with no internal links', fix: 'Linked from category hubs', tag: 'On-Page' },
    { sev: 'low', t: '140 images missing alt text', fix: 'Descriptive alt text added', tag: 'On-Page' },
  ];
  const runBtn = $('#runAudit'), fixBtn = $('#fixAudit'), list = $('#issues');
  const ring = $('#scoreRing'), num = $('#scoreNum'), bar = $('#crawlBar'), label = $('#crawlLabel'), count = $('#crawlCount');
  const C = 2 * Math.PI * 52;
  const setScore = v => {
    ring.style.strokeDashoffset = String(C * (1 - v / 100));
    ring.style.stroke = v >= 90 ? 'var(--green)' : v >= 70 ? 'var(--yellow)' : 'var(--red)';
    const from = +num.textContent || 0, t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 900); num.textContent = Math.round(from + (v - from) * p); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true; fixBtn.disabled = true; list.replaceChildren();
    num.textContent = '–'; ring.style.strokeDashoffset = String(C);
    label.textContent = 'Crawling site…';
    const total = 1284;
    for (let i = 0; i <= 40; i++) {
      bar.style.width = (i / 40 * 100) + '%';
      count.textContent = Math.round(total * i / 40).toLocaleString() + ' URLs';
      await sleep(reduce ? 0 : 35);
    }
    label.textContent = 'Crawl complete · ' + ISSUES.length + ' issue types found';
    setScore(58);
    for (const it of ISSUES) {
      const li = el('li', 'issue');
      li.append(el('span', 'sev sev--' + it.sev));
      const t = el('span', 'issue__t'); t.append(el('b', null, it.t), el('small', null, 'Fix: ' + it.fix));
      li.append(t, el('span', 'issue__tag', it.tag));
      list.append(li);
      await sleep(reduce ? 0 : 110);
    }
    runBtn.textContent = 'Run again'; runBtn.disabled = false; fixBtn.disabled = false;
  });

  fixBtn.addEventListener('click', async () => {
    fixBtn.disabled = true; runBtn.disabled = true;
    label.textContent = 'Applying fixes…';
    for (const li of $$('.issue', list)) { li.classList.add('is-fixed'); li.querySelector('.issue__tag').textContent = 'Fixed'; await sleep(reduce ? 0 : 140); }
    setScore(94);
    label.textContent = 'All fixes applied · re-crawl clean';
    runBtn.disabled = false;
  });


  /* ---------- Case study walkthrough ---------- */
  const PDF = 'assets/case-studies/boat-rental-formentor-seo-case-study.pdf';
  const PAGES = [
    ['Cover & headline results', 'About 1.3K Google clicks in 3 months, organic users +126.1%, organic sessions +145.5% and GA4-attributed organic revenue +356.9%.'],
    ['Executive summary', 'Every KPI moved the right way: clicks 615 → ≈1.3K, impressions +31.9%, CTR 2.2% → 3.5%, average position 17.2 → 10.3, key events 12 → 42.'],
    ['Search Console growth', 'Last 3 months vs previous 3 months in Google Search Console: clicks, impressions, CTR and average position all improved together.'],
    ['GA4 user acquisition', 'Organic Search users 1,366 → 3,089 (+126.1%), new users +135.7% and key-event rate 0.89% → 1.25%.'],
    ['GA4 traffic & revenue', 'Organic sessions 2,077 → 5,098, engaged sessions +124.3%, and GA4-attributed organic revenue €2,620 → €11,970.'],
    ['Keyword rankings', '#1 for "boat rental formentor" and other local terms; 30 of 38 tracked keywords are now in the Top 10.'],
    ['Strategy: what I did', 'Keyword mapping, on-page optimisation, technical checks, local SEO and authority building, measured in GSC, GA4 and a rank tracker.'],
  ];
  const walk = $('#walk');
  if (walk) {
    const steps = $$('.walk__steps button', walk);
    const img = $('#walkImg'), zoomBtn = $('#walkZoom'), cap = $('#walkCap'), numEl = $('#walkNum'), pdfA = $('#walkPdf');
    const dlg = $('#zoomDlg'), zImg = $('#zoomImg'), zTitle = $('#zoomTitle');
    const src = n => 'assets/case-studies/boat-rental-formentor/page-' + n + '.jpg';
    let cur = 1;
    const go = (n, focus) => {
      cur = Math.min(7, Math.max(1, n));
      steps.forEach((b, i) => {
        const on = i + 1 === cur;
        b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
        if (on) {
          b.classList.add('is-seen'); if (focus) b.focus({ preventScroll: true });
          const strip = b.closest('.walk__steps');
          if (strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: b.parentElement.offsetLeft - strip.offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
      const [title, text] = PAGES[cur - 1];
      zoomBtn.classList.add('is-loading');
      const next = new Image(); next.src = src(cur);
      (next.decode ? next.decode() : Promise.resolve()).catch(() => {}).then(() => {
        img.src = next.src; img.alt = 'Case study page ' + cur + ': ' + title; zoomBtn.classList.remove('is-loading');
      });
      numEl.textContent = 'Page ' + cur + ' · ' + title;
      cap.textContent = text;
      pdfA.href = PDF + '#page=' + cur;
      $('#walkPrev').disabled = cur === 1;
      $('#walkNext').textContent = cur === 7 ? 'Open full PDF ↗' : 'Next →';
      if (cur < 7) new Image().src = src(cur + 1); // preload
    };
    steps.forEach((b, i) => {
      b.addEventListener('click', () => go(i + 1));
      b.addEventListener('keydown', e => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); go(cur + d, true); }
      });
    });
    $('#walkPrev').addEventListener('click', () => go(cur - 1));
    $('#walkNext').addEventListener('click', () => { if (cur === 7) window.open(PDF, '_blank', 'noopener'); else go(cur + 1); });
    // Swipe on the page image
    let sx = null;
    zoomBtn.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    zoomBtn.addEventListener('touchend', e => {
      if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { zoomBtn.dataset.swiped = '1'; go(cur + (dx < 0 ? 1 : -1)); }
    });
    // Zoom
    zoomBtn.addEventListener('click', () => {
      if (zoomBtn.dataset.swiped) { delete zoomBtn.dataset.swiped; return; }
      zImg.src = src(cur); zImg.alt = img.alt; zTitle.textContent = 'Page ' + cur + ' of 7 · ' + PAGES[cur - 1][0];
      if (dlg.showModal) dlg.showModal(); else window.open(src(cur), '_blank', 'noopener');
    });
    $('#zoomClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    go(1);
    steps[0].classList.add('is-seen');
  }

  /* ---------- Copy email ---------- */
  const toast = $('#toast'); let tt;
  const show = msg => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2200); };
  $('#copyEmail').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('amanrai2319@gmail.com'); show('Email copied ✓'); }
    catch { show('amanrai2319@gmail.com'); }
  });

  /* ---------- Reveal on scroll ---------- */
  const rev = $$('.cs-card, .cs-kpi, .walk, .section__head, .point, .mode, .tool, .tools-minor, .job, .cert, .edu article, .tool-win, .steps li');
  if (!reduce && 'IntersectionObserver' in window) {
    rev.forEach(e => e.classList.add('reveal'));
    const ro = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(e => ro.observe(e));
  }
})();
