import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { FlashcardPackage, Flashcard, CreateCardRequest, Folder, Review  } from "../../types/index";
import "./PackageDetail.css";
import { getThemeGradient, THEMES } from "./themes";
import TagInput from "../shared/Taginput";
import AuthModal from "../auth/AuthModal";
import elephantImg from "../../assets/reviews.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";


const CATEGORIES = ["Universidad", "PAES", "Carrera", "Idiomas", "Licencias", "Otros"];

export default function PackageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken, user } = useAuth();

    const [pkg, setPkg] = useState<FlashcardPackage | null>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    // tarjeta expandida (acordeón)
    const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

    // menú paquete
    const [showPkgMenu, setShowPkgMenu] = useState(false);
    const [showEditPkg, setShowEditPkg] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editTags, setEditTags] = useState<string[]>([]);
    const [savingPkg, setSavingPkg] = useState(false);
    const [showDeletePkg, setShowDeletePkg] = useState(false);

    // carpetas
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [pkgFolderIds, setPkgFolderIds] = useState<number[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(false);

    // agregar tarjeta
    const [showForm, setShowForm] = useState(false);
    const [newCard, setNewCard] = useState<CreateCardRequest>({ question: "", answer: "" });
    const [saving, setSaving] = useState(false);

    // editar tarjeta
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [editQuestion, setEditQuestion] = useState("");
    const [editAnswer, setEditAnswer] = useState("");
    const [savingCard, setSavingCard] = useState(false);
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

    // reseñaS
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [savingReview, setSavingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const hasReviewed = user
        ? reviews.some(r => r.userId === user.uid)
        : false;
    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/packages/${id}`).then(r => r.json()),
            fetch(`${API_URL}/packages/${id}/cards`).then(r => r.json()),
            fetch(`${API_URL}/packages/${id}/reviews`).then(r => r.json()),
        ]).then(([pkgData, cardsData, reviewsData]) => {
            setPkg(pkgData);
            setCards(Array.isArray(cardsData) ? cardsData : []);
            setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        }).finally(() => setLoading(false));
    }, [id]);

    const handleDeleteReview = async (packageId: number) => {
    try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/packages/${packageId}/reviews`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        setReviews(prev => prev.filter(r => r.userId !== user?.uid));
    } catch {
        setError("No se pudo eliminar la reseña");
    }
};
    // ── EDITAR PAQUETE ──
    const openEditPkg = () => {
        if (!pkg) return;
        setEditName(pkg.name);
        setEditDesc(pkg.description);
        setEditCategory(pkg.category);
        setEditIsPublic(pkg.isPublic);
        setEditTags(pkg.tags ?? []);
        setShowPkgMenu(false);
        setShowEditPkg(true);
    };

    const handleSavePkg = async () => {
        if (!editName.trim()) return;
        setSavingPkg(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    name: editName,
                    description: editDesc,
                    category: editCategory,
                    isPublic: editIsPublic,
                    tags: editTags,
                }),
            });
            if (res.ok) {
                setPkg(await res.json());
                setShowEditPkg(false);
            }
        } catch {}
        finally { setSavingPkg(false); }
    };

    const handleDeletePkg = async () => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/packages/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            navigate("/");
        } catch {}
    };

    // ── CARPETAS ──
    const openFolderModal = async () => {
        setShowPkgMenu(false);
        setLoadingFolders(true);
        setShowFolderModal(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/folders`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) {
                const allFolders: Folder[] = await res.json();
                setFolders(allFolders);
                const inFolders = await Promise.all(
                    allFolders.map(async f => {
                        const r = await fetch(`${API_URL}/folders/${f.id}/packages`);
                        if (!r.ok) return null;
                        const pkgs: FlashcardPackage[] = await r.json();
                        return pkgs.find(p => p.id === Number(id)) ? f.id : null;
                    })
                );
                setPkgFolderIds(inFolders.filter((x): x is number => x !== null));
            }
        } catch {}
        finally { setLoadingFolders(false); }
    };

    const toggleFolder = async (folderId: number) => {
        const token = await getToken();
        const inFolder = pkgFolderIds.includes(folderId);
        const method = inFolder ? "DELETE" : "POST";
        await fetch(`${API_URL}/folders/${folderId}/packages/${id}`, {
            method,
            headers: { "Authorization": `Bearer ${token}` },
        });
        setPkgFolderIds(prev =>
            inFolder ? prev.filter(x => x !== folderId) : [...prev, folderId]
        );
    };

    // ── TARJETAS ──
    const handleAddCard = async () => {
        if (!newCard.question.trim() || !newCard.answer.trim()) {
            setError("Ambos campos son obligatorios"); return;
        }
        setSaving(true); setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages/${id}/cards`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(newCard),
            });
            if (!res.ok) throw new Error();
            const created: Flashcard = await res.json();
            setCards(prev => {
                const updated = [...prev, created];
                setPkg(p => p ? { ...p, cardCount: updated.length } : p);
                return updated;
            });
            setNewCard({ question: "", answer: "" });
            setShowForm(false);
        } catch { setError("No se pudo crear la tarjeta"); }
        finally { setSaving(false); }
    };

    const openEditCard = (card: Flashcard) => {
        setEditingCard(card);
        setEditQuestion(card.question);
        setEditAnswer(card.answer);
    };

    const handleSaveCard = async () => {
        if (!editingCard) return;
        setSavingCard(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/cards/${editingCard.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ question: editQuestion, answer: editAnswer }),
            });
            if (res.ok) {
                const updated: Flashcard = await res.json();
                setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
                setEditingCard(null);
            }
        } catch {}
        finally { setSavingCard(false); }
    };

    const handleDeleteCard = async (cardId: number) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/cards/${cardId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setCards(prev => {
                const updated = prev.filter(c => c.id !== cardId);
                setPkg(p => p ? { ...p, cardCount: updated.length } : p);
                return updated;
            });
            setDeletingCardId(null);
        } catch {}
    };

    const handleFork = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages/${id}/fork`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
            navigate(`/packages/${(await res.json()).id}`);
        } catch { setError("No se pudo guardar la copia"); }
    };

    const handleSubmitReview = async () => {
        if (newRating === 0) { setReviewError("Selecciona una calificación"); return; }
        setSavingReview(true); setReviewError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages/${id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ rating: newRating, comment: newComment }),
            });
            if (!res.ok) throw new Error();
            const created: Review = await res.json();
            setReviews(prev => [created, ...prev]);
            setShowReviewModal(false);
            setNewRating(0); setNewComment("");
        } catch { setReviewError("No se pudo enviar la reseña"); }
        finally { setSavingReview(false); }
    };

    const avgRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    if (loading) return <div className="detail-loading">Cargando...</div>;
    if (!pkg) return <div className="detail-loading">Paquete no encontrado</div>;

    const isOwner = user?.uid === pkg.userId;
    const cannotReview = user?.uid === pkg.userId || user?.uid === pkg.originalAuthorId;


    return (
        <div className="detail-page">

            {/* ── HERO estilo Wattpad ── */}
            <div className="detail-hero" style={{ background: getThemeGradient(pkg.theme) }}>

                {/* topbar */}
                <div className="detail-hero-topbar">
                    <button className="detail-back-btn" onClick={() => navigate(-1)}>
                        <BackIcon />
                    </button>

                    {isOwner ? (
                        <button className="detail-menu-btn" onClick={() => setShowPkgMenu(true)}>
                            <DotsIcon />
                        </button>
                    ) : (
                        <button className="detail-hero-fork-btn" onClick={handleFork}>
                            <ForkIcon /> Guardar copia
                        </button>
                    )}
                </div>

                {/* info */}
                <div className="detail-hero-body">
                    <span className="detail-category">{pkg.category}</span>
                    <h1 className="detail-name">
                        {pkg.name}
                    </h1>

                    <div className="detail-author-row">
                        <div className="detail-author-avatar">
                            {pkg.userPhotoUrl
                                ? <img src={pkg.userPhotoUrl} alt={pkg.userName}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                : pkg.userName.slice(0, 1).toUpperCase()
                            }
                        </div>
                        <button
                            className="detail-author-name"
                            onClick={() => { if (!isOwner) navigate(`/profile/${pkg.userId}`); }}
                            style={{ background:"none", border:"none", padding:0, cursor: isOwner ? "default" : "pointer", font:"inherit" }}
                            >
                            {isOwner ? "Tú" : pkg.userName}
                        </button>
                    </div>

                    <div className="detail-hero-stats">
                        <div className="detail-stat">
                            <CardsIcon />
                            {cards.length} tarjetas
                        </div>
                        {reviews.length > 0 && (
                            <>
                                <div className="detail-stat-dot" />
                                <div className="detail-stat">
                                    <span className="detail-rating-stars">★</span>
                                    {avgRating.toFixed(1)}
                                </div>
                            </>
                        )}
                        <div className="detail-stat-dot" />
                        <span className="detail-visibility">
                            {pkg.isPublic ? "Público" : "Privado"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════
            CONTENIDO ÚNICO (sin tabs)
               ══════════════════════════════════ */}
            <div className="detail-body">

                {/* ── DESCRIPCIÓN ── */}
                {pkg.description && (
                    <section className="detail-section">
                        <h2 className="detail-section-title">Descripción</h2>
                        <p className="detail-desc-text">{pkg.description}</p>
                    </section>
                )}

                {/* ── TAGS ── */}
                    {pkg.tags && pkg.tags.length > 0 && (
                        <section className="detail-tags-section">
                            <h3 className="detail-tags-title">Tags</h3>
                            <div className="detail-tags-list">
                                {pkg.tags.map(tag => (
                                    <button
                                        key={tag}
                                        className="detail-tags-pill"
                                        onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                                        style={{ border:"none", cursor:"pointer", font:"inherit" }}
                                    >#{tag}</button>
                                ))}
                            </div>
                        </section>
                    )}

                {/* ── TARJETAS ── */}
                <section className="detail-section">
                    <div className="detail-section-header">
                        <h2 className="detail-section-title">Tarjetas</h2>
                        <span className="detail-section-count">{cards.length}</span>
                    </div>

                    {isOwner && (
                        <button className="detail-add-btn" onClick={() => setShowForm(!showForm)}>
                            <PlusIcon /> Agregar tarjeta
                        </button>
                    )}

                    {error && <p className="detail-error">{error}</p>}

                    {showForm && isOwner && (
                        <div className="detail-card-form">
                            <textarea className="detail-card-input" placeholder="Pregunta"
                                value={newCard.question}
                                onChange={e => setNewCard(p => ({ ...p, question: e.target.value }))} rows={2} />
                            <textarea className="detail-card-input" placeholder="Respuesta"
                                value={newCard.answer}
                                onChange={e => setNewCard(p => ({ ...p, answer: e.target.value }))} rows={2} />
                            <div className="detail-form-actions">
                                <button className="detail-cancel-btn" onClick={() => setShowForm(false)}>Cancelar</button>
                                <button className="detail-save-btn" onClick={handleAddCard} disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="detail-cards">
                        {cards.length === 0 && !showForm && (
                            <p className="detail-empty">Sin tarjetas aún.</p>
                        )}
                        {cards.map(card => {
                            const isExpanded = expandedCardId === card.id;
                            return (
                                <div
                                    className={`detail-card-item ${isExpanded ? "expanded" : ""}`}
                                    key={card.id}
                                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                                >
                                    <div className="detail-card-front">
                                        <span>{card.question}</span>
                                        <span className={`detail-card-chevron ${isExpanded ? "up" : ""}`}>
                                            <ChevronIcon />
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <>
                                            <div className="detail-card-divider" />
                                            <div className="detail-card-back">{card.answer}</div>
                                            {isOwner && (
                                                <div className="detail-card-actions" onClick={e => e.stopPropagation()}>
                                                    <button className="detail-card-edit-btn" onClick={() => openEditCard(card)}>
                                                        <EditIcon /> Editar
                                                    </button>
                                                    <button className="detail-card-del-btn" onClick={() => setDeletingCardId(card.id)}>
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── RESEÑAS ── */}
                <section className="detail-section">
                <div className="detail-reviews-header">
                    <div className="detail-reviews-avg">
                        {reviews.length > 0 ? (
                            <>
                                <span className="detail-reviews-score">{avgRating.toFixed(1)}</span>
                                <div className="detail-reviews-stars">
                                    {[1,2,3,4,5].map(i => (
                                        <span key={i} className={i <= Math.round(avgRating) ? "star-filled" : "star-empty"}>★</span>
                                    ))}
                                </div>
                                <span className="detail-reviews-count">{reviews.length} reseñas</span>
                            </>
                        ) : (
                            <>
                                <span className="detail-reviews-no-rating-star">★</span>
                                <span className="detail-reviews-count">Sin reseñas todavía</span>
                            </>
                        )}
                    </div>

                    {/* Botón normal para quien no puede reseñar aún (no logueado o ya reseñó) */}
                    {!cannotReview && (!user || hasReviewed) && (
                        <button
                            className="detail-review-btn detail-review-btn-disabled"
                            onClick={() => !user && setShowAuthModal(true)}
                        >
                            {!user ? "Inicia sesión para evaluar" : "Ya evaluaste este paquete"}
                        </button>
                    )}

                    {/* Invitación con el elefante, solo cuando SÍ puede evaluar */}
                    {!cannotReview && user && !hasReviewed && (
                        <div className="detail-review-invite">
                            <img src={elephantImg} alt="" className="detail-review-invite-img" />
                            <div className="detail-review-invite-content">
                                <p className="detail-review-invite-text">¿Qué te pareció este paquete?</p>
                                <button className="detail-review-btn" onClick={() => setShowReviewModal(true)}>
                                    Evaluar paquete
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                    <div className="detail-reviews-list">
                        {reviews.length === 0 && <p className="detail-empty">¡Sé el primero en reseñar!</p>}
                        {reviews.map(review => (
                            <div className="detail-review-item" key={review.id}>
                                <div className="detail-review-top">
                                    <button
                                        className="detail-review-avatar-btn"
                                        onClick={() => navigate(`/profile/${review.userId}`)}
                                    >
                                        <div className="detail-review-avatar">
                                            {review.userPhotoUrl
                                                ? <img src={review.userPhotoUrl} alt={review.userName}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                                : review.userName?.slice(0, 1).toUpperCase() ?? "?"
                                            }
                                        </div>
                                    </button>
                                    <div style={{ flex: 1 }}>
                                        <button
                                            className="detail-review-user"
                                            onClick={() => navigate(`/profile/${review.userId}`)}
                                            style={{ background:"none", border:"none", padding:0, cursor:"pointer", font:"inherit" }}
                                        >{review.userName}</button>
                                        <div className="detail-review-stars">
                                            {[1,2,3,4,5].map(i => (
                                                <span key={i} className={i <= review.rating ? "star-filled" : "star-empty"}>★</span>
                                            ))}
                                        </div>
                                    </div>
                                    {/* botón eliminar solo si es tu reseña */}
                                    {user?.uid === review.userId && (
                                        <button
                                            className="detail-card-del-btn"
                                            onClick={() => handleDeleteReview(review.packageId)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    )}
                                </div>
                                {review.comment && <p className="detail-review-comment">{review.comment}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── BARRA INFERIOR FIJA ── */}
            <div className="detail-sticky-bar">
                <button
                    className="detail-study-btn"
                    onClick={() => user ? navigate(`/packages/${id}/study`) : setShowAuthModal(true)}
                >
                    Estudiar paquete
                </button>
            </div>

            {/* ── MENÚ PAQUETE ── */}
            {showPkgMenu && (
                <div className="detail-modal-overlay" onClick={() => setShowPkgMenu(false)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">{pkg.name}</h3>
                        <button className="detail-sheet-row" onClick={openEditPkg}>
                            <EditIcon /> Editar paquete
                        </button>
                        <button className="detail-sheet-row" onClick={openFolderModal}>
                            <FolderIcon /> Agregar a carpeta
                        </button>
                        <div className="detail-sheet-divider" />
                        <button className="detail-sheet-row detail-sheet-danger"
                            onClick={() => { setShowPkgMenu(false); setShowDeletePkg(true); }}>
                            <TrashIcon /> Eliminar paquete
                        </button>
                        <button className="detail-sheet-cancel" onClick={() => setShowPkgMenu(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* ── EDITAR PAQUETE ── */}
            {showEditPkg && (
                <div className="detail-modal-overlay" onClick={() => setShowEditPkg(false)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">Editar paquete</h3>

                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Nombre</label>
                            <input className="detail-edit-input" value={editName}
                                onChange={e => setEditName(e.target.value)} maxLength={80} />
                        </div>

                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Descripción</label>
                            <textarea className="detail-edit-textarea" value={editDesc}
                                onChange={e => setEditDesc(e.target.value)} rows={3} maxLength={300} />
                        </div>

                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Categoría</label>
                            <div className="detail-edit-categories">
                                {CATEGORIES.map(cat => (
                                    <button key={cat}
                                        className={`detail-edit-cat-btn ${editCategory === cat ? "selected" : ""}`}
                                        onClick={() => setEditCategory(cat)}
                                    >{cat}</button>
                                ))}
                            </div>
                        </div>

                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Tema visual</label>
                            <div className="detail-edit-themes">
                                {THEMES.map(t => (
                                    <button key={t.id}
                                        className={`detail-edit-theme-btn ${pkg.theme === t.id ? "selected" : ""}`}
                                        style={{ background: t.gradient }}
                                        onClick={() => {}}
                                    >
                                        <span className="theme-name">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Etiquetas</label>
                            <TagInput tags={editTags} onChange={setEditTags} placeholder="Agrega etiquetas..." />
                        </div>

                        <div className="detail-edit-toggle-row">
                            <div>
                                <p className="detail-edit-toggle-label">Paquete público</p>
                                <p className="detail-edit-toggle-sub">Visible para otros usuarios</p>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={editIsPublic}
                                    onChange={e => setEditIsPublic(e.target.checked)} />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="detail-form-actions">
                            <button className="detail-cancel-btn" onClick={() => setShowEditPkg(false)}>Cancelar</button>
                            <button className="detail-save-btn" onClick={handleSavePkg} disabled={savingPkg}>
                                {savingPkg ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CARPETAS ── */}
            {showFolderModal && (
                <div className="detail-modal-overlay" onClick={() => setShowFolderModal(false)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">Agregar a carpeta</h3>
                        {loadingFolders && <p className="detail-empty">Cargando carpetas...</p>}
                        {!loadingFolders && folders.length === 0 && (
                            <p className="detail-empty">No tienes carpetas. Crea una primero.</p>
                        )}
                        <div className="detail-folder-list">
                            {folders.map(folder => {
                                const inFolder = pkgFolderIds.includes(folder.id);
                                return (
                                    <button key={folder.id}
                                        className={`detail-folder-row ${inFolder ? "in-folder" : ""}`}
                                        onClick={() => toggleFolder(folder.id)}>
                                        <div className="detail-folder-dot" style={{ background: folder.color }} />
                                        <span className="detail-folder-name">{folder.name}</span>
                                        <span className="detail-folder-check">{inFolder ? "✓" : "+"}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button className="detail-sheet-cancel" onClick={() => setShowFolderModal(false)}>Listo</button>
                    </div>
                </div>
            )}

            {/* ── ELIMINAR PAQUETE ── */}
            {showDeletePkg && (
                <div className="detail-modal-overlay" onClick={() => setShowDeletePkg(false)}>
                    <div className="detail-confirm-modal" onClick={e => e.stopPropagation()}>
                        <span className="detail-confirm-icon"><WarningIcon /></span>
                        <h3 className="detail-confirm-title">¿Eliminar paquete?</h3>
                        <p className="detail-confirm-sub">Esta acción no se puede deshacer.</p>
                        <div className="detail-form-actions">
                            <button className="detail-cancel-btn" onClick={() => setShowDeletePkg(false)}>Cancelar</button>
                            <button className="detail-danger-btn" onClick={handleDeletePkg}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDITAR TARJETA ── */}
            {editingCard && (
                <div className="detail-modal-overlay" onClick={() => setEditingCard(null)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">Editar tarjeta</h3>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Pregunta</label>
                            <textarea className="detail-edit-textarea" value={editQuestion}
                                onChange={e => setEditQuestion(e.target.value)} rows={2} />
                        </div>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Respuesta</label>
                            <textarea className="detail-edit-textarea" value={editAnswer}
                                onChange={e => setEditAnswer(e.target.value)} rows={2} />
                        </div>
                        <div className="detail-form-actions">
                            <button className="detail-cancel-btn" onClick={() => setEditingCard(null)}>Cancelar</button>
                            <button className="detail-save-btn" onClick={handleSaveCard} disabled={savingCard}>
                                {savingCard ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ELIMINAR TARJETA ── */}
            {deletingCardId !== null && (
                    <div className="detail-modal-overlay" onClick={() => setDeletingCardId(null)}>
                        <div className="detail-confirm-modal" onClick={e => e.stopPropagation()}>
                            <span className="detail-confirm-icon"><WarningIcon /></span>
                            <h3 className="detail-confirm-title">¿Eliminar tarjeta?</h3>
                            <p className="detail-confirm-sub">Esta acción no se puede deshacer.</p>
                            <div className="detail-form-actions">
                                <button className="detail-cancel-btn" onClick={() => setDeletingCardId(null)}>Cancelar</button>
                                <button className="detail-danger-btn" onClick={() => handleDeleteCard(deletingCardId)}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                )}

            {/* ── RESEÑA ── */}

            {showAuthModal && (
                <AuthModal onClose={() => setShowAuthModal(false)} />
            )}
            {showReviewModal && (
                <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="review-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="review-modal-header">
                            <img src={elephantImg} alt="" className="review-modal-elephant" />
                            <div className="review-modal-header-text">
                                <h3 className="review-modal-title">Evaluar paquete</h3>
                                <p className="review-modal-subtitle">
                                    <span className="review-modal-subtitle-icon"></span> {pkg.name}
                                </p>
                            </div>
                        </div>

                        <div className="review-modal-stars">
                            {[1,2,3,4,5].map(i => (
                                <button key={i}
                                    className={`review-star-btn ${i <= newRating ? "star-filled" : "star-empty"}`}
                                    onClick={() => setNewRating(i)}>★</button>
                            ))}
                        </div>

                        <textarea className="review-modal-input" placeholder="Comentario (opcional)"
                            value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} />

                        {reviewError && <p className="detail-error">{reviewError}</p>}

                        <div className="review-modal-actions">
                            <button className="detail-study-btn" onClick={handleSubmitReview} disabled={savingReview}>
                                {savingReview ? "Enviando..." : "Enviar evaluación"}
                            </button>
                            <button className="detail-cancel-btn review-modal-cancel" onClick={() => setShowReviewModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BackIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function DotsIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>; }
function PlusIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>; }
function ForkIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6 8v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8M6 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function EditIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function TrashIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function FolderIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function CardsIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6 9h12M6 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ChevronIcon() { 
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function WarningIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 3.5L2.5 20h19L12 3.5z"
                stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M12 9.5v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
    );
}