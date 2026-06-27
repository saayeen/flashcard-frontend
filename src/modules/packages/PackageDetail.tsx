import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { FlashcardPackage, Flashcard, CreateCardRequest } from "../../types/index";
import Header from "../navigation/Header";
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

interface CreateReviewRequest {
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

    // agregar tarjeta
    const [showForm, setShowForm] = useState(false);
    const [newCard, setNewCard] = useState<CreateCardRequest>({ question: "", answer: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleAddCard = async () => {
        if (!newCard.question.trim() || !newCard.answer.trim()) {
            setError("Ambos campos son obligatorios");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/packages/${id}/cards`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(newCard),
            });
            if (!response.ok) throw new Error();
            const created: Flashcard = await response.json();
            setCards(prev => [...prev, created]);
            setNewCard({ question: "", answer: "" });
            setShowForm(false);
        } catch {
            setError("No se pudo crear la tarjeta");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitReview = async () => {
        if (newRating === 0) {
            setReviewError("Selecciona una calificación");
            return;
        }
        setSavingReview(true);
        setReviewError(null);
        try {
            const token = await getToken();
            const body: CreateReviewRequest = { rating: newRating, comment: newComment };
            const response = await fetch(`${API_URL}/packages/${id}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error();
            const created: Review = await response.json();
            setReviews(prev => [created, ...prev]);
            setShowReviewModal(false);
            setNewRating(0);
            setNewComment("");
        } catch {
            setReviewError("No se pudo enviar la reseña");
        } finally {
            setSavingReview(false);
        }
    };

    const avgRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0;

    if (loading) return <div className="detail-loading">Cargando...</div>;
    if (!pkg) return <div className="detail-loading">Paquete no encontrado</div>;

    return (
        <div className="detail-page">
            <Header />

            {/* HERO */}
            <div className="detail-hero" style={{ background: pkg ? getThemeGradient(pkg.theme) : "#1B3A5C" }}>
                <button className="detail-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <div className="detail-hero-content">
                    <span className="detail-category">{pkg.category}</span>
                    <h1 className="detail-name">{pkg.name}</h1>
                    <div className="detail-hero-meta">
                        <span>{cards.length} tarjetas</span>
                        {reviews.length > 0 && (
                            <span className="detail-rating">
                                ★ {avgRating.toFixed(1)}
                            </span>
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
                        {tab === "detalles" ? "Detalles"
                            : tab === "descripcion" ? "Descripción"
                            : "Reseñas"}
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
                        <button className="detail-add-btn" onClick={() => setShowForm(!showForm)}>
                            <PlusIcon /> Agregar tarjeta
                        </button>
                    </div>

                    {showForm && (
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
                            {error && <p className="detail-error">{error}</p>}
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
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: DESCRIPCIÓN */}
            {activeTab === "descripcion" && (
                <div className="detail-tab-content">
                    <p className="detail-desc-text">{pkg.description}</p>

                    <div className="detail-actions">
                        <button className="detail-study-btn" onClick={() => navigate(`/packages/${id}/study`)}>
                            Empezar a estudiar
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: RESEÑAS */}
            {activeTab === "resenas" && (
                <div className="detail-tab-content">
                    <div className="detail-reviews-header">
                        <div className="detail-reviews-avg">
                            <span className="detail-reviews-score">
                                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                            </span>
                            <div className="detail-reviews-stars">
                                {[1, 2, 3, 4, 5].map(i => (
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
                            {user ? "Evaluar paquete" : "Estudia este paquete para evaluarlo"}
                        </button>
                    </div>

                    <div className="detail-reviews-list">
                        {reviews.length === 0 && (
                            <p className="detail-empty">Aún no hay reseñas. ¡Sé el primero!</p>
                        )}
                        {reviews.map(review => (
                            <div className="detail-review-item" key={review.id}>
                                <div className="detail-review-top">
                                    <div className="detail-review-avatar">
                                        {review.userId.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="detail-review-user">{review.userId.slice(0, 8)}...</p>
                                        <div className="detail-review-stars">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <span key={i} className={i <= review.rating ? "star-filled" : "star-empty"}>★</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="detail-review-comment">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL RESEÑA */}
            {showReviewModal && (
                <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="review-modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="review-modal-title">Evaluar paquete</h3>
                        <p className="review-modal-subtitle">{pkg.name}</p>

                        <div className="review-modal-stars">
                            {[1, 2, 3, 4, 5].map(i => (
                                <button
                                    key={i}
                                    className={`review-star-btn ${i <= newRating ? "star-filled" : "star-empty"}`}
                                    onClick={() => setNewRating(i)}
                                >
                                    ★
                                </button>
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
                            <button
                                className="detail-study-btn"
                                onClick={handleSubmitReview}
                                disabled={savingReview}
                            >
                                {savingReview ? "Enviando..." : "Enviar evaluación"}
                            </button>
                            <button
                                className="detail-cancel-btn"
                                onClick={() => setShowReviewModal(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BackIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
    );
}