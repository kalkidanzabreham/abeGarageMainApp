import React,{useState,useEffect} from 'react'
import { getAuth } from '../../../util/Auth'
import { Navigate,useLocation } from 'react-router-dom'

// UI routing only; the API enforces the same rules (backend/config/permissions.js)
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
            }
            setIsChecked(true)
    })

    }, [roles])


    if (!isChecked) {
        // don't render protected content before the check has run
        return null
    }
    if(!isLogged){
        return <Navigate to="/login" state={{from:location}}/>
    }
    if(!isAuthorized){
        return <Navigate to="/unauthorized" />
    }
  return (
    children
  )
}

export default ProtectedRoute
