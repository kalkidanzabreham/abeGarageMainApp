import { Routes, Route } from "react-router-dom";

// layouts
import PublicLayout from "./markup/layout/PublicLayout";
import AdminLayout from "./markup/layout/AdminLayout";
import ProtectedRoute from "./markup/components/Auth/ProtectedRoute";

// public pages
import Home from "./markup/pages/Home";
import About from "./markup/pages/About";
import Services from "./markup/pages/Services";
import Contact from "./markup/pages/Contact";
import Login from "./markup/pages/Login";
import CustomerOrder from "./markup/pages/CustomerOrder";
import CarStatusInfo from "./markup/pages/CarStatusInfo";
import Unauthorized from "./markup/pages/Unauthorized";
import NotFound from "./markup/pages/NotFound";

// staff pages
import AdminPage from "./markup/pages/admin/AdminPage";
import Employee from "./markup/pages/admin/Employee";
import AddEmploye from "./markup/pages/admin/AddEmploye";
import EmployeeEdit from "./markup/pages/admin/EmployeeEdit";
import CustomersList from "./markup/pages/admin/CustomersList";
import AddCustomers from "./markup/pages/admin/AddCustomers";
import EditCustomer from "./markup/pages/admin/EditCustomer";
import CustomerProfileLists from "./markup/pages/admin/CustomerProfileLists";
import EditVehicles from "./markup/pages/admin/EditVehicles";
import AdminService from "./markup/pages/admin/AdminService";
import Orders from "./markup/pages/admin/Order";
import OrderList from "./markup/pages/admin/OrderList";
import ViewOrder from "./markup/pages/admin/ViewOrder";
import EditOrder from "./markup/components/OrderEdit/OrderEdit";
import SmartIntakePage from "./markup/pages/admin/SmartIntakePage";

import { ALL_ROLES, PERMISSIONS, PAGE_ROLES } from "./util/roles";

// Staff pages and who may open them. Roles mirror
// backend/config/permissions.js; the API enforces them, this only avoids
// showing pages that would fail.
const STAFF_ROUTES = [
  ["/admin", PAGE_ROLES["/admin"], AdminPage],
  ["/admin/employee", PAGE_ROLES["/admin/employee"], Employee],
  ["/admin/addEmployee", PERMISSIONS["employees:write"], AddEmploye],
  ["/admin/add-employee", PAGE_ROLES["/admin/add-employee"], AddEmploye],
  ["/admin/employees/edit/:employee_id", PERMISSIONS["employees:write"], EmployeeEdit],
  ["/admin/all_customers", PAGE_ROLES["/admin/all_customers"], CustomersList],
  ["/admin/add_customers", PAGE_ROLES["/admin/add_customers"], AddCustomers],
  ["/admin/customer_edit/:customer_id", PERMISSIONS["customers:write"], EditCustomer],
  ["/admin/customer_profile/:customer_id", ALL_ROLES, CustomerProfileLists],
  ["/admin/edit_vehicle/:vehicle_id", PERMISSIONS["vehicles:write"], EditVehicles],
  ["/admin/service", PAGE_ROLES["/admin/service"], AdminService],
  ["/admin/new-order", PAGE_ROLES["/admin/new-order"], Orders],
  ["/admin/orders", PAGE_ROLES["/admin/orders"], OrderList],
  ["/admin/orders/:order_id", ALL_ROLES, ViewOrder],
  ["/admin/edit-order/:id", PERMISSIONS["orders:update"], EditOrder],
  ["/admin/smart-intake", PAGE_ROLES["/admin/smart-intake"], SmartIntakePage],
];

function App() {
  return (
    <Routes>
      {/* login: its own full-screen layout */}
      <Route path="/login" element={<Login />} />

      {/* public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/customer_order/:order_hash" element={<CustomerOrder />} />
        <Route path="/customer_info" element={<CarStatusInfo />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* staff app: any logged-in role gets the shell; each page checks its own roles */}
      <Route
        element={
          <ProtectedRoute roles={ALL_ROLES}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {STAFF_ROUTES.map(([path, roles, Page]) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute roles={roles}>
                <Page />
              </ProtectedRoute>
            }
          />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
