/* ============================================================
   publications.js — Publications page interactions
   ============================================================

   · Scroll reveal
   · Collapsible abstracts
   · BibTeX modal (show / copy / close)
   · Language-aware label updates (reads aritra-lang from localStorage)
   ============================================================ */
(function () {
  'use strict';

  /* ── BibTeX data ─────────────────────────────────────────── */
  var BIBTEX = {
    1: {
      title: 'QINNs: Quantum-Informed Neural Networks',
      code: '@misc{bal2025qinnsquantuminformedneuralnetworks,\n  title  = {QINNs: Quantum-Informed Neural Networks},\n  author = {Aritra Bal and Markus Klute and Benedikt Maier and Melik Oughton and Eric Pezone and Michael Spannowsky},\n  year   = {2025},\n  eprint = {2510.17984},\n  archivePrefix = {arXiv},\n  primaryClass  = {hep-ph},\n  url    = {https://arxiv.org/abs/2510.17984}\n}'
    },
    2: {
      title: 'One Particle \u2013 One Qubit: Particle Physics Data Encoding for Quantum Machine Learning',
      code: '@article{bal2025,\n  title     = {One particle - one qubit: Particle physics data encoding for quantum machine learning},\n  author    = {Bal, Aritra and Klute, Markus and Maier, Benedikt and Oughton, Melik and Pezone, Eric and Spannowsky, Michael},\n  journal   = {Phys. Rev. D},\n  volume    = {112},\n  issue     = {7},\n  pages     = {076004},\n  year      = {2025},\n  month     = {Oct},\n  publisher = {American Physical Society},\n  doi       = {10.1103/l8y2-87vq},\n  url       = {https://link.aps.org/doi/10.1103/l8y2-87vq}\n}'
    },
    3: {
      title: 'Model-agnostic search for dijet resonances with anomalous jet substructure in proton\u2013proton collisions at \u221as\u202f=\u202f13\u202fTeV',
      code: '@article{cms2025modelagnostic,\n  doi       = {10.1088/1361-6633/add762},\n  url       = {https://dx.doi.org/10.1088/1361-6633/add762},\n  year      = {2025},\n  month     = {jun},\n  publisher = {IOP Publishing},\n  volume    = {88},\n  number    = {6},\n  pages     = {067802},\n  author    = {The CMS Collaboration},\n  title     = {Model-agnostic search for dijet resonances with anomalous jet substructure in proton\u2013proton collisions at sqrt{s} = 13 TeV},\n  journal   = {Reports on Progress in Physics}\n}'
    },
    4: {
      title: 'Distilling particle knowledge for fast reconstruction at high-energy physics experiments',
      code: '@article{Bal_2024,\n  doi       = {10.1088/2632-2153/ad43b1},\n  url       = {https://dx.doi.org/10.1088/2632-2153/ad43b1},\n  year      = {2024},\n  month     = {may},\n  publisher = {IOP Publishing},\n  volume    = {5},\n  number    = {2},\n  pages     = {025033},\n  author    = {Bal, A and Brandes, T and Iemmi, F and Klute, M and Maier, B and Mikuni, V and \u00c5rrestad, T K},\n  title     = {Distilling particle knowledge for fast reconstruction at high-energy physics experiments},\n  journal   = {Machine Learning: Science and Technology}\n}'
    },
    5: {
      title: 'Machine learning techniques for model-independent searches in dijet final states',
      code: '@techreport{Harris:2881089,\n  author      = {Harris, Philip and others and Bal, Aritra},\n  title       = {Machine learning techniques for model-independent searches in dijet final states},\n  institution = {CERN},\n  reportNumber = {CMS-NOTE-2023-013, CERN-CMS-NOTE-2023-013},\n  address     = {Geneva},\n  year        = {2023},\n  url         = {https://cds.cern.ch/record/2881089}\n}'
    },
    6: {
      title: 'From Information Geometry to Jet Substructure: A Triality of Cumulant Tensors, Energy Correlators, and Hypergraphs',
      code: '@misc{bal2026informationgeometryjetsubstructure,\n  title         = {From Information Geometry to Jet Substructure: A Triality of Cumulant Tensors, Energy Correlators, and Hypergraphs},\n  author        = {Aritra Bal and Markus Klute and Benedikt Maier and Michael Spannowsky},\n  year          = {2026},\n  eprint        = {2605.03063},\n  archivePrefix = {arXiv},\n  primaryClass  = {hep-ph},\n  url           = {https://arxiv.org/abs/2605.03063}\n}'
    }

  };

  /* ── Scroll reveal ───────────────────────────────────────── */
  var revealObs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function () {
            entry.target.classList.add('visible');
          }, i * 80);
          revealObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObs.observe(el);
  });

  /* ── Abstract toggles ────────────────────────────────────── */
  document.querySelectorAll('.pub-abstract-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var abstract = btn.previousElementSibling; /* .pub-card__abstract */
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      abstract.classList.toggle('expanded', !expanded);
      updateToggleLabel(btn, !expanded);
    });
  });

  function updateToggleLabel(btn, isExpanded) {
    var lang  = localStorage.getItem('aritra-lang') || 'en';
    var label = isExpanded
      ? (lang === 'de' ? 'Abstract ausblenden' : 'Hide abstract')
      : (lang === 'de' ? 'Abstract anzeigen'   : 'Show abstract');
    var span = btn.querySelector('[data-i18n]');
    if (span) span.textContent = label;
  }

  /* After lang.js fires, re-label any already-opened toggles */
  document.addEventListener('aritra:langChanged', function () {
    document.querySelectorAll('.pub-abstract-toggle').forEach(function (btn) {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      updateToggleLabel(btn, expanded);
    });
  });

  /* ── BibTeX modal ────────────────────────────────────────── */
  var modal   = document.getElementById('bibtexModal');
  var codeEl  = document.getElementById('bibtexCode');
  var titleEl = document.getElementById('bibtexTitle');
  var copyBtn = document.getElementById('bibtexCopy');
  var closeBtn = document.getElementById('bibtexClose');
  var closeBtnX = document.getElementById('bibtexCloseX');

  function openModal(id) {
    var entry = BIBTEX[id];
    if (!entry || !modal) return;
    titleEl.textContent = entry.title;
    codeEl.textContent  = entry.code;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Attach to all BibTeX buttons */
  document.querySelectorAll('[data-bibtex]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(parseInt(btn.getAttribute('data-bibtex')));
    });
  });

  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (closeBtnX) closeBtnX.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* Copy to clipboard */
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = codeEl.textContent;
      var lang = localStorage.getItem('aritra-lang') || 'en';
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = lang === 'de' ? 'Kopiert!' : 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.textContent = lang === 'de' ? 'In Zwischenablage kopieren' : 'Copy to clipboard';
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(function () {
        /* Fallback */
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    });
  }

})();
