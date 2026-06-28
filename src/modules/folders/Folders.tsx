import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Folder, CreateFolderRequest, FlashcardPackage } from "../../types/index";
import BottomNav from "../navigation/BottomNav";
import "./Folders.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const COLORS = [
    "#68A9F4", "#D85A30", "#2B2620",
    "#1B3A5C", "#A8D5A2", "#F4C842",
    "#6366f1", "#ec4899", "#14b8a6",
];

type MainTab = "paquetes" | "carpetas";

export default function Folders() {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    const [mainTab, setMainTab] = useState<MainTab>("carpetas");
    const [folders, setFolders] = useState<Folder[]>([]);
    const [myPackages, setMyPackages] = useState<FlashcardPackage[]>([]);
    const [loading, setLoading] = useState(true);

    // formulario nueva carpeta
    const [showForm, setShowForm] = useState(false);
    const [newFolder, setNewFolder] = useState<CreateFolderRequest>({ name: "", color: "#68A9F4" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // carpeta abierta / edición
    const [openFolder, setOpenFolder] = useState<Folder | null>(null);
    const [folderPackages, setFolderPackages] = useState<FlashcardPackage[]>([]);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [showAddPkg, setShowAddPkg] = useState(false);

    useEffect(() => {
        loadFolders();
        loadMyPackages();
    }, []);

    // si hay :id en la URL, abrir esa carpeta directamente
    useEffect(() => {
        if (id && folders.length > 0) {
            const found = folders.find(f => f.id === Number(id));
            if (found) openFolderDetail(found);
        }
    }, [id, folders]);

    const loadFolders = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) setFolders(await res.json());
        } catch {}
        finally { setLoading(false); }
    };

    const loadMyPackages = async () => {
        try {
            const res = await fetch(`${API_URL}/packages`);
            if (res.ok) setMyPackages(await res.json());
        } catch {}
    };

    const handleCreate = async () => {
        if (!newFolder.name.trim()) { setError("El nombre es obligatorio"); return; }
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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

    const handleDelete = async (folderId: number) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/folders/${folderId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setFolders(prev => prev.filter(f => f.id !== folderId));
            setOpenFolder(null);
        } catch {}
    };

    const openFolderDetail = async (folder: Folder) => {
        setOpenFolder(folder);
        setEditName(folder.name);
        setEditColor(folder.color);
        try {
            const res = await fetch(`${API_URL}/folders/${folder.id}/packages`);
            if (res.ok) setFolderPackages(await res.json());
        } catch { setFolderPackages([]); }
    };

    const handleSaveEdit = async () => {
        if (!openFolder) return;
        setSavingEdit(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders/${openFolder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: editName, color: editColor }),
            });
            if (res.ok) {
                const updated: Folder = await res.json();
                setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
                setOpenFolder(updated);
            }
        } catch {}
        finally { setSavingEdit(false); }
    };

    const handleAddPackageToFolder = async (packageId: number) => {
        if (!openFolder) return;
        try {
            const token = await getToken();
            await fetch(`${API_URL}/folders/${openFolder.id}/packages/${packageId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            const pkg = myPackages.find(p => p.id === packageId);
            if (pkg) setFolderPackages(prev => [...prev, pkg]);
            setShowAddPkg(false);
        } catch {}
    };

    const handleRemovePackage = async (packageId: number) => {
        if (!openFolder) return;
        try {
            const token = await getToken();
            await fetch(`${API_URL}/folders/${openFolder.id}/packages/${packageId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setFolderPackages(prev => prev.filter(p => p.id !== packageId));
        } catch {}
    };

    // ── VISTA DETALLE DE CARPETA ──
    if (openFolder) {
        const availableToAdd = myPackages.filter(p => !folderPackages.find(fp => fp.id === p.id));

        return (
            <div className="folders-page">
                <div className="folder-detail-header">
                    <button className="folder-back-btn" onClick={() => { setOpenFolder(null); navigate("/folders"); }}>
                        <BackIcon />
                        <span>Mis carpetas</span>
                    </button>
                </div>

                <div className="folder-detail-body">
                    <p className="folder-detail-section-label">EDITAR CARPETA</p>

                    <div className="folder-detail-form">
                        <div className="folder-edit-field">
                            <label className="folder-edit-label">Nombre de la carpeta</label>
                            <input
                                className="folder-edit-input"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                maxLength={50}
                            />
                        </div>

                        <div className="folder-edit-field">
                            <label className="folder-edit-label">Color (opcional)</label>
                            <div className="folder-color-row">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`folder-color-dot ${editColor === color ? "selected" : ""}`}
                                        style={{ background: color }}
                                        onClick={() => setEditColor(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="folder-edit-field">
                            <label className="folder-edit-label">Paquetes en esta carpeta</label>
                            {folderPackages.length === 0 ? (
                                <p className="folder-empty-pkgs">Sin paquetes aún</p>
                            ) : (
                                <div className="folder-pkg-list">
                                    {folderPackages.map(pkg => (
                                        <div key={pkg.id} className="folder-pkg-item">
                                            <div className="folder-pkg-dot" style={{ background: openFolder.color }} />
                                            <span className="folder-pkg-name">{pkg.name}</span>
                                            <button
                                                className="folder-pkg-remove"
                                                onClick={() => handleRemovePackage(pkg.id)}
                                            >
                                                <XIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                className="folder-add-pkg-btn"
                                onClick={() => setShowAddPkg(true)}
                            >
                                + Agregar paquetes a esta carpeta
                            </button>
                        </div>
                    </div>

                    <div className="folder-detail-actions">
                        <button
                            className="folder-save-edit-btn"
                            onClick={handleSaveEdit}
                            disabled={savingEdit}
                        >
                            {savingEdit ? "Guardando..." : "Guardar cambios"}
                        </button>
                        <button
                            className="folder-delete-edit-btn"
                            onClick={() => handleDelete(openFolder.id)}
                        >
                            Eliminar carpeta
                        </button>
                    </div>
                </div>

                {/* MODAL: agregar paquete */}
                {showAddPkg && (
                    <div className="folder-modal-overlay" onClick={() => setShowAddPkg(false)}>
                        <div className="folder-modal" onClick={e => e.stopPropagation()}>
                            <h3 className="folder-modal-title">Agregar paquete</h3>
                            {availableToAdd.length === 0 ? (
                                <p className="folder-empty-pkgs">No hay paquetes disponibles</p>
                            ) : (
                                <div className="folder-modal-list">
                                    {availableToAdd.map(pkg => (
                                        <button
                                            key={pkg.id}
                                            className="folder-modal-item"
                                            onClick={() => handleAddPackageToFolder(pkg.id)}
                                        >
                                            <span className="folder-modal-item-name">{pkg.name}</span>
                                            <span className="folder-modal-item-cat">{pkg.category}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button className="folder-modal-cancel" onClick={() => setShowAddPkg(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <BottomNav />
            </div>
        );
    }

    // ── VISTA PRINCIPAL ──
    return (
        <div className="folders-page">
            {/* HEADER */}
            <div className="folders-topbar">
                <div className="folders-topbar-left">
                    <span className="folders-brand">Jati</span>
                </div>
                <div className="folders-topbar-right">
                    <button className="folders-icon-btn" aria-label="Buscar" onClick={() => navigate("/search")}>
                        <SearchIcon />
                    </button>
                    <button className="folders-icon-btn" aria-label="Perfil" onClick={() => navigate("/profile")}>
                        <UserIcon />
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="folders-tabs">
                <button
                    className={`folders-tab ${mainTab === "paquetes" ? "active" : ""}`}
                    onClick={() => setMainTab("paquetes")}
                >
                    <PackageIcon />
                    Paquetes
                </button>
                <button
                    className={`folders-tab ${mainTab === "carpetas" ? "active" : ""}`}
                    onClick={() => setMainTab("carpetas")}
                >
                    <FolderIcon />
                    Carpetas
                </button>
            </div>

            {/* NUEVA CARPETA FORM */}
            {showForm && (
                <div className="folder-form">
                    <input
                        className="folder-input"
                        placeholder="Nombre de la carpeta"
                        value={newFolder.name}
                        onChange={e => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                        maxLength={50}
                        autoFocus
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
                        <button className="folder-cancel-btn" onClick={() => { setShowForm(false); setError(null); }}>
                            Cancelar
                        </button>
                        <button className="folder-save-btn" onClick={handleCreate} disabled={saving}>
                            {saving ? "Guardando..." : "Crear carpeta"}
                        </button>
                    </div>
                </div>
            )}

            {/* CONTENIDO */}
            <div className="folders-body">
                {/* TAB: PAQUETES */}
                {mainTab === "paquetes" && (
                    <>
                        {loading && (
                            <div className="folders-skeleton-list">
                                {[1, 2, 3].map(i => <div key={i} className="folders-skeleton" />)}
                            </div>
                        )}
                        {!loading && myPackages.length === 0 && (
                            <div className="folders-empty">
                                <span className="folders-empty-icon">📦</span>
                                <p className="folders-empty-title">Sin paquetes aún</p>
                                <p className="folders-empty-sub">Crea tu primer paquete de flashcards</p>
                                <button className="folder-save-btn" onClick={() => navigate("/packages/new")}>
                                    Crear paquete
                                </button>
                            </div>
                        )}
                        <div className="folders-grid">
                            {myPackages.map(pkg => (
                                <div
                                    className="folder-card"
                                    key={pkg.id}
                                    onClick={() => navigate(`/packages/${pkg.id}`)}
                                >
                                    <div className="folder-card-icon" style={{ background: "#6366f1" }}>
                                        <PackageIcon />
                                    </div>
                                    <div className="folder-card-info">
                                        <h2 className="folder-card-name">{pkg.name}</h2>
                                        <p className="folder-card-sub">{pkg.cardCount} tarjetas · {pkg.category}</p>
                                    </div>
                                    <ChevronIcon />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* TAB: CARPETAS */}
                {mainTab === "carpetas" && (
                    <>
                        {loading && (
                            <div className="folders-skeleton-list">
                                {[1, 2, 3].map(i => <div key={i} className="folders-skeleton" />)}
                            </div>
                        )}
                        {!loading && folders.length === 0 && !showForm && (
                            <div className="folders-empty">
                                <span className="folders-empty-icon">📁</span>
                                <p className="folders-empty-title">Sin carpetas aún</p>
                                <p className="folders-empty-sub">Organiza tus paquetes en carpetas</p>
                                <button className="folder-save-btn" onClick={() => setShowForm(true)}>
                                    Crear primera carpeta
                                </button>
                            </div>
                        )}
                        <div className="folders-grid">
                            {folders.map(folder => (
                                <div
                                    className="folder-card"
                                    key={folder.id}
                                    onClick={() => openFolderDetail(folder)}
                                >
                                    <div className="folder-card-icon" style={{ background: folder.color }}>
                                        <FolderIcon />
                                    </div>
                                    <div className="folder-card-info">
                                        <h2 className="folder-card-name">{folder.name}</h2>
                                    </div>
                                    <ChevronIcon />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* FAB nueva carpeta */}
            {!showForm && (
                <button
                    className="folders-fab"
                    onClick={() => setShowForm(true)}
                    aria-label="Nueva carpeta"
                >
                    + Nueva carpeta
                </button>
            )}

            <BottomNav />
        </div>
    );
}

function FolderIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PackageIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
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

function UserIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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