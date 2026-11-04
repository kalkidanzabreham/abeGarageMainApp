import React, { useContext, useEffect, useState } from "react";
import { getAuth } from "../util/Auth";
import { getToken } from "../services/api";
import { ROLES, can as roleCan } from "../util/roles";
import { getAiStatus } from "../services/ai.service";

const AuthContext = React.createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const Authprovider = ({ children }) => {
  const token = getToken();

  const [employee, setEmployee] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // smart intake: null = switched off or not allowed for this role
  const [aiStatus, setAiStatus] = useState(null);
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
    aiStatus,
    refreshAiStatus,
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

  function refreshAiStatus() {
    getAiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus(null));
  }

  useEffect(() => {
    fetch();
  }, [token]);

  // ask the API once per login whether smart intake is on for this user
  useEffect(() => {
    if (roleId && roleCan(roleId, "ai:intake")) refreshAiStatus();
    else setAiStatus(null);
  }, [roleId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
