import SmartIntake from "../../components/SmartIntake/SmartIntake";
import { useAuth } from "../../../Context/AuthContext";

// Try smart intake without creating an order (also how the Demo account,
// which can't create orders, can see the feature).
function SmartIntakePage() {
  const { aiStatus } = useAuth();
  return (
    <>
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
      </>
  );
}

export default SmartIntakePage;
