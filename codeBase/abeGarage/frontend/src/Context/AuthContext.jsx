import React, { useContext, useEffect, useState } from "react";
import { getAuth } from "../util/Auth";
import { getToken } from "../services/api";
import { ROLES, can as roleCan } from "../util/roles";

const AuthContext = React.createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const Authprovider = ({ children }) => {
  const token = getToken();

  const [employee, setEmployee] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const roleId = employee ? employee.employee_role_id : null;
  // read-only demo account (replaces the removed guest login)
  const isDemo = roleId === ROLES.DEMO;
  // UI hint only; the API enforces permissions (see util/roles.js)
  const can = (permission) => roleCan(roleId, permission);

  const value = {
    token,
    isLoggedIn,
    isDemo,
    employee,
    roleId,
    can,
    isAdmin,
    setIsLoggedIn,
    setIsAdmin,
  };

  const fetch = () => {
    const auth = getAuth();
    auth.then((response) => {
      if (response) {
        setIsLoggedIn(true);
        if (response.employee_role_id === ROLES.ADMIN) {
          setIsAdmin(true);
        }
        setEmployee(response);
      }
    });
  };

  useEffect(() => {
    fetch();
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
