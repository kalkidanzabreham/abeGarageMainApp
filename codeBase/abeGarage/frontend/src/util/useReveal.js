import { useEffect } from "react";

// Fades .gh-reveal elements in as they scroll into view. Content is
// visible by default: the hiding only starts once this hook has set up the
// observer, and never with reduced motion or without IntersectionObserver.
export default function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return undefined;

    const els = Array.from(document.querySelectorAll(".gh-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    for (const el of els) {
      el.classList.add("gh-reveal-armed");
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
}
