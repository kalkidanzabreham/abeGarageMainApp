import React from 'react'
import AdminMenu from '../../components/Admin/AdminMenu/AdminMenu';
import Card from '../../components/Admin/AdminCard/Card';
import { Link } from 'react-router-dom';
function AdminPage() {
  return (
    <div>
      <div className="container-fluid admin-pages">
        <div className="row">
          <div className="col-md-3 admin-left-side">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-right-side">
            <div className="sec-title style-two m-5">
              <h2>Admin Dashboard</h2>
              <div className="text">
                <p className="m-2">
                  Bring to the table win-win survival strategies to ensure
                  proactive domination. At the end of the day, going forward, a
                  new normal that has evolved from generation X is on the runway
                  heading towards a streamlined cloud solution.
                </p>
              </div>
            </div>
            <section className="services-section style-two pt-0">
              <div className="auto-container">
                <div className="row">
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>Orders</h5>
                      <h2>Orders</h2>
                      <Link to="/admin/orderS" className="read-more">
                        VIEW OREDER +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-power"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>OPEN FOR LEADS </h5>
                      <h2>New Orders</h2>
                      <Link to="/admin/new-order" className="read-more">
                        ADD ORDER +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-gearbox"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>OPEN FOR ADMINS </h5>
                      <h2>Employees</h2>
                      <Link to="/admin/employee" className="read-more">
                        LIST OF EMPLOYEES +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-brake-disc"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>OPEN FOR ADMINS</h5>
                      <h2>Add Employees</h2>
                      <Link to="/admin/add-employee" className="read-more">
                        ADD EMPLOYEE +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>Customer Mangagment</h5>
                      <h2>Add Customer</h2>
                      <Link to="/admin/add_customers" className="read-more">
                        ADD CUSTOMER +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-tire"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>CUSTOMER MANAGEMENT</h5>
                      <h2>Customer</h2>
                      <Link to="/admin/all_customers" className="read-more">
                        VIEW CUSTOMERS +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>SERVICE AND REPAIRS</h5>
                      <h2>Add Services</h2>
                      <Link to="/admin/service" className="read-more">
                        ADD SERVICE +
                      </Link>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage