import React from 'react'
import {useAuth} from "../../../Context/AuthContext"
import LoginForm from "../../components/LoginForm/LoginForm"
import Unauthorized from '../Unauthorized';
import EmployeeList from '../../components/EmployeeList/EmployeeList';
function Employee() {
  const {isLoggedIn,can} = useAuth()
  if (isLoggedIn){
    if(can("employees:read")){
   return (
      <>
            <EmployeeList />
      </>
      )
    }else{
      return <Unauthorized/>
    }
  }
  else{
    return <LoginForm/>
  }
}

export default Employee