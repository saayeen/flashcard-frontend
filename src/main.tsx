import { createRoot } from 'react-dom/client'
import './modules/theme/Theme.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./modules/auth/AuthContext";
import { AuthGateProvider } from "./modules/auth/AuthGateContext";
import { ThemeProvider } from "./modules/theme/ThemeContext.tsx";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
        <AuthProvider>
            <AuthGateProvider>
                <App />
            </AuthGateProvider>
        </AuthProvider>
    </ThemeProvider>
);