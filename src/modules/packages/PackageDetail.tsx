import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { FlashcardPackage, Flashcard, CreateCardRequest } from "../../types/index";
import Header from "../navigation/Header";
import "./PackageDetail.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function PackageDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [pkg, setPkg] = useState<FlashcardPackage | null>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newCard, setNewCard] = useState<CreateCardRequest>({ front: "", back: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/packages/${id}`).then(r => r.json()),
            fetch(`${API_URL}/packages/${id}/cards`).then(r => r.json()),
        ]).then(([pkgData, cardsData]) => {
            setPkg(pkgData);
            setCards(cardsData);
        }).finally(() => setLoading(false));
    }, [id]);

    const handleAddCard = async () => {
        if (!newCard.front.trim() || !newCard.back.trim()) {
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
            setNewCard({ front: "", back: "" });
            setShowForm(false);
        } catch {
            setError("No se pudo crear la tarjeta");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="detail-loading">Cargando...</div>;
    if (!pkg) return <div className="detail-loading">Paquete no encontrado</div>;

    return (
        <div className="detail-page">
            <Header />

            <div className="detail-hero">
                <button className="detail-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <span className="detail-category">{pkg.category}</span>
                <h1 className="detail-name">{pkg.name}</h1>
                <p className="detail-description">{pkg.description}</p>
                <div className="detail-meta">
                    <span>{cards.length} tarjetas</span>
                </div>
            </div>

            <div className="detail-actions">
                <button className="detail-study-btn" onClick={() => navigate(`/packages/${id}/study`)}>
                    Estudiar
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
                        value={newCard.front}
                        onChange={e => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                        rows={2}
                    />
                    <textarea
                        className="detail-card-input"
                        placeholder="Reverso de la tarjeta"
                        value={newCard.back}
                        onChange={e => setNewCard(prev => ({ ...prev, back: e.target.value }))}
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
                        <div className="detail-card-front">{card.front}</div>
                        <div className="detail-card-divider" />
                        <div className="detail-card-back">{card.back}</div>
                    </div>
                ))}
            </div>
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