import "./App.css";
// import routes and route from react-router-dom
import { Routes, Route } from "react-router-dom";
// import components
import Home from "./markup/pages/Home";
import About from "./markup/pages/About";
import Login from "./markup/pages/Login";
import AddEmploye from "./markup/pages/admin/AddEmploye";
import Services from "./markup/pages/Services";
import Contact from "./markup/pages/Contact";
import NotFound from "./markup/pages/NotFound";
import Header from "./markup/components/Header/Header";
// import bootstrap sytles color and responsive css files
import "./assets/template_assets/css/bootstrap.css";
import "./assets/template_assets/css/style.css";
import "./assets/template_assets/css/responsive.css";
import "./assets/template_assets/css/color.css";
import "./assets/styles/custom.css";
// import all styles

import Footer from "./markup/components/Footer/Footer";
// import components from './components
import Employee from "./markup/pages/admin/Employee";
import Customer from "./markup/pages/admin/customer";
import Unauthorized from "./markup/pages/Unauthorized";
import ProtectedRoute from "./markup/components/Auth/ProtectedRoute";

import CustomerOrder from "./markup/pages/CustomerOrder";
import CarStatusInfo from "./markup/pages/CarStatusInfo";


import Orders from "./markup/pages/admin/Order";
import OrderList from "./markup/pages/admin/OrderList";

import AddCustomers from "./markup/pages/admin/AddCustomers";
import CustomersList from "./markup/pages/admin/CustomersList";
import CustomerProfileLists from "./markup/pages/admin/CustomerProfileLists";
import EditCustomer from "./markup/pages/admin/EditCustomer";
import EditVehicles from "./markup/pages/admin/EditVehicles";
import ViewOrder from "./markup/pages/admin/ViewOrder";

import AdminService from "./markup/pages/admin/AdminService";
import EmployeeEdit from "./markup/pages/admin/EmployeeEdit";

import AdminPage from "./markup/pages/admin/AdminPage";

import { MdOutlineAirlineSeatLegroomReduced } from "react-icons/md";

import EditOrder from "./markup/components/OrderEdit/OrderEdit";



function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/addEmployee"
          element={
            <ProtectedRoute roles={[3]}>
              <AddEmploye />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit_vehicle/:vehicle_id"
          element={<EditVehicles />}
        />
        <Route
          path="/admin/customer_edit/:customer_id"
          element={<EditCustomer />}
        />
        <Route
          path="/admin/add_customers"
          element={
            <ProtectedRoute roles={[1, 2, 3]}>
              <AddCustomers />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/all_customers" element={<CustomersList />} />

        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/employee" element={<Employee />} />

        <Route path="/customer_order/:order_hash" element={<CustomerOrder />} />
        <Route path="/customer_info" element={<CarStatusInfo />} />


        <Route path="/admin/service" element={<AdminService />} />

        <Route path="/admin/add-employee" element={<AddEmploye/>} />



        <Route
          path="/admin/employees/edit/:employee_id"
          element={<EmployeeEdit />}
        />

        <Route
          path="/admin/customer_profile/:customer_id"
          element={<CustomerProfileLists />}
        />
        <Route
          path="/admin/new-order"
          element={
            <ProtectedRoute roles={[3]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={[1, 2, 3]}>
              <OrderList />
            </ProtectedRoute>
          }
        />
         <Route
          path="/admin/orders/:order_id"
          element={
            <ProtectedRoute roles={[1, 2, 3]}>
              <ViewOrder/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-order/:id"
          element={
            <ProtectedRoute roles={[1, 2, 3]}>
              <EditOrder />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
