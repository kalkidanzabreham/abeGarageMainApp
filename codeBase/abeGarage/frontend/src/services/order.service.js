const api_url = import.meta.env.VITE_API_URL;
const getAllOrders = async () => {
  try {
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await fetch(`${api_url}/api/getorders`, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.log(error);
  }
};

const singleOrder = async (order_id) => {
  try {
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await fetch(
      `${api_url}/api/singleorder/${order_id}`,
      options
    );
    return response.json();
  } catch (error) {
    console.log(error);
  }
};

const orders = {

  getAllOrders,
  singleOrder,

};

export default orders;
