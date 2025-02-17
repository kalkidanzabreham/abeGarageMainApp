import React from 'react'
import {useAuth} from "../../../Context/AuthContext"
import LoginForm from "../../components/LoginForm/LoginForm"
import Unauthorized from '../Unauthorized';
import AdminMenu from '../../components/Admin/AdminMenu/AdminMenu';
import EmployeeList from '../../components/EmployeeList/EmployeeList';
function Employee() {
  const {isLoggedIn,isAdmin} = useAuth()
  if (isLoggedIn){
    if(isAdmin){
   return (
      <div>
        <div className="container-fluid admin-pages">
          <div className="row">
            <div className="col-md-3 admin-left-side">
              <AdminMenu />
            </div>
            <div className="col-md-9 admin-right-side">
            <EmployeeList />
            </div>
          </div>
        </div>
      </div>
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