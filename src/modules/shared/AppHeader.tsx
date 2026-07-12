import { useNavigate } from "react-router-dom";
import jatiImg from "../../assets/jati.png";
import "./AppHeader.css";

interface AppHeaderProps {
    user?: { photoURL?: string | null; displayName?: string | null } | null;
    onSearchClick?: () => void; // si no se pasa, navega a /search (búsqueda global)
    onRequireAuth?: () => void; // si no hay user y hace click en el avatar, se llama esto (abrir AuthModal)
}

export default function AppHeader({ user, onSearchClick, onRequireAuth }: AppHeaderProps) {
    const navigate = useNavigate();
    const initials = user?.displayName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    const handleSearchClick = () => {
        if (onSearchClick) onSearchClick();
        else navigate("/search");
    };

    const handleAvatarClick = () => {
        if (user) navigate("/profile");
        else if (onRequireAuth) onRequireAuth();
    };

    return (
        <div className="app-header">
            <div className="app-header-brand" onClick={() => navigate("/")}>
                <img src={jatiImg} alt="Jati" className="app-header-logo" />
                <span className="app-header-title">Jati</span>
            </div>
            <div className="app-header-actions">
                <button className="app-header-search-btn" onClick={handleSearchClick} aria-label="Buscar">
                    <SearchIcon />
                </button>
                <button className="app-header-avatar" onClick={handleAvatarClick} aria-label="Perfil">
                    {user?.photoURL
                        ? <img src={user.photoURL} alt="Perfil" />
                        : user?.displayName
                            ? <span>{initials}</span>
                            : <PersonIcon />
                    }
                </button>
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function PersonIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}