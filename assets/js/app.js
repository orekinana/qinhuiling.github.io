/**
 * app.js — Semantic HTML decorator for qinhuiling.github.io
 *
 * Content lives in index.html (both zh/en inline).
 * This script handles: language switching, dark mode, navigation UX, BibTeX copy.
 */
(function () {
  'use strict';

  var cls = document.documentElement.classList;
  var m = cls.value.match(/lang-(\w+)/);
  var currentLang = m ? m[1] : 'zh';
  var isDarkMode = cls.contains('dark');

  /* ───────── Language ───────── */

  function applyLanguage(lang) {
    currentLang = lang;
    cls.remove('lang-zh', 'lang-en');
    cls.add('lang-' + lang);
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
    ['lang-toggle', 'lang-toggle-mobile'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中文';
    });
    updatePageMeta(lang);
  }

  function updatePageMeta(lang) {
    document.title = lang === 'en'
      ? 'Huiling Qin (秦慧玲) - Assistant Professor, Beijing Normal University'
      : '秦慧玲 - 北京师范大学助理教授';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.content = lang === 'en'
        ? 'Dr. Huiling Qin is an Assistant Professor and Doctoral Supervisor at the Institute of Artificial Intelligence and Future Networks, Beijing Normal University, specializing in spatiotemporal data mining, urban computing, and artificial intelligence.'
        : '秦慧玲，北京师范大学人工智能与未来网络研究院助理教授、博士生导师，研究方向：时空数据挖掘、城市计算、人工智能。';
    }
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogTitle) ogTitle.content = document.title;
    if (ogDesc) ogDesc.content = desc ? desc.content : '';
    if (ogLocale) ogLocale.content = lang === 'en' ? 'en_US' : 'zh_CN';
  }

  function setupLangToggle() {
    ['lang-toggle', 'lang-toggle-mobile'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', function () {
        var newLang = currentLang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('language', newLang);
        history.pushState({ lang: newLang }, '', '/' + newLang + window.location.hash);
        applyLanguage(newLang);
      });
    });
  }

  /* ───────── Theme ───────── */

  function applyTheme(dark) {
    isDarkMode = dark;
    cls.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  function setupThemeToggle() {
    ['theme-toggle', 'theme-toggle-mobile'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', function () { applyTheme(!isDarkMode); });
    });
  }

  /* ───────── Mobile menu ───────── */

  function setupMobileMenu() {
    var toggle = document.getElementById('mobile-menu-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () { menu.classList.toggle('hidden'); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.add('hidden'); });
    });
  }

  /* ───────── Smooth scroll ───────── */

  function setupSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    });
  }

  /* ───────── Scroll spy ───────── */

  function setupScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var links = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', function () {
      var current = '';
      sections.forEach(function (s) {
        if (window.scrollY >= s.offsetTop - 100) current = s.id;
      });
      links.forEach(function (a) {
        var active = a.dataset.section === current;
        a.classList.toggle('text-[#2c4f7c]', active);
        a.classList.toggle('dark:text-blue-400', active);
        a.classList.toggle('font-semibold', active);
      });
    }, { passive: true });
  }

  /* ───────── Back to top ───────── */

  function setupBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 300;
      btn.classList.toggle('opacity-0', !show);
      btn.classList.toggle('invisible', !show);
      btn.classList.toggle('opacity-100', show);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ───────── Section link copy ───────── */

  function setupSectionLinks() {
    document.querySelectorAll('.section-link-icon').forEach(function (icon) {
      icon.addEventListener('click', function (e) {
        e.preventDefault();
        var section = icon.closest('section[id]');
        if (!section) return;
        var url = window.location.origin + '/' + currentLang + '#' + section.id;
        navigator.clipboard.writeText(url).then(function () {
          var orig = icon.innerHTML;
          icon.innerHTML = '✓';
          icon.classList.add('text-green-500', 'dark:text-green-400');
          setTimeout(function () {
            icon.innerHTML = orig;
            icon.classList.remove('text-green-500', 'dark:text-green-400');
          }, 2000);
        }).catch(function () {});
      });
    });
  }

  /* ───────── BibTeX copy ───────── */

  function setupBibtex() {
    document.querySelectorAll('[data-copy-bibtex]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var details = btn.closest('details');
        if (!details) return;
        var pre = details.querySelector('pre');
        if (!pre) return;
        var zhSpan = btn.querySelector('[lang="zh"]');
        var enSpan = btn.querySelector('[lang="en"]');

        function label(zh, en) {
          if (zhSpan) zhSpan.textContent = zh;
          if (enSpan) enSpan.textContent = en;
        }

        navigator.clipboard.writeText(pre.textContent.trim()).then(function () {
          label('已复制!', 'Copied!');
          btn.classList.add('text-green-600', 'border-green-400', 'dark:text-green-400', 'dark:border-green-600');
          setTimeout(function () {
            label('复制', 'Copy');
            btn.classList.remove('text-green-600', 'border-green-400', 'dark:text-green-400', 'dark:border-green-600');
          }, 3000);
        }).catch(function () {
          label('失败', 'Failed');
          setTimeout(function () { label('复制', 'Copy'); }, 2000);
        });
      });
    });
  }

  /* ───────── Initial hash scroll ───────── */

  function handleInitialHash() {
    var hash = window.location.hash;
    if (!hash) return;
    var id = hash.slice(1);
    setTimeout(function () {
      var el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    }, 200);
  }

  /* ───────── Popstate ───────── */

  window.addEventListener('popstate', function () {
    var path = window.location.pathname;
    var lang = /^\/en/.test(path) ? 'en' : /^\/zh/.test(path) ? 'zh' : currentLang;
    if (lang !== currentLang) applyLanguage(lang);
  });

  /* ───────── Init ───────── */

  function init() {
    applyLanguage(currentLang);
    applyTheme(isDarkMode);
    setupLangToggle();
    setupThemeToggle();
    setupMobileMenu();
    setupSmoothScroll();
    setupScrollSpy();
    setupBackToTop();
    setupSectionLinks();
    setupBibtex();
    handleInitialHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
