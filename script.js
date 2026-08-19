/* ============================================================
   JINA AGENCY — interactions
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header / progress ---------- */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('scrolled', y > 24);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var nav = $('#mainNav'), toggle = $('#navToggle');
  function closeNav() {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });
  $$('#mainNav a').forEach(function (a) { a.addEventListener('click', closeNav); });

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- number counters ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, to = parseInt(el.dataset.to, 10) || 0, t0 = null;
      var suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = to.toLocaleString('ko-KR') + suffix; cio.unobserve(el); return; }
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * eased).toLocaleString('ko-KR') + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('.js-count').forEach(function (el) { cio.observe(el); });

  /* ---------- cursor glow ---------- */
  var glow = $('#cursorGlow'), gx = 0, gy = 0, cx = 0, cy = 0, glowOn = false;
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced) {
    glowOn = true;
    window.addEventListener('mousemove', function (e) { gx = e.clientX; gy = e.clientY; });
    (function loop() {
      cx += (gx - cx) * 0.08; cy += (gy - cy) * 0.08;
      glow.style.transform = 'translate3d(' + (cx - 260) + 'px,' + (cy - 260) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }
  if (!glowOn && glow) glow.style.display = 'none';

  /* ---------- hero video controls ---------- */
  var hv = $('#heroVideo'), bSound = $('#btnSound'), bPlay = $('#btnPlay');
  if (hv) {
    var tryPlay = hv.play();
    if (tryPlay && tryPlay.catch) tryPlay.catch(function () { bPlay.textContent = '▶'; });
    bSound.addEventListener('click', function () {
      hv.muted = !hv.muted;
      bSound.textContent = hv.muted ? '🔇' : '🔊';
      if (!hv.muted && hv.paused) hv.play();
    });
    bPlay.addEventListener('click', function () {
      if (hv.paused) { hv.play(); bPlay.textContent = '❚❚'; }
      else { hv.pause(); bPlay.textContent = '▶'; }
    });
    hv.addEventListener('error', function () {
      // 영상 파일이 없을 경우 포스터 이미지로 대체
      var img = document.createElement('img');
      img.src = hv.getAttribute('poster');
      img.alt = 'JINA AI Model Visual';
      hv.parentNode.replaceChild(img, hv);
    });
  }

  /* ---------- portfolio filter (카테고리 블록 단위) ---------- */
  var cats = $$('#catBlocks .cat');
  $$('#filters button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('#filters button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.dataset.f;
      cats.forEach(function (c) {
        c.classList.toggle('hide', !(f === 'all' || c.dataset.cat === f));
      });
    });
  });

  /* ---------- 깨진 썸네일 자동 숨김 ---------- */
  $$('#catBlocks .tile img').forEach(function (img) {
    img.addEventListener('error', function () {
      var t = img.closest('.tile');
      if (t) t.remove();
    });
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbMedia = $('#lbMedia'), lbCap = $('#lbCap');
  var current = -1;

  function visibleTiles() {
    return $$('#catBlocks .tile').filter(function (t) {
      var c = t.closest('.cat');
      return !c || !c.classList.contains('hide');
    });
  }

  function render(i) {
    var list = visibleTiles();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var t = list[current];
    lbMedia.innerHTML = '';
    if (t.dataset.type === 'video') {
      var v = document.createElement('video');
      v.src = t.dataset.src;
      v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      lbMedia.appendChild(v);
    } else {
      var im = document.createElement('img');
      im.src = t.dataset.src; im.alt = t.dataset.cap || '';
      lbMedia.appendChild(im);
    }
    lbCap.textContent = t.dataset.cap || '';
  }

  function openLb(i) {
    render(i);
    lb.classList.add('open');
    document.body.classList.add('is-locked');
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.classList.remove('is-locked');
    lbMedia.innerHTML = '';
  }

  $('#catBlocks').addEventListener('click', function (e) {
    var t = e.target.closest('.tile');
    if (!t) return;
    openLb(visibleTiles().indexOf(t));
  });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function (e) { e.stopPropagation(); render(current - 1); });
  $('#lbNext').addEventListener('click', function (e) { e.stopPropagation(); render(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') render(current - 1);
    if (e.key === 'ArrowRight') render(current + 1);
  });

  /* ---------- FAQ ---------- */
  $$('#faqList .qa').forEach(function (qa) {
    var btn = qa.querySelector('button'), ans = qa.querySelector('.ans');
    btn.addEventListener('click', function () {
      var open = qa.classList.contains('open');
      $$('#faqList .qa').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.ans').style.maxHeight = null;
      });
      if (!open) {
        qa.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

  /* ---------- floating kakao panel ---------- */
  var fw = $('#floatWrap'), fab = $('#floatFab');
  fab.addEventListener('click', function (e) {
    e.stopPropagation();
    fw.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (!fw.contains(e.target)) fw.classList.remove('open');
  });

  /* ---------- CTA → 카카오 오픈채팅 ---------- */
  var KAKAO_URL = 'https://open.kakao.com/me/jinaagency';
  $$('.js-kakao').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.open(KAKAO_URL, '_blank', 'noopener');
    });
  });

  /* ---------- toast + copy ---------- */
  var toast = $('#toast'), toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  $$('.js-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var txt = btn.dataset.copy;
      var done = function () { showToast('이메일 주소가 복사되었습니다 · ' + txt); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(txt).then(done).catch(fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); }
        catch (err) { showToast('복사 실패 — ' + txt); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- smooth anchor offset ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || a.classList.contains('js-kakao')) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
})();
