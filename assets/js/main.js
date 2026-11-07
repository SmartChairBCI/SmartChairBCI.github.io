/* SmartChair — interazioni dell'interfaccia (nessuna dipendenza) */
(function () {
  'use strict';

  var doc = document.documentElement;

  /* Header: più opaco dopo lo scroll */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Menu mobile */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var label = toggle.querySelector('.sr-only');
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (label) label.textContent = open ? label.dataset.labelClose : label.dataset.labelOpen;
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    window.matchMedia('(min-width: 881px)').addEventListener('change', function (mq) { if (mq.matches) setOpen(false); });
  }

  /* Comparsa degli elementi durante lo scroll */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 3, 2) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Diario: filtri per ricerca e per tipo di voce */
  var filters = document.querySelector('[data-filters]');
  var journal = document.querySelector('[data-journal]');
  if (filters && journal) {
    filters.hidden = false;
    var state = { project: '', kind: '' };
    var apply = function () {
      journal.querySelectorAll('.entry').forEach(function (entry) {
        var ok = (!state.project || entry.dataset.project === state.project) &&
                 (!state.kind || entry.dataset.kind === state.kind);
        entry.hidden = !ok;
        if (ok) entry.classList.add('is-visible');
      });
      // nasconde i mesi rimasti senza voci
      journal.querySelectorAll('[data-month]').forEach(function (month) {
        month.hidden = !month.querySelector('.entry:not([hidden])');
      });
    };
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter-project], [data-filter-kind]');
      if (!btn) return;
      var key = 'filterProject' in btn.dataset ? 'project' : 'kind';
      var attr = key === 'project' ? 'data-filter-project' : 'data-filter-kind';
      state[key] = btn.getAttribute(attr);
      btn.parentNode.querySelectorAll('[' + attr + ']').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      apply();
    });
  }

  /* Contatti: compone un'email precompilata (mailto) */
  var form = document.querySelector('[data-mailto-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var name = form.elements.name.value.trim();
      var subject = form.elements.subject.value.trim();
      var body = form.elements.body.value.trim();
      if (name) body += '\n\n— ' + name;
      window.location.href = 'mailto:' + form.dataset.email +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  }

  doc.classList.add('js-ready');
})();
