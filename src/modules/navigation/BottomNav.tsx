import { useLocation, useNavigate } from "react-router-dom";
import { useAuthGate } from "../auth/AuthGateContext";
import "./BottomNav.css";

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { requireAuth } = useAuthGate();

    const isActive = (path: string) => location.pathname === path;

    const handleHome = () => navigate("/");
    const handleCreate = () => requireAuth(() => navigate("/packages/new"));
    const handleFolders = () => requireAuth(() => navigate("/folders"));

    return (
        <nav className="bottom-nav" aria-label="Navegación principal">
            <button
                className={`nav-item ${isActive("/") ? "nav-item-active" : ""}`}
                onClick={handleHome}
                aria-label="Inicio"
            >
                <HomeIcon />
                <span className="nav-label">Inicio</span>
            </button>

            <button
                className="nav-item nav-item-create"
                onClick={handleCreate}
                aria-label="Crear paquete"
            >
                <PlusIcon />
            </button>

            <button
                className={`nav-item ${isActive("/folders") ? "nav-item-active" : ""}`}
                onClick={handleFolders}
                aria-label="Paquetes"
            >
                <CardStackIcon />
                <span className="nav-label">Paquetes</span>
            </button>
        </nav>
    );
}

function HomeIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
                d="M3 11.5L12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1h4v-5.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V20h4a1 1 0 0 0 1-1v-9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function CardStackIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="4" width="11" height="14" rx="1.5"
                stroke="currentColor" strokeWidth="1.6"
                transform="rotate(8 14.5 11)" />
            <rect x="7" y="3" width="11" height="14" rx="1.5"
                stroke="currentColor" strokeWidth="1.6" />
            <rect x="4" y="5" width="11" height="14" rx="1.5"
                stroke="currentColor" strokeWidth="1.6"
                transform="rotate(-8 9.5 12)" />
        </svg>
    );
}