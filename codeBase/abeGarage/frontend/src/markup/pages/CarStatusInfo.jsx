import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowRight, LuPackageSearch } from "react-icons/lu";
import { GearSpinner } from "../components/ui/garage";
import { getOrderByHash } from "../../services/order.service";

const NOT_FOUND_MESSAGE = "No order found for that key. Check the link from the garage and try again.";

function CarStatusInfo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Looks up ONE order through the public tracking endpoint. This page used
  // to download every order (with all their secret hashes) and compare in
  // the browser; once /api/orders required a login that list was empty and
  // every valid key was reported as wrong.
  const handleCheckOrder = async (event) => {
    event.preventDefault();
    const hash = customerInfo.trim();
    if (!hash) {
      setErrorMessage("Please enter your order key.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const order = await getOrderByHash(hash);
      if (Array.isArray(order) && order.length > 0) {
        navigate(`/customer_order/${encodeURIComponent(hash)}`);
      } else {
        // 404 NOT_FOUND, or 400 when the key is not even UUID-shaped
        setErrorMessage(NOT_FOUND_MESSAGE);
      }
    } catch (err) {
      console.error("Order lookup failed:", err);
      setErrorMessage("Could not check the order right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="gh-narrow-page gh-page">
      <div className="gh-card gh-lookup">
        <span className="gh-icon-tile gh-icon-tile-lg">
          <LuPackageSearch aria-hidden="true" />
        </span>
        <h1>Track your order</h1>
        <p className="gh-muted">
          Enter the order key from the link the garage sent you. You&apos;ll see the order&apos;s status and the
          services on it; no account needed.
        </p>

        <form onSubmit={handleCheckOrder} noValidate>
          <label htmlFor="customer_info" className="form-label">
            Order key
          </label>
          <input
            id="customer_info"
            type="text"
            name="customer_info"
            value={customerInfo}
            onChange={(event) => setCustomerInfo(event.target.value)}
            className="form-control"
            placeholder="e.g. 1e3ee1e9-f61f-467b-bc29-d5f8c34279ed"
            autoComplete="off"
            spellCheck={false}
          />

          {errorMessage && (
            <div className="gh-alert gh-alert-danger mt-3 mb-0" role="alert">
              {errorMessage}
            </div>
          )}

          <button className="btn btn-primary w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-2" type="submit" disabled={loading}>
            {loading ? <GearSpinner /> : null}
            {loading ? "Checking..." : "Check status"}
            {!loading && <LuArrowRight aria-hidden="true" />}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CarStatusInfo;
