(function () {
  'use strict';
  var company = window.COMPANY || {};

  // ---------- Header: solid on scroll, mobile menu ----------
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  function onScroll() { if (header) header.classList.toggle('is-solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Reveal on scroll ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- Project filter ----------
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    var cards = document.querySelectorAll('.projects-grid--all .card');
    function apply(cat) {
      filters.forEach(function (f) { f.setAttribute('aria-pressed', f.dataset.filter === cat ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var show = cat === 'all' || c.dataset.category === cat;
        c.hidden = !show;
        if (show) c.classList.add('is-in');
      });
    }
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        apply(f.dataset.filter);
        try { history.replaceState(null, '', f.dataset.filter === 'all' ? location.pathname : '#' + f.dataset.filter); } catch (e) {}
      });
    });
    function fromHash() {
      var cat = location.hash.replace('#', '');
      if (cat && document.querySelector('.filter[data-filter="' + cat + '"]')) apply(cat);
    }
    fromHash();
    // Footer category links on this same page only change the hash
    window.addEventListener('hashchange', fromHash);
  }

  // ---------- Lightbox ----------
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var shots = Array.prototype.slice.call(document.querySelectorAll('.shot button'));
    var img = lb.querySelector('img');
    var counter = lb.querySelector('.lb-counter');
    var idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + shots.length) % shots.length;
      img.src = shots[idx].dataset.full;
      img.alt = shots[idx].querySelector('img').alt;
      counter.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(shots.length).padStart(2, '0');
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    shots.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target.classList.contains('lightbox-stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  // ---------- Lead form -> email ----------
  // Статический сайт без сервера: заявка уходит на почту студии через FormSubmit (formEndpoint из company.json).
  var form = document.querySelector('.lead-form');
  if (form) {
    var err = form.querySelector('.form-error');
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit.firstChild.textContent;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      if (data.get('website')) return; // honeypot: заполняют только боты
      var name = (data.get('name') || '').toString().trim();
      var phone = (data.get('phone') || '').toString().trim();
      if (!name || phone.replace(/\D/g, '').length < 10) {
        err.textContent = 'Укажите имя и телефон — мы перезвоним.';
        return;
      }
      if (!data.get('consent')) {
        err.textContent = 'Нужно согласие на обработку персональных данных.';
        return;
      }
      err.textContent = '';
      var payload = {
        _subject: 'Заявка с сайта «КАПСУЛА»: ' + name,
        _template: 'table',
        _captcha: 'false',
        'Имя': name,
        'Телефон': phone,
        'Объект': (data.get('object') || '').toString() || '—',
        'Комментарий': (data.get('message') || '').toString().trim() || '—',
        'Согласие на обработку ПДн': 'дано, ' + new Date().toLocaleString('ru-RU'),
        'Страница': location.href
      };
      submit.disabled = true;
      submit.firstChild.textContent = 'Отправляем… ';
      fetch(company.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'send failed');
        form.reset();
        err.textContent = 'Спасибо! Заявка отправлена — мы свяжемся с вами в ближайшее время.';
      }).catch(function () {
        err.textContent = 'Не удалось отправить заявку. Позвоните нам: ' + company.phone + '.';
      }).then(function () {
        submit.disabled = false;
        submit.firstChild.textContent = submitLabel;
      });
    });
  }

  // ---------- Cookie banner ----------
  var cookie = document.querySelector('.cookie');
  if (cookie) {
    var accepted = false;
    try { accepted = localStorage.getItem('kapsula-cookie') === '1'; } catch (e) {}
    if (!accepted) cookie.classList.add('is-visible');
    cookie.querySelector('button').addEventListener('click', function () {
      try { localStorage.setItem('kapsula-cookie', '1'); } catch (e) {}
      cookie.classList.remove('is-visible');
    });
  }
})();
