import React, { useContext, useEffect, useState } from "react";
import customerService from "../services/customer.service";
import { getAuth } from "../util/Auth";
import { getToken } from "../services/api";
import { ROLES, can as roleCan } from "../util/roles";

const AuthContext = React.createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const Authprovider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const [apiError, setApiError] = useState(false);
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
    customers,
    getAllCustomerList,
    loading,
    apiError,
    apiErrorMessage,
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

  function getAllCustomerList() {
    setLoading(true);
    const allCustomers = customerService.getCustomer();
    allCustomers
      .then((res) => {
        if (!res.ok) {
          setApiError(true);
          if (res.status === 401) {
            setApiErrorMessage("Please login again");
          } else if (res.status === 403) {
            setApiErrorMessage("You are not authorized to view this page");
          } else {
            setApiErrorMessage("Please try again later");
          }
        }
        return res.json();
      })
      .then((data) => {
        if (data.data && data.data.length !== 0) {
          setCustomers(data.data);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    // customer data needs a login; don't request it for anonymous visitors
    if (token) {
      getAllCustomerList();
    }
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
