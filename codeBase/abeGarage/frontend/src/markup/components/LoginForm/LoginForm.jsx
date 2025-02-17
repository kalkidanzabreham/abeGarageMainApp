import React from 'react'
// import use state
import { useState } from 'react';
// import useNavigate
import { useNavigate,useLocation} from 'react-router-dom';
// import login fun
import { login } from '../../../services/login.service';
function LoginForm() {

  const [email_error, set_email] = useState("");
  const [server_error, set_server_error] = useState("");
  const [password_error, set_password] = useState("");
  const [succes_message, set_succes_message] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.redirect?.from || "/";
  console.log(location);
  //collecting data from the form
  const handleSubmit =  async (e) => {
    e.preventDefault();
    // set the states to empty
    set_email("");
    set_server_error("");
    set_password("");
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    let valid = true;
  

    // define a variable to store email regex
    const email_regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    // check if the email is empty
    if (data.employee_email === "") {
      set_email("Email is required");
      valid = false;
    } else if (!data.employee_email.includes("@")) {
      set_email("Email is invalid");
      valid = false;
    } else if (!email_regex.test(data.employee_email)) {
      set_email("Email is invalid");
      valid = false;
    }

    // check if the password is empty
    if (data.employee_password === "") {
      set_password("Password is required");
      valid = false;
    }
    // check if the password is less than 6 characters
    if (data.employee_password.length < 6) {
      set_password("Password must be at least 6 characters");
      valid = false;
    }
    // if the form is valid
    if (!valid) {
      return;
    }
    // call the login function to send the data to the server
    try {
      const response = await login(data);
      console.log(response);
      if (response.status === "success") {
        set_succes_message(true);
        // set jwt token to local storage
        const token = response.token
        localStorage.setItem("Our-token",JSON.stringify(token))
        setTimeout(() => {
          navigate(redirect);
        }, 2000);
      
      } else {
        set_server_error(response.message);
      }
      
    } catch (error) {
      console.log(error);
      
    }
  
  }

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="contact-title">
          <h2>Login to your account</h2>
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
                        type="email"
                        name="employee_email"
                        placeholder="Email"
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
                        type="password"
                        name="employee_password"
                        placeholder="Password"
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
                        <span>Login</span>
                      </button>
                    </div>
                  </div>
                </form>
                {succes_message && (
                  <div className="success_message">
                    Employee logged successfully!
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

export default LoginForm