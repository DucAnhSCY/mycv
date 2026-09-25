(() => {
  "use strict";

  document.documentElement.classList.add("js");

  function initializePortfolio() {
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("navToggle");
    const navLinksContainer = document.getElementById("navLinks");
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    const desktopViewport = window.matchMedia("(min-width: 901px)");

    function getHashTarget(hash) {
      if (!hash || hash === "#") return null;
      try {
        return document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        return null;
      }
    }

    // Native links retain their URL and browser history behavior.
    const sections = navLinks.flatMap((link) => {
      const section = getHashTarget(link.hash);
      return section ? [{ link, section }] : [];
    });

    function setMenuOpen(open, restoreFocus = false) {
      if (!navToggle || !navLinksContainer) return;

      const isOpen = open && !desktopViewport.matches;
      const focusWasInside = navLinksContainer.contains(document.activeElement);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
      navToggle.classList.toggle("is-open", isOpen);
      navLinksContainer.classList.toggle("is-open", isOpen);
      navLinksContainer.inert = !desktopViewport.matches && !isOpen;

      if (
        !isOpen &&
        !desktopViewport.matches &&
        (restoreFocus || focusWasInside)
      ) {
        navToggle.focus({ preventScroll: true });
      }
    }

    function isMenuOpen() {
      return navToggle?.getAttribute("aria-expanded") === "true";
    }

    if (navToggle && navLinksContainer) {
      navToggle.setAttribute("aria-controls", navLinksContainer.id);
      setMenuOpen(false);

      navToggle.addEventListener("click", () => setMenuOpen(!isMenuOpen()));

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isMenuOpen()) {
          event.preventDefault();
          setMenuOpen(false, true);
        }
      });

      document.addEventListener("pointerdown", (event) => {
        if (
          isMenuOpen() &&
          !navToggle.contains(event.target) &&
          !navLinksContainer.contains(event.target)
        ) {
          setMenuOpen(false);
        }
      });

      document.addEventListener("focusin", (event) => {
        if (
          isMenuOpen() &&
          !navToggle.contains(event.target) &&
          !navLinksContainer.contains(event.target)
        ) {
          setMenuOpen(false);
        }
      });

      // A resized menu must never leave desktop navigation inert.
      desktopViewport.addEventListener("change", () => setMenuOpen(false));
    }

    let scheduledFrame = false;
    let activeLink;

    function updateScrollState() {
      scheduledFrame = false;
      navbar?.classList.toggle("is-scrolled", window.scrollY > 16);
      if (!sections.length) return;

      const activationLine = (navbar?.getBoundingClientRect().height || 0) + 64;
      let currentLink = null;

      for (const { link, section } of sections) {
        if (section.getBoundingClientRect().top <= activationLine)
          currentLink = link;
      }

      const pageHeight = document.documentElement.scrollHeight;
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= pageHeight - 2
      ) {
        currentLink = sections[sections.length - 1].link;
      }

      if (activeLink === currentLink) return;
      activeLink = currentLink;
      for (const link of navLinks) {
        const isActive = link === currentLink;
        link.classList.toggle("is-active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }

    function scheduleScrollUpdate() {
      if (scheduledFrame) return;
      scheduledFrame = true;
      window.requestAnimationFrame(updateScrollState);
    }

    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
    window.addEventListener("load", scheduleScrollUpdate, { once: true });
    updateScrollState();

    const filterButtons = Array.from(
      document.querySelectorAll(".filter-button"),
    );
    const projectCards = Array.from(document.querySelectorAll(".project-card"));
    const projectCount = document.getElementById("projectCount");

    function filterProjects(filter) {
      let visibleCount = 0;
      for (const card of projectCards) {
        const categories = (card.dataset.category || "").split(/\s+/);
        const visible = filter === "all" || categories.includes(filter);
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      }

      for (const button of filterButtons) {
        const isActive = button.dataset.filter === filter;
        button.setAttribute("aria-pressed", String(isActive));
        button.classList.toggle("is-active", isActive);
      }

      if (projectCount) {
        projectCount.textContent = `${visibleCount} ${visibleCount === 1 ? "project" : "projects"}`;
      }
      scheduleScrollUpdate();
    }

    for (const button of filterButtons) {
      button.addEventListener("click", () =>
        filterProjects(button.dataset.filter || "all"),
      );
    }
    if (projectCards.length) filterProjects("all");

    function revealHashTarget(target) {
      const project = target?.closest(".project-card");
      if (!project?.hidden) return false;
      filterProjects("all");
      return true;
    }

    function focusDestination(target) {
      // Sections and cards become focusable only for this navigation.
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          { once: true },
        );
      }
      target.focus({ preventScroll: true });
    }

    document.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const link = event.target.closest("a[href]");
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self") ||
        link.origin !== window.location.origin ||
        link.pathname !== window.location.pathname ||
        link.search !== window.location.search
      )
        return;

      const target = getHashTarget(link.hash);
      if (!target) return;

      // Reveal before the browser scrolls, including a repeated hash link.
      revealHashTarget(target);
      setMenuOpen(false);
      focusDestination(target);
    });

    window.addEventListener("hashchange", () => {
      const target = getHashTarget(window.location.hash);
      if (revealHashTarget(target)) {
        // History navigation may have tried scrolling while the card was hidden.
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }
      if (target) focusDestination(target);
      scheduleScrollUpdate();
    });

    const currentYear = document.getElementById("currentYear");
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePortfolio, {
      once: true,
    });
  } else {
    initializePortfolio();
  }
})();
