import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import authcontextfrom './authcontext
import { Authprovider } from "./Context/AuthContext.jsx"
// import browserRouter from 'react-router-dom'
 import { BrowserRouter } from 'react-router-dom'
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <Authprovider>
        <App />
      </Authprovider>
    </StrictMode>
  </BrowserRouter>
);
