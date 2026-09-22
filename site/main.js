/* Kiwii landing page. No framework, no build step — the page ships as written. */

const root = document.documentElement
const STORE_KEY = "kiwii.lang"

const TITLES = {
  vi: "Kiwii — Coding agent chạy trên máy của bạn",
  en: "Kiwii — A coding agent that runs on your machine",
}

/* ── Language ──────────────────────────────────────────────────────────── */

// Both languages are already in the markup; this only flips which one CSS shows.
function setLang(lang) {
  root.dataset.lang = lang
  root.lang = lang
  document.title = TITLES[lang]
  try {
    localStorage.setItem(STORE_KEY, lang)
  } catch {
    // Private windows and blocked site data both throw; the page works either way.
  }
}

function initialLang() {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved === "vi" || saved === "en") return saved
  } catch {
    // Fall through to the browser's preference.
  }
  const browser = (navigator.language || "").toLowerCase()
  return browser.startsWith("vi") ? "vi" : "en"
}

setLang(initialLang())

document.getElementById("lang").addEventListener("click", () => {
  setLang(root.dataset.lang === "vi" ? "en" : "vi")
})

/* ── Install tabs ──────────────────────────────────────────────────────── */

const osTabs = document.querySelectorAll("[data-os]")
const osPanels = document.querySelectorAll("[data-os-panel]")

osTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    osTabs.forEach((other) => {
      const active = other === tab
      other.classList.toggle("is-active", active)
      other.setAttribute("aria-selected", String(active))
    })
    osPanels.forEach((panel) => {
      panel.hidden = panel.dataset.osPanel !== tab.dataset.os
    })
  })
})

/* ── Copy buttons ──────────────────────────────────────────────────────── */

document.querySelectorAll(".copy").forEach((button) => {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy)
    if (!source) return
    try {
      await navigator.clipboard.writeText(source.textContent.trim())
    } catch {
      // Clipboard access needs a secure context and a permission; selecting the
      // text still lets the reader copy it by hand, so fail quietly.
      return
    }
    button.classList.add("is-done")
    setTimeout(() => button.classList.remove("is-done"), 1600)
  })
})

/* ── Permission modes ──────────────────────────────────────────────────── */

const demo = document.getElementById("mode-demo")
const modeButtons = document.querySelectorAll("[data-mode]")
const descriptions = document.querySelectorAll("[data-desc]")

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode
    modeButtons.forEach((other) => {
      const active = other === button
      other.classList.toggle("is-active", active)
      other.setAttribute("aria-selected", String(active))
    })
    descriptions.forEach((description) => {
      description.hidden = description.dataset.desc !== mode
    })
    demo.style.setProperty("--m", `var(--mode-${mode})`)
  })
})
