import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuExternalLink, LuPencil, LuSearchX } from "react-icons/lu";
import { getOrderById } from "../../../services/order.service";
import { useAuth } from "../../../Context/AuthContext";
import OrderDetails from "../OrderDetails/OrderDetails";

// Staff view of one order: /admin/orders/:order_id
function ViewSingleOrder() {
  const { order_id } = useParams();
  const { can } = useAuth();
  const [state, setState] = useState({ loading: true, order: null });

  useEffect(() => {
    let cancelled = false;
    getOrderById(order_id)
      .then((data) => !cancelled && setState({ loading: false, order: Array.isArray(data) ? data[0] ?? null : null }))
      .catch(() => !cancelled && setState({ loading: false, order: null }));
    return () => {
      cancelled = true;
    };
  }, [order_id]);

  if (state.loading) {
    return (
      <div className="d-grid gap-3" aria-busy="true">
        <div className="gh-skeleton" style={{ height: 200 }} />
        <div className="gh-skeleton" style={{ height: 160 }} />
      </div>
    );
  }

  if (!state.order) {
    return (
      <div className="gh-card gh-lookup text-center mx-auto">
        <span className="gh-icon-tile gh-icon-tile-lg mx-auto">
          <LuSearchX aria-hidden="true" />
        </span>
        <h1>Order not found</h1>
        <p className="gh-muted">It may have been removed, or the link is wrong.</p>
        <Link to="/admin/orders" className="btn btn-primary">
          Back to orders
        </Link>
      </div>
    );
  }

  const order = state.order;
  return (
    <>
      <Link to="/admin/orders" className="gh-back-link mb-3">
        <LuArrowLeft aria-hidden="true" /> All orders
      </Link>
      <div className="mt-3">
        <OrderDetails
          order={order}
          actions={
            <>
              {can("orders:update") && (
                <Link to={`/admin/edit-order/${order.order_id}`} className="btn btn-primary d-inline-flex align-items-center gap-2">
                  <LuPencil aria-hidden="true" /> Edit order
                </Link>
              )}
              {order.order_hash && (
                <Link
                  to={`/customer_order/${order.order_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                >
                  <LuExternalLink aria-hidden="true" /> Customer&apos;s tracking page
                </Link>
              )}
            </>
          }
        />
      </div>
    </>
  );
}

export default ViewSingleOrder;
