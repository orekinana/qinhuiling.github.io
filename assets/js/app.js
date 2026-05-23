/**
 * app.js — interactions for qinhuiling.me
 *
 * The HTML body contains only content.  This script:
 *   · injects SVG icons (no SVG in body markup)
 *   · toggles language (zh ⇄ en) with URL + localStorage memory
 *   · toggles light / dark theme
 *   · smooth-scrolls in-page anchors with sticky-header offset
 *   · tracks the active section in the sidebar nav
 *   · switches between the default view and the dedicated
 *     "Publications" view (hash-routed: /publications)
 *   · animates BibTeX collapse/expand (grid-rows 0fr ⇄ 1fr)
 *   · copies BibTeX with a floating clipboard button
 *   · copies section-link with a § anchor
 *   · probes whether animations are running (some sandboxed
 *     iframes pause them) and gracefully degrades to instant.
 *
 * No third-party libraries.  No external network calls.
 */
(function () {
    'use strict';

    var html  = document.documentElement;
    var match = html.className.match(/lang-(\w+)/);
    var currentLang = match ? match[1] : 'zh';
    var isDark      = html.classList.contains('dark');


    /* ── 0.  SVG icons — injected into [data-icon] hosts ──────── */
    var ICONS = {
        pdf:
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M14 3v4a1 1 0 0 0 1 1h4"/>' +
                '<path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>' +
                '<path d="M9 13h6M9 17h4"/>' +
            '</svg>',
        bib:
            '<svg class="icon chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transition: transform .25s ease;">' +
                '<path d="M9 18l6-6-6-6"/>' +
            '</svg>',
        copy:
            '<svg class="icon ic-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<rect x="8" y="8" width="12" height="12" rx="2"/>' +
                '<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>' +
            '</svg>',
        check:
            '<svg class="icon ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M4 12.5l5 5L20 6.5"/>' +
            '</svg>',
        scholar:
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M12 3 2 9l10 6 10-6-10-6z"/>' +
                '<path d="M6 11.4V17c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-5.6"/>' +
                '<path d="M22 9v6"/>' +
            '</svg>',
        faculty:
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M3 20h18"/>' +
                '<path d="M5 20V8l7-4 7 4v12"/>' +
                '<path d="M9 20v-5h6v5"/>' +
                '<path d="M9 11h.01M15 11h.01"/>' +
            '</svg>',
        email:
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
                '<path d="M3 7l9 6 9-6"/>' +
            '</svg>',
        moon:
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>' +
            '</svg>',
        sun:
            '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<circle cx="12" cy="12" r="4"/>' +
                '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>' +
            '</svg>'
    };

    function injectIcons() {
        document.querySelectorAll('[data-icon]').forEach(function (el) {
            var kind = el.dataset.icon;
            if (kind === 'theme') return;   // handled separately
            var svg = ICONS[kind];
            if (svg && !el.querySelector('svg.icon')) {
                el.insertAdjacentHTML('afterbegin', svg);
            }
        });
        updateThemeIcon();
    }

    function updateThemeIcon() {
        var btn = document.querySelector('.theme-toggle');
        if (!btn) return;
        btn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    }


    /* ── 1.  Language ─────────────────────────────────────────── */
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
        if (!desc) return;
        desc.content = lang === 'en'
            ? 'Dr. Huiling Qin is an Assistant Professor at Beijing Normal University, working on spatiotemporal data mining, urban computing and AI.'
            : '秦慧玲，北京师范大学人工智能与未来网络研究院助理教授，研究方向：时空数据挖掘、城市计算、人工智能。';
    }

    function bindLanguageToggle() {
        var switching = false;
        var main = document.querySelector('main');
        document.querySelectorAll('.lang-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (switching) return;
                var next = currentLang === 'zh' ? 'en' : 'zh';
                try { localStorage.setItem('language', next); } catch (e) {}
                history.replaceState({ lang: next }, '', '/' + next + location.hash);

                switching = true;
                var oldH = main.offsetHeight;
                html.classList.add('lang-fade');

                setTimeout(function () {
                    main.style.height = oldH + 'px';
                    main.classList.add('lang-resize');
                    main.offsetHeight; // force reflow
                    applyLanguage(next);
                    var newH = main.scrollHeight;
                    main.style.height = newH + 'px';
                    html.classList.remove('lang-fade');

                    function done() {
                        main.classList.remove('lang-resize');
                        main.style.height = '';
                        switching = false;
                        main.removeEventListener('transitionend', done);
                    }
                    main.addEventListener('transitionend', done);
                    setTimeout(done, 350);
                }, 150);
            });
        });
    }


    /* ── 2.  Theme ────────────────────────────────────────────── */
    function applyTheme(dark) {
        isDark = dark;
        html.classList.toggle('dark', dark);
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
        updateThemeIcon();
    }

    function bindThemeToggle() {
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () { applyTheme(!isDark); });
        });
    }


    /* ── 3.  View switching (default ⇄ publications) ──────────── */
    function setView(name, opts) {
        var pub = name === 'publications';
        document.body.classList.toggle('view-publications', pub);
        // mark nav active state for the publications link
        document.querySelectorAll('nav a[data-view="publications"]').forEach(function (a) {
            a.classList.toggle('active-view', pub);
        });
        if (opts && opts.scroll) window.scrollTo({ top: 0, behavior: 'auto' });
        // Force-update scrollspy after view change
        spy.lastId = '';
        if (typeof pickSpy === 'function') pickSpy();
    }

    function bindViewLinks() {
        document.addEventListener('click', function (e) {
            var link = e.target.closest('a[data-view], button[data-view]');
            if (!link) return;
            e.preventDefault();
            var view = link.dataset.view;
            if (view === 'publications') {
                setView('publications', { scroll: true });
                history.replaceState(null, '', '#publications');
            } else {
                setView('default', { scroll: false });
                var target = link.getAttribute('href') || '#about';
                history.replaceState(null, '', target.startsWith('#') ? target : '#');
                scrollToHash(target);
            }
        });
        // initial state from URL hash
        if (location.hash === '#publications') setView('publications');
    }


    /* ── 4.  Smooth scroll for in-page anchors ────────────────── */
    function scrollToHash(hash) {
        var id = (hash || '').replace(/^#/, '');
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        var top = target.getBoundingClientRect().top + window.scrollY - 18;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function bindSmoothScroll() {
        document.addEventListener('click', function (e) {
            // Skip if a data-view handler already swallowed the click.
            var v = e.target.closest('[data-view]');
            if (v) return;
            var link = e.target.closest('a[href^="#"]');
            if (!link) return;
            var id = link.getAttribute('href').slice(1);
            if (!id) return;
            var target = document.getElementById(id);
            if (!target) return;
            // If we're currently in publications view and the user clicked
            // a non-publications nav link, switch back to the default view
            // before scrolling.
            if (document.body.classList.contains('view-publications')
                && id !== 'publications') {
                setView('default');
                history.replaceState(null, '', '#' + id);
            }
            e.preventDefault();
            scrollToHash('#' + id);
            history.replaceState(null, '', '#' + id);
        });
    }


    /* ── 5.  Scroll-spy (active nav link) ──────────────────────
       Uses IntersectionObserver with a tall horizontal "spotlight"
       band near the top of the viewport.  The first section
       intersecting the band (in document order) is the active one.
       A bottom-of-page detector pins the last section as active
       once the reader has scrolled to the absolute end — so short
       trailing sections like Lab can still light up.
       Each marker simply fades opacity/scaleX from CSS, so multiple
       transitions don't fight; no race, no flicker. */
    var spy = { sections: [], links: [], visible: null, lastId: '', io: null };

    function setupScrollSpy() {
        spy.sections = Array.prototype.slice.call(
            document.querySelectorAll('main > section[id]:not(.view)')
        );
        spy.links = Array.prototype.slice.call(document.querySelectorAll('nav a'));
        if (!spy.sections.length || !spy.links.length) return;

        spy.visible = new Set();
        if ('IntersectionObserver' in window) {
            spy.io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) spy.visible.add(e.target.id);
                    else spy.visible.delete(e.target.id);
                });
                pickSpy();
            }, {
                // Spotlight stripe: from 18% to 60% of viewport height.
                rootMargin: '-18% 0% -40% 0%',
                threshold: 0
            });
            spy.sections.forEach(function (s) { spy.io.observe(s); });
        }

        // Bottom-of-page sentinel — runs on every scroll, cheaply.
        window.addEventListener('scroll', requestBottomCheck, { passive: true });
        window.addEventListener('resize', requestBottomCheck);
        pickSpy();
    }

    var bottomRaf = 0;
    function requestBottomCheck() {
        if (bottomRaf) return;
        bottomRaf = requestAnimationFrame(function () { bottomRaf = 0; pickSpy(); });
    }

    function pickSpy() {
        if (document.body.classList.contains('view-publications')) {
            setActive('publications');
            return;
        }
        // 1. At the very bottom of the page, lock to the last section.
        var docH = document.documentElement.scrollHeight;
        var winB = window.scrollY + window.innerHeight;
        if (winB >= docH - 6) {
            setActive(spy.sections[spy.sections.length - 1].id);
            return;
        }
        // 2. Otherwise: first section in document order whose top is
        //    inside the spotlight band.
        var firstVisible = '';
        for (var i = 0; i < spy.sections.length; i++) {
            if (spy.visible.has(spy.sections[i].id)) {
                firstVisible = spy.sections[i].id;
                break;
            }
        }
        // 3. Fallbacks: above all sections → first; below all → last.
        if (!firstVisible) {
            var y = window.scrollY;
            if (y < spy.sections[0].offsetTop) firstVisible = spy.sections[0].id;
            else firstVisible = spy.lastId || spy.sections[0].id;
        }
        setActive(firstVisible);
    }

    function setActive(id) {
        if (id === spy.lastId) return;
        spy.lastId = id;
        spy.links.forEach(function (a) {
            var isView = a.dataset.view === 'publications';
            var match = isView ? (id === 'publications') : (a.dataset.section === id);
            a.classList.toggle('active', match);
        });
    }


    /* ── 6.  Section anchor (§) copies a deep link ───────────── */
    function bindSectionAnchors() {
        document.querySelectorAll('.anchor').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var sec = a.closest('section[id]');
                if (!sec) return;
                var url = location.origin + '/' + currentLang + '#' + sec.id;
                copyText(url, function () { flash(a, 'copied'); });
            });
        });
    }


    /* ── 6b. Email copy-to-clipboard ─────────────────────────── */
    function bindEmailCopy() {
        var link = document.querySelector('.elsewhere a[data-icon="email"]');
        if (!link) return;
        var emailSvg = ICONS.email;
        var copying = false;

        link.addEventListener('mouseenter', function () {
            if (!copying) link.innerHTML = ICONS.copy;
        });
        link.addEventListener('mouseleave', function () {
            if (!copying) link.innerHTML = emailSvg;
        });
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var href = link.getAttribute('href') || '';
            var addr = href.replace(/^mailto:/, '').replace(/#/g, '@');
            copyText(addr, function () {
                copying = true;
                link.innerHTML = ICONS.check;
                link.classList.add('copied');
                setTimeout(function () {
                    copying = false;
                    link.innerHTML = emailSvg;
                    link.classList.remove('copied');
                }, 1800);
            });
        });
    }


    /* ── 7.  BibTeX expand / collapse with smooth height tween ── */
    function bindBibtex() {
        document.querySelectorAll('button[data-bibtex]').forEach(function (btn) {
            btn.setAttribute('aria-expanded', 'false');
            // Wire to the next .bibtex sibling at the article level.
            var pub = btn.closest('.pub');
            if (!pub) return;
            var box = pub.querySelector('.bibtex');
            if (!box) return;
            box.setAttribute('data-open', 'false');

            // Wrap the <pre> in a .bibtex-inner so the grid-rows
            // collapse clips the pre + its padding cleanly (no
            // background slit when closed).
            var pre = box.querySelector('pre');
            if (pre && !box.querySelector('.bibtex-inner')) {
                var inner = document.createElement('div');
                inner.className = 'bibtex-inner';
                box.insertBefore(inner, pre);
                inner.appendChild(pre);

                // Inject a floating Copy button into the inner wrapper.
                var copy = document.createElement('button');
                copy.type = 'button';
                copy.className = 'copy';
                copy.setAttribute('aria-label', 'Copy BibTeX');
                copy.innerHTML = ICONS.copy + ICONS.check;
                copy.addEventListener('click', function () {
                    copyText(pre.textContent.trim(), function () { flash(copy, 'copied', 1800); });
                });
                inner.appendChild(copy);
            }

            btn.addEventListener('click', function () {
                var open = box.getAttribute('data-open') === 'true';
                btn.setAttribute('aria-expanded', open ? 'false' : 'true');
                box.setAttribute('data-open', open ? 'false' : 'true');
            });
        });
    }


    /* ── 8.  Animation capability probe ───────────────────────── */
    function probeAnimations() {
        try {
            var style = document.createElement('style');
            style.id = '__anim_probe_style__';
            style.textContent =
                '@keyframes __probe__ { from { opacity: 0; } to { opacity: 1; } } ' +
                '#__probe__ { opacity: 0; animation: __probe__ 30ms linear forwards; }';
            document.head.appendChild(style);
            var probe = document.createElement('div');
            probe.id = '__probe__';
            probe.style.cssText = 'position:fixed; left:-9999px; top:0; width:1px; height:1px;';
            document.body.appendChild(probe);
            setTimeout(function () {
                var opacity = parseFloat(getComputedStyle(probe).opacity);
                if (!isFinite(opacity) || opacity < 0.5) {
                    html.classList.add('no-anim');
                    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
                }
                probe.remove(); style.remove();
            }, 120);
        } catch (e) {}
    }


    /* ── 9.  Reveal-on-scroll ─────────────────────────────────── */
    function setupReveal() {
        var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
        if (!els.length) return;
        function inViewport(el) {
            var r = el.getBoundingClientRect();
            return r.top < window.innerHeight * 0.94 && r.bottom > 0;
        }
        function check() {
            for (var i = els.length - 1; i >= 0; i--) {
                if (inViewport(els[i])) { els[i].classList.add('in'); els.splice(i, 1); }
            }
        }
        check();
        var raf = 0;
        function onScroll() {
            if (raf) return;
            raf = requestAnimationFrame(function () { raf = 0; check(); });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
                });
            }, { threshold: 0.04, rootMargin: '0px 0px -4% 0px' });
            els.forEach(function (el) { io.observe(el); });
        }
    }


    /* ── 10.  Hash scroll on load ─────────────────────────────── */
    function handleHash() {
        if (!location.hash) return;
        if (location.hash === '#publications') { setView('publications'); return; }
        setTimeout(function () { scrollToHash(location.hash); }, 60);
    }


    /* ── 11.  Popstate (back / forward) ───────────────────────── */
    window.addEventListener('popstate', function () {
        var lang = /^\/en/.test(location.pathname) ? 'en'
                 : /^\/zh/.test(location.pathname) ? 'zh' : currentLang;
        if (lang !== currentLang) applyLanguage(lang);
        if (location.hash === '#publications') setView('publications', { scroll: true });
        else setView('default');
    });


    /* ── 12.  Helpers ─────────────────────────────────────────── */
    function copyText(text, ok) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text, ok); });
        } else {
            fallbackCopy(text, ok);
        }
    }
    function fallbackCopy(text, ok) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed; opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            ok && ok();
        } catch (e) {}
    }
    function flash(el, cls, ms) {
        el.classList.add(cls);
        setTimeout(function () { el.classList.remove(cls); }, ms || 1800);
    }


    /* ── 13.  Populate recent-papers as a slice of #publications ─ */
    var RECENT_COUNT = 10;

    function populateRecentPapers() {
        var recent = document.getElementById('papers');
        var full   = document.getElementById('publications');
        if (!recent || !full) return;
        var pubs = Array.prototype.slice.call(full.querySelectorAll(':scope > .pub'), 0, RECENT_COUNT);
        var more = recent.querySelector('.more');
        pubs.forEach(function (pub) {
            var clone = pub.cloneNode(true);
            recent.insertBefore(clone, more);
        });
    }


    /* ── 14.  Init ────────────────────────────────────────────── */
    function init() {
        populateRecentPapers();
        injectIcons();
        applyLanguage(currentLang);
        applyTheme(isDark);
        bindLanguageToggle();
        bindThemeToggle();
        bindViewLinks();
        bindSmoothScroll();
        bindSectionAnchors();
        bindEmailCopy();
        bindBibtex();
        probeAnimations();
        setupReveal();
        setupScrollSpy();
        handleHash();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
