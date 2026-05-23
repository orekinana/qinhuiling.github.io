/**
 * app.js — semantic-HTML decorator for qinhuiling.me
 * Content lives in index.html. This script handles interactions only.
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var m = html.className.match(/lang-(\w+)/);
  var currentLang = m ? m[1] : 'zh';
  var isDarkMode  = html.classList.contains('dark');

  /* ── language ───────────────────────────────────── */
  function applyLanguage(lang) {
    currentLang = lang;
    html.classList.remove('lang-zh', 'lang-en');
    html.classList.add('lang-' + lang);
    html.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = lang === 'zh' ? 'EN' : '中文';
    });
    updateMeta(lang);
  }

  function updateMeta(lang) {
    document.title = lang === 'en'
      ? 'Huiling Qin (秦慧玲) — Assistant Professor, Beijing Normal University'
      : '秦慧玲 — 北京师范大学助理教授';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.content = lang === 'en'
        ? 'Dr. Huiling Qin is an Assistant Professor at Beijing Normal University, specializing in spatiotemporal data mining, urban computing, and AI.'
        : '秦慧玲，北京师范大学人工智能与未来网络研究院助理教授，研究方向：时空数据挖掘、城市计算、人工智能。';
    }
  }

  function setupLangToggle() {
    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('language', next);
        history.pushState({ lang: next }, '', '/' + next + location.hash);
        applyLanguage(next);
      });
    });
  }

  /* ── theme ──────────────────────────────────────── */
  function applyTheme(dark) {
    isDarkMode = dark;
    html.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  function setupThemeToggle() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () { applyTheme(!isDarkMode); });
    });
  }

  /* ── smooth scroll for in-page anchors ──────────── */
  function setupSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', '#' + id);
    });
  }

  /* ── scroll spy ─────────────────────────────────── */
  function setupScrollSpy() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
    var links    = document.querySelectorAll('nav .nav-link');
    function update() {
      var y = window.scrollY + 120, current = '';
      for (var i = 0; i < sections.length; i++) {
        if (y >= sections[i].offsetTop) current = sections[i].id;
      }
      links.forEach(function (a) {
        a.classList.toggle('active', a.dataset.section === current);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── section link copy ──────────────────────────── */
  function setupSectionLinks() {
    document.querySelectorAll('.section-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var section = link.closest('section[id]');
        if (!section) return;
        var url = location.origin + '/' + currentLang + '#' + section.id;
        navigator.clipboard.writeText(url).then(function () {
          link.classList.add('copied');
          setTimeout(function () { link.classList.remove('copied'); }, 1800);
        }).catch(function () {});
      });
    });
  }

  /* ── bibtex copy ────────────────────────────────── */
  function setupBibtex() {
    document.querySelectorAll('.bibtex-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pre = btn.closest('details').querySelector('pre');
        if (!pre) return;
        navigator.clipboard.writeText(pre.textContent.trim()).then(function () {
          btn.classList.add('copied');
          setTimeout(function () { btn.classList.remove('copied'); }, 2000);
        }).catch(function () {});
      });
    });
  }

  /* ── reveal on scroll ───────────────────────────── */
  function setupReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── hash scroll on load ────────────────────────── */
  function handleHash() {
    if (!location.hash) return;
    var id = location.hash.slice(1);
    setTimeout(function () {
      var el = document.getElementById(id);
      if (el) {
        var top = el.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }, 80);
  }

  /* ── popstate ───────────────────────────────────── */
  window.addEventListener('popstate', function () {
    var lang = /^\/en/.test(location.pathname) ? 'en'
             : /^\/zh/.test(location.pathname) ? 'zh' : currentLang;
    if (lang !== currentLang) applyLanguage(lang);
  });

  /* ── init ───────────────────────────────────────── */
  function init() {
    applyLanguage(currentLang);
    applyTheme(isDarkMode);
    setupLangToggle();
    setupThemeToggle();
    setupSmoothScroll();
    setupScrollSpy();
    setupSectionLinks();
    setupBibtex();
    setupReveal();
    handleHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
