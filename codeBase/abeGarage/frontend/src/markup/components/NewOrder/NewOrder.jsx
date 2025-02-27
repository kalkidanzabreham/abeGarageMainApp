import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, Form, Button } from "react-bootstrap";
import { FaEdit } from "react-icons/fa"; // Font Awesome icons
import { MdCancelPresentation } from "react-icons/md";
import { TbHandFinger } from "react-icons/tb";
import { getAllCustomers } from "../../../services/customer.service";
import { useAuth } from "../../../context/AuthContext";
import { getVehicleByCustomerId } from "../../../services/vehicle.service";
import { getAllServices } from "../../../services/service.service";
import { addOrder } from "../../../services/order.service";
import { useNavigate } from "react-router-dom";
// Reusable MdCancel Component
const MdCancel = ({ onClick, size = 24, fill = "red" }) => (
  <button className="theme-btn" onClick={onClick}>
    <MdCancelPresentation fill={fill} size={size} />
  </button>
);

function NewOrder() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [orderDescription, setOrderDescription] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [customers, setCustomers] = useState([]);
  const { employee } = useAuth();

  let token = null;
  if (employee) {
    token = employee.token;
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customer_first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.customer_last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.customer_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.customer_phone_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedVehicle(null);
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleClearCustomerSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setSelectedVehicle(null);
    setSelectedServices([]); // Reset selected services
  };

  const handleClearVehicleSelection = () => {
    setSelectedVehicle(null);
    setSelectedServices([]); // Reset selected services
  };

  const handleServiceSelection = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmitOrder = () => {
    const orderData = {
      employee_id: employee.employee_id,
      customer_id: selectedCustomer.customer_id,
      vehicle_id: selectedVehicle.vehicle_id,
      order_description: orderDescription,
      estimated_completion_date: estimatedCompletionDate,
      completion_date: null,
      order_completed: 0,
      order_services: selectedServices.map((serviceId) => ({
        service_id: serviceId,
      })),
    };
    addOrder(orderData, token).then((response) => {
      // console.log("Order added successfully:", response);
      if (response.status === "success") {
        navigate("/admin/orders");
      }
    });
    // console.log("Order Data:", orderData);
  };

  // send the data to addOrder function

  useEffect(() => {
    getAllCustomers(token).then((response) => {
      setCustomers(response.customers);
    });
    getAllServices(token).then((response) => {
      setServices(response.data);
    });
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      getVehicleByCustomerId(selectedCustomer.customer_id, token).then(
        (response) => {
          setVehicles(response.vehicle);
        }
      );
    }
  }, [selectedCustomer]);

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="contact-title">
          <h2>Create a new order</h2>
        </div>

        {/* Customer Section */}
        {!selectedCustomer && (
          <div className="row clearfix">
            <div className="form-column col-lg-7">
              <div className="inner-column">
                <div className="contact-form">
                  <form>
                    <div className="row clearfix">
                      <div className="form-group col-md-12">
                        <input
                          type="text"
                          name="search_customer"
                          placeholder="Search for a customer using first name, last name, email address, or phone number"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      {searchTerm === "" && (
                        <div className="form-group col-md-12">
                          <Link to="/admin/add-customer">
                            <button
                              className="theme-btn btn-style-one"
                              data-loading-text="Please wait..."
                            >
                              <span>Add New Customer</span>
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedCustomer && searchTerm !== "" && (
          <div className="row clearfix">
            <div className="form-column col-lg-12">
              <Table striped bordered hover>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.customer_id}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{customer.customer_first_name}</td>
                      <td>{customer.customer_last_name}</td>
                      <td>{customer.customer_email}</td>
                      <td>{customer.customer_phone_number}</td>
                      <td>
                        <TbHandFinger
                          fill="black"
                          size={24}
                          onClick={() => handleCustomerSelect(customer)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* Selected Customer Section */}
        {selectedCustomer && (
          <div className="row clearfix selected-customer">
            <div className="form-column col-9">
              <div className="selected-customer-info ">
                <h3 style={{ fontWeight: "bold" }}>
                  {selectedCustomer.customer_first_name}{" "}
                  {selectedCustomer.customer_last_name}
                </h3>
                <div>
                  <strong>Email:</strong> {selectedCustomer.customer_email}
                </div>
                <div>
                  <strong>Phone Number:</strong>{" "}
                  {selectedCustomer.customer_phone_number}
                </div>
                <div>
                  <strong>Active Customer:</strong>{" "}
                  {selectedCustomer.active ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Edit Customer:</strong>{" "}
                  <span className="edit-delete-icons">
                    <Link to={`/admin/edit-customer/${selectedCustomer.id}`}>
                      <FaEdit
                        color="red"
                        style={{ cursor: "pointer", marginRight: "5px" }}
                      />
                    </Link>
                  </span>
                </div>
              </div>
            </div>

            <div className="form-column col-3 text-right align-self-center">
              <MdCancel onClick={handleClearCustomerSelection} />
            </div>
          </div>
        )}

        {/* Vehicle Section */}
        {selectedCustomer && !selectedVehicle && (
          <div className="row clearfix">
            <div className="form-column col-lg-12 selected-customer">
              <h4 style={{ fontWeight: "bold" }}>Choose a vehicle</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Tag</th>
                    <th>Serial</th>
                    <th>Color</th>
                    <th>Mileage</th>
                    <th>Choose</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.vehicle_year}</td>
                      <td>{vehicle.vehicle_make}</td>
                      <td>{vehicle.vehicle_model}</td>
                      <td>{vehicle.vehicle_tag}</td>
                      <td>{vehicle.vehicle_serial}</td>
                      <td>{vehicle.vehicle_color}</td>
                      <td>{vehicle.vehicle_mileage}</td>
                      <td>
                        <TbHandFinger
                          fill="black"
                          size={24}
                          onClick={() => handleVehicleSelect(vehicle)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}

        {/* Selected Vehicle Section */}
        {selectedVehicle && (
          <div className="row clearfix selected-customer">
            <div className="form-column col-9">
              <div className="selected-vehicle-info">
                <h3>{selectedVehicle.vehicle_make}</h3>
                <div>
                  <strong>Vehicle color:</strong>{" "}
                  {selectedVehicle.vehicle_color}
                </div>
                <div>
                  <strong>Vehicle tag:</strong> {selectedVehicle.vehicle_tag}
                </div>
                <div>
                  <strong>Vehicle year:</strong> {selectedVehicle.vehicle_year}
                </div>
                <div>
                  <strong>Vehicle mileage:</strong>
                  {selectedVehicle.vehicle_mileage}
                </div>
                <div>
                  <strong>Vehicle serial:</strong>
                  {selectedVehicle.vehicle_serial}
                </div>
                <div>
                  <strong>Edit vehicle info:</strong>{" "}
                  <span className="edit-delete-icons">
                    <Link to={`/admin/edit-customer/${selectedCustomer.id}`}>
                      <FaEdit
                        color="red"
                        style={{ cursor: "pointer", marginRight: "5px" }}
                      />
                    </Link>
                  </span>
                </div>
              </div>
            </div>

            <div className="form-column col-3 text-right align-self-center">
              <MdCancel onClick={handleClearVehicleSelection} />
            </div>
          </div>
        )}

        {/* Services Section */}
        {selectedVehicle && (
          <>
            <div className="row clearfix">
              <div className="form-column col-lg-12 selected-customer">
                <h3>Choose Service</h3>

                {services.map((service) => (
                  <div className="service-item row">
                    <div className="col-9">
                      <h4 style={{ fontWeight: "bold" }}>
                        {service.service_name}
                      </h4>
                      <div>{service.service_description}</div>
                    </div>
                    <div className="checkbox-holder col-3 text-right  ">
                      <Form.Check
                        type="checkbox"
                        checked={selectedServices.includes(service.service_id)}
                        onChange={() =>
                          handleServiceSelection(service.service_id)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Order Details Section */}
        {selectedVehicle && (
          <div className="row clearfix selected-customer">
            <div className="form-column col-lg-12">
              <h3>Order Details:</h3>
              <Form>
                <Form.Group controlId="orderDescription">
                  <Form.Label>Order Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={orderDescription}
                    placeholder="write the order description here"
                    onChange={(e) => setOrderDescription(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="estimatedCompletionDate">
                  <Form.Label>Estimated Completion Date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={estimatedCompletionDate}
                    onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedVehicle && (
          <div className="row clearfix form-group ">
            <div className="form-column col-lg-12">
              <Button
                className="theme-btn btn-style-one"
                onClick={handleSubmitOrder}
              >
                Submit Order
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default NewOrder;
