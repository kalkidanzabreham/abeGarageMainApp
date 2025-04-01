import React, { useContext, useEffect, useState } from "react";
import customerService from "../services/customer.service";
import { getAuth } from "../util/Auth";

const AuthContext = React.createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const Authprovider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const [apiError, setApiError] = useState(false);
  const token = JSON.parse(localStorage.getItem("Our-token"));

  const [employee, setEmployee] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false); 

  const value = {
    token,
    isLoggedIn,
    isGuest, 
    employee,
    isAdmin,
    setIsLoggedIn,
    setIsAdmin,
    setIsGuest, 
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

        if (response.employee_role_id === 3) {
          setIsAdmin(true);
        } else if (response.employee_role_id === "guest") {
          setIsGuest(true); 
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
        if (data.data.length !== 0) {
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
    getAllCustomerList();
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
