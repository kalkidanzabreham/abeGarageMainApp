import { Link } from "react-router-dom";
import { LuArrowLeft, LuCompass } from "react-icons/lu";

function NotFound() {
  return (
    <section className="gh-narrow-page gh-page">
      <div className="gh-card gh-lookup text-center">
        <span className="gh-icon-tile gh-icon-tile-lg mx-auto">
          <LuCompass aria-hidden="true" />
        </span>
        <div className="gh-error-code">404</div>
        <h1>This page took a wrong turn</h1>
        <p className="gh-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link to="/" className="btn btn-primary d-inline-flex align-items-center gap-2">
          <LuArrowLeft aria-hidden="true" /> Back to the home page
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
