import React,{useState,useEffect} from 'react'
import { getAuth } from '../../../util/Auth'
import { Navigate,useLocation } from 'react-router-dom'

function ProtectedRoute({roles,children}) {
    const [isLogged, setIsLogged] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isChecked, setIsChecked] = useState(false)
    const location =  useLocation()

    useEffect(() => {
        const auth = getAuth()
        auth.then((employee) => {   
            if(employee){
                setIsLogged(true)
                
                if(roles && roles.includes(employee.employee_role_id)){
                    setIsAuthorized(true)
                }
                if(roles && roles.includes("guest")){
                    setIsAuthorized(true)
                }
            }
            setIsChecked(true)
    })

    }, [roles])


    if (isChecked) {
        if(!isLogged){
            return <Navigate to="/login" redirect = {{from:location}}/>
        }
        else if(!isAuthorized){
            return <Navigate to="/unauthorized" />
        }
    }
  return (
    children
  )
}

export default ProtectedRoute