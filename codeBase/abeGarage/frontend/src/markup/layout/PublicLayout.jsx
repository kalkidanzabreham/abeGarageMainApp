import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LuArrowRight, LuGithub, LuMenu, LuX } from "react-icons/lu";
import Brand from "../components/ui/Brand";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useAuth } from "../../Context/AuthContext";

const REPO_URL = "https://github.com/kalkidanzabreham/abeGarageMainApp";

const LINKS = [
  { to: "/#features", label: "Features" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/customer_info", label: "Track an order" },
];

export default function PublicLayout() {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  // scroll to /#section links after navigation
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cta = isLoggedIn ? (
    <Link to="/admin" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2">
      Dashboard <LuArrowRight aria-hidden="true" />
    </Link>
  ) : (
    <Link to="/login" className="btn btn-primary btn-sm">
      Log in
    </Link>
  );

  return (
    <div className="gh-public">
      <header className={`gh-navbar ${scrolled ? "gh-navbar-scrolled" : ""}`}>
        <div className="container gh-navbar-inner">
          <Brand />
          <nav className={`gh-navlinks ${open ? "gh-navlinks-open" : ""}`} aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className="gh-navlink">
                {l.label}
              </NavLink>
            ))}
            <div className="gh-navlinks-cta d-md-none">{cta}</div>
          </nav>
          <div className="d-flex align-items-center gap-2">
            <ThemeToggle />
            <span className="d-none d-md-inline-flex">{cta}</span>
            <button
              type="button"
              className="gh-icon-btn d-md-none"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <LuX /> : <LuMenu />}
            </button>
          </div>
        </div>
      </header>

      <main key={location.pathname}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="gh-footer">
        <div className="container">
          <div className="gh-footer-grid">
            <div>
              <Brand />
              <p className="gh-muted mt-3 mb-0" style={{ maxWidth: 360 }}>
                Workshop management for a small repair garage: customers, vehicles, orders, and AI-drafted job cards
                that a person always confirms.
              </p>
            </div>
            <div>
              <div className="gh-footer-title">Product</div>
              <Link to="/#features">Features</Link>
              <Link to="/#how-it-works">How it works</Link>
              <Link to="/customer_info">Track an order</Link>
            </div>
            <div>
              <div className="gh-footer-title">Project</div>
              <Link to="/login">Staff login</Link>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="d-inline-flex align-items-center gap-1">
                <LuGithub aria-hidden="true" /> Source code
              </a>
            </div>
          </div>
          <div className="gh-footer-bottom">
            <span>© {new Date().getFullYear()} GarageHub. A portfolio demo; customer data is fictional.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
