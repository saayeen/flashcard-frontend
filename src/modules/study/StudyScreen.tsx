import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Flashcard } from "../../types/index";
import "./StudyScreen.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Phase = "studying" | "summary";

interface SessionSummary {
    sessionId: number;
    totalCards: number;
    difficult: number;
    almost: number;
    good: number;
    easy: number;
}

export default function StudyScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [cards, setCards] = useState<Flashcard[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [phase, setPhase] = useState<Phase>("studying");
    const [summary, setSummary] = useState<SessionSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const token = await getToken();

                // cargar tarjetas
                const cardsRes = await fetch(`${API_URL}/packages/${id}/cards`);
                const cardsData = await cardsRes.json();
                setCards(cardsData);

                // crear sesión
                const sessionRes = await fetch(`${API_URL}/study/sessions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ packageId: Number(id) }),
                });
                const sessionData = await sessionRes.json();
                setSessionId(sessionData.id);
            } catch {
                setError("No se pudo iniciar la sesión");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    const handleQuality = async (quality: number) => {
        if (!sessionId) return;
        const card = cards[currentIndex];
        try {
            const token = await getToken();
            await fetch(`${API_URL}/study/sessions/${sessionId}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ cardId: card.id, quality }),
            });
        } catch {
            // continuar aunque falle el review
        }

        if (currentIndex + 1 >= cards.length) {
            await finishSession();
        } else {
            setCurrentIndex(prev => prev + 1);
            setFlipped(false);
        }
    };

    const finishSession = async () => {
        if (!sessionId) return;
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/study/sessions/${sessionId}/finish`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await res.json();
            setSummary(data);
            setPhase("summary");
        } catch {
            setPhase("summary");
        }
    };

    if (loading) return <div className="study-loading">Preparando sesión...</div>;
    if (error) return <div className="study-loading">{error}</div>;
    if (cards.length === 0) return (
        <div className="study-loading">
            <p>No hay tarjetas para estudiar</p>
            <button onClick={() => navigate(-1)}>Volver</button>
        </div>
    );

    if (phase === "summary" && summary) {
        return (
            <div className="study-page">
                <div className="summary-container">
                    <div className="summary-emoji">🎉</div>
                    <h1 className="summary-title">¡Sesión completada!</h1>
                    <p className="summary-sub">{summary.totalCards} tarjetas estudiadas</p>

                    <div className="summary-grid">
                        <div className="summary-stat summary-difficult">
                            <span className="stat-number">{summary.difficult}</span>
                            <span className="stat-label">Difícil</span>
                        </div>
                        <div className="summary-stat summary-almost">
                            <span className="stat-number">{summary.almost}</span>
                            <span className="stat-label">Casi</span>
                        </div>
                        <div className="summary-stat summary-good">
                            <span className="stat-number">{summary.good}</span>
                            <span className="stat-label">Bien</span>
                        </div>
                        <div className="summary-stat summary-easy">
                            <span className="stat-number">{summary.easy}</span>
                            <span className="stat-label">Fácil</span>
                        </div>
                    </div>

                    <button className="summary-btn" onClick={() => navigate(`/packages/${id}`)}>
                        Volver al paquete
                    </button>
                </div>
            </div>
        );
    }

    const card = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;

    return (
        <div className="study-page">
            <div className="study-header">
                <button className="study-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <div className="study-progress-bar">
                    <div className="study-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="study-counter">{currentIndex + 1}/{cards.length}</span>
            </div>

            <div className="study-card-container" onClick={() => setFlipped(!flipped)}>
                <div className={`study-card ${flipped ? "flipped" : ""}`}>
                    <div className="study-card-front">
                        <span className="study-card-hint">Pregunta</span>
                        <p className="study-card-text">{card.question}</p>
                        <span className="study-tap-hint">Toca para ver respuesta</span>
                    </div>
                    <div className="study-card-back">
                        <span className="study-card-hint">Respuesta</span>
                        <p className="study-card-text">{card.answer}</p>
                    </div>
                </div>
            </div>

            {flipped && (
                <div className="study-actions">
                    <p className="study-actions-label">¿Qué tan bien lo recordaste?</p>
                    <div className="study-buttons">
                        <button className="quality-btn quality-1" onClick={() => handleQuality(1)}>
                            😰 Difícil
                        </button>
                        <button className="quality-btn quality-2" onClick={() => handleQuality(2)}>
                            😅 Casi
                        </button>
                        <button className="quality-btn quality-3" onClick={() => handleQuality(3)}>
                            😊 Bien
                        </button>
                        <button className="quality-btn quality-4" onClick={() => handleQuality(4)}>
                            😀 Fácil
                        </button>
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