"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";

import { primaryNav, site } from "@/data/site";

export default function FloatingNav() {
  const [active, setActive] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });

  /*
   * Detect scroll position
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
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
   * Update active indicator position
   */
  useEffect(() => {
    const updateIndicator = () => {
      const button = btnRefs.current[active];
      const container = containerRef.current;

      if (!button || !container) return;

      const buttonRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left,
      });
    };

    updateIndicator();

    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [active]);

  /*
   * Close mobile menu with Escape
   */
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  /*
   * Prevent body scrolling while mobile menu is open
   */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /*
   * Handle navigation click
   */
  const handleNavigation = (index: number, href: string) => {
    setActive(index);
    setMobileOpen(false);

    if (href.startsWith("#")) {
      const element = document.querySelector(href);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  return (
    <>
      {/* DESKTOP FLOATING NAV */}
      <div className="fixed bottom-6 left-1/2 z-50 hidden w-full max-w-4xl -translate-x-1/2 px-4 lg:block">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          ref={containerRef}
          className={`
            relative mx-auto flex items-center
            rounded-full border
            px-2 py-2
            shadow-[0_15px_50px_rgba(0,0,0,0.15)]
            backdrop-blur-xl
            transition-all duration-300
            ${
              scrolled
                ? "border-charcoal/10 bg-stone/95"
                : "border-white/20 bg-charcoal/85"
            }
          `}
        >
          {/* LOGO */}
          <a
            href="#top"
            onClick={() => setActive(0)}
            className="relative z-10 flex shrink-0 items-center gap-2 px-4"
          >
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full">
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
              className={`
                hidden font-display text-sm tracking-tight xl:block
                ${
                  scrolled
                    ? "text-charcoal"
                    : "text-white"
                }
              `}
            >
              {site.name}
            </span>
          </a>

          {/* DIVIDER */}
          <div
            className={`
              mx-2 h-7 w-px
              ${scrolled ? "bg-charcoal/10" : "bg-white/15"}
            `}
          />

          {/* NAVIGATION */}
          <nav className="relative flex flex-1 items-center justify-center">
            {primaryNav.map((link, index) => (
              <a
                key={link.href}
                ref={(element) => {
                  btnRefs.current[index] = element;
                }}
                href={link.href}
                onClick={(event) => {
                  if (link.href.startsWith("#")) {
                    event.preventDefault();
                    handleNavigation(index, link.href);
                  } else {
                    setActive(index);
                  }
                }}
                className={`
                  relative z-10 flex items-center justify-center
                  rounded-full px-4 py-3
                  font-body text-sm
                  transition-colors duration-200
                  ${
                    active === index
                      ? scrolled
                        ? "text-charcoal"
                        : "text-white"
                      : scrolled
                        ? "text-charcoal-soft hover:text-charcoal"
                        : "text-white/65 hover:text-white"
                  }
                `}
              >
                {link.label}
              </a>
            ))}

            {/* ACTIVE INDICATOR */}
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
              className={`
                pointer-events-none absolute inset-y-1 rounded-full
                ${
                  scrolled
                    ? "bg-charcoal/7"
                    : "bg-white/10"
                }
              `}
            />
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex shrink-0 items-center">
            <a
              href="#contact"
              className={`
                rounded-full px-5 py-3
                font-body text-sm font-medium
                transition-all duration-200
                ${
                  scrolled
                    ? "bg-charcoal text-stone hover:bg-moss"
                    : "bg-white text-charcoal hover:bg-stone"
                }
              `}
            >
              Contact
            </a>
          </div>
        </motion.div>
      </div>

      {/* MOBILE TOP BAR */}
      <header
        className={`
          fixed inset-x-0 top-0 z-50 lg:hidden
          transition-all duration-300
          ${
            scrolled || mobileOpen
              ? "border-b border-charcoal/10 bg-stone/95 shadow-sm backdrop-blur-xl"
              : "bg-transparent"
          }
        `}
      >
        <div className="flex h-20 items-center justify-between px-6">
          {/* MOBILE LOGO */}
          <a
            href="#top"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
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
              className={`
                font-display text-lg tracking-tight
                ${
                  scrolled || mobileOpen
                    ? "text-charcoal"
                    : "text-white"
                }
              `}
            >
              {site.name}
            </span>
          </a>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen((value) => !value)
            }
            className={`
              rounded-full p-2.5
              transition-colors
              ${
                scrolled || mobileOpen
                  ? "text-charcoal hover:bg-charcoal/5"
                  : "text-white hover:bg-white/10"
              }
            `}
          >
            {mobileOpen ? (
              <X
                className="h-6 w-6"
                strokeWidth={1.5}
              />
            ) : (
              <Menu
                className="h-6 w-6"
                strokeWidth={1.5}
              />
            )}
          </button>
        </div>
      </header>

      {/* MOBILE FULL SCREEN MENU */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="fixed inset-0 z-40 flex flex-col bg-stone px-6 pb-10 pt-24 lg:hidden"
          >
            <nav className="flex flex-1 flex-col justify-center">
              {primaryNav.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    if (link.href.startsWith("#")) {
                      event.preventDefault();
                      handleNavigation(
                        index,
                        link.href
                      );
                    }
                  }}
                  className="group flex items-center justify-between border-b border-charcoal/10 py-5"
                >
                  <span className="font-display text-3xl text-charcoal transition-transform duration-200 group-hover:translate-x-2">
                    {link.label}
                  </span>

                  <span className="font-body text-xs uppercase tracking-[0.2em] text-charcoal-soft">
                    0{index + 1}
                  </span>
                </a>
              ))}
            </nav>

            {/* MOBILE CONTACT */}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
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