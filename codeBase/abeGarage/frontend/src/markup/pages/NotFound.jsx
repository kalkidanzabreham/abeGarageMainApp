import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { Gauge } from "../components/ui/garage";

function NotFound() {
  return (
    <section className="gh-narrow-page gh-page">
      <div className="gh-card gh-lookup text-center">
        <Gauge value={0} size={140} className="mx-auto d-block gh-gauge-stalled" />
        <div className="gh-error-code">404</div>
        <h1>Engine stalled: page not found</h1>
        <p className="gh-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link to="/" className="btn btn-primary d-inline-flex align-items-center gap-2">
          <LuArrowLeft aria-hidden="true" /> Back to the home page
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
