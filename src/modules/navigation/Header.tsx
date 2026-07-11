import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import jatiImg from "../../assets/jati.png";
import "./Header.css";

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const initials = user?.displayName
        ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    return (
        <header className="app-header">
            <div className="header-top">
                <div className="header-left" onClick={() => navigate("/")}>
                    <img src={jatiImg} alt="Jati" className="header-logo" />
                    <span className="header-brand">Jati</span>
                </div>
                <div className="header-actions">
                    <button className="header-icon-btn" onClick={() => navigate("/search")} aria-label="Buscar">
                        <SearchIcon />
                    </button>
                    {user && (
                        <button className="header-avatar-btn" onClick={() => navigate("/profile")} aria-label="Perfil">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Perfil" className="header-avatar-img" />
                            ) : (
                                <span className="header-avatar-initials">{initials}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

function SearchIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}