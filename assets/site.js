// Sélecta's site: blocks that appear, the demos (in the hero and for the
// extension examples), small card animations, colored code, and the
// download link of the latest version.
"use strict";

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
// The site's root, also from a page in a folder such as extensions/.
const root = new URL("..", document.currentScript.src);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// MARK: Navigation and appearing blocks

const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const starters = new Map();
const appear = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("is-in");
    starters.get(entry.target)?.();
    appear.unobserve(entry.target);
  }
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal, [data-animate]").forEach((element) => appear.observe(element));
// The page's header appears at once, without waiting for the observer.
requestAnimationFrame(() => document.querySelectorAll(".hero .reveal, .guide-hero .reveal").forEach((element) => element.classList.add("is-in")));

/** Runs `start` once the card is on screen. */
function whenShown(element, start) {
  if (!element) return;
  starters.set(element, start);
}

/** Returns a function that resolves once `element` is on screen and the page is visible. */
function watch(element) {
  let onScreen = false;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.3 }).observe(element);
  return () => new Promise((resolve) => {
    const check = () => (onScreen && !document.hidden ? resolve() : setTimeout(check, 250));
    check();
  });
}

// MARK: Latest version, read from the update feed

const sparkle = "http://www.andymatuschak.org/xml-namespaces/sparkle";
fetch(new URL("appcast.xml", root), { cache: "no-cache" })
  .then((response) => (response.ok ? response.text() : Promise.reject(response.status)))
  .then((text) => {
    const feed = new DOMParser().parseFromString(text, "application/xml");
    const item = feed.querySelector("item");
    const url = item?.querySelector("enclosure")?.getAttribute("url");
    const version = item?.getElementsByTagNameNS(sparkle, "shortVersionString")[0]?.textContent;
    if (url?.startsWith("https://github.com/rapha-blt/selecta/releases/download/")) {
      document.querySelectorAll("[data-download]").forEach((link) => (link.href = url));
      document.querySelectorAll("[data-dmg-name]").forEach((name) => (name.textContent = url.split("/").pop()));
    }
    if (version) document.querySelectorAll("[data-version]").forEach((label) => (label.textContent = `Version ${version}`));
  })
  .catch(() => {});

// MARK: Code colors

// One pattern per language; each named group is a color class of site.css
// (c comment, s string, k key or name, w word, m placeholder).
const grammars = {
  yaml: /(?<c>(?:^|(?<=\s))#.*)|(?<s>'[^'\n]*'|"[^"\n]*")|(?<k>(?<=^\s*(?:- )?)[\w$-]+(?=:(?:\s|$)))|(?<m>\*\*\*)/gm,
  js: /(?<c>\/\/.*|\/\*[\s\S]*?\*\/)|(?<s>`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(?<w>\b(?:const|let|return|await|async|if|else|for|of|new|function|interface|type|true|false|null|undefined)\b)|(?<k>\b(?:sel|util|fetch)\b)/g,
  sh: /(?<c>(?:^|(?<=\s))#.*)|(?<s>"(?:\\.|[^"\\])*"|'[^']*')|(?<k>\$\{?\w+(?::\w)?\}?)/gm,
  applescript: /(?<c>--.*)|(?<s>"(?:\\.|[^"\\])*")|(?<w>\b(?:tell|end|application|make|new|with|properties|return|say)\b)|(?<k>\bselecta\w+)/g,
  json: /(?<k>"[^"\n]*"(?=\s*:))|(?<s>"[^"\n]*")/g,
};

const escape = (text) => text.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);

function highlight(code, grammar) {
  const text = code.textContent;
  let html = "";
  let last = 0;
  for (const match of text.matchAll(grammar)) {
    const [kind] = Object.entries(match.groups).find(([, value]) => value !== undefined);
    html += escape(text.slice(last, match.index)) + `<span class="${kind}">${escape(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  code.innerHTML = html + escape(text.slice(last));
}

// MARK: Feature cards

whenShown(document.querySelector(".detect")?.closest(".card"), () => {
  const rows = [...document.querySelectorAll(".detect-row")];
  let index = 0;
  const show = () => rows.forEach((row, i) => row.classList.toggle("is-active", i === index));
  show();
  if (still) return;
  setInterval(() => { index = (index + 1) % rows.length; show(); }, 1700);
});

whenShown(document.querySelector(".transform")?.closest(".card"), () => {
  const text = document.querySelector("[data-transform]");
  const keys = document.querySelectorAll("[data-key]");
  const states = [["BONJOUR LE MONDE", "upper"], ["Bonjour Le Monde", "title"], ["bonjour le monde", "lower"]];
  let index = 0;
  const show = () => {
    text.textContent = states[index][0];
    keys.forEach((key) => key.classList.toggle("is-active", key.dataset.key === states[index][1]));
  };
  if (still) { show(); return; }
  setInterval(async () => {
    text.classList.add("is-fading");
    await wait(200);
    show();
    text.classList.remove("is-fading");
    index = (index + 1) % states.length;
  }, 1800);
});

whenShown(document.querySelector(".count")?.closest(".card"), () => {
  document.querySelectorAll("[data-count]").forEach((number) => {
    const target = Number(number.dataset.count);
    if (still) { number.textContent = target.toLocaleString("fr-FR"); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1400);
      number.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString("fr-FR");
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
});

// MARK: Demo stage, shared by the hero and the extension examples

const icons = {
  search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6"/><path d="m10.4 10.4 3.6 3.6"/></svg>',
  hash: '<svg viewBox="0 0 16 16"><path d="M6.3 2.5 5 13.5M11 2.5 9.7 13.5M2.8 6h11M2.2 10h11"/></svg>',
  link: '<svg viewBox="0 0 16 16"><path d="M6.6 9.4l2.8-2.8M7.2 4.6l1-1a2.7 2.7 0 0 1 3.8 3.8l-1 1M8.8 11.4l-1 1a2.7 2.7 0 0 1-3.8-3.8l1-1"/></svg>',
  mail: '<svg viewBox="0 0 16 16"><rect x="2" y="3.5" width="12" height="9" rx="1.6"/><path d="m2.6 4.6 5.4 4.2 5.4-4.2"/></svg>',
  translate: '<span class="glyph">A文</span>',
  code: '<svg viewBox="0 0 16 16"><path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/></svg>',
  shortcut: '<svg viewBox="0 0 16 16"><path d="M8 2.2 13.6 5 8 7.8 2.4 5z"/><path d="M2.4 8 8 10.8 13.6 8M2.4 11 8 13.8 13.6 11"/></svg>',
  wiki: '<span class="glyph glyph-serif">W</span>',
  bold: '<span class="glyph glyph-bold">B</span>',
  stars: '<span class="glyph">**</span>',
  count: '<span class="glyph">123</span>',
};

/** Thrown by a stage's pauses once it is reset: the scene stops there. */
class Cancelled extends Error {}

/**
 * A window where a cursor selects text, then clicks in the bar above it.
 * `restAt` is where the cursor waits, as fractions of the window's size.
 */
function createStage(body, restAt = [0.82, 0.86]) {
  const bar = body.querySelector("[data-bar]");
  const cursor = body.querySelector("[data-cursor]");
  const toast = body.querySelector("[data-toast]");
  let generation = 0;

  /** Waits, unless the stage is reset meanwhile. */
  async function pause(ms) {
    const current = generation;
    await wait(ms);
    if (current !== generation) throw new Cancelled();
  }

  /** Cuts the text into words (each with its space) or characters, so the selection can grow. */
  function write(group, text) {
    const pieces = group.unit === "char" ? [...text] : text.split(/(?<=\s)/);
    group.element.replaceChildren(...pieces.map((piece) => {
      const span = document.createElement("span");
      span.className = "u";
      span.textContent = piece;
      return span;
    }));
    group.units = [...group.element.children];
  }

  function group(element) {
    const result = { element, unit: element.dataset.unit, original: element.textContent, units: [] };
    write(result, result.original);
    return result;
  }

  const box = (rect) => {
    const origin = body.getBoundingClientRect();
    return { x: rect.left - origin.left, y: rect.top - origin.top, w: rect.width, h: rect.height };
  };

  function moveCursor(x, y, ms, beam = false) {
    cursor.classList.add("is-shown");
    cursor.classList.toggle("is-beam", beam);
    cursor.style.transitionDuration = `${ms}ms, 250ms`;
    // The arrow's tip is 2 px into its drawing.
    cursor.style.transform = beam ? `translate(${x}px, ${y}px)` : `translate(${x - 2}px, ${y - 2}px)`;
    return pause(ms);
  }

  /** Puts the cursor where it rests, without moving it there. */
  function park() {
    cursor.style.transform = `translate(${body.clientWidth * restAt[0]}px, ${body.clientHeight * restAt[1]}px)`;
  }

  function rest() {
    return moveCursor(body.clientWidth * restAt[0], body.clientHeight * restAt[1], 900);
  }

  async function select(group, perUnit) {
    const first = box(group.units[0].getClientRects()[0]);
    await moveCursor(first.x, first.y + first.h / 2, 800, true);
    await pause(180);
    cursor.classList.add("is-down");
    for (const unit of group.units) {
      unit.classList.add("is-selected");
      const rects = unit.getClientRects();
      const last = box(rects[rects.length - 1]);
      await moveCursor(last.x + last.w, last.y + last.h / 2, perUnit, true);
    }
    cursor.classList.remove("is-down");
  }

  const unselect = (group) => group.units.forEach((unit) => unit.classList.remove("is-selected"));

  function showBar(items, group) {
    // On a narrow screen, a shorter bar with its pages button, as Sélecta does.
    const narrow = body.clientWidth < 520 && items.length > 4;
    const shown = narrow ? [items[1], items[3], items.find((item) => item.key), { text: "›" }] : items;
    bar.innerHTML = shown.map((item) => {
      const content = item.icon ? icons[item.icon] : item.result ? `<span>${escape(item.text)}</span>` : escape(item.text);
      return `<span class="bar-item${item.result ? " is-result" : ""}" data-key="${item.key ?? ""}">${content}</span>`;
    }).join("");

    const rects = group.units.flatMap((unit) => [...unit.getClientRects()]).map(box);
    const top = Math.min(...rects.map((rect) => rect.y));
    const line = rects.filter((rect) => rect.y < top + 4);
    const center = (Math.min(...line.map((rect) => rect.x)) + Math.max(...line.map((rect) => rect.x + rect.w))) / 2;
    const width = bar.offsetWidth;
    const left = Math.max(10, Math.min(center - width / 2, body.clientWidth - width - 10));
    bar.style.left = `${left}px`;
    bar.style.top = `${top - bar.offsetHeight - 9}px`;
    bar.style.setProperty("--arrow-x", `${Math.max(14, Math.min(center - left, width - 14))}px`);
    requestAnimationFrame(() => bar.classList.add("is-shown"));
  }

  const hideBar = () => bar.classList.remove("is-shown");

  async function click(key) {
    const item = bar.querySelector(`[data-key="${key}"]`);
    const rect = box(item.getBoundingClientRect());
    await moveCursor(rect.x + rect.w / 2, rect.y + rect.h * 0.6, 650);
    item.classList.add("is-hover");
    await pause(260);
    cursor.classList.add("is-down");
    item.classList.add("is-pressed");
    await pause(150);
    cursor.classList.remove("is-down");
    item.classList.remove("is-pressed");
  }

  async function swap(group, text) {
    group.element.classList.add("is-swapping");
    await pause(350);
    write(group, text);
    group.element.classList.remove("is-swapping");
  }

  function showToast(icon, text) {
    toast.innerHTML = `${icons[icon]}<span>${escape(text)}</span>`;
    toast.classList.add("is-shown");
  }

  const hideToast = () => toast.classList.remove("is-shown");

  /** Stops the scene being played, and clears what it showed. */
  function reset() {
    generation += 1;
    hideBar();
    hideToast();
    cursor.classList.remove("is-down");
    body.querySelectorAll(".is-swapping").forEach((element) => element.classList.remove("is-swapping"));
  }

  return { pause, write, group, park, rest, select, unselect, showBar, hideBar, click, swap, showToast, hideToast, reset };
}

// MARK: Hero demo

const common = [{ icon: "search" }, { text: "Copier" }, { text: "Couper" }, { text: "Coller" }];
const scenarios = [
  {
    group: "phrase",
    caption: "Une phrase : la barre propose de la traduire.",
    items: [...common, { text: "ABC" }, { text: "abc" }, { icon: "hash" }, { icon: "translate", key: "go" }],
    perUnit: 70,
    result: "Can we move the meeting to Tuesday at 2 p.m.?",
  },
  {
    group: "url",
    caption: "Une adresse web : la barre propose de l'ouvrir.",
    items: [...common, { icon: "link", key: "go" }, { text: "ABC" }, { text: "abc" }],
    perUnit: 16,
    toast: ["link", "exemple.fr/compte-rendu s'ouvre dans votre navigateur"],
  },
  {
    group: "mail",
    caption: "Une adresse e-mail : la barre propose d'écrire un message.",
    items: [...common, { icon: "mail", key: "go" }, { text: "ABC" }, { text: "abc" }],
    perUnit: 20,
    toast: ["mail", "Nouveau message à equipe@exemple.fr"],
  },
];

const demo = document.querySelector("[data-demo]");
if (demo) runDemo(demo);

function runDemo(body) {
  const stage = createStage(body);
  const caption = document.querySelector("[data-caption]");
  const dots = [...document.querySelectorAll(".demo-steps i")];
  const groups = {};
  body.querySelectorAll("[data-group]").forEach((element) => (groups[element.dataset.group] = stage.group(element)));

  async function setCaption(index) {
    dots.forEach((dot, i) => dot.classList.toggle("is-current", i === index));
    caption.classList.add("is-fading");
    await wait(300);
    caption.textContent = scenarios[index].caption;
    caption.classList.remove("is-fading");
  }

  async function play(scenario) {
    const group = groups[scenario.group];
    await stage.select(group, scenario.perUnit);
    await stage.pause(220);
    stage.showBar(scenario.items, group);
    await stage.pause(900);
    await stage.click("go");
    stage.hideBar();
    if (scenario.result) {
      await stage.pause(220);
      stage.showBar([{ text: scenario.result, key: "result", result: true }], group);
      await stage.pause(1100);
      await stage.click("result");
      stage.hideBar();
      await stage.swap(group, scenario.result);
      await stage.rest();
      await stage.pause(1400);
      await stage.swap(group, group.original);
    } else {
      stage.unselect(group);
      stage.showToast(...scenario.toast);
      await stage.rest();
      await stage.pause(1500);
      stage.hideToast();
    }
    await stage.pause(500);
  }

  if (still) {
    groups.phrase.units.forEach((unit) => unit.classList.add("is-selected"));
    dots[0].classList.add("is-current");
    requestAnimationFrame(() => stage.showBar(scenarios[0].items, groups.phrase));
    return;
  }

  // Plays only while the demo is on screen and the page is visible.
  const ready = watch(body);
  (async () => {
    dots[0].classList.add("is-current");
    stage.park();
    await wait(900);
    for (let index = 0; ; index = (index + 1) % scenarios.length) {
      await ready();
      if (index > 0 || caption.textContent !== scenarios[0].caption) await setCaption(index);
      try {
        await play(scenarios[index]);
      } catch {
        // Start the next one from a clean state.
        stage.reset();
        Object.values(groups).forEach((group) => stage.write(group, group.original));
        await wait(600);
      }
    }
  })();
}

// MARK: Extension examples

/** What the Compteur de mots example shows, counted the same way. */
function countWords(text) {
  const clean = text.trim();
  const characters = typeof Intl.Segmenter === "function"
    ? [...new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(clean)].length
    : [...clean].length;
  const words = clean.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  const sentences = clean.split(/[.!?…]+(?=\s|$)/).filter((sentence) => sentence.trim() !== "").length;
  const number = (value, word) => `${value.toLocaleString("fr-FR")} ${word}${value > 1 ? "s" : ""}`;
  return `${number(words, "mot")} · ${number(characters, "caractère")} · ${number(sentences, "phrase")}`;
}

// Each example: the window, the text with its selection (before, selected,
// after), the bar, what the click does, and the extension's configuration.
const extensions = {
  deepl: {
    title: "Réponse à Sam",
    text: ["Bonjour Sam, ", "le compte rendu est en ligne.", " Bonne journée !"],
    unit: "word",
    perUnit: 80,
    items: [...common, { icon: "translate", key: "go" }],
    outcome: { kind: "preview", text: "the minutes are online." },
    caption: "DeepL traduit la sélection ; un clic sur la traduction la met à sa place.",
    file: "DeepL.selectaext/Config.yaml",
    lang: "yaml",
    code: `name: DeepL
identifier: app.selecta.examples.deepl
icon: symbol:translate
entitlements: [network]
options:
  - identifier: apikey
    type: secret
    label: Clé d'API DeepL
  - identifier: cible
    type: multiple
    label: Traduire vers
    values: [EN-GB, EN-US, FR, DE, ES, IT, PT-PT, NL, PL, JA, ZH]
    defaultValue: EN-GB
after: preview-result
timeout: 15
javascriptFile: traduire.js`,
  },
  wikipedia: {
    title: "Histoire de l'informatique",
    text: ["La première programmeuse est ", "Ada Lovelace", ", en 1843."],
    unit: "char",
    perUnit: 32,
    items: [{ icon: "search" }, { text: "Copier" }, { icon: "wiki", key: "go" }],
    outcome: { kind: "open", icon: "wiki", text: "Wikipédia s'ouvre sur « Ada Lovelace »" },
    caption: "Un nom : W le cherche dans Wikipédia, sans une ligne de code.",
    file: "Wikipedia.selectaext/Config.yaml",
    lang: "yaml",
    code: `# Une action sans code : une adresse où *** devient la sélection.
name: Wikipédia
identifier: app.selecta.examples.wikipedia
description: Cherche la sélection dans Wikipédia en français.
icon: text:W
requirements: [text, '!url']
url: https://fr.wikipedia.org/w/index.php?search=***`,
  },
  markdown: {
    title: "README.md",
    text: ["", "Du **gras** et un [lien](https://exemple.fr).", ""],
    unit: "word",
    perUnit: 90,
    items: [{ text: "Copier" }, { text: "Couper" }, { text: "Coller" }, { icon: "code", key: "go" }],
    outcome: { kind: "preview", text: '<p>Du <strong>gras</strong> et un <a href="https://exemple.fr">lien</a>.</p>' },
    caption: "Du Markdown devient du HTML, proposé dans la barre : un clic le colle à sa place.",
    file: "MarkdownHTML.selectaext/Config.yaml",
    lang: "yaml",
    code: `# JavaScript dans un fichier du paquet.
name: Markdown → HTML
identifier: app.selecta.examples.markdown-html
icon: symbol:chevron.left.forwardslash.chevron.right
# Le HTML devient un bouton : un clic le colle à la place du Markdown.
after: preview-result
javascriptFile: markdown.js`,
  },
  bold: {
    title: "Lettre",
    text: ["Merci de ", "confirmer avant vendredi", " votre venue."],
    unit: "word",
    perUnit: 90,
    items: [{ text: "Copier" }, { text: "Couper" }, { text: "Coller" }, { icon: "bold", key: "go" }, { icon: "stars" }],
    outcome: { kind: "bold" },
    caption: "Dans TextEdit, Notes ou Mail, B met la sélection en gras ; ** le fait en Markdown.",
    file: "Gras.selectaext/Config.yaml",
    lang: "yaml",
    code: `name: Gras
identifier: app.selecta.examples.bold
requirements: [text, paste]
actions:
  - title: Gras
    icon: symbol:bold
    apps: [com.apple.TextEdit, com.apple.Notes, com.apple.mail, com.apple.iWork.Pages, com.microsoft.Word]
    keyCombo: command b
  - title: Gras Markdown
    icon: text:**
    after: paste-result
    javascript: |
      const [, before, inner, after] = sel.input.text.match(/^(\\s*)([\\s\\S]*?)(\\s*)$/)
      const bold = inner.match(/^\\*\\*([\\s\\S]+)\\*\\*$/)
      return before + (bold ? bold[1] : \`**\${inner}**\`) + after`,
  },
  count: {
    title: "Rapport annuel",
    text: ["", "Sélecta compte les mots, les caractères et les phrases. Essayez !", ""],
    unit: "word",
    perUnit: 60,
    items: [{ icon: "search" }, { text: "Copier" }, { text: "Coller" }, { icon: "count", key: "go" }],
    outcome: { kind: "show", text: countWords },
    caption: "Le nombre de mots, de caractères et de phrases, affiché dans la barre.",
    file: "CompteurDeMots.selectaext/Config.json",
    lang: "json",
    code: `{
  "name": "Compteur de mots",
  "identifier": "app.selecta.examples.word-count",
  "description": "Affiche dans la barre le nombre de mots, de caractères et de phrases de la sélection.",
  "icon": "symbol:textformat.123",
  "javascriptFile": "compter.ts"
}`,
  },
  shortcut: {
    title: "Courses",
    text: ["À faire : ", "acheter du pain et des œufs", ""],
    unit: "word",
    perUnit: 80,
    items: [{ text: "Copier" }, { text: "Couper" }, { text: "Coller" }, { icon: "shortcut", key: "go" }],
    outcome: { kind: "show", text: "Ajouté à vos Rappels" },
    caption: "Votre Raccourci « Sélecta » reçoit la sélection, ici pour l'ajouter à Rappels ; la barre affiche sa réponse.",
    file: "Raccourci.selectaext/Config.yaml",
    lang: "yaml",
    code: `# Une action sans code qui lance un Raccourci de l'app Raccourcis.
name: Raccourci Sélecta
identifier: app.selecta.examples.shortcut
icon: symbol:square.2.layers.3d
after: show-result
timeout: 30
shortcut: Sélecta`,
  },
};

const showcase = document.querySelector("[data-showcase]");
if (showcase) runShowcase(showcase);

function runShowcase(section) {
  const body = section.querySelector("[data-ext-stage]");
  // Bottom left: the window is small, and its messages appear bottom right.
  const stage = createStage(body, [0.1, 0.84]);
  const paragraph = section.querySelector("[data-ext-text]");
  const title = section.querySelector("[data-ext-title]");
  const caption = section.querySelector("[data-ext-caption]");
  const file = section.querySelector("[data-ext-file]");
  const code = section.querySelector("[data-ext-code]");
  const buttons = [...section.querySelectorAll("[data-ext]")];
  const order = buttons.map((button) => button.dataset.ext);
  let current = buttons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.ext ?? order[0];
  // Once a visitor picks an example, it plays again and again instead of the next one.
  let picked = false;
  let group;

  function show(id) {
    const example = extensions[id];
    current = id;
    stage.reset();
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.ext === id)));
    title.textContent = example.title;
    caption.textContent = example.caption;
    file.textContent = example.file;
    code.textContent = example.code;
    code.parentElement.scrollTop = 0;
    highlight(code, grammars[example.lang]);
    const [before, selected, after] = example.text;
    const target = document.createElement("span");
    target.dataset.unit = example.unit;
    target.textContent = selected;
    paragraph.replaceChildren(before, target, after);
    group = stage.group(target);
    if (still) {
      group.units.forEach((unit) => unit.classList.add("is-selected"));
      requestAnimationFrame(() => stage.showBar(example.items, group));
    }
  }

  async function play(example) {
    await stage.select(group, example.perUnit);
    await stage.pause(220);
    stage.showBar(example.items, group);
    await stage.pause(800);
    await stage.click("go");
    const { outcome } = example;
    if (outcome.kind === "open") {
      // A link: the bar closes and the page opens.
      stage.hideBar();
      stage.unselect(group);
      stage.showToast(outcome.icon, outcome.text);
      await stage.rest();
      await stage.pause(1800);
      stage.hideToast();
    } else if (outcome.kind === "bold") {
      // A keyboard shortcut: the bar closes, the app does the rest.
      stage.hideBar();
      group.element.classList.add("is-bold");
      await stage.rest();
      await stage.pause(1600);
      stage.unselect(group);
      await stage.pause(500);
      group.element.classList.remove("is-bold");
    } else if (outcome.kind === "show") {
      // The result takes the place of the buttons.
      const text = typeof outcome.text === "function" ? outcome.text(group.original) : outcome.text;
      stage.showBar([{ text, key: "result", result: true }], group);
      await stage.rest();
      await stage.pause(2200);
      stage.hideBar();
      stage.unselect(group);
    } else {
      // A result offered as a button, which then replaces the selection.
      stage.hideBar();
      await stage.pause(220);
      stage.showBar([{ text: outcome.text, key: "result", result: true }], group);
      await stage.pause(1000);
      await stage.click("result");
      stage.hideBar();
      await stage.swap(group, outcome.text);
      await stage.rest();
      await stage.pause(1600);
      await stage.swap(group, group.original);
    }
    await stage.pause(700);
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    picked = true;
    show(button.dataset.ext);
  }));

  show(current);
  if (still) return;

  const ready = watch(body);
  (async () => {
    stage.park();
    for (;;) {
      await ready();
      try {
        await play(extensions[current]);
        if (!picked) show(order[(order.indexOf(current) + 1) % order.length]);
      } catch (error) {
        // A visitor picked another example: it starts at once.
        if (error instanceof Cancelled) continue;
        show(current);
        await wait(600);
      }
    }
  })();
}
