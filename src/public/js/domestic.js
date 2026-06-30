// domestic.js — inrikesnyheter
// Hanterar tab-navigation och hämtar Text-TV-sidor 101–103

const viewer = document.getElementById("viewer-inrikes");
const tabs = document.querySelectorAll("#tabs-inrikes .tab");

/**
 * Renders a Text-TV page in the viewer panel.
 * The API returns an array of subpages; we show the first.
 */
async function loadPage(pageNum) {
  if (!viewer) return;

  try {
    const res = await fetch(`/api/page/${pageNum}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const firstPage = data[0];
    if (!firstPage) throw new Error("Tom sida");

    // Content is an array of HTML strings — join them
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

/**
 * Activates a tab and updates ARIA attributes.
 */
function activateTab(tab) {
  tabs.forEach((t) => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });

  tab.classList.add("active");
  tab.setAttribute("aria-selected", "true");

  // Update tabpanel's aria-labelledby to match active tab
  viewer.setAttribute("aria-labelledby", tab.id);
}

document.addEventListener("DOMContentLoaded", () => {
  // Set up tab click handlers
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
      loadPage(tab.dataset.page);
    });
  });

  // Keyboard navigation within tablist (left/right arrow keys)
  const tablist = document.getElementById("tabs-inrikes");
  if (tablist) {
    tablist.addEventListener("keydown", (e) => {
      const allTabs = [...tabs];
      const currentIndex = allTabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let next = null;
      if (e.key === "ArrowRight")
        next = allTabs[currentIndex + 1] ?? allTabs[0];
      if (e.key === "ArrowLeft")
        next = allTabs[currentIndex - 1] ?? allTabs[allTabs.length - 1];

      if (next) {
        next.focus();
        activateTab(next);
        loadPage(next.dataset.page);
        e.preventDefault();
      }
    });
  }

  // Search box
  const goBtn = document.getElementById("goBtn");
  const input = document.getElementById("pageInput");

  function goToPage() {
    const page = parseInt(input?.value, 10);
    if (!page || page < 100 || page > 899) {
      input?.setAttribute("aria-invalid", "true");
      input?.focus();
      return;
    }
    input?.removeAttribute("aria-invalid");
    window.location.href = `/custom.html?page=${page}`;
  }

  goBtn?.addEventListener("click", goToPage);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goToPage();
  });

  // Load the default tab (101) on page load
  const defaultTab = tabs[0];
  if (defaultTab) {
    activateTab(defaultTab);
    loadPage(defaultTab.dataset.page);
  }
});
