// import react from 'react';
import React, { useContext, useEffect,useState} from "react";
// import getauth 
import { getAuth } from "../util/Auth";
const AuthContext = React.createContext();

export const useAuth = () =>{
    return useContext(AuthContext)
}


export const Authprovider = ({children}) => {
    const token = JSON.parse(localStorage.getItem("Our-token"))
  
    const [employee,setEmployee]  = useState(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const[isAdmin, setIsAdmin] = useState(false)
    const value = {token,isLoggedIn,employee,isAdmin,setIsLoggedIn,setIsAdmin}

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
 
 

 
 return (<AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>)  
} 