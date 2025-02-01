import './App.css'
// import routes and route from react-router-dom
import { Routes, Route } from 'react-router-dom'
// import components
import Home from './markup/pages/Home'
import About from './markup/pages/About'
import Login from './markup/pages/Login'
import AddEmploye from './markup/pages/admin/addEmploye'
import Services from './markup/pages/Services'
import Contact from './markup/pages/Contact'
import NotFound from './markup/pages/NotFound'
import Header from './markup/components/Header/Header'
// import bootstrap sytles color and responsive css files 
import "./assets/template_assets/css/bootstrap.css"
import "./assets/template_assets/css/style.css"
import "./assets/template_assets/css/responsive.css"
import "./assets/template_assets/css/color.css";
import "./assets/styles/custom.css"
import Footer from './markup/components/Footer/Footer'

function App() {
  

  return (
    <>
    <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/addEmployee" element={<AddEmploye />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer/>
    </>
  )
}

export default App
