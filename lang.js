/* ============================================================
   lang.js — Bilingual (EN / DE) content switcher
   Dr. Aritra Bal — Personal Academic Website

   Include this script BEFORE main.js on every page.
   · [data-i18n]      → el.textContent is swapped (plain text)
   · [data-i18n-html] → el.innerHTML  is swapped (markup allowed)
   Language preference is persisted in localStorage as 'aritra-lang'.
   ============================================================ */
(function () {
  'use strict';

  /* ── Translation table ─────────────────────────────────── */
  var T = {

    /* ══════════════════ ENGLISH ══════════════════════════ */
    en: {
      /* Navbar — shared */
      'navbar.name':      'Dr. Aritra Bal, PhD',
      'navbar.title':     'Particle Physicist & ML Researcher',
      'nav.home':         'Home',
      'nav.about':        'About Me',
      'nav.research':     'Research',
      'nav.publications': 'Publications',

      /* Footer — shared */
      'footer.copy': '\u00a9 2026 Aritra Bal \u00a0\u00b7\u00a0 Karlsruhe Institute of Technology',

      /* ── index.html ───────────────────────────────────── */
      'hero.heading': 'I am\u00a0Aritra,<br/>a physicist at the<br/><em>Karlsruhe Institute<br/>of Technology.</em>',
      'hero.sub':     'I work at the intersection of fundamental physics and AI, developing novel methods in the search for new physics at high energy colliders, using machine learning and quantum computing.',
      'hero.btn':     'Find Out More',

      /* ── about.html ───────────────────────────────────── */
      'section.about': 'About Me',
      'about.intro':   'I work at the boundary where fundamental physics meets modern machine learning, building tools and methods that help us see deeper into the very fabric of matter. Below is a brief timeline of my career so far.',

      'tl1.date':  '2025 \u2014 Present',
      'tl1.badge': 'Current',
      'tl1.role':  'Postdoctoral Researcher',
      'tl1.place': 'Institute of Theoretical Physics (ITP) &amp; Institute of Experimental Particle Physics (ETP), KIT, Germany',
      'tl1.d1':    'I currently hold a joint postdoctoral position between the <strong>Institute of Experimental Particle Physics (ETP)</strong> and the <strong>Institute of Theoretical Physics (ITP)</strong> at KIT, working in the groups of <strong>Prof.\u00a0Dr.\u00a0Markus Klute</strong> and <a href="https://itp.kit.edu/~mspannow/" target="_blank" rel="noopener" class="inline-link">Prof.\u00a0Dr.\u00a0Michael Spannowsky</a>. I work on developing novel statistical and machine learning tools, including quantum machine learning, for a deeper understanding of jet substructure.',

      'tl2.date':  '2022 \u2014 2025',
      'tl2.role':  'Doctoral Researcher',
      'tl2.place': 'Institute of Experimental Particle Physics (ETP), KIT, Germany',
      'tl2.d1':    'My doctoral work explored the use of classical and quantum machine learning for discovering signatures of new physics at the Large Hadron Collider, with a particular focus on the CMS Detector. I was supervised by <a href="https://etpwww.etp.kit.edu/~klute/" target="_blank" rel="noopener" class="inline-link">Alexander von Humboldt Prof.\u00a0Dr.\u00a0Markus Klute</a> and <strong>Dr.\u00a0Benedikt Maier</strong> (Schmidt AI Fellow, Imperial College London).',
      'tl2.d2':    'I graduated with distinction, with my dissertation receiving the highest possible grade of <strong>summa cum laude</strong>, and I was subsequently nominated for both the <strong>KIT Doctoral Prize</strong> and the <strong>DPG Otto Haxel Prize</strong>.',

      'tl3.date':  '2017 \u2014 2022',
      'tl3.role':  'BSc (Hons.) and MSc in Physics',
      'tl3.place': 'Indian Institute of Technology Kharagpur (IIT KGP), India',
      'tl3.d1':    'I studied Physics in Kharagpur, the site of the very first Indian Institute of Technology established in 1952, over five years, graduating with a Master\u2019s degree. During this period I was a summer student at <strong>CERN</strong> (2020) and <strong>DESY</strong> (2021).',

      /* ── research.html ────────────────────────────────── */
      'section.research': 'Research',
      'research.heading': 'Current Work',
      'research.intro':   'My research sits at the intersection of quantum computing, machine learning, and experimental particle physics \u2014 developing new methods to push the boundaries of what we can discover at the LHC and beyond.',

      'tp1.index': 'The world need not be binary\u00a0\u2026',
      'tp1.title': 'Quantum &amp; Quantum-informed ML<br/><em>for High-Energy Physics</em>',
      'tp1.b1':    'Quantum computing offers a fundamentally different computational paradigm that may unlock new capabilities for analysing the extraordinarily complex datasets produced at collider experiments. My work in this area explores variational quantum circuits, hybrid classical–quantum architectures and quantum-informed machine learning, asking whether the performance of classical machine learning models can be <em>improved</em> by the usage of quantum circuit-based algorithms, and subsequently lead to a practical advantage for event classification and anomaly detection at the LHC. The fundamental unit of two-level quantum systems is the qubit, analogous to the classical bit but different in the sense that it can exist in superposition states. This allows quantum algorithms to explore a vastly larger state space than classical algorithms, which may be advantageous for learning complex correlations in data. You can experiment with a qubit visualiser tool <a href="bloch/index.html" target="_blank" rel="noopener" class="inline-link" style="color:#b0242a; border-color:#b0242a;">here</a>.',
      'tp1.tag1':  'Variational Quantum Circuits',
      'tp1.tag3':  'Quantum Informed Neural Networks',
      'tp1.tag4':  'Jet Substructure',

      'tp2.index': 'Must you always know what you are looking for?',
      'tp2.title': 'Unsupervised ML<br/><em>for New Physics Searches</em>',
      'tp2.b1':    'The Standard Model of particle physics is extraordinarily successful, yet we know it is incomplete. One of the most pressing challenges at the LHC is searching for signatures of new physics without knowing in advance precisely what we are looking for. Unsupervised and weakly-supervised machine learning methods are ideally suited to this task, enabling model-agnostic anomaly detection directly in collision data.',
      'tp2.b2':    'I develop and apply machine learning models that seek to identify events that deviate from Standard Model expectations, without relying on simulation-based signal assumptions that could bias the search.',
      'tp2.tag1':  'Anomaly Detection',
      'tp2.tag2':  'VAEs',
      'tp2.tag3':  'Jets',
      'tp2.tag4':  'Model-Agnostic Searches',

      /* ── publications.html ── */
      'section.works':  'Works',
      'section.publications': 'Publications',
      'pub.intro':    'A list of my publications (both published and in peer-review) along with a list of my talks at major international conferences.',
      'pub.tab.publications': 'Publications',
      'pub.tab.talks':        'Talks',
      't1.meta': 'LHCP 2026, Paris, France',
      't1.date': '19 May 2026',
      't2.meta': 'ML4Jets 2025, Caltech, Pasadena, USA',
      't2.date': '22 August 2025',
      't3.meta': 'EPS-HEP 2025, Marseille, France',
      't3.date': '9 July 2025',
      't4.meta': 'ML4Jets 2024, Paris, France',
      't4.date': '7 November 2024',
      'talks.footnote': 'And several talks at the annual DPG Spring Meetings, FSP CMS Annual Meetings and CMS Town Halls.',
      'pub.abstract.show': 'Show abstract',
      'pub.abstract.hide': 'Hide abstract',
      'pub.modal.heading': 'BibTeX Citation',
      'pub.modal.copy':    'Copy to clipboard',
      'pub.modal.close':   'Close',

      'p6.status': 'In peer-review',
      'p1.status': 'In peer-review',
      'p2.status': 'Published in <em>Physical Review D</em> &thinsp;&middot;&thinsp; IF&nbsp;9 &thinsp;&middot;&thinsp; <a href="https://indico.in2p3.fr/event/33627/contributions/155068/" target="_blank" rel="noopener" class="status-link">EPS HEP 2025</a> &thinsp;&middot;&thinsp; <a href="https://indico.cern.ch/event/1526677/contributions/6530881/" target="_blank" rel="noopener" class="status-link">ML4Jets 2025</a>',
      'p3.status': 'Published in <em>Reports on Progress in Physics</em> &thinsp;&middot;&thinsp; IF&nbsp;19 &thinsp;&middot;&thinsp; <a href="https://indico.cern.ch/event/1386125/contributions/6181748/" target="_blank" rel="noopener" class="status-link">ML4Jets 2024</a>',
      'p4.status': 'Published in <em>Machine Learning: Science and Technology</em>',
      'p5.status': 'In peer-review',

      'p6.abstract': 'Pairwise Fisher graphs capture local covariance information, but they cannot distinguish an irreducible multi-observable radiation pattern from a collection of ordinary pairwise correlations. We show that this missing structure is naturally supplied by higher-order Fisher tensors. In a finite basis of binned EECs, ECFs, or EFPs, and in the natural exponential-family coordinates generated by that basis, the same local tensor has three equivalent interpretations: a coefficient in the local Kullback-Leibler expansion, a connected cumulant of the chosen correlator observables, and a signed weight on a hyperedge linking those observables. This gives an exact Fisher-correlator-hypergraph triality in the local exponential-family embedding. The triality provides a direct construction of physics-informed hypergraphs from correlator data. Extending the quadratic Fisher matrix to the first non-trivial higher tensor identifies genuinely connected multi-observable radiation patterns, supplies hyperedge weights for higher-order Laplacians and message passing, and gives a principled criterion for compressing observable bases beyond pairwise information. We develop these constructions and spell out why the exact cumulant interpretation is special to natural exponential-family coordinates. We illustrate the framework in four applications. In a minimal local-KL study, the cubic Fisher tensor reduces the KL truncation error and isolates the dominant triplet structure. In a two-versus-three prong jet substructure benchmark, the hypergraph selector improves compressed-basis classification. In a 33-observable basis-design problem, the Fisher hypergraph retains more third-order local response at twelve observables. A low-capacity learning benchmark then shows how the same Fisher hyperedges can be used as an interpretable inductive bias for message passing on correlator observables.',
      'p1.abstract': 'Classical deep neural networks can learn rich multi-particle correlations in collider data, but their inductive biases are rarely anchored in physics structure. We propose quantum-informed neural networks (QINNs), a general framework that brings quantum information concepts and quantum observables into purely classical models. While the framework is broad, in this paper we study one concrete realisation that encodes each particle as a qubit and uses the Quantum Fisher Information Matrix (QFIM) as a compact, basis-independent summary of particle correlations. Using jet tagging as a case study, QFIMs act as lightweight embeddings in graph neural networks, increasing model expressivity and plasticity. The QFIM reveals distinct patterns for QCD and hadronic top jets that align with physical expectations. QINNs offer a practical, interpretable, and scalable route to quantum-informed analyses of particle collisions, particularly by enhancing well-established deep learning approaches.',
      'p2.abstract': 'We introduce 1P1Q, a novel quantum data encoding scheme for high-energy physics (HEP), where each particle is assigned to an individual qubit, enabling direct representation of collision events without classical compression. We demonstrate the effectiveness of 1P1Q in quantum machine learning (QML) through two applications: a Quantum Autoencoder (QAE) for unsupervised anomaly detection and a Variational Quantum Circuit (VQC) for supervised classification of top quark jets. The QAE successfully distinguishes signal jets from background QCD jets, achieving superior performance compared to a classical autoencoder while utilising significantly fewer trainable parameters. The VQC achieves competitive classification performance approaching state-of-the-art classical models despite minimal computational complexity. We additionally validate the QAE on real experimental data from the CMS detector, establishing the robustness of quantum algorithms in practical HEP applications.',
      'p3.abstract': 'This paper presents a model-agnostic search for narrow resonances in the dijet final state in the mass range 1.8\u20136\u202fTeV. The signal is assumed to produce jets with substructure atypical of jets initiated by light quarks or gluons, with minimal additional assumptions. A collection of complementary anomaly detection methods \u2014 based on unsupervised, weakly supervised, and semisupervised algorithms \u2014 are used to maximise the sensitivity to unknown new physics signatures. These algorithms are applied to data corresponding to an integrated luminosity of 138\u202ffb\u207b\u00b9 recorded by the CMS experiment at \u221as\u202f=\u202f13\u202fTeV. No significant excesses above background expectations are seen. The anomaly detection methods are found to significantly enhance the sensitivity to a variety of models relative to benchmark inclusive and substructure-based search strategies.',
      'p4.abstract': 'Knowledge distillation is a form of model compression that allows artificial neural networks of different sizes to learn from one another. We consider proton-proton collisions at the High-Luminosity LHC and demonstrate a successful knowledge transfer from an event-level graph neural network (GNN) to a particle-level small deep neural network (DNN). Our algorithm, DistillNet, is trained to predict whether a particle originates from the primary interaction vertex. The results show minimal loss during knowledge transfer to the student network while significantly improving computational resource requirements. This is demonstrated on a CPU and for a quantized and pruned student network deployed on an FPGA, proving the utility of this approach for fast AI in high-energy physics trigger stages.',
      'p5.abstract': 'We present the performance of machine learning-based anomaly detection techniques for extracting potential new physics phenomena in a model-agnostic way with the CMS experiment at the LHC. We introduce five distinct outlier detection or density estimation techniques \u2014 CWoLa, Tag N\u2019Train, CATHODE, QUAK, and QR-VAE \u2014 tailored for the identification of anomalous jets originating from the decay of unknown heavy particles. We demonstrate the utility of these approaches in enhancing the sensitivity to a wide variety of potential signals and assess their comparative performance in simulation.',
    },

    /* ══════════════════ GERMAN ════════════════════════════ */
    de: {
      /* Navbar */
      'navbar.name':      'Dr. rer. nat. Aritra Bal',
      'navbar.title':     'Teilchenphysiker & ML-Forscher',
      'nav.home':         'Startseite',
      'nav.about':        '\u00dcber mich',
      'nav.research':     'Forschung',
      'nav.publications': 'Publikationen',

      /* Footer */
      'footer.copy': '\u00a9 2026 Aritra Bal \u00a0\u00b7\u00a0 Karlsruher Institut f\u00fcr Technologie',

      /* ── index.html ───────────────────────────────────── */
      'hero.heading': 'Ich bin Aritra,<br/>Physiker am<br/><em>Karlsruher Institut<br/>f\u00fcr Technologie.</em>',
      'hero.sub':     'Meine Forschung liegt an der Schnittstelle von Grundlagenphysik und k\u00fcnstlicher Intelligenz. Ich entwickle neue Methoden zur Suche nach neuer Physik an Hochenergiebeschleunigern \u2014 mittels maschinellem Lernen und Quantencomputing.',
      'hero.btn':     'Mehr erfahren',

      /* ── about.html ───────────────────────────────────── */
      'section.about': '\u00dcber mich',
      'about.intro':   'Ich forsche an der Grenze zwischen fundamentaler Physik und modernem maschinellem Lernen und entwickle Methoden, die einen tieferen Einblick in die Grundbausteine der Materie erm\u00f6glichen. Nachfolgend ein kurzer \u00dcberblick \u00fcber meinen bisherigen wissenschaftlichen Werdegang.',

      'tl1.date':  '2025 \u2014 Heute',
      'tl1.badge': 'Aktuell',
      'tl1.role':  'Wissenschaftlicher Mitarbeiter (Postdoc)',
      'tl1.place': 'Institut f\u00fcr Theoretische Physik (ITP) &amp; Institut f\u00fcr Experimentelle Teilchenphysik (ETP), KIT, Deutschland',
      'tl1.d1':    'Derzeit halte ich eine gemeinsame Postdoktoranden-Stelle am <strong>Institut f\u00fcr Experimentelle Teilchenphysik (ETP)</strong> und am <strong>Institut f\u00fcr Theoretische Physik (ITP)</strong> des KIT inne und arbeite in den Gruppen von <strong>Prof.\u00a0Dr.\u00a0Markus Klute</strong> und <a href="https://itp.kit.edu/~mspannow/" target="_blank" rel="noopener" class="inline-link">Prof.\u00a0Dr.\u00a0Michael Spannowsky</a>. Meine Arbeit umfasst die Entwicklung neuartiger statistischer Methoden und Methoden des maschinellen Lernens, einschlie\u00dflich des Quanten-maschinellen Lernens, f\u00fcr ein tieferes Verst\u00e4ndnis der Jet-Substruktur.',

      'tl2.date':  '2022 \u2014 2025',
      'tl2.role':  'Doktorand',
      'tl2.place': 'Institut f\u00fcr Experimentelle Teilchenphysik (ETP), KIT, Deutschland',
      'tl2.d1':    'Meine Dissertation untersuchte den Einsatz von klassischem und Quanten-maschinellem Lernen zur Entdeckung von Signaturen neuer Physik am Large Hadron Collider, mit besonderem Fokus auf den CMS-Detektor. Ich wurde betreut von <a href="https://etpwww.etp.kit.edu/~klute/" target="_blank" rel="noopener" class="inline-link">Alexander-von-Humboldt-Prof.\u00a0Dr.\u00a0Markus Klute</a> und <strong>Dr.\u00a0Benedikt Maier</strong> (Schmidt AI Fellow, Imperial College London).',
      'tl2.d2':    'Ich schloss die Promotion mit Auszeichnung ab; meine Dissertation erhielt die Bestnote <strong>summa cum laude</strong>. Anschlie\u00dfend wurde ich sowohl f\u00fcr den <strong>KIT-Doktorandenpreis</strong> als auch f\u00fcr den <strong>DPG-Otto-Haxel-Preis</strong> nominiert.',

      'tl3.date':  '2017 \u2014 2022',
      'tl3.role':  'B.Sc. (Hons.) und M.Sc. in Physik',
      'tl3.place': 'Indian Institute of Technology Kharagpur (IIT\u00a0KGP), Indien',
      'tl3.d1':    'Ich studierte f\u00fcnf Jahre lang Physik in Kharagpur am ersten, 1952 gegr\u00fcndeten Indian Institute of Technology und schloss mit einem Masterabschluss ab. In dieser Zeit war ich Sommerstudent am <strong>CERN</strong> (2020) und am <strong>DESY</strong> (2021).',

      /* ── research.html ────────────────────────────────── */
      'section.research': 'Forschung',
      'research.heading': 'Aktuelle Forschung',
      'research.intro':   'Meine Forschung liegt an der Schnittstelle von Quantencomputing, maschinellem Lernen und experimenteller Teilchenphysik \u2014 mit dem Ziel, neue Methoden zu entwickeln, die die Grenzen des am LHC und dar\u00fcber hinaus Entdeckbaren erweitern.',

      'tp1.index': 'Die Welt muss nicht bin\u00e4r sein\u00a0\u2026',
      'tp1.title': 'Quanten- &amp; quanteninspiriertes ML<br/><em>f\u00fcr die Hochenergiephysik</em>',
      'tp1.b1':    'Quantencomputing bietet ein grundlegend anderes Rechenparadigma, das neue M\u00f6glichkeiten f\u00fcr die Analyse der au\u00dferordentlich komplexen Datens\u00e4tze von Kollisionsereignissen erschlie\u00dfen k\u00f6nnte. Meine Arbeit in diesem Bereich umfasst die Erforschung von variationellen Quantenschaltkreisen, hybriden klassischen-quantum Architekturen und quanteninspiriertem maschinellem Lernen. Dabei stelle ich die Frage, ob die Leistung klassischer maschineller Lernmodelle durch den Einsatz von Algorithmen auf Basis von Quanten-Schaltkreisen <em>verbessert</em> werden kann und ob dies zu einem praktischen Vorteil bei der Ereignisklassifizierung und Anomalieerkennung am LHC f\u00fchren kann. Die fundamentale Einheit von zwei-zust\u00e4ndigen Quantensystemen ist das Qubit, analog zum klassischen Bit, aber mit der Besonderheit, dass es sich in Superpositionszust\u00e4nden befinden kann. Dies erm\u00f6glicht es Quantenalgorithmen, einen weitaus gr\u00f6\u00dderen Zustandsraum zu erkunden als klassische Algorithmen, was f\u00fcr das Erlernen komplexer Korrelationen in Daten von Vorteil sein k\u00f6nnte. Sie k\u00f6nnen mit einem Qubit-Visualisierungstool <a href="bloch/index.html" target="_blank" rel="noopener" class="inline-link" style="color:#b0242a; border-color:#b0242a;">hier</a> experimentieren.',
      'tp1.tag1':  'Variationelle Quantenschaltkreise',
      'tp1.tag3':  'Quanteninspirierte Neuronale Netzwerke',
      'tp1.tag4':  'Jet-Substruktur',

      'tp2.index': 'Muss man immer wissen, wonach man sucht?',
      'tp2.title': 'Un\u00fcberwachtes ML<br/><em>f\u00fcr Suchen nach neuer Physik</em>',
      'tp2.b1':    'Das Standardmodell der Teilchenphysik ist au\u00dferordentlich erfolgreich \u2014 und dennoch wissen wir, dass es unvollst\u00e4ndig ist. Eine der dringlichsten Herausforderungen am LHC besteht darin, nach Signaturen neuer Physik zu suchen, ohne im Voraus genau zu wissen, wonach wir suchen. Un\u00fcberwachte und schwach \u00fcberwachte Methoden des maschinellen Lernens sind hierf\u00fcr besonders geeignet, da sie eine modell-agnostische Anomalieerkennung direkt in Kollisionsdaten erm\u00f6glichen.',
      'tp2.b2':    'Ich entwickle und wende tiefe generative Modelle an, um statistisch anomale Ereignisse zu identifizieren, die von den Erwartungen des Standardmodells abweichen \u2014 ohne dabei auf simulationsbasierte Signalannahmen zur\u00fcckzugreifen, die die Suche verzerren k\u00f6nnten.',
      'tp2.tag1':  'Anomalieerkennung',
      'tp2.tag2':  'VAEs',
      'tp2.tag3':  'Jets',
      'tp2.tag4':  'Modell-agnostische Suchen',

      /* ── publications.html ── */
      'section.works':  'Werke',
      'section.publications': 'Publikationen',
      'pub.tab.publications': 'Publikationen',
      'pub.tab.talks':        'Vorträge',
      'pub.intro':    'Eine Liste meiner Publikationen (veröffentlicht und im Peer-Review-Verfahren) sowie meiner Vorträge auf großen internationalen Konferenzen.',
      't1.meta': 'LHCP 2026, Paris, Frankreich',
      't1.date': '19. Mai 2026',
      't2.meta': 'ML4Jets 2025, Caltech, Pasadena, USA',
      't2.date': '22. August 2025',
      't3.meta': 'EPS-HEP 2025, Marseille, Frankreich',
      't3.date': '9. Juli 2025',
      't4.meta': 'ML4Jets 2024, Paris, Frankreich',
      't4.date': '7. November 2024',
      'talks.footnote': 'Sowie mehrere Vorträge bei den jährlichen DPG-Frühjahrstagungen, FSP-CMS-Jahrestagungen und CMS-Town-Halls.',
      'pub.abstract.show': 'Abstract anzeigen',
      'pub.abstract.hide': 'Abstract ausblenden',
      'pub.modal.heading': 'BibTeX-Zitat',
      'pub.modal.copy':    'In Zwischenablage kopieren',
      'pub.modal.close':   'Schlie\u00dfen',

      'p6.status': 'Im Peer-Review-Verfahren',
      'p1.status': 'Im Peer-Review-Verfahren',
      'p2.status': 'Ver\u00f6ffentlicht in <em>Physical Review D</em> &thinsp;&middot;&thinsp; IF&nbsp;9 &thinsp;&middot;&thinsp; <a href="https://indico.in2p3.fr/event/33627/contributions/155068/" target="_blank" rel="noopener" class="status-link">EPS HEP 2025</a> &thinsp;&middot;&thinsp; <a href="https://indico.cern.ch/event/1526677/contributions/6530881/" target="_blank" rel="noopener" class="status-link">ML4Jets 2025</a>',
      'p3.status': 'Ver\u00f6ffentlicht in <em>Reports on Progress in Physics</em> &thinsp;&middot;&thinsp; IF&nbsp;19 &thinsp;&middot;&thinsp; <a href="https://indico.cern.ch/event/1386125/contributions/6181748/" target="_blank" rel="noopener" class="status-link">ML4Jets 2024</a>',
      'p4.status': 'Ver\u00f6ffentlicht in <em>Machine Learning: Science and Technology</em>',
      'p5.status': 'Im Peer-Review-Verfahren',

      'p6.abstract': 'Paarweise Fisher-Graphen erfassen lokale Kovarianzinformation, k\u00f6nnen jedoch nicht zwischen einem irreduziblen Mehrfachobservablen-Strahlungsmuster und einer Sammlung gew\u00f6hnlicher paarweiser Korrelationen unterscheiden. Wir zeigen, dass diese fehlende Struktur auf nat\u00fcrliche Weise durch Fisher-Tensoren h\u00f6herer Ordnung bereitgestellt wird. In einer endlichen Basis gebinnter EECs, ECFs oder EFPs, und in den durch diese Basis erzeugten nat\u00fcrlichen Exponentialfamilien-Koordinaten, besitzt derselbe lokale Tensor drei \u00e4quivalente Interpretationen: einen Koeffizienten in der lokalen Kullback-Leibler-Entwicklung, ein verbundenes Kumulant der gew\u00e4hlten Korrelator-Observablen, und ein vorzeichenbehaftetes Gewicht auf einer Hyperkante, die diese Observablen verbindet. Dies ergibt eine exakte Fisher-Korrelator-Hypergraph-Trialit\u00e4t in der lokalen Exponentialfamilien-Einbettung. Die Trialit\u00e4t erm\u00f6glicht eine direkte Konstruktion physik-informierter Hypergraphen aus Korrelatordaten. Die Erweiterung der quadratischen Fisher-Matrix auf den ersten nicht-trivialen Tensor h\u00f6herer Ordnung identifiziert echte verbundene Mehrfachobservablen-Strahlungsmuster, liefert Hyperkanten-Gewichte f\u00fcr Laplace-Operatoren h\u00f6herer Ordnung und Message Passing, und gibt ein prinzipienbasiertes Kriterium zur Kompression von Observablen-Basen \u00fcber paarweise Information hinaus. Wir entwickeln diese Konstruktionen und erl\u00e4utern, warum die exakte Kumulanten-Interpretation in nat\u00fcrlichen Exponentialfamilien-Koordinaten besonders ist. Wir illustrieren das Framework anhand von vier Anwendungen. In einer minimalen lokalen KL-Studie reduziert der kubische Fisher-Tensor den KL-Abschneidefehler und isoliert die dominante Triplettstruktur. In einem Vergleichstest zur Jet-Substruktur mit zwei versus drei Strahlen verbessert der Hypergraph-Selektor die Klassifizierung in komprimierten Basen. In einem Basis-Design-Problem mit 33 Observablen beh\u00e4lt der Fisher-Hypergraph bei zw\u00f6lf Observablen mehr lokale Antwort dritter Ordnung. Ein Lernbenchmark mit geringer Kapazit\u00e4t zeigt schlie\u00dflich, wie dieselben Fisher-Hyperkanten als interpretierbarer induktiver Bias f\u00fcr Message Passing auf Korrelator-Observablen eingesetzt werden k\u00f6nnen.',
      'p1.abstract': 'Klassische tiefe neuronale Netzwerke k\u00f6nnen umfangreiche Mehrteilchen-Korrelationen in Kollisionsdaten erlernen, doch ihre induktiven Vorannahmen sind selten in physikalischen Strukturen verankert. Wir schlagen quanteninformierte neuronale Netzwerke (QINNs) vor, ein allgemeines Framework, das Konzepte der Quanteninformation und Quantenobservablen in rein klassische Modelle integriert. In dieser Arbeit untersuchen wir eine konkrete Realisierung, die jedes Teilchen als Qubit kodiert und die Quanten-Fisher-Informationsmatrix (QFIM) als kompakte, basisunabh\u00e4ngige Zusammenfassung von Teilchenkorrelationen verwendet. Anhand der Jet-Klassifizierung als Fallstudie fungieren QFIMs als leichtgewichtige Einbettungen in Graph-Neuronalen Netzwerken und erh\u00f6hen die Modellausdrucksf\u00e4higkeit. QINNs bieten einen praktischen, interpretierbaren und skalierbaren Weg zu quanteninformierten Analysen von Teilchenkollisionen.',
      'p2.abstract': 'Wir stellen 1P1Q vor, ein neuartiges Quantendatenkodierungsschema f\u00fcr die Hochenergiephysik, bei dem jedes Teilchen einem einzelnen Qubit zugeordnet wird und so eine direkte Darstellung von Kollisionsereignissen ohne klassische Kompression erm\u00f6glicht. Wir demonstrieren die Wirksamkeit von 1P1Q im Quanten-maschinellen Lernen anhand eines Quanten-Autoencoders (QAE) f\u00fcr unbeaufsichtigte Anomalieerkennung und eines Variationellen Quantenschaltkreises (VQC) f\u00fcr \u00fcberwachte Klassifizierung von Top-Quark-Jets. Der QAE \u00fcbertrifft einen klassischen Autoencoder bei deutlich weniger trainierbaren Parametern. Zus\u00e4tzlich validieren wir den QAE an realen Experimentaldaten des CMS-Detektors.',
      'p3.abstract': 'Diese Arbeit pr\u00e4sentiert eine modell-agnostische Suche nach schmalen Resonanzen im Dijet-Endzustand im Massenbereich 1,8\u20136\u202fTeV. Eine Sammlung komplement\u00e4rer Anomalieerkennungsmethoden \u2014 basierend auf un\u00fcberwachten, schwach \u00fcberwachten und halbbeaufsichtigten Algorithmen \u2014 wird eingesetzt, um die Sensitivit\u00e4t f\u00fcr unbekannte Signaturen zu maximieren. Die Algorithmen werden auf Daten einer integrierten Luminosit\u00e4t von 138\u202ffb\u207b\u00b9 des CMS-Experiments bei \u221as\u202f=\u202f13\u202fTeV angewendet. Es werden keine signifikanten \u00dcberschüsse beobachtet, und die Anomalieerkennungsmethoden erweisen sich im Vergleich zu Referenzstrategien als deutlich leistungsf\u00e4higer.',
      'p4.abstract': 'Wissensdestillation ist eine Form der Modellkompression, bei der neuronale Netzwerke unterschiedlicher Gr\u00f6\u00dfe voneinander lernen. Wir demonstrieren einen erfolgreichen Wissenstransfer von einem ereignisbasierten Graph-Neuronalen Netzwerk (GNN) zu einem kleinen tiefen neuronalen Netzwerk (DNN) f\u00fcr Proton-Proton-Kollisionen am HL-LHC. Unser Algorithmus DistillNet wird darauf trainiert vorherzusagen, ob ein Teilchen vom Prim\u00e4rvertex stammt. Die Ergebnisse zeigen minimalen Verlust beim Wissenstransfer bei deutlich reduziertem Ressourcenbedarf \u2014 demonstriert auf CPU und FPGA.',
      'p5.abstract': 'Wir pr\u00e4sentieren die Leistung maschinelles-Lernen-basierter Anomalieerkennungstechniken zur Extraktion potenzieller neuer Physik auf modell-agnostische Weise mit dem CMS-Experiment. Wir stellen f\u00fcnf Ausrei\u00dfererkennungs- und Dichteschätzungstechniken vor \u2014 CWoLa, Tag N\u2019Train, CATHODE, QUAK und QR-VAE \u2014 zur Identifizierung anomaler Jets aus dem Zerfall unbekannter schwerer Teilchen, und bewerten ihre vergleichende Leistung in der Simulation.',
    }
  };

  /* ── State ─────────────────────────────────────────────── */
  var lang = localStorage.getItem('aritra-lang') || ((navigator.language || navigator.userLanguage).startsWith('de') ? 'de' : 'en');

  /* ── Core apply function ────────────────────────────────── */
  function apply(l) {
    var t = T[l];
    if (!t) return;

    /* Plain-text swap */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (t[k] !== undefined) el.textContent = t[k];
    });

    /* HTML-content swap */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (t[k] !== undefined) el.innerHTML = t[k];
    });

    /* Re-sync data-date on about.html timeline entries (mobile CSS reads it) */
    document.querySelectorAll('.timeline__entry').forEach(function (entry) {
      var dateEl = entry.querySelector('.timeline__date');
      var bodyEl = entry.querySelector('.timeline__body');
      if (dateEl && bodyEl) bodyEl.setAttribute('data-date', dateEl.textContent.trim());
    });

    /* Update flag & code on the lang button */
    var flagEl = document.getElementById('langFlag');
    var codeEl = document.getElementById('langCode');
    if (flagEl) flagEl.src = 'icons/' + (l === 'en' ? 'uk' : 'de') + '.svg';
    if (codeEl) codeEl.textContent = l === 'en' ? 'EN' : 'DE';

    /* Update <html lang="…"> for accessibility / SEO */
    document.documentElement.lang = l === 'en' ? 'en' : 'de';

    /* Notify page-specific scripts */
    document.dispatchEvent(new CustomEvent('aritra:langChanged', { detail: { lang: l } }));
  }

  /* ── Init on DOM ready ──────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('langBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        lang = lang === 'en' ? 'de' : 'en';
        localStorage.setItem('aritra-lang', lang);
        apply(lang);
      });
    }
    apply(lang);
  });
})();
