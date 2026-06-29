import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { FlashcardPackage, Flashcard, CreateCardRequest } from "../../types/index";
import "./PackageDetail.css";
import { getThemeGradient } from "./themes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Tab = "detalles" | "descripcion" | "resenas";

interface Review {
    id: number;
    userId: string;
    packageId: number;
    rating: number;
    comment: string;
}

export default function PackageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken, user } = useAuth();

    const [pkg, setPkg] = useState<FlashcardPackage | null>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("detalles");
    const [error, setError] = useState<string | null>(null);

    // menú paquete
    const [showPkgMenu, setShowPkgMenu] = useState(false);
    const [showEditPkg, setShowEditPkg] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [savingPkg, setSavingPkg] = useState(false);
    const [showDeletePkg, setShowDeletePkg] = useState(false);

    // agregar tarjeta
    const [showForm, setShowForm] = useState(false);
    const [newCard, setNewCard] = useState<CreateCardRequest>({ question: "", answer: "" });
    const [saving, setSaving] = useState(false);

    // editar tarjeta
    const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
    const [editQuestion, setEditQuestion] = useState("");
    const [editAnswer, setEditAnswer] = useState("");
    const [savingCard, setSavingCard] = useState(false);

    // eliminar tarjeta
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

    // reseña
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [savingReview, setSavingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/packages/${id}`).then(r => r.json()),
            fetch(`${API_URL}/packages/${id}/cards`).then(r => r.json()),
            fetch(`${API_URL}/packages/${id}/reviews`).then(r => r.json()),
        ]).then(([pkgData, cardsData, reviewsData]) => {
            setPkg(pkgData);
            setCards(cardsData);
            setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        }).finally(() => setLoading(false));
    }, [id]);

    // ── PAQUETE ──
    const openEditPkg = () => {
        if (!pkg) return;
        setEditName(pkg.name);
        setEditDesc(pkg.description);
        setEditCategory(pkg.category);
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
                body: JSON.stringify({ name: editName, description: editDesc, category: editCategory }),
            });
            if (res.ok) {
                const updated = await res.json();
                setPkg(updated);
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

    // ── TARJETAS ──
    const handleAddCard = async () => {
        if (!newCard.question.trim() || !newCard.answer.trim()) {
            setError("Ambos campos son obligatorios");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages/${id}/cards`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(newCard),
            });
            if (!res.ok) throw new Error();
            const created: Flashcard = await res.json();
            setCards(prev => [...prev, created]);
            setNewCard({ question: "", answer: "" });
            setShowForm(false);
        } catch {
            setError("No se pudo crear la tarjeta");
        } finally { setSaving(false); }
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
            setCards(prev => prev.filter(c => c.id !== cardId));
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
            const forked = await res.json();
            navigate(`/packages/${forked.id}`);
        } catch {
            setError("No se pudo guardar la copia");
        }
    };

    const handleSubmitReview = async () => {
        if (newRating === 0) { setReviewError("Selecciona una calificación"); return; }
        setSavingReview(true);
        setReviewError(null);
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
            setNewRating(0);
            setNewComment("");
        } catch {
            setReviewError("No se pudo enviar la reseña");
        } finally { setSavingReview(false); }
    };

    const avgRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    if (loading) return <div className="detail-loading">Cargando...</div>;
    if (!pkg) return <div className="detail-loading">Paquete no encontrado</div>;

    const isOwner = user?.uid === pkg.userId;

    return (
        <div className="detail-page">

            {/* HERO */}
            <div className="detail-hero" style={{ background: getThemeGradient(pkg.theme) }}>
                <button className="detail-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>

                {isOwner && (
                    <button className="detail-menu-btn" onClick={() => setShowPkgMenu(true)}>
                        <DotsIcon />
                    </button>
                )}

                <div className="detail-hero-content">
                    <span className="detail-category">{pkg.category}</span>
                    <h1 className="detail-name">{pkg.name}</h1>
                    <div className="detail-hero-meta">
                        <span>{cards.length} tarjetas</span>
                        {reviews.length > 0 && (
                            <span className="detail-rating">★ {avgRating.toFixed(1)}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="detail-tabs">
                {(["detalles", "descripcion", "resenas"] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        className={`detail-tab ${activeTab === tab ? "detail-tab-active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "detalles" ? "Detalles" : tab === "descripcion" ? "Descripción" : "Reseñas"}
                    </button>
                ))}
            </div>

            {/* TAB: DETALLES */}
            {activeTab === "detalles" && (
                <div className="detail-tab-content">
                    <div className="detail-actions">
                        <button className="detail-study-btn" onClick={() => navigate(`/packages/${id}/study`)}>
                            Estudiar paquete
                        </button>
                        {isOwner ? (
                            <button className="detail-add-btn" onClick={() => setShowForm(!showForm)}>
                                <PlusIcon /> Agregar tarjeta
                            </button>
                        ) : (
                            <button className="detail-fork-btn" onClick={handleFork}>
                                <ForkIcon /> Guardar copia
                            </button>
                        )}
                    </div>

                    {error && <p className="detail-error">{error}</p>}

                    {showForm && isOwner && (
                        <div className="detail-card-form">
                            <textarea
                                className="detail-card-input"
                                placeholder="Frente de la tarjeta"
                                value={newCard.question}
                                onChange={e => setNewCard(prev => ({ ...prev, question: e.target.value }))}
                                rows={2}
                            />
                            <textarea
                                className="detail-card-input"
                                placeholder="Reverso de la tarjeta"
                                value={newCard.answer}
                                onChange={e => setNewCard(prev => ({ ...prev, answer: e.target.value }))}
                                rows={2}
                            />
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
                            <p className="detail-empty">Este paquete no tiene tarjetas aún.</p>
                        )}
                        {cards.map(card => (
                            <div className="detail-card-item" key={card.id}>
                                <div className="detail-card-front">{card.question}</div>
                                <div className="detail-card-divider" />
                                <div className="detail-card-back">{card.answer}</div>
                                {isOwner && (
                                    <div className="detail-card-actions">
                                        <button
                                            className="detail-card-edit-btn"
                                            onClick={() => openEditCard(card)}
                                        >
                                            <EditIcon /> Editar
                                        </button>
                                        <button
                                            className="detail-card-del-btn"
                                            onClick={() => setDeletingCardId(card.id)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: DESCRIPCIÓN */}
            {activeTab === "descripcion" && (
                <div className="detail-tab-content">
                    <p className="detail-desc-text">{pkg.description || "Sin descripción."}</p>
                    <div className="detail-actions">
                        <button className="detail-study-btn" onClick={() => navigate(`/packages/${id}/study`)}>
                            Empezar a estudiar
                        </button>
                        {!isOwner && (
                            <button className="detail-fork-btn" onClick={handleFork}>
                                <ForkIcon /> Guardar copia
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: RESEÑAS */}
            {activeTab === "resenas" && (
                <div className="detail-tab-content">
                    <div className="detail-reviews-header">
                        <div className="detail-reviews-avg">
                            <span className="detail-reviews-score">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
                            <div className="detail-reviews-stars">
                                {[1,2,3,4,5].map(i => (
                                    <span key={i} className={i <= Math.round(avgRating) ? "star-filled" : "star-empty"}>★</span>
                                ))}
                            </div>
                            <span className="detail-reviews-count">{reviews.length} reseñas</span>
                        </div>
                        <button
                            className={`detail-review-btn ${!user ? "detail-review-btn-disabled" : ""}`}
                            onClick={() => user && setShowReviewModal(true)}
                            disabled={!user}
                        >
                            {user ? "Evaluar paquete" : "Inicia sesión para evaluar"}
                        </button>
                    </div>
                    <div className="detail-reviews-list">
                        {reviews.length === 0 && <p className="detail-empty">Aún no hay reseñas. ¡Sé el primero!</p>}
                        {reviews.map(review => (
                            <div className="detail-review-item" key={review.id}>
                                <div className="detail-review-top">
                                    <div className="detail-review-avatar">{review.userId.slice(0,1).toUpperCase()}</div>
                                    <div>
                                        <p className="detail-review-user">{review.userId.slice(0,8)}...</p>
                                        <div className="detail-review-stars">
                                            {[1,2,3,4,5].map(i => (
                                                <span key={i} className={i <= review.rating ? "star-filled" : "star-empty"}>★</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {review.comment && <p className="detail-review-comment">{review.comment}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── MODAL MENÚ PAQUETE ── */}
            {showPkgMenu && (
                <div className="detail-modal-overlay" onClick={() => setShowPkgMenu(false)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">{pkg.name}</h3>
                        <button className="detail-sheet-row" onClick={openEditPkg}>
                            <EditIcon /> Editar paquete
                        </button>
                        <div className="detail-sheet-divider" />
                        <button className="detail-sheet-row detail-sheet-danger" onClick={() => { setShowPkgMenu(false); setShowDeletePkg(true); }}>
                            <TrashIcon /> Eliminar paquete
                        </button>
                        <button className="detail-sheet-cancel" onClick={() => setShowPkgMenu(false)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* ── MODAL EDITAR PAQUETE ── */}
            {showEditPkg && (
                <div className="detail-modal-overlay" onClick={() => setShowEditPkg(false)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">Editar paquete</h3>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Nombre</label>
                            <input
                                className="detail-edit-input"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                maxLength={80}
                            />
                        </div>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Categoría</label>
                            <input
                                className="detail-edit-input"
                                value={editCategory}
                                onChange={e => setEditCategory(e.target.value)}
                                maxLength={50}
                            />
                        </div>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Descripción</label>
                            <textarea
                                className="detail-edit-textarea"
                                value={editDesc}
                                onChange={e => setEditDesc(e.target.value)}
                                rows={3}
                                maxLength={300}
                            />
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

            {/* ── MODAL ELIMINAR PAQUETE ── */}
            {showDeletePkg && (
                <div className="detail-modal-overlay" onClick={() => setShowDeletePkg(false)}>
                    <div className="detail-confirm-modal" onClick={e => e.stopPropagation()}>
                        <span className="detail-confirm-icon">⚠️</span>
                        <h3 className="detail-confirm-title">¿Eliminar paquete?</h3>
                        <p className="detail-confirm-sub">Esta acción no se puede deshacer.</p>
                        <div className="detail-form-actions">
                            <button className="detail-cancel-btn" onClick={() => setShowDeletePkg(false)}>Cancelar</button>
                            <button className="detail-danger-btn" onClick={handleDeletePkg}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL EDITAR TARJETA ── */}
            {editingCard && (
                <div className="detail-modal-overlay" onClick={() => setEditingCard(null)}>
                    <div className="detail-bottom-sheet" onClick={e => e.stopPropagation()}>
                        <div className="detail-sheet-handle" />
                        <h3 className="detail-sheet-title">Editar tarjeta #{editingCard.id}</h3>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Pregunta</label>
                            <textarea
                                className="detail-edit-textarea"
                                value={editQuestion}
                                onChange={e => setEditQuestion(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div className="detail-edit-field">
                            <label className="detail-edit-label">Respuesta</label>
                            <textarea
                                className="detail-edit-textarea"
                                value={editAnswer}
                                onChange={e => setEditAnswer(e.target.value)}
                                rows={2}
                            />
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

            {/* ── MODAL ELIMINAR TARJETA ── */}
            {deletingCardId !== null && (
                <div className="detail-modal-overlay" onClick={() => setDeletingCardId(null)}>
                    <div className="detail-confirm-modal" onClick={e => e.stopPropagation()}>
                        <span className="detail-confirm-icon">⚠️</span>
                        <h3 className="detail-confirm-title">¿Eliminar esta tarjeta?</h3>
                        <p className="detail-confirm-sub">Esta acción no se puede deshacer.</p>
                        <div className="detail-form-actions">
                            <button className="detail-cancel-btn" onClick={() => setDeletingCardId(null)}>Cancelar</button>
                            <button className="detail-danger-btn" onClick={() => handleDeleteCard(deletingCardId)}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL RESEÑA ── */}
            {showReviewModal && (
                <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="review-modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="review-modal-title">Evaluar paquete</h3>
                        <p className="review-modal-subtitle">{pkg.name}</p>
                        <div className="review-modal-stars">
                            {[1,2,3,4,5].map(i => (
                                <button key={i} className={`review-star-btn ${i <= newRating ? "star-filled" : "star-empty"}`} onClick={() => setNewRating(i)}>★</button>
                            ))}
                        </div>
                        <textarea
                            className="review-modal-input"
                            placeholder="Comentario (opcional)"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            rows={3}
                        />
                        {reviewError && <p className="detail-error">{reviewError}</p>}
                        <div className="review-modal-actions">
                            <button className="detail-study-btn" onClick={handleSubmitReview} disabled={savingReview}>
                                {savingReview ? "Enviando..." : "Enviar evaluación"}
                            </button>
                            <button className="detail-cancel-btn" onClick={() => setShowReviewModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BackIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function DotsIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>;
}
function PlusIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
}
function ForkIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6 8v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8M6 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function EditIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function TrashIcon() {
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}