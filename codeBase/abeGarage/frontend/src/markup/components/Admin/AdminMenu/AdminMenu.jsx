import React from 'react'
import { useAuth } from '../../../../Context/AuthContext';
import { canVisit } from '../../../../util/roles';

const ITEMS = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/new-order", "New order"],
  ["/admin/add-employee", "Add employee"],
  ["/admin/employee", "Employees"],
  ["/admin/add_customers", "Add customer"],
  ["/admin/all_customers", "Customers"],
  ["/admin/service", "Services"],
  ["/admin/smart-intake", "Smart intake (AI)"],
];

function AdminMenu() {
  const { roleId, aiStatus } = useAuth();
  return (
    <div>
      <div className="admin-menu">
        <h2>Admin Menu</h2>
      </div>
      <div className="list-group">
        {/* only pages this role can open (util/roles.js PAGE_ROLES) */}
        {ITEMS.filter(([path]) => canVisit(roleId, path) && (path !== "/admin/smart-intake" || aiStatus)).map(([path, label]) => (
          <a key={path} href={path} className="list-group-item">
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default AdminMenu
