// script.js — startsidans logik
// Hämtar preview-innehåll för de tre korten och hanterar sidbyte via sökrutan

/**
 * Strips most HTML tags from Text-TV content and returns plain text.
 * Keeps newlines for readability.
 */
function stripHTML(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

/**
 * Renders fetched Text-TV data into a preview card.
 * Shows the first subpage's plain text, clamped visually via CSS.
 */
function renderPreview(containerId, pages) {
  const el = document.getElementById(containerId);
  if (!el) return;

  fetch(`/api/page/${pages}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const firstPage = data[0];
      if (!firstPage) throw new Error("Tom sida");

      // Combine all content blocks into one string
      const rawHTML = Array.isArray(firstPage.content)
        ? firstPage.content.join("\n")
        : firstPage.content || "";

      const text = stripHTML(rawHTML).trim();

      el.setAttribute("aria-busy", "false");
      el.innerHTML = `<div class="texttv-content">${text || "Ingen data tillgänglig."}</div>`;
    })
    .catch(() => {
      el.setAttribute("aria-busy", "false");
      el.innerHTML = '<p class="error-msg">Kunde inte ladda innehåll.</p>';
    });
}

// ── Navigation: go to page on Enter or button click ──
function goToPage() {
  const input = document.getElementById("pageInput");
  const page = parseInt(input.value, 10);

  if (!page || page < 100 || page > 899) {
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }

  input.removeAttribute("aria-invalid");
  window.location.href = `/custom.html?page=${page}`;
}

/**
 * Scrolls so the target element appears vertically centered in the viewport,
 * but never scrolls above the topbar.
 */
function scrollToCenter(el) {
  const topbar = document.querySelector(".topbar");
  const topbarH = topbar ? topbar.getBoundingClientRect().height : 0;
  const rect = el.getBoundingClientRect();
  const elCenter = rect.top + window.scrollY + rect.height / 2;
  const viewportCenter = (window.innerHeight - topbarH) / 2 + topbarH;
  const target = elCenter - viewportCenter;

  window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  // Intercept anchor clicks in nav and scroll to center instead.
  // Hem (#main-content) scrolls to the very top; all other anchors center their card.
  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      document.querySelectorAll(".nav-link").forEach((l) => {
        l.classList.remove("active");
        l.removeAttribute("aria-current");
      });
      link.classList.add("active");
      link.setAttribute("aria-current", "page");

      const href = link.getAttribute("href");
      if (href === "#main-content") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) scrollToCenter(target);
    });
  });

  // Load all four preview cards in parallel
  renderPreview("start-nyheter", "100");
  renderPreview("start-utrikes", "104");
  renderPreview("start-sport", "300");
  renderPreview("start-vader", "401");

  // Search button
  const goBtn = document.getElementById("goBtn");
  if (goBtn) {
    goBtn.addEventListener("click", goToPage);
  }

  // Enter key in input
  const input = document.getElementById("pageInput");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goToPage();
    });
  }
});
