// The extension guide: colored code, a copy button on each block, and the
// table of contents following the section being read.
"use strict";

// MARK: Code colors

// The patterns and `highlight` are in site.js, shared with the home page.

// The title of a block that does not name a file.
const languages = { yaml: "YAML", js: "JavaScript", sh: "Shell", applescript: "AppleScript", json: "JSON" };

// MARK: Copy buttons

function addCopyButton(card, code) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy";
  button.textContent = "Copier";
  button.setAttribute("aria-label", "Copier le code");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "Copié";
      button.classList.add("is-done");
    } catch {
      button.textContent = "Sélectionnez le code";
    }
    setTimeout(() => { button.textContent = "Copier"; button.classList.remove("is-done"); }, 1600);
  });
  card.querySelector(".code-head").append(button);
}

function addHead(card) {
  const head = document.createElement("figcaption");
  head.className = "code-head";
  head.innerHTML = '<span class="lights"><i></i><i></i><i></i></span><span></span>';
  head.lastChild.textContent = languages[card.dataset.lang] ?? "";
  card.prepend(head);
}

document.querySelectorAll(".code-card[data-lang]").forEach((card) => {
  const code = card.querySelector("code");
  const grammar = grammars[card.dataset.lang];
  if (grammar) highlight(code, grammar);
  if (!card.querySelector(".code-head")) addHead(card);
  if (navigator.clipboard) addCopyButton(card, code);
});

// MARK: Table of contents

const links = new Map([...document.querySelectorAll(".toc a")].map((link) => [link.hash.slice(1), link]));
const visible = new Set();
const follow = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
  }
  // The first section on screen, in page order.
  const current = [...visible].sort((a, b) => a.offsetTop - b.offsetTop)[0];
  if (!current) return;
  links.forEach((link, id) => (id === current.id ? link.setAttribute("aria-current", "true") : link.removeAttribute("aria-current")));
}, { rootMargin: "-80px 0px -55% 0px" });
document.querySelectorAll(".prose section[id]").forEach((section) => follow.observe(section));
