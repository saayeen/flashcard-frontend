import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Folder, CreateFolderRequest, FlashcardPackage } from "../../types/index";
import BottomNav from "../navigation/BottomNav";
import "./Folders.css";
import { getThemeGradient } from "../packages/themes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const COLORS = [
    "#68A9F4", "#D85A30", "#2B2620",
    "#1B3A5C", "#A8D5A2", "#F4C842",
    "#6366f1", "#ec4899", "#14b8a6",
];

type MainTab = "paquetes" | "carpetas";

export default function Folders() {
    const { getToken, user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    const [mainTab, setMainTab] = useState<MainTab>("carpetas");
    const [pkgTab, setPkgTab] = useState<"propios" | "copiados">("propios");
    const [folders, setFolders] = useState<Folder[]>([]);
    const [myPackages, setMyPackages] = useState<FlashcardPackage[]>([]);
    const [forkedPackages, setForkedPackages] = useState<FlashcardPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(""); 
    const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
    
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
    const [folderPackageCounts, setFolderPackageCounts] = useState<Record<number, number>>({});
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const [editMode, setEditMode] = useState(false);
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
            if (res.ok) {
                const data: Folder[] = await res.json();
                setFolders(data);

                const counts: Record<number, number> = {};
                await Promise.all(
                    data.map(async folder => {
                        const r = await fetch(`${API_URL}/folders/${folder.id}/packages`, {
                            headers: { "Authorization": `Bearer ${token}` },
                        });
                        if (r.ok) {
                            const pkgs = await r.json();
                            counts[folder.id] = pkgs.length;
                        } else {
                            counts[folder.id] = 0;
                        }
                    })
                );
                setFolderPackageCounts(counts);
            }
        } catch {}
        finally { setLoading(false); }
        };
    const loadMyPackages = async () => {
        try {
            const token = await getToken();
            const headers = { "Authorization": `Bearer ${token}` };
            const [ownedRes, forkedRes] = await Promise.all([
                fetch(`${API_URL}/users/me/packages`, { headers }),
                fetch(`${API_URL}/users/me/packages/forked`, { headers }),
            ]);
            if (ownedRes.ok) setMyPackages(await ownedRes.json());
            if (forkedRes.ok) setForkedPackages(await forkedRes.json());
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
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders/${folder.id}/packages`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
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
            const res = await fetch(`${API_URL}/folders/${openFolder.id}/packages/${packageId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (!res.ok) return; // no actualizar UI si falló
            const pkg = myPackages.find(p => p.id === packageId);
            if (pkg) setFolderPackages(prev => [...prev, pkg]);
            setFolderPackageCounts(prev => ({
                ...prev,
                [openFolder.id]: (prev[openFolder.id] ?? 0) + 1,
            }));
            setShowAddPkg(false);
        } catch {}
    };

        const handleRemovePackageFromFolder = async (packageId: number) => {
        if (!openFolder) return;
        try {
            const token = await getToken();
            await fetch(`${API_URL}/folders/${openFolder.id}/packages/${packageId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setFolderPackages(prev => prev.filter(p => p.id !== packageId));
            setFolderPackageCounts(prev => ({
                ...prev,
                [openFolder.id]: Math.max(0, (prev[openFolder.id] ?? 0) - 1),
            }));
        } catch {}
    };

            const filteredFolders = folders.filter(f =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const filteredMyPackages = myPackages.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const filteredForkedPackages = forkedPackages.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // ── VISTA DETALLE DE CARPETA ──
    if (openFolder) {
    const availableToAdd = myPackages.filter(p => !folderPackages.find(fp => fp.id === p.id));

    return (
        <div className="folders-page">
            {/* HEADER */}
            <div className="folder-detail-header">
                <button className="folder-back-btn" onClick={() => { setOpenFolder(null); setEditMode(false); navigate("/folders"); }}>
                    <BackIcon />
                </button>
                <h2 className="folder-detail-title">{openFolder.name}</h2>
                <button className="folder-menu-btn" onClick={() => setShowFolderMenu(true)}>
                    <DotsIcon />
                </button>
            </div>

            {/* PAQUETES */}
            <div className="folder-detail-body">
                {folderPackages.length === 0 ? (
                    <div className="folders-empty">
                        <span className="folders-empty-icon">📦</span>
                        <p className="folders-empty-title">Sin paquetes aún</p>
                        <p className="folders-empty-sub">Agrega paquetes a esta carpeta</p>
                    </div>
                ) : (
                    <div className="folder-pkg-cards">
                        {folderPackages.map(pkg => (
                            <div
                                key={pkg.id}
                                className="folder-pkg-card"
                                onClick={() => navigate(`/packages/${pkg.id}`)}
                            >
                                {/* 3. Ícono dentro de carpeta abierta — fondo de color, usa la variante outline */}
                                    <div className="folder-pkg-card-icon" style={{ background: getThemeGradient(pkg.theme) }}>
                                        <CardStackIconOutline />
                                    </div>
                                <div className="folder-pkg-card-info">
                                    <p className="folder-pkg-card-name">{pkg.name}</p>
                                    <p className="folder-pkg-card-sub">{pkg.cardCount} tarjetas · {pkg.category}</p>
                                </div>
                                <button
                                    className="folder-pkg-remove-btn"
                                    onClick={e => { e.stopPropagation(); handleRemovePackageFromFolder(pkg.id); }}
                                    aria-label="Quitar de la carpeta"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="folder-add-pkg-btn" onClick={() => setShowAddPkg(true)}>
                    <span>+</span> Agregar paquetes
                </button>
            </div>

            {/* BOTTOM SHEET MENÚ */}
            {showFolderMenu && (
                <div className="folder-modal-overlay" onClick={() => setShowFolderMenu(false)}>
                    <div className="folder-modal folder-menu-sheet" onClick={e => e.stopPropagation()}>
                        <div className="folder-sheet-handle" />
                        <p className="folder-sheet-title">{openFolder.name}</p>

                        {!editMode ? (
                            <>
                                <button className="folder-sheet-row" onClick={() => setEditMode(true)}>
                                    <EditIcon /> Editar nombre y color
                                </button>
                                <div className="folder-sheet-divider" />
                                <button className="folder-sheet-row folder-sheet-danger" onClick={() => handleDelete(openFolder.id)}>
                                    <TrashIcon /> Eliminar carpeta
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="folder-edit-field">
                                    <label className="folder-edit-label">Nombre</label>
                                    <input className="folder-edit-input" value={editName}
                                        onChange={e => setEditName(e.target.value)} maxLength={50} />
                                </div>
                                <div className="folder-edit-field">
                                    <label className="folder-edit-label">Color</label>
                                    <div className="folder-color-row">
                                        {COLORS.map(color => (
                                            <button key={color}
                                                className={`folder-color-dot ${editColor === color ? "selected" : ""}`}
                                                style={{ background: color }}
                                                onClick={() => setEditColor(color)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="folder-form-actions">
                                    <button className="folder-cancel-btn" onClick={() => setEditMode(false)}>Cancelar</button>
                                    <button className="folder-save-btn" onClick={async () => { await handleSaveEdit(); setEditMode(false); setShowFolderMenu(false); }} disabled={savingEdit}>
                                        {savingEdit ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </>
                        )}

                        <button className="folder-modal-cancel" onClick={() => { setShowFolderMenu(false); setEditMode(false); }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL AGREGAR PAQUETE */}
            {showAddPkg && (
                <div className="folder-modal-overlay" onClick={() => setShowAddPkg(false)}>
                    <div className="folder-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="folder-modal-title">Agregar paquete</h3>
                        {availableToAdd.length === 0 ? (
                            <p className="folder-empty-pkgs">No hay paquetes disponibles</p>
                        ) : (
                            <div className="folder-modal-list">
                                {availableToAdd.map(pkg => (
                                    <button key={pkg.id} className="folder-modal-item"
                                        onClick={() => handleAddPackageToFolder(pkg.id)}>
                                        <span className="folder-modal-item-name">{pkg.name}</span>
                                        <span className="folder-modal-item-cat">{pkg.category}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button className="folder-modal-cancel" onClick={() => setShowAddPkg(false)}>Cancelar</button>
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
                    {user && (
                        <button className="folders-icon-btn folders-header-avatar" aria-label="Perfil" onClick={() => navigate("/profile")}>
                            {user.photoURL
                                ? <img src={user.photoURL} alt="Perfil" className="folders-avatar-img" />
                                : <span className="folders-avatar-initials">{initials}</span>
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* TABS */}
            <div className="folders-tabs">
                {/* 1. Tab superior — fondo var(--bg-page), usa CardStackIcon con fill */}
                <button className={`folders-tab ${mainTab === "paquetes" ? "active" : ""}`} onClick={() => setMainTab("paquetes")}>
                    <CardStackIcon />
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

            <div className="folders-search-bar">
                <SearchIcon />
                <input
                    className="folders-search-input"
                    type="text"
                    placeholder={mainTab === "carpetas" ? "Buscar carpetas..." : "Buscar paquetes..."}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="folders-search-clear" onClick={() => setSearchQuery("")}>
                        ✕
                    </button>
                )}
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
                        {/* sub-tabs */}
                        <div className="folders-pkg-subtabs">
                        <button
                            className={`folders-pkg-subtab ${pkgTab === "propios" ? "active" : ""}`}
                            onClick={() => setPkgTab("propios")}
                        >
                            Mis paquetes ({filteredMyPackages.length})
                        </button>
                            <button
                                className={`folders-pkg-subtab ${pkgTab === "copiados" ? "active" : ""}`}
                                onClick={() => setPkgTab("copiados")}
                            >
                                Copiados ({filteredForkedPackages.length})
                            </button>
                        </div>

                        {loading && (
                            <div className="folders-skeleton-list">
                                {[1, 2, 3].map(i => <div key={i} className="folders-skeleton" />)}
                            </div>
                        )}

                        {/* propios */}
                        {!loading && pkgTab === "propios" && (
                            <>
                                {!searchQuery && myPackages.length === 0 && (
                                    <div className="folders-empty">
                                        <span className="folders-empty-icon">📦</span>
                                        <p className="folders-empty-title">Sin paquetes aún</p>
                                        <p className="folders-empty-sub">Crea tu primer paquete de flashcards</p>
                                        <button className="folder-save-btn" onClick={() => navigate("/packages/new")}>
                                            Crear paquete
                                        </button>
                                    </div>
                                )}
                                {searchQuery && filteredMyPackages.length === 0 && (
                                    <div className="folders-empty">
                                        <span className="folders-empty-icon">🔍</span>
                                        <p className="folders-empty-title">Sin resultados</p>
                                        <p className="folders-empty-sub">No encontramos paquetes con ese nombre</p>
                                    </div>
                                )}
                                <div className="folders-pkg-list">
                                    {filteredMyPackages.map(pkg => (
                                        <div className="folder-pkg-row" key={pkg.id} onClick={() => navigate(`/packages/${pkg.id}`)}>
                                        {/* 2. Fila "mis paquetes" — fondo de color sólido, usa la variante outline */}
                                                <div className="folder-pkg-row-icon" style={{ background: getThemeGradient(pkg.theme), color: "#fff" }}>
                                                    <CardStackIconOutline />
                                                </div>
                                            <div className="folder-pkg-row-info">
                                                <p className="folder-pkg-row-name">{pkg.name}</p>
                                                <p className="folder-pkg-row-sub">{pkg.cardCount} tarjetas · {pkg.category}</p>
                                            </div>
                                            <div className="folder-pkg-badges">
                                                {pkg.isPublic
                                                    ? <span className="folder-pkg-badge badge-public">Público</span>
                                                    : <span className="folder-pkg-badge badge-private">Privado</span>
                                                }
                                                <ChevronIcon />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* copiados */}
                        {!loading && pkgTab === "copiados" && (
                                <>
                                    {!searchQuery && forkedPackages.length === 0 && (
                                        <div className="folders-empty">
                                            <span className="folders-empty-icon">🔖</span>
                                            <p className="folders-empty-title">Sin paquetes copiados</p>
                                            <p className="folders-empty-sub">Guarda copias de paquetes que te gusten</p>
                                        </div>
                                    )}
                                    {searchQuery && filteredForkedPackages.length === 0 && (
                                        <div className="folders-empty">
                                            <span className="folders-empty-icon">🔍</span>
                                            <p className="folders-empty-title">Sin resultados</p>
                                            <p className="folders-empty-sub">No encontramos paquetes con ese nombre</p>
                                        </div>
                                    )}
                                    <div className="folders-pkg-list">
                                        {filteredForkedPackages.map(pkg => (
                                            <div className="folder-pkg-row" key={pkg.id} onClick={() => navigate(`/packages/${pkg.id}`)}>
                                                <div className="folder-pkg-row-icon" style={{ background: getThemeGradient(pkg.theme) }}>
                                                    <ForkIcon />
                                                </div>
                                                <div className="folder-pkg-row-info">
                                                    <p className="folder-pkg-row-name">{pkg.name}</p>
                                                    <p className="folder-pkg-row-sub">{pkg.cardCount} tarjetas · {pkg.category}</p>
                                                    <p className="folder-card-fork-label">Copia de otro usuario</p>
                                                </div>
                                                <ChevronIcon />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
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
                            {filteredFolders.map(folder => (
                                <div
                                    className="folder-card"
                                    key={folder.id}
                                    onClick={() => openFolderDetail(folder)}
                                >
                                <div
                                        className="folder-card-icon"
                                        style={{ background: getFolderGradient(folder.color), color: "#fff" }}
                                    >
                                        <FolderIcon />
                                    </div>
                                    <h2 className="folder-card-name">{folder.name}</h2>
                                    <p className="folder-card-sub">
                                        {folderPackageCounts[folder.id] ?? 0} paquetes
                                    </p>
                                </div>
                                    ))} 
                        </div>
                    </>
                )}
            </div>

            {/* FAB nueva carpeta */}
            {mainTab === "carpetas" && !showForm && (
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

function getFolderGradient(color: string) {
    // degradado del color elegido hacia una versión más oscura
    return `linear-gradient(135deg, ${color}, ${color}CC)`;
}

function FolderIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CardStackIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="11" height="15" rx="2"
                stroke="currentColor" strokeWidth="1.6" />
            <rect x="4" y="7" width="11" height="15" rx="2"
                fill="var(--bg-surface, #14151f)"
                stroke="currentColor" strokeWidth="1.6" />
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

function SearchIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function ForkIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M6 8v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8M6 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

function EditIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" 
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" 
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

function DotsIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
    </svg>;
}


function TrashIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>;
}

function CardStackIconOutline() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="8" y="3" width="12" height="15" rx="2.5"
                fill="rgba(255,255,255,0.25)"
                stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="6" width="12" height="15" rx="2.5"
                fill="rgba(255,255,255,0.9)"
                stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}