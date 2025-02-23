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
// export the create employee function
export { createEmployee, getAllEmployees };
