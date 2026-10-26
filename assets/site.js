// Sélecta's site: blocks that appear, the demo in the hero, small card
// animations, and the download link of the latest version.
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

// MARK: Hero demo

const icons = {
  search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6"/><path d="m10.4 10.4 3.6 3.6"/></svg>',
  hash: '<svg viewBox="0 0 16 16"><path d="M6.3 2.5 5 13.5M11 2.5 9.7 13.5M2.8 6h11M2.2 10h11"/></svg>',
  link: '<svg viewBox="0 0 16 16"><path d="M6.6 9.4l2.8-2.8M7.2 4.6l1-1a2.7 2.7 0 0 1 3.8 3.8l-1 1M8.8 11.4l-1 1a2.7 2.7 0 0 1-3.8-3.8l1-1"/></svg>',
  mail: '<svg viewBox="0 0 16 16"><rect x="2" y="3.5" width="12" height="9" rx="1.6"/><path d="m2.6 4.6 5.4 4.2 5.4-4.2"/></svg>',
  translate: '<span class="glyph">A文</span>',
};

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
    toast: [icons.link, "exemple.fr/compte-rendu s'ouvre dans votre navigateur"],
  },
  {
    group: "mail",
    caption: "Une adresse e-mail : la barre propose d'écrire un message.",
    items: [...common, { icon: "mail", key: "go" }, { text: "ABC" }, { text: "abc" }],
    perUnit: 20,
    toast: [icons.mail, "Nouveau message à equipe@exemple.fr"],
  },
];

const demo = document.querySelector("[data-demo]");
if (demo) runDemo(demo);

function runDemo(body) {
  const bar = body.querySelector("[data-bar]");
  const cursor = body.querySelector("[data-cursor]");
  const toast = body.querySelector("[data-toast]");
  const caption = document.querySelector("[data-caption]");
  const dots = [...document.querySelectorAll(".demo-steps i")];
  const groups = {};

  body.querySelectorAll("[data-group]").forEach((element) => {
    const group = { element, unit: element.dataset.unit, original: element.textContent, units: [] };
    write(group, group.original);
    groups[element.dataset.group] = group;
  });

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
    return wait(ms);
  }

  function rest() {
    return moveCursor(body.clientWidth * 0.82, body.clientHeight * 0.86, 900);
  }

  async function select(group, perUnit) {
    const first = box(group.units[0].getClientRects()[0]);
    await moveCursor(first.x, first.y + first.h / 2, 800, true);
    await wait(180);
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
      const content = item.icon ? icons[item.icon] : item.text;
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
    await wait(260);
    cursor.classList.add("is-down");
    item.classList.add("is-pressed");
    await wait(150);
    cursor.classList.remove("is-down");
    item.classList.remove("is-pressed");
  }

  async function swap(group, text) {
    group.element.classList.add("is-swapping");
    await wait(350);
    write(group, text);
    group.element.classList.remove("is-swapping");
  }

  async function setCaption(index) {
    dots.forEach((dot, i) => dot.classList.toggle("is-current", i === index));
    caption.classList.add("is-fading");
    await wait(300);
    caption.textContent = scenarios[index].caption;
    caption.classList.remove("is-fading");
  }

  async function play(scenario) {
    const group = groups[scenario.group];
    await select(group, scenario.perUnit);
    await wait(220);
    showBar(scenario.items, group);
    await wait(900);
    await click("go");
    hideBar();
    if (scenario.result) {
      await wait(220);
      showBar([{ text: scenario.result, key: "result", result: true }], group);
      await wait(1100);
      await click("result");
      hideBar();
      await swap(group, scenario.result);
      await rest();
      await wait(1400);
      await swap(group, group.original);
    } else {
      unselect(group);
      toast.innerHTML = `${scenario.toast[0]}<span>${scenario.toast[1]}</span>`;
      toast.classList.add("is-shown");
      await rest();
      await wait(1500);
      toast.classList.remove("is-shown");
    }
    await wait(500);
  }

  if (still) {
    groups.phrase.units.forEach((unit) => unit.classList.add("is-selected"));
    dots[0].classList.add("is-current");
    requestAnimationFrame(() => showBar(scenarios[0].items, groups.phrase));
    return;
  }

  // Plays only while the demo is on screen and the page is visible.
  let onScreen = false;
  new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.3 }).observe(body);
  const ready = () => new Promise((resolve) => {
    const check = () => (onScreen && !document.hidden ? resolve() : setTimeout(check, 250));
    check();
  });

  (async () => {
    dots[0].classList.add("is-current");
    cursor.style.transform = `translate(${body.clientWidth * 0.82}px, ${body.clientHeight * 0.86}px)`;
    await wait(900);
    for (let index = 0; ; index = (index + 1) % scenarios.length) {
      await ready();
      if (index > 0 || caption.textContent !== scenarios[0].caption) await setCaption(index);
      try {
        await play(scenarios[index]);
      } catch {
        // Start the next one from a clean state.
        hideBar();
        toast.classList.remove("is-shown");
        Object.values(groups).forEach((group) => write(group, group.original));
        await wait(600);
      }
    }
  })();
}
