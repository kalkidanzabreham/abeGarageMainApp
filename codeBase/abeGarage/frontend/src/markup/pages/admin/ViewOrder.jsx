import React from "react";
import ViewSingleOrder from "../../components/ViewSingleOrder/ViewSingleOrder";
import AdminMenu from "../../components/Admin/AdminMenu/AdminMenu";

function ViewOrder() {
  return (
    <div>
      <div className="container-fluid admin-pages">
        <div className="row">
          <div className="col-md-3 admin-left-side">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-right-side">
            <ViewSingleOrder />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewOrder;
