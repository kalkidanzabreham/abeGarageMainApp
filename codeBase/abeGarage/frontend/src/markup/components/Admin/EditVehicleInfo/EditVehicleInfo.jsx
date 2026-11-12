import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddVechile from "../../../pages/admin/AddVechile";
import vehicles from "../../../../services/vehicle.service";
import PageHeader from "../../ui/PageHeader";
import { Plate } from "../../ui/garage";

function EditVehicleInfo() {
  const { vehicle_id } = useParams();
  const [vehicleData, setVehicleData] = useState(null);

  useEffect(() => {
    vehicles.singleVehicle(vehicle_id).then((data) => setVehicleData(data.data[0]));
  }, [vehicle_id]);

  return (
    <>
      <PageHeader
        eyebrow="Edit vehicle"
        title={vehicleData ? `${vehicleData.vehicle_year} ${vehicleData.vehicle_make} ${vehicleData.vehicle_model}` : "Loading..."}
        actions={vehicleData?.vehicle_tag && <Plate>{vehicleData.vehicle_tag}</Plate>}
      />
      {vehicleData ? <AddVechile existingVehicle={vehicleData} /> : <div className="gh-skeleton" style={{ height: 320, maxWidth: 760 }} />}
    </>
  );
}

export default EditVehicleInfo;
