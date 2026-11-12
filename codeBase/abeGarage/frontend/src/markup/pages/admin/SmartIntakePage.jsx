import { Link } from "react-router-dom";
import { LuArrowRight, LuInfo } from "react-icons/lu";
import SmartIntake from "../../components/SmartIntake/SmartIntake";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../../Context/AuthContext";

// Try smart intake without creating an order (also how the Demo account,
// which can't create orders, can see the feature).
function SmartIntakePage() {
  const { aiStatus, can } = useAuth();
  return (
    <>
      <PageHeader title="Smart job intake" subtitle="Try the AI draft on its own. Nothing on this page is saved." />
      {aiStatus ? (
        <div className="gh-split">
          <SmartIntake />
          <aside className="gh-card gh-sticky gh-intake-help" aria-label="How drafts become orders">
            <div className="d-flex align-items-center gap-2 mb-2">
              <LuInfo aria-hidden="true" />
              <strong>Turning a draft into an order</strong>
            </div>
            <ol className="gh-help-steps">
              <li>Open New order and pick the customer and their vehicle.</li>
              <li>Smart intake appears on the order form: draft the job card there.</li>
              <li>Untick what doesn&apos;t fit, add the rest to the order, and submit.</li>
            </ol>
            {can("orders:create") ? (
              <Link to="/admin/new-order" className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2">
                Go to New order <LuArrowRight aria-hidden="true" />
              </Link>
            ) : (
              <p className="gh-muted small m-0">Managers and admins create orders; this account can try drafts here.</p>
            )}
          </aside>
        </div>
      ) : (
        <div className="gh-card gh-empty">
          <p>Smart intake is not available.</p>
        </div>
      )}
    </>
  );
}

export default SmartIntakePage;
