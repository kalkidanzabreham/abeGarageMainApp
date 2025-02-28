import React from "react";
import ListAllOrder from "../../components/ListAllOrder/ListAllOrder";
import  AdminMenu from "../../components/Admin/AdminMenu/AdminMenu"
function OrderList() {
  return (
    <div>
      <div className="container-fluid admin-pages">
        <div className="row">
          <div className="col-md-3 admin-left-side">
            <AdminMenu/>
          </div>
          <div className="col-md-9 admin-right-side">
            <ListAllOrder />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderList;
