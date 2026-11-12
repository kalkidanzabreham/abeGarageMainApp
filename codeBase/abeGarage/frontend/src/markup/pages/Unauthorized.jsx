import { Link } from "react-router-dom";
import { LuArrowLeft, LuLock } from "react-icons/lu";
import { useAuth } from "../../Context/AuthContext";
import { ROLE_LABELS } from "../../util/roles";

// Where the route guards send a logged-in user who opens a page their role
// can't use (util/roles.js PAGE_ROLES).
function Unauthorized() {
  const { isLoggedIn, roleId } = useAuth();
  return (
    <section className="gh-narrow-page gh-page">
      <div className="gh-card gh-lookup text-center">
        <span className="gh-icon-tile gh-icon-tile-lg mx-auto">
          <LuLock aria-hidden="true" />
        </span>
        <h1>You don&apos;t have access to this page</h1>
        <p className="gh-muted">
          {isLoggedIn && ROLE_LABELS[roleId]
            ? `Your role (${ROLE_LABELS[roleId]}) can't open it. Ask an admin if you need access.`
            : "Log in with an account that has access to this page."}
        </p>
        <Link to={isLoggedIn ? "/admin" : "/login"} className="btn btn-primary d-inline-flex align-items-center gap-2">
          <LuArrowLeft aria-hidden="true" /> {isLoggedIn ? "Back to the dashboard" : "Log in"}
        </Link>
      </div>
    </section>
  );
}

export default Unauthorized;
