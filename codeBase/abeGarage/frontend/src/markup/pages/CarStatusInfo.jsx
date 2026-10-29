import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PulseLoader } from "react-spinners";
import { getOrderByHash } from "../../services/order.service";

const NOT_FOUND_MESSAGE =
  "No order found for that key. Check the link from the garage and try again.";

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
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
      <div
        className="card p-5 shadow-lg border-0 rounded order_card"
        style={{ maxWidth: "500px", width: "100%" }}
      >
        <h3 className="text-center mb-4">
          Welcome! 🚗 <br />
          Access your car status by entering your secret hash key.
        </h3>

        <form onSubmit={handleCheckOrder}>
          <div className="form-group mb-3 mt-4">
            <input
              type="text"
              name="customer_info"
              value={customerInfo}
              onChange={(event) => setCustomerInfo(event.target.value)}
              className="form-control p-2"
              placeholder="Insert your secret hash key here"
              required
            />
          </div>

          {errorMessage && (
            <p className="text-danger text-center" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="form-group text-center mt-1">
            <button
              className="theme-btn btn-style-one w-100"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? (
                  <div>
                    <span>Please wait </span>
                    <PulseLoader size={10} color={"#123abc"} />
                  </div>
                ) : (
                  "Check Status"
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CarStatusInfo;
