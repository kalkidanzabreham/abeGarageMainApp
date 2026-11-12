import { useState, useEffect } from "react";
import vehicles from "../../../services/vehicle.service";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { LuCarFront } from "react-icons/lu";
import Field, { FormCard } from "../../components/ui/Field";
import { GearSpinner } from "../../components/ui/garage";
import { useAuth } from "../../../Context/AuthContext";

function AddVechile({ customer_id, onVehicleAdded, existingVehicle }) {
  const [vehicle_year, setVehicle_year] = useState("");
  const [vehicle_make, setVehicle_make] = useState("");
  const [vehicle_model, setVehicle_model] = useState("");
  const [vehicle_type, setVehicle_type] = useState("");
  const [vehicle_mileage, setVehicle_mileage] = useState("");
  const [vehicle_tag, setVehicle_tag] = useState("");
  const [vehicle_serial, setvehicle_serial_number] = useState("");
  const [vehicle_color, setVehicle_color] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { can } = useAuth();

  const navigate = useNavigate();

  const isEditing = !!existingVehicle;

  useEffect(() => {
    if (isEditing) {
      setVehicle_year(existingVehicle.vehicle_year || "");
      setVehicle_make(existingVehicle.vehicle_make || "");
      setVehicle_model(existingVehicle.vehicle_model || "");
      setVehicle_type(existingVehicle.vehicle_type || "");
      setVehicle_mileage(existingVehicle.vehicle_mileage || "");
      setVehicle_tag(existingVehicle.vehicle_tag || "");
      setvehicle_serial_number(existingVehicle.vehicle_serial || "");
      setVehicle_color(existingVehicle.vehicle_color || "");
    }
  }, [existingVehicle]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!can("vehicles:write")) {
      toast.error("Only admins and managers can add/edit vehicles");
      return;
    }

    setLoading(true);

    const payload = {
      customer_id: isEditing ? existingVehicle?.customer_id : "",
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_type,
      vehicle_mileage,
      vehicle_tag,
      vehicle_serial,
      vehicle_color,
    };

    let response;
    if (isEditing) {
      response = vehicles.editVehicle(existingVehicle.vehicle_id, payload);
    } else {
      response = vehicles.addVehicles(customer_id, payload);
    }
    response
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "error") {
          setServerError(data.message);
        } else {
          setvehicle_serial_number("");
          setVehicle_color("");
          setVehicle_make("");
          setVehicle_model("");
          setVehicle_tag("");
          setVehicle_type("");
          setVehicle_year("");
          setVehicle_mileage("");
          setServerError("");
          toast.success(data.message);
          navigate(0);
          // window.location.reload();
          if (!isEditing) {
            onVehicleAdded();
          }
          if (isEditing) {
            navigate(-1);
          }
        }
      })
      .catch((error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        setServerError(resMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fields = [
    ["vehicle_year", "Year", vehicle_year, setVehicle_year, { inputMode: "numeric", placeholder: "2019" }],
    ["vehicle_make", "Make", vehicle_make, setVehicle_make, { placeholder: "Toyota" }],
    ["vehicle_model", "Model", vehicle_model, setVehicle_model, { placeholder: "Corolla" }],
    ["vehicle_type", "Type", vehicle_type, setVehicle_type, { placeholder: "Sedan, SUV, pickup..." }],
    ["vehicle_mileage", "Mileage", vehicle_mileage, setVehicle_mileage, { inputMode: "numeric", placeholder: "98000" }],
    ["vehicle_tag", "Plate number", vehicle_tag, setVehicle_tag, { placeholder: "ABC-123" }],
    ["vehicle_serial_number", "Serial / VIN", vehicle_serial, setvehicle_serial_number, { placeholder: "VIN or serial" }],
    ["vehicle_color", "Color", vehicle_color, setVehicle_color, { placeholder: "White" }],
  ];

  return (
    <FormCard
      onSubmit={handleSubmit}
      className={isEditing ? "gh-form-narrow" : "gh-form-inline"}
      footer={
        <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="submit" disabled={loading}>
          {loading ? <GearSpinner /> : <LuCarFront aria-hidden="true" />}
          {loading ? "Saving..." : isEditing ? "Update" : "Add Vehicle"}
        </button>
      }
    >
      <h2 className="h5 gh-span-2 m-0">{isEditing ? "Vehicle details" : "Add a new vehicle"}</h2>
      {serverError && (
        <div className="gh-alert gh-alert-danger gh-span-2" role="alert">
          {serverError}
        </div>
      )}
      {fields.map(([name, label, value, setter, extra]) => (
        <Field key={name} label={label} name={name} value={value} onChange={(e) => setter(e.target.value)} autoComplete="off" {...extra} />
      ))}
    </FormCard>
  );
}

export default AddVechile;
