/* ============================================================
   Getting Started at NDHU — interactions
   Mobile menu, copy-to-clipboard buttons, back-to-top button,
   and active section highlighting. Vanilla JS, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktopQuery = window.matchMedia("(min-width: 900px)");

  /* ---------- Mobile menu ---------- */

  var navToggle = document.getElementById("nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function setMenuOpen(open) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    // Close the menu after choosing a section.
    navMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    // Close on Escape and return focus to the toggle button.
    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        navToggle.getAttribute("aria-expanded") === "true"
      ) {
        setMenuOpen(false);
        navToggle.focus();
      }
    });

    // Reset state when switching between mobile and desktop layouts.
    var onViewportChange = function () {
      if (desktopQuery.matches) setMenuOpen(false);
    };
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onViewportChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(onViewportChange);
    }
  }

  /* ---------- Copy to clipboard ---------- */

  var statusRegion = document.getElementById("copy-status");
  var isMac = /Mac|iPhone|iPad|iPod/.test(
    navigator.platform || navigator.userAgent
  );
  var copyShortcut = isMac ? "⌘+C" : "Ctrl+C";

  function announce(message) {
    if (!statusRegion) return;
    // Clear first so identical messages are announced again.
    statusRegion.textContent = "";
    window.setTimeout(function () {
      statusRegion.textContent = message;
    }, 50);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      document.body.appendChild(textarea);
      textarea.select();
      var succeeded = false;
      try {
        succeeded = document.execCommand("copy");
      } catch (err) {
        succeeded = false;
      }
      document.body.removeChild(textarea);
      succeeded ? resolve() : reject(new Error("copy-failed"));
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        // Clipboard API unavailable (permissions, hidden tab): try the classic path.
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  document.querySelectorAll(".copy-btn").forEach(function (button) {
    var label = button.querySelector(".copy-btn__label");
    var resetTimer = null;

    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy") || "";
      if (!text) return;

      if (resetTimer) {
        window.clearTimeout(resetTimer);
        resetTimer = null;
      }

      copyText(text)
        .then(function () {
          button.classList.add("is-copied");
          if (label) label.textContent = "Copied";
          button.setAttribute("aria-label", "Copied: " + text);
          announce("Copied to clipboard: " + text);
          resetTimer = window.setTimeout(function () {
            button.classList.remove("is-copied");
            if (label) label.textContent = "Copy";
            button.removeAttribute("aria-label");
            resetTimer = null;
          }, 2000);
        })
        .catch(function () {
          if (label) label.textContent = "Press " + copyShortcut;
          announce(
            "Copying failed. Select the text and press " +
              copyShortcut +
              " to copy it."
          );
          window.setTimeout(function () {
            if (label) label.textContent = "Copy";
          }, 3000);
        });
    });
  });

  /* ---------- Back to top ---------- */

  var backToTop = document.getElementById("back-to-top");
  var hero = document.getElementById("top");
  var scrollThreshold = 450;

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      if (prefersReducedMotion.matches) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
        // If the browser refuses to animate (background tab, blocked smooth
        // scrolling), fall back to an instant jump so the button always works.
        window.setTimeout(function () {
          if (window.scrollY > 0) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }
        }, 600);
      }
      if (hero) hero.focus({ preventScroll: true });
    });
  }

  /* ---------- In-page links: guarantee the jump lands ---------- */

  document.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    var hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    var target = document.querySelector(hash);
    if (!target) return;

    // CSS smooth scrolling can be blocked (hidden tab, some browser states),
    // which would leave the link looking broken. Make sure we land there.
    window.setTimeout(function () {
      var rect = target.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.6 || rect.top < 0) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 600);
  });

  /* ---------- Highlight the section currently being read ---------- */

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.navbar__menu a[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  function setActiveSection(id) {
    navLinks.forEach(function (link) {
      var isCurrent = link.getAttribute("href") === "#" + id;
      if (isCurrent) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /* One scroll handler drives both the back-to-top button and the
     active navigation link, so nothing depends on animation frames. */
  function onScroll() {
    if (backToTop) {
      backToTop.classList.toggle("is-visible", window.scrollY > scrollThreshold);
    }

    var marker = window.scrollY + window.innerHeight * 0.35;
    var currentId = null;
    sections.forEach(function (section) {
      if (section.offsetTop <= marker) currentId = section.id;
    });
    setActiveSection(currentId);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Make wide tables keyboard-scrollable ---------- */

  document.querySelectorAll(".table-wrap").forEach(function (wrapper) {
    if (wrapper.scrollWidth > wrapper.clientWidth) {
      wrapper.setAttribute("tabindex", "0");
      wrapper.setAttribute(
        "aria-label",
        "Table, scroll horizontally to see more"
      );
    }
  });
})();
