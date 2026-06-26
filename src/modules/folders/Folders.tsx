import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Folder, CreateFolderRequest } from "../../types/index";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import "./Folders.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const COLORS = ["#68A9F4", "#D85A30", "#2B2620", "#1B3A5C", "#A8D5A2", "#F4C842"];

export default function Folders() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newFolder, setNewFolder] = useState<CreateFolderRequest>({ name: "", color: "#68A9F4" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await res.json();
            setFolders(data);
        } catch {
            setError("No se pudieron cargar las carpetas");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newFolder.name.trim()) {
            setError("El nombre es obligatorio");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(newFolder),
            });
            if (!res.ok) throw new Error();
            const created: Folder = await res.json();
            setFolders(prev => [...prev, created]);
            setNewFolder({ name: "", color: "#68A9F4" });
            setShowForm(false);
        } catch {
            setError("No se pudo crear la carpeta");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/folders/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setFolders(prev => prev.filter(f => f.id !== id));
        } catch {
            setError("No se pudo eliminar la carpeta");
        }
    };

    return (
        <div className="folders-page">
            <Header />

            <div className="folders-header">
                <h1 className="folders-title">Mis carpetas</h1>
                <button className="folders-add-btn" onClick={() => setShowForm(!showForm)}>
                    + Nueva
                </button>
            </div>

            {showForm && (
                <div className="folder-form">
                    <input
                        className="folder-input"
                        placeholder="Nombre de la carpeta"
                        value={newFolder.name}
                        onChange={e => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                        maxLength={50}
                    />
                    <div className="folder-colors">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                className={`color-dot ${newFolder.color === color ? "selected" : ""}`}
                                style={{ background: color }}
                                onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                            />
                        ))}
                    </div>
                    {error && <p className="folder-error">{error}</p>}
                    <div className="folder-form-actions">
                        <button className="folder-cancel-btn" onClick={() => setShowForm(false)}>Cancelar</button>
                        <button className="folder-save-btn" onClick={handleCreate} disabled={saving}>
                            {saving ? "Guardando..." : "Crear"}
                        </button>
                    </div>
                </div>
            )}

            {loading && <p className="folders-status">Cargando...</p>}

            {!loading && folders.length === 0 && !showForm && (
                <div className="folders-empty">
                    <span className="folders-empty-icon">📁</span>
                    <p>No tienes carpetas aún</p>
                    <button className="folders-add-btn" onClick={() => setShowForm(true)}>
                        Crear primera carpeta
                    </button>
                </div>
            )}

            <div className="folders-grid">
                {folders.map(folder => (
                    <div
                        className="folder-card"
                        key={folder.id}
                        onClick={() => navigate(`/folders/${folder.id}`)}
                    >
                        <div className="folder-icon" style={{ background: folder.color }}>
                            <FolderIcon />
                        </div>
                        <div className="folder-info">
                            <h2 className="folder-name">{folder.name}</h2>
                        </div>
                        <button
                            className="folder-delete-btn"
                            onClick={e => { e.stopPropagation(); handleDelete(folder.id); }}
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>

            <BottomNav />
        </div>
    );
}

function FolderIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"
                fill="rgba(255,255,255,0.9)" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}