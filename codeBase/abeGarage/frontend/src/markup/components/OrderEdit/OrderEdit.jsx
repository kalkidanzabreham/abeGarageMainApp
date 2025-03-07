import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { MdCancelPresentation } from "react-icons/md";

import { useAuth } from "../../../context/AuthContext";
import { getAllServices } from "../../../services/service.service";
import { getOrderById, updateOrder } from "../../../services/order.service";

function EditOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(0);
  const { employee } = useAuth();

  let token = null;
  if (employee) {
    token = employee.token;
  }

  // Helper function to format the date for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return ""; // Handle empty dates
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    getOrderById(id, token).then((response) => {
      const orderData = response[0];
      console.log(orderData);
      
      setOrder(orderData);
      // Format the estimatedCompletionDate before setting it in the state
      const formattedDate = formatDateForInput(
        orderData.estimated_completion_date
      );
      setEstimatedCompletionDate(formattedDate);

      setOrderCompleted(orderData.order_completed);
      setSelectedServices(orderData.order_services);
    });

    getAllServices(token).then((response) => {
      setServices(response.data);
    });
  }, [id, token]);

  const handleServiceCompletion = (serviceId, completed) => {
    const updatedServices = selectedServices.map((service) =>
      service.service_id === serviceId
        ? { ...service, service_completed: completed }
        : service
    );
    setSelectedServices(updatedServices);

    // Check if all services are completed and "Mark as In Progress" is checked
    const allServicesCompleted = updatedServices.every(
      (service) => service.service_completed === 1
    );
    if (allServicesCompleted && orderCompleted !== 0) {
      setOrderCompleted(3); // Set order_completed to 3
    }
  };

  const handleAddService = (serviceId) => {
    if (!selectedServices.find((service) => service.service_id === serviceId)) {
      setSelectedServices([
        ...selectedServices,
        { service_id: serviceId, service_completed: 0 },
      ]);
    }
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices(
      selectedServices.filter((service) => service.service_id !== serviceId)
    );
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      // If checkbox is checked, set order_completed to 1 (in progress)
      setOrderCompleted(1);
    } else {
      // If checkbox is unchecked, set order_completed to 0 (not in progress)
      setOrderCompleted(0);
    }
  };

  const handleSubmitOrder = () => {
    const orderData = {
      order_id: order.order_id,
      estimated_completion_date: estimatedCompletionDate,
      order_completed: orderCompleted,
      order_services: selectedServices,
    };
    console.log(orderData);

    updateOrder(id, orderData, token).then((response) => {
      if (response.status === "success") {
        navigate("/admin/orders");
      }
    });
  };

  // Check if all services are selected
  const allServicesSelected = selectedServices.length === services.length;

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="contact-title">
          <h2>Edit Order</h2>
        </div>

        {/* Order Details Section */}
        <div className="row clearfix selected-customer">
          <div className="form-column col-lg-12">
            <h3>Order Details:</h3>
            <Form>
              {/* Mark as In Progress at the top with bold visualization */}
              <Form.Group controlId="orderCompleted" className="mb-4">
                <Form.Check
                  type="checkbox"
                  label={<strong>Mark as In Progress</strong>}
                  checked={orderCompleted !== 0} // Checked if order_completed is 1, 2, or 3
                  onChange={handleCheckboxChange}
                />
              </Form.Group>

              {/* Estimated Completion Date at the bottom */}
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

        {/* Services Section */}
        <div className="row clearfix">
          <div className="form-column col-lg-12 selected-customer">
            <h3>Order Services</h3>
            {selectedServices.map((service) => (
              <div className="service-item row" key={service.service_id}>
                <div className="col-9">
                  <h4 style={{ fontWeight: "bold" }}>
                    {
                      services.find((s) => s.service_id === service.service_id)
                        ?.service_name
                    }
                  </h4>
                  <div>
                    {
                      services.find((s) => s.service_id === service.service_id)
                        ?.service_description
                    }
                  </div>
                </div>
                <div className="col-3 text-right">
                  <Form.Control
                    as="select"
                    value={service.service_completed}
                    onChange={(e) =>
                      handleServiceCompletion(
                        service.service_id,
                        parseInt(e.target.value)
                      )
                    }
                    disabled={orderCompleted !== 1} // Disable if order is not in progress
                  >
                    <option value={0}>In Progress</option>
                    <option value={1}>Completed</option>
                  </Form.Control>
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveService(service.service_id)}
                    className="mt-2 w-100"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Services Section */}
        {!allServicesSelected && ( // Only show if not all services are selected
          <div className="row clearfix">
            <div className="form-column col-lg-12 selected-customer">
              <h3>Add Services</h3>
              {services
                .filter(
                  (service) =>
                    !selectedServices.find(
                      (s) => s.service_id === service.service_id
                    )
                )
                .map((service) => (
                  <div className="service-item row" key={service.service_id}>
                    <div className="col-9">
                      <h4 style={{ fontWeight: "bold" }}>
                        {service.service_name}
                      </h4>
                      <div>{service.service_description}</div>
                    </div>
                    <div className="col-3 text-right">
                      <Button
                        variant="success"
                        onClick={() => handleAddService(service.service_id)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="row clearfix form-group">
          <div className="form-column col-lg-12">
            <Button
              className="theme-btn btn-style-one"
              onClick={handleSubmitOrder}
            >
              Update Order
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EditOrder;