import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LuClipboardList,
  LuContact,
  LuFilePlus2,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuSparkles,
  LuUserCog,
  LuUserPlus,
  LuUsers,
  LuWrench,
  LuX,
} from "react-icons/lu";
import Brand from "../components/ui/Brand";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import ThemeToggle from "../components/ui/ThemeToggle";
import { useAuth } from "../../Context/AuthContext";
import { logout } from "../../services/login.service";
import { canVisit, ROLE_LABELS } from "../../util/roles";

// Sidebar groups. Each link shows only if this role may open the page
// (util/roles.js PAGE_ROLES), so a link never leads to /unauthorized.
const NAV = [
  {
    label: "Workshop",
    items: [
      { to: "/admin", label: "Dashboard", icon: LuLayoutDashboard, end: true },
      { to: "/admin/orders", label: "Orders", icon: LuClipboardList },
      { to: "/admin/new-order", label: "New order", icon: LuFilePlus2 },
      { to: "/admin/smart-intake", label: "Smart intake (AI)", icon: LuSparkles, ai: true },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/all_customers", label: "Customers", icon: LuUsers },
      { to: "/admin/add_customers", label: "Add customer", icon: LuUserPlus },
      { to: "/admin/employee", label: "Employees", icon: LuContact },
      { to: "/admin/add-employee", label: "Add employee", icon: LuUserCog },
    ],
  },
  {
    label: "Catalog",
    items: [{ to: "/admin/service", label: "Services", icon: LuWrench }],
  },
];

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

export default function AdminLayout() {
  const { employee, roleId, aiStatus, isDemo, setIsLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // close the mobile menu after navigating
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const signOut = () => {
    logout();
    setIsLoggedIn(false);
    window.location.replace("/");
  };

  const firstName = employee?.employee_first_name || "";

  return (
    <div className={`gh-app ${menuOpen ? "gh-menu-open" : ""}`}>
      <aside className="gh-sidebar gh-tread" aria-label="Staff menu">
        <div className="gh-sidebar-head">
          <Brand to="/admin" light />
          <button type="button" className="gh-icon-btn gh-sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <LuX />
          </button>
        </div>
        <nav className="gh-nav" aria-label="Admin">
          {NAV.map((group) => {
            const items = group.items.filter((i) => canVisit(roleId, i.to) && (!i.ai || aiStatus));
            if (!items.length) return null;
            return (
              <div key={group.label} className="gh-nav-group">
                <div className="gh-nav-label">{group.label}</div>
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} className="gh-nav-link">
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="gh-sidebar-foot">
          <div className="gh-user">
            <span className="gh-avatar" aria-hidden="true">
              {initials(firstName)}
            </span>
            <span className="gh-user-text">
              <span className="gh-user-name">{firstName}</span>
              <span className="gh-user-role">{ROLE_LABELS[roleId] || ""}</span>
            </span>
          </div>
          <button type="button" className="gh-icon-btn" onClick={signOut} aria-label="Log out" title="Log out">
            <LuLogOut />
          </button>
        </div>
      </aside>
      <div className="gh-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="gh-main">
        <header className="gh-topbar">
          <button type="button" className="gh-icon-btn gh-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <LuMenu />
          </button>
          <div className="gh-topbar-greeting">
            Welcome back, <strong>{firstName}</strong>
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <ThemeToggle />
            <button type="button" className="btn btn-outline-secondary btn-sm d-none d-sm-inline-flex align-items-center gap-2" onClick={signOut}>
              <LuLogOut aria-hidden="true" /> Log out
            </button>
          </div>
        </header>
        {isDemo && (
          <div className="gh-demo-banner" role="note">
            You&apos;re using the read-only demo account: you can look around and try Smart intake, but changes are not saved.
          </div>
        )}
        <main className="gh-content" key={location.pathname}>
          <div className="gh-page">
            {/* keyed by path (on <main>): a crash on one page is cleared by navigating away */}
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
