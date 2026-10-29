import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useAuth } from "../../../Context/AuthContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { getAllOrders } from "../../../services/order.service";
import { formatPrice } from "../../../util/money";
import { orderStatusMeta, ORDER_STATUS } from "../../../util/orderStatus";
import MoreCustomers from "../../pages/MoreCustomers";

const PAGE_SIZE = 10;
import { FiExternalLink } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";

function ListAllOrder() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(""); // "" = all statuses
  const [apiError, setApiError] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const { employee, token } = useAuth();

  // Helper function to remove "Updated" from a string
  const removeUpdatedWord = (str) => {
    return str ? str.replace(/Updated/g, "").trim() : "";
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const allOrders = await getAllOrders({ page, page_size: PAGE_SIZE, status });

        if (allOrders.status !== "success") {
          setApiError(true);
          if (allOrders.status === 401) {
            setApiErrorMessage("Please login again");
          } else if (allOrders.status === 403) {
            setApiErrorMessage("You are not authorized to access this page");
          } else {
            setApiErrorMessage("Please try again later");
          }
          return;
        }

        // customer, vehicle and creator come with each order from the API
        // (this used to be 3 extra requests per row)
        setOrders(allOrders.data);
        setTotalPages(allOrders.pagination.total_pages);
      } catch (error) {
        setApiError(true);
        setApiErrorMessage("Failed to fetch orders. Please try again later.");
      }
    };

    fetchOrders();
  }, [token, page, status]);

  return (
    <>
      {apiError ? (
        <section className="contact-section">
          <div className="auto-container">
            <div className="contact-title">
              <h2>{apiErrorMessage}</h2>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="contact-section order-page">
            <div className="auto-container">
              <div className="contact-title">
                <h2>Orders</h2>
              </div>
              <div className="mb-3" style={{ maxWidth: 260 }}>
                <select
                  className="form-control"
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
              <Table striped bordered hover className="table-responsive-mobile">
                <thead>
                  <tr>
                    <th>Order id</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Order date</th>
                    <th>Received by</th>
                    <th>Order Hash</th>
                    <th>Total</th>
                    <th>Order status</th>
                    <th>View/Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const { label: status, listClass: statusClass } =
                      orderStatusMeta(order);

                    return (
                      <tr key={order.order_id}>
                        <td>{order.order_id}</td>
                        <td>
                          <h4>
                            {order.customer_first_name}{" "}
                            {order.customer_last_name}
                          </h4>
                          <div>{order.customer_email}</div>
                          <div>{order.customer_phone_number}</div>
                        </td>
                        <td>
                          <h4>
                            {order.vehicle_make} {order.vehicle_model}
                          </h4>
                          <div>{order.vehicle_year}</div>
                          <div>{order.vehicle_tag}</div>
                        </td>
                        <td>
                          {format(new Date(order.order_date), "MM/dd/yyyy")}
                        </td>
                        <td>
                          <div>
                            {removeUpdatedWord(order.employee_first_name)}{" "}
                            {removeUpdatedWord(order.employee_last_name)}
                          </div>
                        </td>
                        <td>
                          <div>{order.order_hash}</div>
                        </td>
                        <td>{formatPrice(order.order_total_price)}</td>
                        <td>
                          <span className={statusClass}>{status}</span>
                        </td>
                        <td>
                          <div className="edit-delete-icons">
                            <Link to={`/admin/orders/${order.order_id}`}>
                              <FiExternalLink />
                            </Link>
                            <Link to={`/admin/edit-order/${order.order_id}`}>
                              <FaEdit
                                style={{
                                  cursor: "pointer",
                                  marginRight: "5px",
                                }}
                              />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <MoreCustomers currentPage={page} totalPages={totalPages} setCurrentPage={setPage} />
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default ListAllOrder;
