import React, { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useAuth } from "../../../Context/AuthContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { getAllOrders } from "../../../services/order.service";
import { FiExternalLink } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import Customers from "../../../services/customer.service";
import Vehicles from "../../../services/vehicle.service";
import { getEmployee } from "../../../services/employee.service";

function ListAllOrder() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [vehicles, setVehicles] = useState({});
  const [apiError, setApiError] = useState(false);
  const [receiver, setReceiver] = useState({});
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const { employee, token } = useAuth();

  // Helper function to remove "Updated" from a string
  const removeUpdatedWord = (str) => {
    return str ? str.replace(/Updated/g, "").trim() : "";
  };

  // Helper function to determine order status
  const getOrderStatus = (order) => {
    if (order.order_completed === 0) {
      return "Received";
    } else if (order.order_completed === 1) {
      return "In Progress";
    } else {
      return "Completed";
    }
  };

  // Helper function to get status class
  const getStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "status completed";
      case "In Progress":
        return "status in-progress";
      case "Received":
        return "status received";
      default:
        return "status received";
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const allOrders = await getAllOrders(token);

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

        if (allOrders.data.length !== 0) {
          setOrders(allOrders.data);

          // Fetch customer, vehicle, and receiver information for each order
          allOrders.data.forEach(async (order) => {
            console.log(order);

            try {
              const vehicleResponse = await Vehicles.singleVehicle(
                order.vehicle_id
              );

              setVehicles((prevVehicles) => ({
                ...prevVehicles,
                [order.vehicle_id]: vehicleResponse.data[0],
              }));

              const customerResponse = await Customers.singleCustomer(
                order.customer_id
              ).then((res) => res.json());

              setCustomers((prevCustomers) => ({
                ...prevCustomers,
                [order.customer_id]: customerResponse.data[0],
              }));

              const receiverResponse = await getEmployee(
                order.employee_id
              ).then((res) => res.json());

              setReceiver((prevReceivers) => ({
                ...prevReceivers,
                [order.employee_id]: receiverResponse.data,
              }));
            } catch (error) {
              console.error(
                "Error fetching customer, vehicle, or receiver data:",
                error
              );
            }
          });
        }
      } catch (error) {
        setApiError(true);
        setApiErrorMessage("Failed to fetch orders. Please try again later.");
      }
    };

    fetchOrders();
  }, [token]);

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
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Order id</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Order date</th>
                    <th>Received by</th>
                    <th>Order Hash</th>
                    <th>Order status</th>
                    <th>View/Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = getOrderStatus(order);
                    const statusClass = getStatusClass(status);

                    return (
                      <tr key={order.order_id}>
                        <td>{order.order_id}</td>
                        <td>
                          {customers[order.customer_id] ? (
                            <>
                              <h4>
                                {
                                  customers[order.customer_id]
                                    .customer_first_name
                                }{" "}
                                {
                                  customers[order.customer_id]
                                    .customer_last_name
                                }
                              </h4>
                              <div>
                                {customers[order.customer_id].customer_email}
                              </div>
                              <div>
                                {
                                  customers[order.customer_id]
                                    .customer_phone_number
                                }
                              </div>
                            </>
                          ) : (
                            "Loading..."
                          )}
                        </td>
                        <td>
                          {vehicles[order.vehicle_id] ? (
                            <>
                              <h4>
                                {vehicles[order.vehicle_id].vehicle_make}{" "}
                                {vehicles[order.vehicle_id].vehicle_model}
                              </h4>
                              <div>
                                {vehicles[order.vehicle_id].vehicle_year}
                              </div>
                              <div>
                                {vehicles[order.vehicle_id].vehicle_tag}
                              </div>
                            </>
                          ) : (
                            "Loading..."
                          )}
                        </td>
                        <td>
                          {format(new Date(order.order_date), "MM/dd/yyyy")}
                        </td>
                        <td>
                          {receiver[order.employee_id] ? (
                            <div>
                              {removeUpdatedWord(
                                receiver[order.employee_id].employee_first_name
                              )}{" "}
                              {removeUpdatedWord(
                                receiver[order.employee_id].employee_last_name
                              )}
                            </div>
                          ) : (
                            "Loading..."
                          )}
                        </td>
                        <td>
                          <div>{order.order_hash}</div>
                        </td>
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
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default ListAllOrder;
