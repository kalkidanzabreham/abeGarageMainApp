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


import EditOrder from "./markup/components/OrderEdit/OrderEdit";
import { ALL_ROLES, PERMISSIONS } from "./util/roles";



function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/customer_order/:order_hash" element={<CustomerOrder />} />
        <Route path="/customer_info" element={<CarStatusInfo />} />
        {/* staff pages: roles mirror backend/config/permissions.js;
            the API enforces them, this only avoids showing pages that
            would fail */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={ALL_ROLES}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employee"
          element={
            <ProtectedRoute roles={PERMISSIONS["employees:read"]}>
              <Employee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/addEmployee"
          element={
            <ProtectedRoute roles={PERMISSIONS["employees:write"]}>
              <AddEmploye />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add-employee"
          element={
            <ProtectedRoute roles={PERMISSIONS["employees:write"]}>
              <AddEmploye />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees/edit/:employee_id"
          element={
            <ProtectedRoute roles={PERMISSIONS["employees:write"]}>
              <EmployeeEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/all_customers"
          element={
            <ProtectedRoute roles={ALL_ROLES}>
              <CustomersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add_customers"
          element={
            <ProtectedRoute roles={PERMISSIONS["customers:write"]}>
              <AddCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customer_edit/:customer_id"
          element={
            <ProtectedRoute roles={PERMISSIONS["customers:write"]}>
              <EditCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customer_profile/:customer_id"
          element={
            <ProtectedRoute roles={ALL_ROLES}>
              <CustomerProfileLists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit_vehicle/:vehicle_id"
          element={
            <ProtectedRoute roles={PERMISSIONS["vehicles:write"]}>
              <EditVehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/service"
          element={
            <ProtectedRoute roles={ALL_ROLES}>
              <AdminService />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/new-order"
          element={
            <ProtectedRoute roles={PERMISSIONS["orders:create"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={ALL_ROLES}>
              <OrderList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:order_id"
          element={
            <ProtectedRoute roles={ALL_ROLES}>
              <ViewOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-order/:id"
          element={
            <ProtectedRoute roles={PERMISSIONS["orders:update"]}>
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
