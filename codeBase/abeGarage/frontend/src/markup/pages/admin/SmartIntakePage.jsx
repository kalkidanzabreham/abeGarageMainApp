import AdminMenu from "../../components/Admin/AdminMenu/AdminMenu";
import SmartIntake from "../../components/SmartIntake/SmartIntake";
import { useAuth } from "../../../Context/AuthContext";

// Try smart intake without creating an order (also how the Demo account,
// which can't create orders, can see the feature).
function SmartIntakePage() {
  const { aiStatus } = useAuth();
  return (
    <div className="container-fluid admin-pages">
      <div className="row">
        <div className="col-md-3 admin-left-side">
          <AdminMenu />
        </div>
        <div className="col-md-9 admin-right-side">
          <section className="contact-section">
            <div className="auto-container">
              <div className="contact-title">
                <h2>Smart job intake</h2>
              </div>
              {aiStatus ? (
                <SmartIntake />
              ) : (
                <p>Smart intake is not available.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SmartIntakePage;
