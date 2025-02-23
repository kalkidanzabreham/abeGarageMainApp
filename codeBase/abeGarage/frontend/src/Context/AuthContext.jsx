// import react from 'react';
import React, { useContext, useEffect,useState} from "react";
 import customerService from '../services/customer.service'
// import getauth 
import { getAuth } from "../util/Auth";
const AuthContext = React.createContext();

export const useAuth = () =>{
    return useContext(AuthContext)
}


export const Authprovider = ({children}) => {
    const [customers, setcustomers] = useState([]);
     const [loading, setLoading] = useState(false);
       const [apiErrorMessage, setApiErrorMessage] = useState(null);
       const [apiError, setApiError] = useState(false);
    const token = JSON.parse(localStorage.getItem("Our-token"))
  
    const [employee,setEmployee]  = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const[isAdmin, setIsAdmin] = useState(false)
    const value = {token,isLoggedIn,employee,isAdmin,setIsLoggedIn,setIsAdmin,customers,getAllCustomerList,loading,apiError,apiErrorMessage}

    const fetch =  ()=> {
      const auth = getAuth();
      auth.then((response) => {
        if (response) {
          setIsLoggedIn(true);

          if (response.employee_role_id === 3) {
            setIsAdmin(true);
          }
          setEmployee(response);
        }
      });
    }
    
    useEffect(()=>{
      fetch()
    },[token])
 
    function getAllCustomerList() {
      setLoading(true);
      const allcustomers = customerService.getCustomer();
      allcustomers
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
            setcustomers(data.data);
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


 
 return (<AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>)  
} 