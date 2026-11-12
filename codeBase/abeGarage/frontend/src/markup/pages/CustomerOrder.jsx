import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuSearchX } from "react-icons/lu";
import { getOrderByHash } from "../../services/order.service";
import OrderDetails from "../components/OrderDetails/OrderDetails";

// The customer's tracking page: /customer_order/:hash, no login.
function CustomerOrder() {
  const { order_hash } = useParams();
  const [state, setState] = useState({ loading: true, order: null });

  useEffect(() => {
    let cancelled = false;
    getOrderByHash(order_hash)
      .then((data) => !cancelled && setState({ loading: false, order: Array.isArray(data) ? data[0] ?? null : null }))
      .catch(() => !cancelled && setState({ loading: false, order: null }));
    return () => {
      cancelled = true;
    };
  }, [order_hash]);

  return (
    <section className="container py-4 py-md-5 gh-page" style={{ maxWidth: 960 }}>
      <Link to="/customer_info" className="gh-back-link mb-3">
        <LuArrowLeft aria-hidden="true" /> Track another order
      </Link>
      {state.loading ? (
        <div className="d-grid gap-3 mt-3" aria-busy="true">
          <div className="gh-skeleton" style={{ height: 180 }} />
          <div className="gh-skeleton" style={{ height: 140 }} />
        </div>
      ) : !state.order ? (
        <div className="gh-card gh-lookup text-center mx-auto mt-3">
          <span className="gh-icon-tile gh-icon-tile-lg mx-auto">
            <LuSearchX aria-hidden="true" />
          </span>
          <h1>Order not found</h1>
          <p className="gh-muted">Check the link from the garage, or enter the order key again.</p>
          <Link to="/customer_info" className="btn btn-primary">
            Check again
          </Link>
        </div>
      ) : (
        <div className="mt-3">
          <OrderDetails
            order={state.order}
            intro="We'll keep this page up to date as your car moves through the workshop. Check back any time."
          />
        </div>
      )}
    </section>
  );
}

export default CustomerOrder;
