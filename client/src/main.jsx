import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="46294113326-n8q9mi1qavgj93g85m4q1meac5j4sere.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);