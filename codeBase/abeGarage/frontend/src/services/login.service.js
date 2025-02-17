// create a login function to send the data to the server
 const login = async (data) => {
    try {
      const response = await fetch(`http://localhost:7000/api/employee/login`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(data),
      });
      const responseData = await response.json();
     
      return responseData;
    } catch (error) {
      console.error(error);
    }
     }

  const logout = () =>{
    localStorage.removeItem("Our-token"); // redirect to login page
  }
// export log
export {
  login,
  logout
};