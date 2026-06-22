import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Header.css";

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const initials = user?.displayName
        ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "?";

    // Cierra el menú si el usuario hace clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        navigate("/");
    };

    return (
        <header className="app-header">
            <div className="header-top">
                {searchOpen ? (
                    <form className="header-search-form" onSubmit={handleSearch}>
                        <input
                            className="header-search-input"
                            type="text"
                            placeholder="Buscar paquetes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="button" className="header-icon-btn" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                            <XIcon />
                        </button>
                    </form>
                ) : (
                    <div className="header-actions">
                        <button className="header-icon-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar">
                            <SearchIcon />
                        </button>
                        <div className="header-profile-wrapper" ref={menuRef}>
                            <button className="header-avatar-btn" onClick={() => user ? setMenuOpen(!menuOpen) : navigate("/")} aria-label="Perfil">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Perfil" className="header-avatar-img" />
                                ) : (
                                    <span className="header-avatar-initials">{initials}</span>
                                )}
                            </button>
                            {menuOpen && user && (
                                <div className="header-profile-menu">
                                    <p className="header-profile-name">{user.displayName}</p>
                                    <button className="header-logout-btn" onClick={handleLogout}>
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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

function XIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}