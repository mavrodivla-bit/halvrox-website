(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  // hero word stagger
  document.querySelectorAll('.hero-title .word').forEach((w, i) => {
    w.style.animationDelay = (0.1 + i * 0.07) + 's';
  });

  // reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    if (el.closest('.hero')) return;
    if (el.closest('.stats, .pillars')) el.style.transitionDelay = ((i % 4) * 0.08) + 's';
    io.observe(el);
  });

  // count-up stats
  const fmt = (n, short) => short && n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n.toLocaleString('en-US');
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, short = el.dataset.format === 'short';
      counter.unobserve(el);
      if (reduce) { el.textContent = fmt(end, short); return; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(end * k), short);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));

  // lazy videos: load + play only while visible
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        const s = v.querySelector('source[data-src]');
        if (s) { s.src = s.dataset.src; s.removeAttribute('data-src'); v.load(); }
        if (!reduce) v.play().catch(() => {});
      } else v.pause();
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.lazy-video').forEach((v) => vio.observe(v));

  // nav hide on scroll down + progress bar
  const nav = document.querySelector('.nav'), bar = document.querySelector('.progress');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('hide', y > lastY && y > 300);
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  // hero parallax tiles
  const stage = document.querySelector('.hero-stage');
  if (stage && fine && !reduce) {
    const tiles = [...stage.querySelectorAll('.tile')];
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('mousemove', (e) => {
      tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5);
    });
    const loop = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      tiles.forEach((t) => {
        const d = +t.dataset.depth || 1;
        t.style.transform = `translate3d(${cx * 40 * d}px, ${cy * 30 * d}px, 0) rotateY(${cx * 10 * d}deg) rotateX(${-cy * 8 * d}deg)`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  }

  // tilt media cards
  if (fine && !reduce) {
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.015)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // magnetic buttons
  if (fine && !reduce) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // flashlight
  document.querySelectorAll('[data-flashlight]').forEach((el) => {
    const hint = el.querySelector('.flashlight-hint');
    if (hint && !fine) hint.textContent = 'Drag your finger — the demon only shows in the light';
    const set = (x, y) => { el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px'); };
    const move = (cx, cy) => { const r = el.getBoundingClientRect(); set(cx - r.left, cy - r.top); el.classList.add('touched'); };
    el.addEventListener('pointermove', (e) => move(e.clientX, e.clientY));
    el.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    // idle sweep until the visitor takes the light
    if (!reduce) {
      let a = 0;
      const sweep = () => {
        if (el.classList.contains('touched')) return;
        a += 0.012;
        const r = el.getBoundingClientRect();
        set(r.width * (0.5 + Math.cos(a) * 0.32), r.height * (0.45 + Math.sin(a * 1.7) * 0.22));
        requestAnimationFrame(sweep);
      };
      sweep();
    }
  });

  // trailer modal (YouTube, privacy-enhanced)
  const modal = document.getElementById('trailer'), frame = modal.querySelector('.modal-frame');
  const open = (id) => {
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { frame.innerHTML = ''; }, 350);
  };
  document.querySelectorAll('[data-trailer]').forEach((b) => b.addEventListener('click', () => open(b.dataset.trailer)));
  modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
})();
