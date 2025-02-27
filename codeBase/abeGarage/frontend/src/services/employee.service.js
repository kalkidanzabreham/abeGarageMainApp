// import apiurl from env
const apiurl = import.meta.env.VITE_API_URL;
console.log(apiurl)
// create create employee function to send the data to the server
console.log(apiurl);
const createEmployee = async (data, token) => {
  console.log(token);

  try {
    const response = await fetch(
      `
    ${apiurl}/employee`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify(data),
      }
    );

    const responseData = await response.json();
    console.log(responseData);
    return responseData;
  } catch (error) {
    console.error(error);
  }
};
//  a function to send a get request to the server to get all employees

const getAllEmployees = async (token) => {
  const response = await fetch(`${apiurl}/employee`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });

  const responseData = await response.json();
  console.log(responseData);
  return responseData;
};

// A function to send get request to get employee
const getEmployee = async (token, employee_id) => {
	try {
		const response = await fetch(
			`${apiurl}/employee/${employee_id}`,
			{
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"x-access-token": token,
		},
	}
)

		// console.log('employee: response==',response);
		return response;
	} catch (error) {
		console.error("Error fetching employee:", error);
		throw error;
	}
};

// Afunction to send put request to update employee data
const updateEmployee = async (employeeId, formData, loggedInEmployeeToken) => {
	const requestOptions = {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"x-access-token": loggedInEmployeeToken,
		},
		body: JSON.stringify(formData),
	};

	const response = await fetch(
		`${apiurl}/employee/${employeeId}`,
		requestOptions
	);
	return response;
};

const deleteEmployee = async (employee_id, token) => {
  try {
    const response = await fetch(`${apiurl}/employee/${employee_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });

    if (!response.ok) {
      return { success: false, message: "Failed to delete employee" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
// export the create employee function


export { createEmployee, getAllEmployees,getEmployee,updateEmployee,deleteEmployee };

