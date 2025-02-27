import React from 'react'
import AdminMenu from '../../components/Admin/AdminMenu/AdminMenu';
import AddCustomer from '../../components/Admin/AddCustomer/AddCustomer';

function AddCustomers() {
  return (
    <div className="container-fluid admin-pages">
      <div className="row">
        <div className="col-md-3 admin-left-side">
          <AdminMenu/>
        </div>
        <div className="col-md-9 admin-right-side">
          <AddCustomer />
        </div>
      </div>
    </div>
  );
}

export default AddCustomers