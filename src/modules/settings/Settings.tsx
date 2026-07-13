import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import "./Settings.css";

export default function Settings() {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [notifGeneral, setNotifGeneral] = useState(true);
    const [notifFollow, setNotifFollow] = useState(true);
    const [notifFork, setNotifFork] = useState(true);
    const [isPublic, setIsPublic] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className="settings-page">
            {/* HEADER */}
            <div className="settings-header">
                <button className="settings-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <h1 className="settings-title">Configuración</h1>
                <div style={{ width: 36 }} />
            </div>

            <div className="settings-body">

                {/* CUENTA */}
                <div className="settings-group">
                    <p className="settings-group-label">Cuenta</p>
                    <div className="settings-card">
                        <button className="settings-row" onClick={() => {}}>
                            <span className="settings-row-label">Cambiar nombre de usuario</span>
                            <ChevronIcon />
                        </button>
                        <div className="settings-divider" />
                        <button className="settings-row" onClick={() => {}}>
                            <span className="settings-row-label">Cambiar correo</span>
                            <ChevronIcon />
                        </button>
                        <div className="settings-divider" />
                        <button className="settings-row" onClick={() => {}}>
                            <span className="settings-row-label">Cambiar contraseña</span>
                            <ChevronIcon />
                        </button>
                    </div>
                </div>

                {/* NOTIFICACIONES */}
                <div className="settings-group">
                    <p className="settings-group-label">Notificaciones</p>
                    <div className="settings-card">
                        <div className="settings-row">
                            <span className="settings-row-label">Activar notificaciones generales</span>
                            <Toggle value={notifGeneral} onChange={setNotifGeneral} />
                        </div>
                        <div className="settings-divider" />
                        <div className="settings-row">
                            <span className="settings-row-label">Notificar cuando alguien sigue</span>
                            <Toggle value={notifFollow} onChange={setNotifFollow} />
                        </div>
                        <div className="settings-divider" />
                        <div className="settings-row">
                            <span className="settings-row-label">Notificar cuando copian un paquete tuyo</span>
                            <Toggle value={notifFork} onChange={setNotifFork} />
                        </div>
                    </div>
                </div>

                {/* APARIENCIA */}
                <div className="settings-group">
                    <p className="settings-group-label">Apariencia</p>
                    <div className="settings-card">
                        <div className="settings-row">
                            <span className="settings-row-label">Tema oscuro</span>
                            <button className="settings-theme-toggle" onClick={e => toggleTheme(e)}>
                                {theme === "dark" ? <MoonIcon /> : <SunIcon />}
                                {theme === "dark" ? "Oscuro" : "Claro"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* PRIVACIDAD */}
                <div className="settings-group">
                    <p className="settings-group-label">Privacidad</p>
                    <div className="settings-card">
                        <div className="settings-row">
                            <span className="settings-row-label">Perfil público</span>
                            <Toggle value={isPublic} onChange={setIsPublic} />
                        </div>
                    </div>
                </div>

                {/* ACCIONES PELIGROSAS */}
                <div className="settings-danger-group">
                    <button className="settings-logout-btn" onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                    <button
                        className="settings-delete-btn"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        Eliminar cuenta
                    </button>
                </div>

            </div>

            {/* MODAL CONFIRMAR ELIMINAR */}
            {showDeleteConfirm && (
                <div className="settings-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="settings-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="settings-modal-title">¿Eliminar cuenta?</h3>
                        <p className="settings-modal-sub">
                            Esta acción es permanente y no se puede deshacer. Todos tus paquetes y datos serán eliminados.
                        </p>
                        <div className="settings-modal-actions">
                            <button className="settings-modal-cancel" onClick={() => setShowDeleteConfirm(false)}>
                                Cancelar
                            </button>
                            <button className="settings-modal-confirm" onClick={handleLogout}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="settings-toggle">
            <input
                type="checkbox"
                checked={value}
                onChange={e => onChange(e.target.checked)}
            />
            <span className="settings-toggle-slider" />
        </label>
    );
}

function BackIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
            <path
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}