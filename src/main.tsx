
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./modules/auth/AuthContext";
import { AuthGateProvider } from "./modules/auth/AuthGateContext";

createRoot(document.getElementById("root")!).render(
<AuthProvider>
  <AuthGateProvider>
    <App />
  </AuthGateProvider>
</AuthProvider>
);