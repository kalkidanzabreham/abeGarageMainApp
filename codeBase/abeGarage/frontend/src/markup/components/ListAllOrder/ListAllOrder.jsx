import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { LuCarFront, LuEye, LuFilePlus2, LuSquarePen } from "react-icons/lu";
import { useAuth } from "../../../Context/AuthContext";
import { getAllOrders } from "../../../services/order.service";
import { formatPrice } from "../../../util/money";
import { orderStatusMeta, ORDER_STATUS } from "../../../util/orderStatus";
import { canVisit } from "../../../util/roles";
import PageHeader from "../ui/PageHeader";
import StatusPill from "../ui/StatusPill";
import Pager from "../ui/Pager";
import { Plate } from "../ui/garage";

const PAGE_SIZE = 10;

// creator names were once stored with an "Updated" suffix
const cleanName = (str) => (str ? str.replace(/Updated/g, "").trim() : "");

function ListAllOrder() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(""); // "" = all statuses
  const [loading, setLoading] = useState(true);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const { roleId, can } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const allOrders = await getAllOrders({ page, page_size: PAGE_SIZE, status });
        if (cancelled) return;
        if (allOrders.status !== "success") {
          setApiErrorMessage(
            allOrders.status === 401
              ? "Please log in again."
              : allOrders.status === 403
                ? "You are not authorized to see orders."
                : "Couldn't load orders. Please try again later."
          );
          return;
        }
        // customer, vehicle and creator come with each order from the API
        // (this used to be 3 extra requests per row)
        setOrders(allOrders.data);
        setTotalPages(allOrders.pagination.total_pages);
      } catch {
        if (!cancelled) setApiErrorMessage("Couldn't load orders. Please try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [page, status]);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every job in the workshop, newest first."
        actions={
          canVisit(roleId, "/admin/new-order") && (
            <Link to="/admin/new-order" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <LuFilePlus2 aria-hidden="true" /> New order
            </Link>
          )
        }
      />

      {apiErrorMessage ? (
        <div className="gh-alert gh-alert-danger" role="alert">
          {apiErrorMessage}
        </div>
      ) : (
        <>
          <div className="gh-toolbar">
            <select
              className="form-select"
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {Object.values(ORDER_STATUS).map((value) => (
                <option key={value} value={value}>
                  {orderStatusMeta({ order_status: value }).label}
                </option>
              ))}
            </select>
          </div>

          <div className="gh-table-wrap">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Received</th>
                    <th scope="col" className="text-end">
                      Total
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={loading ? "gh-loading-rows" : ""}>
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="gh-td-id">{order.order_id}</td>
                      <td>
                        <div className="fw-semibold">
                          {order.customer_first_name} {order.customer_last_name}
                        </div>
                        <div className="gh-muted small">{order.customer_email}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-nowrap">
                          {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
                        </div>
                        <Plate>{order.vehicle_tag}</Plate>
                      </td>
                      <td className="text-nowrap">
                        <div>{format(new Date(order.order_date), "d MMM yyyy")}</div>
                        <div className="gh-muted small">
                          by {cleanName(order.employee_first_name)} {cleanName(order.employee_last_name)}
                        </div>
                      </td>
                      <td className="text-end fw-semibold gh-num">{formatPrice(order.order_total_price)}</td>
                      <td>
                        <StatusPill order={order} />
                      </td>
                      <td>
                        <div className="gh-row-actions">
                          <Link to={`/admin/orders/${order.order_id}`} className="gh-icon-btn" aria-label={`View order ${order.order_id}`} title="View">
                            <LuEye />
                          </Link>
                          {can("orders:update") && (
                            <Link to={`/admin/edit-order/${order.order_id}`} className="gh-icon-btn" aria-label={`Edit order ${order.order_id}`} title="Edit">
                              <LuSquarePen />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && orders.length === 0 && (
              <div className="gh-empty">
                <LuCarFront aria-hidden="true" />
                <p>{status === "" ? "No orders yet." : "No orders with this status."}</p>
              </div>
            )}
          </div>
          <Pager currentPage={page} totalPages={totalPages} setCurrentPage={setPage} />
        </>
      )}
    </>
  );
}

export default ListAllOrder;
