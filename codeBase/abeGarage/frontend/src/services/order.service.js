// a function to get all orders from backend
const api_url = import.meta.env.VITE_API_URL;

const getAllOrders = async (loggedInEmployeeToken) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": loggedInEmployeeToken,
    },
  };
  const response = await fetch(`${api_url}/orders`, requestOptions);
  // console.log(response);

  return response.json();
};
// a function to add an order to the backend
const addOrder = async (order, loggedInEmployeeToken) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": loggedInEmployeeToken,
    },

    body: JSON.stringify(order),
  };
  const response = await fetch(`${api_url}/order`, requestOptions);
  return response.json();
};
//  a function to get single order by ID
const getOrderById = async (orderId, loggedInEmployeeToken) => {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": loggedInEmployeeToken,
    },
  };
  const response = await fetch(
    `${api_url}/order/${orderId}`,
    requestOptions
  );
  return response.json();
};
// a function to update an order
const updateOrder = async (orderId, order, loggedInEmployeeToken) => {
  console.log(order);
  
  const requestOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": loggedInEmployeeToken,
    },
    body: JSON.stringify(order),
  };
  const response = await fetch(
    `${api_url}/order/${orderId}`,
    requestOptions
  );
  return response.json();
};
// export the function
export { getAllOrders, addOrder, getOrderById, updateOrder };
