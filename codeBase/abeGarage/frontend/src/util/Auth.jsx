// get the token from the local storage
const getAuth = async () => {
const token = await JSON.parse(localStorage.getItem("Our-token"))
if(token){
    const employee = await decodeToken(token)
    employee.token = token;
    return employee
}

}
  
// write a function to decode the payload from the token

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    const decodedPayload = JSON.parse(atob(base64));
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
// export get auth
 export { getAuth };
 