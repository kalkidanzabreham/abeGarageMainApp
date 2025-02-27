 const apiurl = import.meta.env.VITE_API_URL;
 
 const getAllServices = async () => {
    try {
      const response = await fetch(`
    ${apiurl}/services`);
    const responseData = await response.json();
    // console.log(responseData);
    return responseData;
  } catch (error) {
    console.error(error);
  }
}

  const addServiceService = async (service) => {
    try {
      const response  = await fetch(`${apiurl}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      const responseData = await response.json();
      console.log(responseData);
      return responseData;
    } catch (error) {
      console.error(error);
    }
  };

  const updateServiceService = async (service,serviceToBeEdited) => {
    try {
      const response = await fetch(`${apiurl}/services/${serviceToBeEdited.service_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      const responseData = await response.json();
      console.log(responseData);
      return responseData;
    } catch (error) {
      console.error(error);
    }
  };

  const deleteServiceService = async (id) => {
    try {
      const response = await fetch(`${apiurl}/services/${id}`, {
        method: "DELETE",
      });
      const responseData = await response.json();
      console.log(responseData);
      return responseData;
    } catch (error) {
      console.error(error);
    }
  };

  export {getAllServices,addServiceService,updateServiceService,deleteServiceService}