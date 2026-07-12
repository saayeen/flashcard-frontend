import { useNavigate } from "react-router-dom";
import jatiImg from "../../assets/jati.png";
import "./AppHeader.css";

interface AppHeaderProps {
    user?: { photoURL?: string | null; displayName?: string | null } | null;
    onSearchClick?: () => void;
}

export default function AppHeader({ user, onSearchClick }: AppHeaderProps) {
    const navigate = useNavigate();
    const initials = user?.displayName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="app-header">
            <div className="app-header-brand" onClick={() => navigate("/")}>
                <img src={jatiImg} alt="Jati" className="app-header-logo" />
                <span className="app-header-title">Jati</span>
            </div>
            <div className="app-header-actions">
                <button className="app-header-search-btn" onClick={onSearchClick} aria-label="Buscar">
                    <SearchIcon />
                </button>
                <button className="app-header-avatar" onClick={() => navigate("/profile")} aria-label="Perfil">
                    {user?.photoURL
                        ? <img src={user.photoURL} alt="Perfil" />
                        : <span>{initials || "?"}</span>
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