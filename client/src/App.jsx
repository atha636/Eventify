import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Category from "./pages/Category";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VendorDetail from "./pages/VendorDetail";
import VendorDashboard from "./pages/VendorDashboard";
import AddService from "./pages/AddService";
import UserDashboard from "./pages/UserDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/category/:type" element={<Category />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vendor/:id" element={<VendorDetail />} />
        <Route path="/vendor-dashboard" element={<VendorDashboard />} />
        <Route path="/add-service" element={<AddService />} />
        <Route path="/my-bookings" element={<UserDashboard />} />
      </Routes>
    </BrowserRouter>
    
  );
  
}