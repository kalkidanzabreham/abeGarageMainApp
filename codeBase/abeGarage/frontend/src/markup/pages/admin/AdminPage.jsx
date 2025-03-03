import React from 'react'
import AdminMenu from '../../components/Admin/AdminMenu/AdminMenu';
import Card from '../../components/Admin/AdminCard/Card';
import { Link } from 'react-router';
function AdminPage() {
  return (
    <div>
      <div className="container-fluid admin-pages">
        <div className="row">
          <div className="col-md-3 admin-left-side">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-right-side">
                <div className='title m-5' >
                  <h2>Admin Dashboard</h2>
                </div>
            <section className="services-section style-two pt-0">
              <div className="auto-container">

                <div className="row">
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>Orders</h5>
                      <h2>Orders</h2>
                      <Link to="/admin/order" className="read-more">
                        read more +
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
                      <a href="service-details.html" className="read-more">
                        ADD ORDER +
                      </a>
                      <div className="icon">
                        <span className="flaticon-gearbox"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>OPEN FOR ADMINS </h5>
                      <h2>Employees</h2>
                      <a href="service-details.html" className="read-more">
                        LIST OF EMPLOYEES +
                      </a>
                      <div className="icon">
                        <span className="flaticon-brake-disc"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>OPEN FOR ADMINS</h5>
                      <h2>Add Employees</h2>
                      <a href="service-details.html" className="read-more">
                        READ MORE +
                      </a>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>SERVICE AND REPAIRS</h5>
                      <h2>Engine Service & Repair</h2>
                      <a href="service-details.html" className="read-more">
                        READ MORE +
                      </a>
                      <div className="icon">
                        <span className="flaticon-tire"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>SERVICE AND REPAIRS</h5>
                      <h2>Tyre & Wheels</h2>
                      <a href="service-details.html" className="read-more">
                        READ MORE +
                      </a>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>SERVICE AND REPAIRS</h5>
                      <h2>Denting & Painting</h2>
                      <a href="service-details.html" className="read-more">
                        READ MORE +
                      </a>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>SERVICE AND REPAIRS</h5>
                      <h2>Engine Service and Repair</h2>
                      <a href="service-details.html" className="read-more">
                        READ MORE +
                      </a>
                      <div className="icon">
                        <span className="flaticon-spray-gun"></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 service-block-one">
                    <div className="inner-box hvr-float-shadow">
                      <h5>SERVICE AND REPAIRS</h5>
                      <h2>tyre & Wheels </h2>
                      <a href="service-details.html" className="read-more">
                        READ MORE +
                      </a>
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