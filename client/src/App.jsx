import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Category from "./pages/Category";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VendorDetail from "./pages/VendorDetail";
import VendorDashboard from "./pages/VendorDashboard";
import AddService from "./pages/AddService";
import UserDashboard from "./pages/UserDashboard";
import Vendors from "./pages/Vendors";
import CustomerCareClient from "./pages/CustomerCareClient";
import CustomerCareVendor from "./pages/CustomerCareVendor";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:type" element={<Category />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/vendor/:id" element={<VendorDetail />} />
        <Route path="/vendor-dashboard" element={<VendorDashboard />} />
        <Route path="/add-service" element={<AddService />} />
        <Route path="/my-bookings" element={<UserDashboard />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/customer-care" element={<CustomerCareClient />} />
        <Route path="/customer-care/vendor" element={<CustomerCareVendor />} />
      </Routes>
    </BrowserRouter>
  );
}