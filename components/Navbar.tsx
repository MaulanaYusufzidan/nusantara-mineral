"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";

import { primaryNav, site } from "@/data/site";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });

  // The CTA button already covers "Contact", so it's excluded here to
  // avoid showing it twice in the nav list. Memoized so the array
  // reference stays stable across renders (used as an effect dependency).
  const navLinks = useMemo(
    () =>
      primaryNav.filter(
        (link) =>
          link.href.toLowerCase() !== "#contact" &&
          link.label.trim().toLowerCase() !== "contact"
      ),
    []
  );

  /*
   * Detect scroll position (throttled via rAF)
   */
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        ticking = false;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
   * Update active indicator.
   * Runs after the layout/transition triggered by `scrolled` has had a
   * chance to settle, so we don't measure a stale mid-transition rect.
   */
  useEffect(() => {
    const updateIndicator = () => {
      const activeNav = navRefs.current[active];
      const navContainer = navContainerRef.current;

      if (!activeNav || !navContainer) {
        // `active` points at something outside navLinks (e.g. the Contact
        // CTA), so there's no pill to align to — hide it instead of
        // leaving it stuck at its last position.
        setIndicatorStyle({ width: 0, left: 0 });
        return;
      }

      const navRect = activeNav.getBoundingClientRect();
      // Measured against the <nav> element itself, since that's the
      // positioned ancestor the indicator pill is actually placed in —
      // not the outer header container (which also includes the logo).
      const containerRect = navContainer.getBoundingClientRect();

      setIndicatorStyle({
        width: navRect.width,
        left: navRect.left - containerRect.left,
      });
    };

    // Measure once immediately (covers plain active-tab changes)...
    const rafId = requestAnimationFrame(updateIndicator);

    // ...and again after the scrolled-state layout transition finishes.
    const timeoutId = window.setTimeout(updateIndicator, 380);

    window.addEventListener("resize", updateIndicator);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [active, scrolled]);

  /*
   * Escape closes mobile menu
   */
  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  /*
   * Lock body scroll on mobile menu
   */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /*
   * Focus management for the mobile menu:
   * - move focus into the menu when it opens
   * - trap Tab/Shift+Tab within it while open
   * - return focus to the toggle button when it closes
   */
  useEffect(() => {
    if (!mobileOpen) return;

    const menu = mobileMenuRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );

    focusable?.[0]?.focus();

    const handleTrap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTrap);

    return () => {
      document.removeEventListener("keydown", handleTrap);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  /*
   * Scrollspy: keep `active` in sync with whichever section is actually
   * in view while the user scrolls manually (not just on click).
   */
  useEffect(() => {
    const sections = navLinks
      .map((link, index) => ({
        index,
        element: link.href.startsWith("#")
          ? document.querySelector(link.href)
          : null,
      }))
      .filter(
        (entry): entry is { index: number; element: Element } =>
          entry.element !== null
      );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible.length === 0) return;

        const matched = sections.find(
          (section) => section.element === visible[0].target
        );

        if (matched) setActive(matched.index);
      },
      {
        // Treat a section as "current" once it's scrolled up near the
        // fixed navbar, rather than only once it's fully in view.
        rootMargin: "-100px 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach(({ element }) => observer.observe(element));

    return () => observer.disconnect();
  }, [navLinks]);

  /*
   * Navigation handler
   */
  const handleNavigation = useCallback(
    (index: number, href: string) => {
      setActive(index);
      setMobileOpen(false);

      if (!href.startsWith("#")) return;

      const target = document.querySelector(href);

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    []
  );

  const setNavRef = useCallback(
    (index: number) => (element: HTMLAnchorElement | null) => {
      navRefs.current[index] = element;
    },
    []
  );

  return (
    <>
      {/* =====================================================
          DESKTOP NAVBAR
          TOP → FLOATING BOTTOM
          ===================================================== */}

      <motion.header
        initial={false}
        animate={{
          top: scrolled ? "auto" : 0,
          bottom: scrolled ? 24 : "auto",
          left: scrolled ? "50%" : 0,
          right: scrolled ? "auto" : 0,
          x: scrolled ? "-50%" : 0,
          width: scrolled ? "min(100% - 32px, 1152px)" : "100%",
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
          mass: 0.8,
        }}
        className={`fixed z-50 hidden lg:block ${
          scrolled ? "rounded-full" : ""
        }`}
      >
        <motion.div
          ref={containerRef}
          animate={{
            borderRadius: scrolled ? 9999 : 0,
            backgroundColor: scrolled
              ? "rgba(244, 241, 234, 0.8)"
              : "rgba(0, 0, 0, 0)",
            boxShadow: scrolled
              ? "0 15px 50px rgba(0,0,0,0.14)"
              : "0 0 0 rgba(0,0,0,0)",
            borderColor: scrolled
              ? "rgba(28,26,22,0.10)"
              : "rgba(255,255,255,0)",
          }}
          transition={{
            duration: 0.35,
            ease: "easeInOut",
          }}
          className={`relative mx-auto flex h-20 items-center border px-6 lg:px-10 ${
            scrolled ? "backdrop-blur-xl" : ""
          }`}
        >
          {/* =================================================
              LOGO
              ================================================= */}

          <motion.a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              handleNavigation(0, "#top");
            }}
            animate={{
              scale: scrolled ? 0.92 : 1,
            }}
            transition={{
              duration: 0.25,
            }}
            className="relative z-20 flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm">
              <Image
                src="/images/logo.png"
                alt={site.name}
                width={36}
                height={36}
                priority
                className="h-full w-full object-cover"
              />
            </span>

            <motion.span
              animate={{
                color: scrolled ? "var(--color-charcoal)" : "#ffffff",
              }}
              className="font-display text-lg tracking-tight"
            >
              {site.name}
            </motion.span>
          </motion.a>

          {/* =================================================
              NAVIGATION
              ================================================= */}

          <nav
            ref={navContainerRef}
            className={`relative flex flex-1 items-center justify-center ${
              scrolled ? "gap-0" : "gap-8"
            }`}
          >
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                ref={setNavRef(index)}
                href={link.href}
                aria-current={active === index ? "page" : undefined}
                onClick={(event) => {
                  if (link.href.startsWith("#")) {
                    event.preventDefault();
                    handleNavigation(index, link.href);
                  } else {
                    setActive(index);
                  }
                }}
                className={`relative z-10 flex items-center justify-center rounded-full font-body text-sm transition-all duration-300 ${
                  scrolled ? "px-4 py-3" : "px-0 py-3"
                } ${
                  scrolled
                    ? "text-charcoal-soft hover:text-charcoal"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}

            {/* ACTIVE INDICATOR */}

            {scrolled && (
              <motion.div
                animate={{
                  width: indicatorStyle.width,
                  x: indicatorStyle.left,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
                className="pointer-events-none absolute left-0 inset-y-1 rounded-full bg-charcoal/[0.07]"
              />
            )}
          </nav>

          {/* =================================================
              CONTACT
              ================================================= */}

          <motion.div
            animate={{
              scale: scrolled ? 0.95 : 1,
            }}
            className="relative z-20 shrink-0"
          >
            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                handleNavigation(navLinks.length, "#contact");
              }}
              className={`inline-flex items-center justify-center rounded-full px-5 py-3 font-body text-sm font-medium transition-all duration-300 ${
                scrolled
                  ? "bg-charcoal text-stone hover:bg-moss"
                  : "border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-charcoal"
              }`}
            >
              Contact
            </a>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* =====================================================
          MOBILE NAVBAR
          ===================================================== */}

      <header
        className={`fixed inset-x-0 top-0 z-50 lg:hidden transition-all duration-300 ${
          mobileOpen
            ? "bg-stone"
            : scrolled
              ? "border-b border-charcoal/10 bg-stone/95 shadow-sm backdrop-blur-xl"
              : "bg-transparent"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          {/* MOBILE LOGO */}

          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              handleNavigation(0, "#top");
            }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm">
              <Image
                src="/images/logo.png"
                alt={site.name}
                width={36}
                height={36}
                priority
                className="h-full w-full object-cover"
              />
            </span>

            <span
              className={`font-display text-lg tracking-tight ${
                scrolled || mobileOpen ? "text-charcoal" : "text-white"
              }`}
            >
              {site.name}
            </span>
          </a>

          {/* MOBILE BUTTON */}

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((value) => !value)}
            className={`inline-flex rounded-full p-2.5 transition-colors ${
              scrolled || mobileOpen
                ? "text-charcoal hover:bg-charcoal/5"
                : "text-white hover:bg-white/10"
            }`}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </header>

      {/* =====================================================
          MOBILE FULLSCREEN MENU
          ===================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-40 flex flex-col bg-stone px-6 pb-10 pt-24 lg:hidden"
          >
            <nav className="flex flex-1 flex-col justify-center">
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  aria-current={active === index ? "page" : undefined}
                  onClick={(event) => {
                    if (link.href.startsWith("#")) {
                      event.preventDefault();
                      handleNavigation(index, link.href);
                    } else {
                      setMobileOpen(false);
                    }
                  }}
                  className="group flex items-center justify-between border-b border-charcoal/10 py-5"
                >
                  <span className="font-display text-3xl text-charcoal transition-transform duration-200 group-hover:translate-x-2">
                    {link.label}
                  </span>

                  <span className="font-body text-xs uppercase tracking-[0.2em] text-charcoal-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </a>
              ))}
            </nav>

            {/* MOBILE CONTACT */}

            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                handleNavigation(navLinks.length, "#contact");
              }}
              className="mt-6 flex items-center justify-center rounded-full bg-charcoal px-6 py-4 font-body text-sm font-medium text-stone transition-colors hover:bg-moss"
            >
              Contact Us
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
