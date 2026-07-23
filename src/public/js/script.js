// script.js — TextTV Online
// Handles page navigation, content loading and mobile menu

// ── Page configuration ──
const PAGE_GROUPS = [
  { pages: [100], label: "Nyheter" },
  { pages: [101, 102, 103], label: "Inrikes" },
  { pages: [104, 105], label: "Utrikes" },
  { pages: [300, 301, 302], label: "Sport" },
  { pages: [330], label: "Resultatbörsen" },
  { pages: [376], label: "Målservice" },
  { pages: [377], label: "Målservice, resultat" },
  { pages: [400], label: "Väder" },
  { pages: [401], label: "Vädret idag/imorgon" },
  { pages: [600, 650, 651, 652, 653, 654, 655, 656], label: "TV-tablåer" },
  { pages: [700], label: "Innehåll" },
];

const CATEGORY_CONFIG = {
  100: { color: "#00c8ff", label: "Nyheter" },
  101: { color: "#00c8ff", label: "Inrikes" },
  102: { color: "#00c8ff", label: "Inrikes" },
  103: { color: "#00c8ff", label: "Inrikes" },
  104: { color: "#f472b6", label: "Utrikes" },
  105: { color: "#f472b6", label: "Utrikes" },
  300: { color: "#34d399", label: "Sport" },
  301: { color: "#34d399", label: "Sport" },
  302: { color: "#34d399", label: "Sport" },
  330: { color: "#34d399", label: "Resultatbörsen" },
  376: { color: "#34d399", label: "Målservice" },
  377: { color: "#34d399", label: "Målservice, resultat" },
  400: { color: "#c084fc", label: "Väder" },
  401: { color: "#c084fc", label: "Vädret idag/imorgon" },
  600: { color: "#fbbf24", label: "TV-tablåer" },
  700: { color: "#9898b0", label: "Innehåll" },
};

// All pages 100–899 available for browsing
const MIN_PAGE = 100;
const MAX_PAGE = 899;

// ── State ──
let currentPage = 100;

// ── DOM references — assigned after DOM is ready ──
let viewer,
  titleEl,
  pageNrEl,
  contentHeader,
  heroContainer,
  pageNavInfo,
  prevBtn,
  nextBtn;

// ── Get label for a page number ──
function getLabelForPage(pageNum) {
  for (const group of PAGE_GROUPS) {
    if (group.pages.includes(pageNum)) return group.label;
  }
  return `Sida ${pageNum}`;
}

// ── Load and display a page ──
async function loadPage(pageNum) {
  currentPage = pageNum;
  const isHome = pageNum === 100;

  // Show hero on start page, content header on all other pages
  heroContainer.hidden = !isHome;
  contentHeader.hidden = isHome;

  // Update heading, page number and color
  titleEl.textContent = getLabelForPage(pageNum);
  pageNrEl.textContent = `sid ${pageNum}`;

  const config = CATEGORY_CONFIG[pageNum];
  titleEl.style.color = config && !isHome ? config.color : "";

  // Update navigation buttons
  prevBtn.disabled = pageNum <= MIN_PAGE;
  nextBtn.disabled = pageNum >= MAX_PAGE;
  pageNavInfo.textContent = `sid ${pageNum}`;

  // Mark active row in sidebar
  document.querySelectorAll(".sidebar-item").forEach((btn) => {
    const active = Number(btn.dataset.page) === pageNum;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-current", active ? "true" : "false");
  });

  // Fetch content
  viewer.setAttribute("aria-busy", "true");
  viewer.innerHTML = "";

  try {
    const res = await fetch(`/api/page/${pageNum}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const firstPage = data[0];
    if (!firstPage) throw new Error("Empty page");

    const rawHTML = Array.isArray(firstPage.content)
      ? firstPage.content.join("\n")
      : firstPage.content || "";

    viewer.setAttribute("aria-busy", "false");
    viewer.innerHTML = `<div class="texttv-content">${rawHTML}</div>`;
  } catch {
    viewer.setAttribute("aria-busy", "false");
    viewer.innerHTML =
      '<p class="error-msg">Kunde inte ladda sidan. Försök igen senare.</p>';
  }
}

// ── Search ──
function goToPage() {
  const input = document.getElementById("pageInput");
  const page = parseInt(input.value, 10);

  if (!page || page < 100 || page > 899) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  input.removeAttribute("aria-invalid");
  input.value = "";
  loadPage(page);
}

// ── Mobile menu ──
function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle = document.getElementById("sidebarToggle");
  sidebar.classList.add("open");
  overlay.classList.add("visible");
  toggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle = document.getElementById("sidebarToggle");
  sidebar.classList.remove("open");
  overlay.classList.remove("visible");
  toggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  viewer = document.getElementById("page-viewer");
  titleEl = document.getElementById("content-title");
  pageNrEl = document.getElementById("content-pagenr");
  contentHeader = document.getElementById("content-header");
  heroContainer = document.getElementById("hero-container");
  pageNavInfo = document.getElementById("page-nav-info");
  prevBtn = document.getElementById("prevBtn");
  nextBtn = document.getElementById("nextBtn");

  // Sidebar buttons
  document.querySelectorAll(".sidebar-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      loadPage(Number(btn.dataset.page));
      closeSidebar();
    });
  });

  // Intercept Text-TV internal page links and load them in the viewer
  viewer.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    // Strip leading slash, then take the first page number (e.g. "110-111" → 110)
    const clean = href.replace(/^\//, "").split("-")[0];
    const pageNum = parseInt(clean, 10);

    if (pageNum >= 100 && pageNum <= 899) {
      e.preventDefault();
      loadPage(pageNum);
    }
  });

  // Browse buttons — step one page at a time
  prevBtn.addEventListener("click", () => {
    if (currentPage > MIN_PAGE) loadPage(currentPage - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < MAX_PAGE) loadPage(currentPage + 1);
  });

  // Search field
  document.getElementById("goBtn").addEventListener("click", goToPage);
  document.getElementById("pageInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") goToPage();
  });

  // Mobile menu
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", openSidebar);
  document
    .getElementById("sidebarOverlay")
    .addEventListener("click", closeSidebar);

  // Close drawer with Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  // Load start page
  loadPage(100);
});
