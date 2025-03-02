import React from "react";
import AdminMenu from "../../components/Admin/AdminMenu/AdminMenu";

import EditVehicleInfo from "../../components/Admin/EditVehicleInfo/EditVehicleInfo";

function EditVehicles() {
  return (
    <div className="container-fluid admin-pages">
      <div className="row">
        <div className="col-md-3 admin-left-side">
          <AdminMenu />
        </div>
        <div className="col-md-9 admin-right-side">
          <EditVehicleInfo />
        </div>
      </div>
    </div>
  );
}

export default EditVehicles;
