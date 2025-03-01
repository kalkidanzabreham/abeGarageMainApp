import React from "react";
import AdminMenu from "../../components/AdminMenu/AdminMenu";
import OrderEdit from "../../components/OrderEdit/OrderEdit";

function EditOrder() {
  return (
    <div>
      <div className="container-fluid admin-pages">
        <div className="row">
          <div className="col-md-3 admin-left-side">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-right-side">
            <OrderEdit />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditOrder;
