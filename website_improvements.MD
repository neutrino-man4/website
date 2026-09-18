# Website Improvement Recommendations

**Site reviewed:** `/web/abal/public_html` — static HTML/CSS/JS, no build step. Reviewed: `index.html`, `about.html`, `research.html`, `publications.html`, `projects/index.html`, `projects/1P1Q/index.html`, `projects/quiver/index.html`, `bloch/index.html`, `style.css`, `about.css`, `research.css`, `publications.css`, `lang.js`, `main.js`, `about.js`, `research.js`, `publications.js`, `plots/index.php`, `plots/view.php`, `robots.txt`, `.htaccess`, `README.md`.

A quick framing: the core design is genuinely good — the sage/cream palette with Cormorant Garamond + DM Sans is a coherent, unusually tasteful choice for an academic site, and the publications page in particular is well built (tabs, collapsible abstracts, BibTeX modal with clipboard fallback). Most of what follows is about (a) content that a faculty-market postdoc needs and doesn't have, and (b) places where the design system has drifted between the five pages rather than places where it's wrong.

---

## 0. Bugs found while reading — fix these first

These aren't suggestions, they're defects. Listing them separately so they don't get buried.

| # | Issue | Evidence | Priority |
|---|---|---|---|
| 0.1 | **The email link in the footer is broken on all five main pages.** The `href` is `mailto:aritra.bal@dont-spam-kit.edu` and the label is a Cloudflare email-obfuscation artefact (`<span class="__cf_email__" data-cfemail="…">`). The site is not served through Cloudflare, so no decoder script ever runs and the placeholder address is what a visitor's mail client receives. | `index.html:109-111`, `about.html:158-160`, `research.html:170-172`, `publications.html:443`, `projects/index.html:288`. Note `projects/1P1Q/index.html:458` and `projects/quiver/index.html:480` use the correct `aritra.bal@kit.edu`. | **High** |
| 0.2 | **`.section-label` is defined only in `about.css`, but `publications.html` uses it and never loads `about.css`.** The "Works" label on the publications page renders as a default 16px black paragraph instead of the uppercase, letter-spaced sage label. Publications is the page most visitors land on from a paper. | `about.css:16`, `publications.html:49` (loads only `style.css` + `publications.css`) | **High** |
| 0.3 | **Long abstracts are silently truncated on mobile.** `.pub-card__abstract.expanded` caps at `max-height: 800px` with `overflow: hidden`. The Triality (`p6`) and QUIVER (`p7`) abstracts are ~2,000 characters; at a 390px viewport (≈42 chars/line, 26px line-height) they need ~1,300px. Roughly the last third of both abstracts is unreachable on a phone, with no visual cue that content is missing. | `publications.css:245-249` | **High** |
| 0.4 | **`.pub-status { white-space: nowrap }` on a status pill that contains a full sentence plus two links.** The `p2.status` string ("Published in *Physical Review D* · IF 9 · EPS HEP 2025 · ML4Jets 2025") cannot wrap; combined with `body { overflow-x: hidden }` in `style.css:39` it is clipped off-screen on narrow viewports. | `publications.css:175`, `lang.js:108` | **High** |
| 0.5 | **`projects/index.html` never loads `lang.js`.** It carries `data-i18n` attributes and a `.lang-btn`, but the button has no `id="langBtn"` and no script is bound — it's a dead control. A German-reading visitor loses their language on entering the Projects section and gets no way back. | `projects/index.html:189-192, 307` (only `../main.js`) | **High** |
| 0.6 | **The HTML defaults on `research.html` disagree with the EN strings in `lang.js`, and `lang.js` always overwrites them on load.** The markup shows tags "Autoencoders" / "Normalising Flows"; `lang.js` EN has `'tp2.tag2': 'VAEs'`, `'tp2.tag3': 'Jets'`. Similarly `tp1.b1` in `lang.js` is two sentences longer than the markup. Result: a visible flash-of-wrong-content and two sources of truth for the same copy. | `research.html:130-131` vs `lang.js` EN block | **Medium** |
| 0.7 | **A hard-coded crimson inline style inside a translation string.** `'tp1.b1'` (both EN and DE) ends with `<a … class="inline-link" style="color:#b0242a; border-color:#b0242a;">here</a>`. Because `lang.js` always runs, this red arXiv-brand link to the Bloch visualiser is what everyone actually sees on the Research page — the only non-sage link colour on the whole site. | `lang.js`, EN and DE `tp1.b1` | **Medium** |
| 0.8 | **Leftover template placeholders in project-page metadata.** `projects/quiver/index.html:45` — `citation_pdf_url` = `https://YOUR_DOMAIN.com/static/pdfs/QUIVER_ICML.pdf`; line 297 — Organization `logo` = `https://YOUR_DOMAIN.com/…`. Google Scholar uses `citation_pdf_url` for full-text indexing, so this is a silently lost indexing opportunity. `og:description` and `twitter:description` are also empty strings on both project pages (`quiver:19,32`; `1P1Q:19,32`), so link previews show a title and nothing else. | as cited | **Medium** |
| 0.9 | Stray unmatched `</div>` in the PhD timeline entry. | `about.html:110-112` (body, entry, then a third orphan) | Low |
| 0.10 | `robots.txt` has two malformed directives — `Disallow /icons/` and `Disallow /images/` are missing the colon, so crawlers ignore them. There is also no `Sitemap:` line. | `robots.txt:5-6` | Low |
| 0.11 | DistillNet entry bolds a co-author instead of the site owner: `Aritra Bal, <strong>Tristan Brandes</strong>, …`, breaking the self-bolding convention used in every other entry. | `publications.html:239` | Low |

---

## 1. Possible new additions

### 1.1 A downloadable CV — **High**
There is no CV link anywhere on the visitor-facing site. `share/BAL_CV.pdf` and `share/cv_march_2025.pdf` exist but sit behind HTTP Basic auth (`share/.htaccess`, `AuthUserFile /web/abal/.passwd`). For a postdoc who is plausibly on the faculty/fellowship market, the CV is the single highest-value artefact on an academic homepage and it's currently unreachable. Add a public, dated PDF (e.g. `cv/Bal_CV_2026-09.pdf`) linked from the navbar or the About page header, with the date visible in the link text so visitors know it's current.

### 1.2 ORCID, and deeper ID integration — **High**
The footer links GitHub, Google Scholar, INSPIRE-HEP (`https://inspirehep.net/authors/1809400`) and email — but **no ORCID**. ORCID is required by essentially every European grant and faculty application system, and by most HEP journals. It's the one identifier a hiring committee or funder actually resolves. Add it to the footer set, and mark it up with `rel="me"` plus a `sameAs` array in a Person JSON-LD block (see 1.6).

Secondary depth, both **Medium**: (a) per-paper INSPIRE record links — the site has arXiv/DOI/PDF/BibTeX but no INSPIRE literature links, which is how HEP colleagues actually check citation counts; (b) an arXiv author-search link.

### 1.3 A talks page that stands on its own — **Medium**
The Talks tab in `publications.html` is good and already carries 8 entries with Indico links, but it's structurally a second-class citizen: it lives inside the Publications page, has no deep link (no `#talks` hash handling in `publications.js`), and a shared URL always opens on the Publications tab. Two concrete fixes: add hash routing (`publications.html#talks`) so the tab state is linkable, and separate *invited/plenary* from *contributed* talks — that distinction is what search committees read for, and right now an LHCP plenary and a parallel-session talk look identical. A dedicated `talks.html` becomes worthwhile once the list passes ~15 entries.

### 1.4 Teaching, supervision and service — **Medium**
Completely absent. `about.html` is a three-entry career timeline and nothing more. For a physics postdoc this omits the section German faculty committees weigh most heavily after publications: lectures/tutorials taught, Bachelor/Master students supervised (the QUIVER author list includes Michael Binder — presumably a student), referee work, and conference/workshop organisation. A short "Teaching & Mentoring" section appended to the About timeline, or a fourth nav item, would cost little and close a real gap.

### 1.5 A software/code index — **Medium**
Three distinct GitHub repos are referenced (`neutrino-man4/quiver-2a2q`, `neutrino-man4/qGNN`, plus the profile), but only ever as small pills buried in individual publication cards. There is no page that answers "what code has this person released?". Given that half the stated research identity is methods development, a `software.html` (or a section on the Projects page) listing repo, one-line purpose, language, licence and the paper it backs would materially help reuse. Low effort — the data already exists.

### 1.6 Structured data and social metadata on the four main pages — **Medium**
The two project pages have a full metadata stack (description, keywords, Open Graph, Twitter cards, Highwire `citation_*` tags, `ScholarlyArticle` + `Organization` JSON-LD). The four main pages have **none of it** — no `description`, no OG, no Twitter card, no JSON-LD, no canonical. So the pages that represent the person are invisible to link previews while the pages about individual papers are well covered. Add, at minimum:
- `<meta name="description">` per page;
- OG + `twitter:card` with the portrait (`images/portrait.jpeg`) as `og:image` — currently sharing the homepage in Slack/Mastodon/Bluesky yields a bare URL;
- a `Person` JSON-LD block on `index.html` with `name`, `jobTitle`, `affiliation` (ITP + IQMT, KIT), `url`, and `sameAs: [ORCID, Scholar, INSPIRE, GitHub]`. This is what makes a Google Knowledge-panel-style result possible for an individual researcher.

### 1.7 Descriptive `<title>` tags — **Medium**
`about.html` is titled just `About`, `research.html` just `Research`, `publications.html` just `Publications`, `projects/index.html` just `Projects`. In a search result or a tab strip these are anonymous. Use `About — Dr. Aritra Bal` etc. Trivial fix, real SEO/UX return.

### 1.8 `sitemap.xml` — **Low**
Doesn't exist, and `robots.txt` has no `Sitemap:` directive. With ~10 crawlable HTML pages a hand-written sitemap is 20 lines and helps the canonical ITP copy get indexed cleanly.

### 1.9 A news/updates line — **Low–Medium**
No news feed. Given the cadence visible in `git log` (four talks added in the last handful of commits), a 5-item "Recent" list on the homepage — *"Sep 2026 — talk at ML4Jets, Vienna"*, *"Jun 2026 — QUIVER preprint out"* — would show the site is alive and give visitors a reason to return. This is a better fit than a full blog, which would go stale.

### 1.10 Surface the two hidden interactive assets — **Medium**
`bloch/` (a genuinely nice qubit visualiser) is reachable only from one inline link buried mid-paragraph in a Research topic body, and `interactive/1P1Q/` is linked from nowhere at all. Both are distinctive, demonstrate exactly the quantum/ML intersection the site claims, and are currently invisible. `bloch/index.html` also has no link back to the main site — it's a navigational dead end. Promote both to the Projects grid.

---

## 2. Aesthetic improvements and better setup

The visual language is consistent *within* each page and inconsistent *between* them. These are the concrete drifts.

### 2.1 Four different content widths, and one unbounded — **High**
- `.about-page`: `max-width: 900px`, padding `clamp(1.5rem, 10vw, 12rem)` → ~612px of text on a 1440px screen (`about.css:7-13`)
- `.pub-page`: `max-width: 980px`, padding `clamp(1.5rem, 8vw, 8rem)` → ~750px (`publications.css:7-14`)
- `.research-page`: `max-width: 1200px`, padding `clamp(1.5rem, 8vw, 8rem)` → ~970px (`research.css:6-12`)
- `.projects-main`: **no max-width at all** — the 2-column card grid stretches edge-to-edge on a 2560px monitor (`projects/index.html:13-20`)

Navigating About → Research → Publications makes the content column visibly jump left and right on every click. Fix: define `--content-max` and `--page-pad` tokens in `style.css:7-26` (which already holds `--nav-h`, `--radius`, `--transition`) and have all four pages consume them. Pick one measure — ~70ch for prose pages, wider only where the research carousel genuinely needs it.

### 2.2 Four different page-header treatments — **High**
- Home: `<h1 class="hero__heading">`, serif, up to 3.1rem, with an italic sage `<em>`
- About: no `<h1>` at all — a `<p class="section-label">` (1.25rem, uppercase, 0.18em tracking) acts as the title
- Research: `<h1 class="research-header__heading">`, serif, up to 3.2rem
- Publications: no `<h1>` — another `.section-label`, which as noted in 0.2 isn't even styled there
- Projects: label + `<h1 class="projects-title">` serif — a *third* variant of the label+title pattern, with its own class names

Pick one: small uppercase eyebrow label + serif `<h1>` + muted intro paragraph, exactly as the Projects page does it, and apply it everywhere. Note that `.about-header__heading` (`about.css:31-44`) and `.pub-header__heading` (`publications.css:22-29`) are already written and **completely unused** — the intended design is in the CSS, the markup just never adopted it.

### 2.3 Five breakpoint sets — **Medium**
`style.css` breaks at 900/640; `about.css` at 768; `research.css` at 860/480; `publications.css` at 640; `projects/index.html` at 720/640; the Bulma project pages at 768. Between 768px and 860px, for instance, the About timeline has already collapsed to its mobile grid while Research is still two-column. Standardise on three values (e.g. 640 / 860 / 1200) as documented constants.

### 2.4 The navbar overflows between 641px and ~780px — **Medium**
`.navbar__links { display: none }` and `.hamburger { display: flex }` only kick in at `max-width: 640px` (`style.css:502-505`). At 700px the navbar must fit brand (~200px) + four uppercase links with `gap: 2.4rem` (~430px) + the language pill (~70px) + horizontal padding — roughly 750px of content in a 700px bar. On a small tablet or a landscape phone the nav crushes or clips. Raise the hamburger breakpoint to ~860px to match the other layout collapses.

Related: `.mobile-nav.open { max-height: 260px }` (`style.css:187`) fits exactly the current four items at ~56px each. Adding the "Projects" link recommended in 2.6 will clip it. Use a generous value or `max-height: 100vh`.

### 2.5 Two-thirds of a dead carousel — **Medium**
`research.js` is well written, but the UX has gaps: it auto-advances every 3,500ms and pauses only on `mouseenter` of the track — not on keyboard focus, not on touch, and with no pause control. The slides carry alt text `'Research plot ' + (i+1)` (`research.js:56`), which tells a screen-reader user nothing and gives a sighted visitor no caption either. These are real research plots from real papers; a one-line caption per slide ("QFIM patterns for QCD vs. top jets") would turn decorative motion into actual scientific content. Also, the square `aspect-ratio: 1/1` track with `object-fit: contain` (`research.css:136-170`) letterboxes wide ROC-curve plots into a lot of empty cream — consider `4/3`.

### 2.6 Projects is not in the navigation — **High**
The Projects index is reachable only via the homepage "Find Out More" CTA (`index.html:71`). It isn't in the navbar or the mobile drawer on *any* page, including its own, and the project detail pages link back only to the four main pages — never to `projects/index.html` or to each other. Someone who arrives at `projects/quiver/` from the QUIVER paper cannot discover 1P1Q. Add "Projects" as a fifth nav item across all pages and a "← All projects" link on each detail page.

### 2.7 The project detail pages are a different website — **Medium**
`projects/1P1Q/` and `projects/quiver/` are Nerfies/Academic-Project-Page-Template forks: Bulma from jsDelivr, Font Awesome, Academicons, Inter as a third typeface, a reimplemented `.site-navbar` (a near-copy of `.navbar` with different class names and inline `<style>`), `theme-color: #2563eb` (a blue that appears nowhere else), and a footer that is purely the template's attribution block — no email, no GitHub/Scholar/INSPIRE, no copyright, no language switcher. The `</main>` also closes *after* `</footer>` (`quiver:909-911`), which is malformed. Full reskinning isn't worth it, but three cheap wins: override `theme-color` to the sage accent, append the shared footer link row above the template attribution, and add the missing back-links from 2.6.

### 2.8 `.section-label` is title-sized, which muddles the hierarchy — **Low**
At `font-size: 1.25rem` with `letter-spacing: 0.18em` and uppercase (`about.css:16-23`), this is bigger than `.pub-card__year`, `.nav-link` and `.topic__index` combined in visual weight — it reads as a heading, not a label. Given it's standing in for the missing `<h1>` on two pages, either shrink it to ~0.75rem and add a real `<h1>` beneath, or rename it. The current state is a label doing a heading's job, badly.

### 2.9 Footer doesn't stay pinned on About and Research — **Low**
`body` is `display: flex; flex-direction: column` (`style.css:32-40`), and `.hero`, `.pub-page` and `.projects-main` each set `flex: 1` — but `.about-page` and `.research-page` don't. On a tall viewport with short content the footer floats up mid-screen. One-line fix.

---

## 3. Changes to colour or layout

The palette is well chosen and I would not replace it. Sage-green/cream reads as considered and calm, which is a defensible and distinctive signal for someone working at a physics/ML intersection — it avoids both the default-LaTeX-blue academic look and the startup-gradient AI look. The problems are contrast and one specific application, not the hue.

### 3.1 `--ink-faint` fails WCAG AA everywhere it's used — **High**
`--ink-faint: #8a8d88` on `--cream: #f5f3ef` computes to **3.03:1**. AA requires 4.5:1 for normal text. It is applied to `.navbar__title`, `.footer__copy`, `.timeline__date`, `.pub-card__year`, `.talk-card__date`, `.talks-footnote`, the inactive `.pub-tab`, and `.pub-status--prep` — all at 0.65–0.88rem, i.e. squarely "normal text". Darkening the token to roughly `#6e716c` reaches ~4.6:1 and is visually almost indistinguishable at these sizes.

The worst instance: `.footer__plots-hint` combines `--ink-faint` with `opacity: 0.7` at `font-size: 0.65rem` (`style.css:436-443`) — effective contrast ≈ **2.2:1 at 10.4px**. This is the entry point to the plots-sharing tool and it's close to invisible.

### 3.2 `--accent` on cream is 4.11:1 — just under AA — **High**
`--accent: #4d7a52` on `--cream` is **4.11:1**; on `--white` it's 4.55:1 (passes). So the same token passes inside a white project card and fails everywhere on the cream page background: `.nav-link.active`, `.inline-link`, `.tag` text, `.pub-abstract-toggle` (0.75rem), `.pub-status--published`, `.project-card__link`. The primary CTA is worse in a different way — `.btn-primary` is white on `--accent`, also 4.11:1, at 0.8rem uppercase (`style.css:288-305`). Darkening `--accent` by about 6% (toward `#456e49`) clears 4.5:1 against both backgrounds and keeps the palette intact. Also check `.pub-status--review` (`#8a6820` on a 10% amber tint, ≈4.3:1 at 0.7rem).

### 3.3 The Research topic hooks are rendered nearly invisible — **High**
`.topic__index` (`research.css:67-77`) uses `color: var(--cream-dark)` (`#ece9e3`) on `--cream` (`#f5f3ef`) — about **1.1:1** — with a 1px `rgba(122,158,126,0.35)` `-webkit-text-stroke` as the only thing making it legible. That outlined-ghost treatment is right for `.pub-card__num` (`publications.css:133-142`), where the content is a redundant decorative index number. But on the Research page the same treatment is applied to **real editorial content**: *"The world need not be binary …"* and *"Must you always know what you are looking for?"* — the rhetorical hooks that frame each research area, and among the best writing on the site. They're currently unreadable on a bright screen and invisible to anyone with mild low vision. Give them a legible treatment (e.g. italic Cormorant in `--sage-dark`, which is already the site's "quiet but readable" colour) and reserve the ghost-outline for genuinely decorative numerals.

### 3.4 No focus styles anywhere — **High**
`grep -rn "focus"` across `style.css`, `about.css`, `research.css`, `publications.css` and `projects/index.html` returns **zero matches**. There is no `:focus` or `:focus-visible` rule on the whole main site. Every interactive element — nav links, the language pill, the hamburger, carousel prev/next and dots, publication tabs, abstract toggles, BibTeX buttons, modal actions — relies entirely on the browser default ring, and several sit on top of custom `transform`/`background` hover transitions that the default ring doesn't coordinate with. Note especially that `.nav-link::after` (the underline sweep) fires on `:hover` and `.active` only, so a keyboard user gets no equivalent affordance. Add a single `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }` rule.

### 3.5 No `prefers-reduced-motion` guard — **High**
The site is animation-heavy: the hero greeting cycles through four scripts every 2,000ms *forever* (`main.js:41-50`), the research carousels auto-advance every 3,500ms with no pause control (`research.js:17`), plus `slideInLeft`/`fadeUp` entrance animations, `IntersectionObserver` reveals on three pages, and `translateY` hover transforms on cards, buttons and pills. Not a single `@media (prefers-reduced-motion: reduce)` block exists. Two continuously-looping animations with no pause mechanism is also a WCAG 2.2.2 (Pause, Stop, Hide) failure independent of the media query. Wrap the animations in the query and stop the greeting loop after one full cycle.

### 3.6 Mobile portrait overflows at ≤360px — **Medium**
At `max-width: 640px`, `.hero__portrait-wrap { width: 70% }` (`style.css:514`) but the inner `.hero__portrait-bg` has `width: clamp(280px, …)` and `flex-shrink: 0` (`style.css:329-339`). On a 320–360px phone the 70% wrapper is ~197–250px while the child refuses to go below 280px, so the portrait overflows and is cropped by `.hero { overflow: hidden }`. Drop the `flex-shrink: 0` or make the clamp minimum viewport-relative.

Related, **Low**: between 900px and ~1300px, `.hero__portrait-bg` has width `36vw` and height `52vw` with different clamp ceilings, so the ellipse's aspect ratio changes continuously with viewport width while `object-position: center top` re-crops the face. Lock the ratio with `aspect-ratio` instead.

### 3.7 `100vh` on mobile — **Low**
`.hero { min-height: calc(100vh - var(--nav-h) - 56px) }` (`style.css:198`) causes the well-known jump on iOS Safari as the URL bar collapses. `100dvh` with a `100vh` fallback fixes it.

### 3.8 Density: the About page is over-padded, the Projects page under-constrained — **Medium**
`about.css:9` — `padding: clamp(3rem, 7vw, 6rem) clamp(1.5rem, 10vw, 12rem)` inside a 900px max-width leaves ~612px of text on a typical laptop, with three timeline entries, so the page is mostly whitespace. Meanwhile `projects/index.html` has no max-width at all and its cards stretch indefinitely. These two are the extremes of the same missing token (see 2.1); fixing that fixes both.

### 3.9 Impact factors in the publication status pills — **Low**
`lang.js` `p2.status` / `p3.status` render "IF 9" and "IF 19" next to the journal name (and the static HTML fallback in `publications.html:216` omits them, so the two sources disagree). Journal impact factors are essentially never quoted in HEP — DORA-signatory institutions actively discourage it, and to a physics reader it reads slightly off-key. The conference-talk links crammed into the same pill compound the problem: a "status" badge is now carrying publication venue + bibliometric + two talk links, with `white-space: nowrap` (see 0.4). Split venue, and move the talk links into the links row where the Indico pills already live.

---

## 4. Other website functionality that might become necessary

### 4.1 Search and filtering on the publications list — **Medium now, High within a year**
Seven publications and eight talks are fine as a flat list. The trajectory (four talks added in the last few commits; three preprints in 2026 alone) means ~15 papers and ~20 talks within two years, at which point the single-column list with `border-top` separators becomes a scroll-and-squint exercise. The infrastructure is half-built already: `publications.js` has a working tab switcher and an `IntersectionObserver` reveal that correctly re-observes cards in newly shown panels. Add year-grouping headers and a tag filter (quantum ML / anomaly detection / jet substructure / CMS) using the same `.tag` styling from `research.css:114-124`. A client-side text filter over titles+abstracts is another ~20 lines.

### 4.2 Move publication data out of the markup — **Medium**
Right now each publication exists in three places: the HTML card, the `BIBTEX` object in `publications.js:14-44`, and the `pN.abstract` / `pN.status` keys in both language blocks of `lang.js`. Adding one paper means four coordinated edits, and 0.6 above shows those copies have already drifted. A single `publications.json` (id, year, title, authors, venue, status, arXiv, DOI, PDF, code, abstract EN/DE, BibTeX) rendered by a small template function would collapse this to one edit and make 4.1 nearly free. Worth doing *before* the list doubles, not after. `lang.js` is already 37KB and 281 lines of which most is publication prose.

### 4.3 Real access control on `plots/` — **Medium–High**
`plots/index.php:118` sets `$passwordProtect = false` with `$password = 'CMS'` sitting in plaintext on line 121. The only protection is `Disallow: /plots/` in `robots.txt`, which is a request to crawlers, not access control — anyone with or guessing the URL sees everything, and the footer links it publicly on all five pages. For a tool whose stated purpose is sharing unpublished collaboration plots (including `plots/BUMP/`, `plots/QML/`, `plots/PART/`), that's a mismatch. `share/.htaccess` already demonstrates the right pattern (`AuthUserFile /web/abal/.passwd`); apply the same to `plots/`, or at minimum enable the script's own password with a hashed value.

Two smaller notes on the same tool: `index.php` and `view.php` are ~1,900-line near-duplicate forks of Evoluted Directory Listing v4 differing mainly in `$pageTitle` and `$showThumbnails` — any fix has to be applied twice (**Low**); and `filter_var($_POST['password'], FILTER_SANITIZE_STRING)` at `index.php:227` is deprecated in PHP 8.1 and removed in PHP 9, so it will start emitting warnings on the next server upgrade (**Low**).

### 4.4 Versioned CV with a stable URL — **Medium**
Follows from 1.1. Applications reference a URL that must not 404 six months later. Serve `cv/cv.pdf` as a stable alias alongside dated files, and show a "last updated" date on the page — committees do check whether a CV predates the application.

### 4.5 Print stylesheet — **Medium**
No `@media print` on any main page (the two project pages inherited one from the Nerfies template at `static/css/index.css:736`, which is the only one on the site). People *do* print or PDF-export publication lists for applications and reference letters. Currently that would emit the fixed navbar, the backdrop blur, and — because `.pub-card__abstract` is `max-height: 0` until toggled — no abstracts at all. A print block that unpins the navbar, expands all abstracts, drops the hover chrome, and prints link URLs after their text would be ~30 lines.

### 4.6 Dark mode — **Medium**
The design is already token-driven (`style.css:7-26`), so a `@media (prefers-color-scheme: dark)` override of the eight colour variables would carry most of the way. Two things need attention beyond the tokens: the footer icon tinting uses hard-coded `filter: invert(20%) sepia(5%) …` (`style.css:391-403`), and the hero portrait sits on a hard-coded `#2d3d50` backdrop (`style.css:335`). Worth doing mainly because a large share of the visiting audience (ML/QC researchers) runs dark and the current cream is bright.

### 4.7 A contact affordance beyond a broken mailto — **Medium**
Once 0.1 is fixed, the footer mailto may be enough — a static site can't take a form without a backend, and a spam-harvested KIT address is a real cost. The pragmatic middle ground: show the address as text with a light JS assembly, and add the postal/office address and ITP group affiliation somewhere on the About page. There is currently no physical address, office, or phone anywhere on the site, which is unusual for an institute-hosted academic page.

### 4.8 Analytics — **Low–Medium**
None present. Under GDPR at a German institution, a self-hosted Matomo with IP anonymisation and no cookies is the standard answer, and doesn't require a consent banner. Worth having if only to learn whether anyone reaches the project pages (currently, per 2.6, they structurally almost can't).

### 4.9 Accessibility fixes that will matter for a public-institution site — **Medium**
Beyond 3.4/3.5, four concrete items:
- **No skip-to-content link** on any page, with a fixed 72px navbar and up to five nav links to tab past.
- **The mobile drawer keeps its links focusable when closed.** `.mobile-nav` uses `max-height: 0; overflow: hidden` (`style.css:174-187`) rather than `display:none`/`inert`, so at ≤640px a keyboard user tabs through four invisible links before reaching the page.
- **Missing `<h1>` on `about.html` and `publications.html`** (see 2.2) — both jump straight from the document to `<h2>`.
- **Tab and modal semantics are partial.** `publications.html:57-65` has `role="tablist"`/`role="tab"`/`aria-selected` but no roving `tabindex` or arrow-key handling; the panels lack `aria-labelledby` and `tabindex="0"`. The BibTeX modal (`publications.js:125-138`) sets `aria-modal` but never moves focus into the dialog, traps nothing, and doesn't restore focus to the triggering button on close.

An accessibility statement (a `BITV 2.0` / EU Directive 2016/2102 *Barrierefreiheitserklärung*) is formally expected of German public-body sites; for a personal `~user` page it's not strictly required, but the underlying conformance issues above are worth fixing regardless — **Low** for the statement itself, **Medium** for the fixes.

### 4.10 RSS/iCal for talks — **Low**
With eight talks listed and a clear upcoming cadence, an `.ics` feed or a simple RSS of talks would let collaborators subscribe. Nice-to-have; genuinely low priority until the talks list has its own page (1.3).

### 4.11 A favicon that matches the current affiliation — **Low**
All five pages use `icons/etp_logo_color_de.png` as the favicon, while the About page correctly states the current posts are at ITP and IQMT. `icons/icon.png` exists and is unused. Minor, but it's the one piece of branding visible in every tab. There's also no `apple-touch-icon` or `theme-color` on the main pages.

---

## Suggested sequencing

1. **Now (half a day):** the bug table — 0.1 broken email, 0.2 unstyled label, 0.3 clipped abstracts, 0.4 nowrap overflow, 0.5 missing `lang.js` on Projects.
2. **This week:** contrast tokens (3.1, 3.2), focus styles (3.4), `prefers-reduced-motion` (3.5), the Research topic hooks (3.3), Projects in the navbar (2.6), page `<title>`s (1.7).
3. **This month:** CV (1.1) + ORCID (1.2), main-page meta/OG/JSON-LD (1.6), unify content widths and page headers (2.1, 2.2), hamburger breakpoint (2.4).
4. **Before the list doubles:** publications data extraction (4.2), then filtering (4.1), teaching/software sections (1.4, 1.5), print stylesheet (4.5), `plots/` auth (4.3).

### Critical Files for Implementation
- `/web/abal/public_html/style.css` — design tokens, navbar, footer, hero, responsive breakpoints; origin of the contrast, focus, reduced-motion and container-width work
- `/web/abal/public_html/publications.css` — abstract `max-height` clipping, `.pub-status` nowrap, unused `.pub-header__heading`, all publication card styling
- `/web/abal/public_html/lang.js` — 37KB i18n table holding publication prose, the inline crimson link style, and the EN/HTML content drift; the natural place to split data from copy
- `/web/abal/public_html/publications.html` — broken email footer, missing `<h1>`, unstyled `.section-label`, tab semantics, and the growth surface for search/filtering
- `/web/abal/public_html/about.css` — sole definition of `.section-label`, the timeline system, and the over-padded page shell
- `/web/abal/public_html/projects/index.html` — inline `<style>` instead of a shared sheet, missing `lang.js`, unbounded grid width, dead language button
