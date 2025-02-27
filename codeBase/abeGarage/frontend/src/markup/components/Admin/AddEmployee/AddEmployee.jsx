import React from 'react'
// import use state
import { useState } from 'react';
// import useNavigate
import { useAuth } from '../../../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
// import createEmployee function]
import { createEmployee } from '../../../../services/employee.service';
function AddEmployee() {
  // create state to srore the form errors
  const [first_name_error, set_first_name] = useState("");  
  const [email_error, set_email] = useState("");
  const [server_error, set_server_error] = useState("");
  const [password_error, set_password] = useState("");
  const [succes_message, set_succes_message] = useState(false);
  const navigate = useNavigate();
  const {token } = useAuth();
  console.log(token);
  
  // console.log(token);

  const handleSubmit = (e) => {
    e.preventDefault();
    // set the states to empty
    set_first_name("");
    set_email("");
    set_server_error("");
    set_password("");
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.active_employee = 1;
    let valid = true;
    console.log(data);
    // check if the first name is empty
    if(data.employee_first_name === ""){
      set_first_name("First name is required");
      valid = false;
    }
    
    // define a variable to store email regex 
    const email_regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    
    // check if the email is empty
    if(data.employee_email === ""){
      set_email("Email is required");
      valid = false;
    } else if(!data.employee_email.includes("@")){
      set_email("Email is invalid");
      valid = false;
    } else if(!email_regex.test(data.employee_email)){
      set_email("Email is invalid");
      valid = false;
    }
  

  // check if the password is empty
  if(data.employee_password === ""){
    set_password("Password is required")
    valid = false
  };
  // check if the password is less than 6 characters
  if(data.employee_password.length < 6){
    set_password("Password must be at least 6 characters")
    valid = false
  };
  // if the form is valid
  if(!valid){
    return;
  }
// pass the data to the create employee function
try {
  createEmployee(data,token).then((response) => {
    // console.log(response);
  if(response.message){
    set_server_error(response.message);
  } else {
    set_succes_message(true);
    setTimeout(() => {
      navigate("/");
    }, 3000);
  }});
} catch (error) {
  console.error(error);
  set_server_error("An error occured");
  
}
}

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="contact-title">
          <h2>Add a new employee</h2>
        </div>
        <div className="row clearfix">
          <div className="form-column col-lg-7">
            <div className="inner-column">
              <div className="contact-form">
                <form onSubmit={handleSubmit}>
                  <div className="row clearfix">
                    <div className="form-group col-md-12">
                      {server_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {server_error}
                        </div>
                      )}
                      <input
                        type="text"
                        name="employee_email"
                        placeholder="Employee email"
                      />

                      {email_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {email_error}
                        </div>
                      )}
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        name="employee_first_name"
                        placeholder="Employee first name"
                      />
                      {first_name_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {first_name_error}
                        </div>
                      )}
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        name="employee_last_name"
                        placeholder="Employee last name"
                      />
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="text"
                        name="employee_phone"
                        placeholder="Employee phone (555-555-5555)"
                      />
                    </div>

                    <div className="form-group col-md-12">
                      <select
                        name="company_role_id"
                        className="custom-select-box"
                      >
                        <option value="1">Employee</option>
                        <option value="2">Manager</option>
                        <option value="3">Admin</option>
                      </select>
                    </div>

                    <div className="form-group col-md-12">
                      <input
                        type="password"
                        name="employee_password"
                        placeholder="Employee password"
                      />
                      {password_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {password_error}
                        </div>
                      )}
                    </div>

                    <div className="form-group col-md-12">
                      <button
                        className="theme-btn btn-style-one"
                        type="submit"
                        data-loading-text="Please wait..."
                      >
                        <span>Add employee</span>
                      </button>
                    </div>
                  </div>
                </form>
                {succes_message && (
                  <div className="success_message">
                    Employee added successfully!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AddEmployee