import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getAllServices,addServiceService,updateServiceService,deleteServiceService } from "../../../../services/service.service";
import Swal from "sweetalert2";
import { useAuth } from "../../../../Context/AuthContext";


function ServicePage() {
  const [services, setServices] = useState([]);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const {isGuest} = useAuth()

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await getAllServices();
      // console.log(response);
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };
  const addService = async () => {
    if (isGuest) {
              Swal.fire("Access Denied", "Guests cannot add Services.", "warning");
              return;
            }
    if (!newService.service_name || !newService.service_description) return;
    try {
      const response = await addServiceService(newService);
      console.log(response);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const updateService = async () => {
    if (isGuest) {
              Swal.fire("Access Denied", "Guests cannot update Services.", "warning");
              return;
            }
    if (
      !serviceToEdit ||
      !newService.service_name ||
      !newService.service_description
    )
      return;
    try {
      const response = await updateServiceService(newService,serviceToEdit);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (id) => {
    if (isGuest) {
              Swal.fire("Access Denied", "Guests cannot delete Services.", "warning");
              return;
            }
    try {
      const response = await deleteServiceService(id)
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleSubmit = () => {
    serviceToEdit ? updateService() : addService();
  };

  const editService = (service) => {
    if (isGuest) {
      Swal.fire("Access Denied", "Guests cannot edit Services.", "warning");
      return;
    }
    setNewService({
      service_name: service.service_name,
      service_description: service.service_description,
    });
    setServiceToEdit(service);
  };

  const resetForm = () => {
    setNewService({ service_name: "", service_description: "" });
    setServiceToEdit(null);
  };

  return (
    <div className="container">
      <div className="sec-title style-two m-5">
        <h2>Services we provide</h2>
        <div className="text">
          <p className="m-2">
            Bring to the table win-win survival strategies to ensure proactive
            domination. At the end of the day, going forward, a new normal that
            has evolved from generation X is on the runway heading towards a
            streamlined cloud solution.
          </p>
        </div>
      </div>

      <ul className="list-group mt-3">
        {services.map((service) => (
          <li
            key={service.service_id}
            className="list-group-item d-flex justify-content-between align-items-center m-1"
          >
            <div>
              <h3>{service.service_name}</h3>
              <p style={{ maxWidth: "900px", wordWrap: "break-word" }}>
                {service.service_description}
              </p>
            </div>
            <div>
              <FontAwesomeIcon
                icon={faEdit}
                className="mx-2 text-danger"
                onClick={() => editService(service)}
              />
              <FontAwesomeIcon
                icon={faTrash}
                className="mx-2 text-black"
                onClick={() => deleteService(service.service_id)}
              />
            </div>
          </li>
        ))}
      </ul>
      <section className="contact-section mt-4 bg-white">
        <div className="auto-container">
          <div className="contact-title">
            <h2>{serviceToEdit ? "Update Service" : "Add a New Service"}</h2>
          </div>

          <div class="form-column col-lg-7">
            <div class="inner-column">
              <div class="contact-form">
                <form onSubmit={handleSubmit}>
                  <div class="row clearfix">
                    <div class="form-group col-md-12">
                      <input
                        type="text"
                        name="form_subject"
                        placeholder="Service Name"
                        value={newService.service_name}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            service_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div class="form-group col-md-12">
                      <textarea
                        name="form_message"
                        placeholder="Service Description"
                        value={newService.service_description}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            service_description: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>

                    <div class="form-group col-md-12">
                      <input
                        id="form_botcheck"
                        name="form_botcheck"
                        class="form-control"
                        type="hidden"
                        value=""
                      />
                      <button
                        className="theme-btn btn-style-one"
                        type="submit"
                        data-loading-text="Please wait..."
                      >
                        {serviceToEdit ? "Update Service" : "Add Service"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ServicePage;

