import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home               from "./pages/Home";
import Category           from "./pages/Category";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import ForgotPassword     from "./pages/ForgotPassword";
import VendorDetail       from "./pages/VendorDetail";
import VendorDashboard    from "./pages/VendorDashboard";
import AddService         from "./pages/AddService";
import EditService        from "./pages/EditService";
import ServiceGallery     from "./pages/ServiceGallery";
import UserDashboard      from "./pages/UserDashboard";
import Vendors            from "./pages/Vendors";
import Favorites          from "./pages/Favorites";
import CustomerCareClient from "./pages/CustomerCareClient";
import CustomerCareVendor from "./pages/CustomerCareVendor";
import PaymentSuccess     from "./pages/PaymentSuccess";
import AboutUs            from "./pages/AboutUs";

// ── Resource pages ──────────────────────────────────────────────────
import VendorHandbook   from "./pages/resources/VendorHandbook";
import PhotoGuidelines  from "./pages/resources/PhotoGuidelines";
import PricingStrategy  from "./pages/resources/PricingStrategy"; 
import DashboardGuide   from "./pages/resources/DashboardGuide";

// ── Admin pages ─────────────────────────────────────────────────────
import AdminLogin     from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                        element={<Home />} />
        <Route path="/category/:type"          element={<Category />} />
        <Route path="/login"                   element={<Login />} />
        <Route path="/register"                element={<Register />} />
        <Route path="/forgot-password"         element={<ForgotPassword />} />
        <Route path="/vendor/:id"              element={<VendorDetail />} />
        <Route path="/vendor/:id/gallery"      element={<ServiceGallery />} />
        <Route path="/vendors"                 element={<Vendors />} />
        <Route path="/about"                   element={<AboutUs />} />


        {/* ── Vendor ── */}
        <Route path="/vendor-dashboard"        element={<VendorDashboard />} />
        <Route path="/add-service"             element={<AddService />} />
        <Route path="/edit-service/:id"        element={<EditService />} />

        {/* ── User ── */}
        <Route path="/my-bookings"             element={<UserDashboard />} />
        <Route path="/favourites"              element={<Favorites />} />

        {/* ── Support ── */}
        <Route path="/customer-care"           element={<CustomerCareClient />} />
        <Route path="/customer-care/vendor"    element={<CustomerCareVendor />} />

        {/* ── Vendor Resources ── */}
        <Route path="/resources/vendor-handbook"   element={<VendorHandbook />} />
        <Route path="/resources/photo-guidelines"  element={<PhotoGuidelines />} />
        <Route path="/resources/pricing-strategy"  element={<PricingStrategy />} />
        <Route path="/resources/dashboard-guide"   element={<DashboardGuide />} />
        <Route path="/payment-success/:bookingId" element={<PaymentSuccess />} />

        {/* ── Admin ── */}
        <Route path="/admin/login"  element={<AdminLogin />} />
        <Route path="/admin"        element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}