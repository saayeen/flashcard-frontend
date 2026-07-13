import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { CreatePackageRequest, CreateCardRequest, Flashcard } from "../../types/index";
import { THEMES, getThemeGradient } from "./themes";
import TagInput from "../shared/Taginput";
import "./CreatePackage.css";
import FinalImg from "../../assets/PackageCreated.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Step = 1 | 2 | 3;

const CATEGORIES = ["Universidad", "PAES", "Idiomas", "Licencia de conducir", "Otros"];

export default function CreatePackage() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Paso 1 — formulario
    const [form, setForm] = useState<CreatePackageRequest>({
        name: "",
        description: "",
        category: "",
        isPublic: true,
        theme: "blue",
        tags: [],
    });
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Paso 2 — tarjetas
    const [createdId, setCreatedId] = useState<number | null>(null);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [newCard, setNewCard] = useState<CreateCardRequest>({ question: "", answer: "" });
    const [savingCard, setSavingCard] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleStep1 = async () => {
        if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
        if (!form.category) { setError("Selecciona una categoría"); return; }
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error();
            const created = await res.json();
            setCreatedId(created.id);
            setStep(2);
        } catch {
            setError("Ocurrió un error al crear el paquete");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async () => {
        if (!newCard.question.trim() || !newCard.answer.trim()) {
            setCardError("Ambos campos son obligatorios");
            return;
        }
        setSavingCard(true);
        setCardError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/packages/${createdId}/cards`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(newCard),
            });
            if (!res.ok) throw new Error();
            const created: Flashcard = await res.json();
            setCards(prev => [...prev, created]);
            setNewCard({ question: "", answer: "" });
        } catch {
            setCardError("No se pudo agregar la tarjeta");
        } finally {
            setSavingCard(false);
        }
    };

    const handleDeleteCard = async (cardId: number) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/cards/${cardId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setCards(prev => prev.filter(c => c.id !== cardId));
        } catch {}
    };

    const selectedTheme = THEMES.find(t => t.id === form.theme) ?? THEMES[0];
    const gradient = getThemeGradient(form.theme) || selectedTheme.gradient;
    const stepLabels = ["Formulario", "Agregar tarjetas", "Estado final"];

    return (
        <div className="create-page">
            {/* HEADER con gradiente del tema */}
            <div className="create-header" style={{ background: gradient }}>
                <button
                    className="create-back-btn"
                    onClick={() => step === 1 ? setShowExitConfirm(true) : setStep(s => (s - 1) as Step)}
                >
                    <BackIcon />
                </button>
                <h1 className="create-header-title">Crear nuevo paquete</h1>
            </div>

            {/* STEPS */}
            <div className="create-steps">
                {stepLabels.map((label, i) => (
                    <div key={i} className={`create-step ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}`}>
                        <div className="step-circle">{step > i + 1 ? "✓" : i + 1}</div>
                        <span className="step-label">{label}</span>
                        {i < stepLabels.length - 1 && <div className="step-line" />}
                    </div>
                ))}
            </div>

            {/* ── PASO 1: FORMULARIO ── */}
            {step === 1 && (
                <div className="create-form">
                    <div className="create-field">
                        <label className="create-label">Nombre del paquete</label>
                        <input
                            className="create-input"
                            name="name"
                            placeholder="Nombre del paquete..."
                            value={form.name}
                            onChange={handleChange}
                            maxLength={80}
                        />
                    </div>

                    <div className="create-field">
                        <label className="create-label">Categoría</label>
                        <div className="create-category-grid">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    className={`create-category-btn ${form.category === cat ? "selected" : ""}`}
                                    onClick={() => setForm(p => ({ ...p, category: cat }))}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="create-field">
                        <label className="create-label">Descripción (opcional)</label>
                        <textarea
                            className="create-textarea"
                            name="description"
                            placeholder="Describe tu paquete..."
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            maxLength={300}
                        />
                    </div>

                    <div className="create-field">
                        <label className="create-label">Etiquetas (opcional)</label>
                        <TagInput
                            tags={form.tags}
                            onChange={tags => setForm(p => ({ ...p, tags }))}
                            placeholder="Escribe y presiona Enter o coma..."
                        />
                        <p className="create-tags-hint">Ej: historia, chile, paes — máx. 10 etiquetas</p>
                    </div>

                    <div className="create-field">
                        <label className="create-label">Tema visual</label>
                        <div className="theme-grid">
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    className={`theme-option ${form.theme === theme.id ? "selected" : ""}`}
                                    style={{ background: theme.gradient }}
                                    onClick={() => setForm(prev => ({ ...prev, theme: theme.id }))}
                                >
                                    {form.theme === theme.id && <span className="theme-check">✓</span>}
                                    <span className="theme-name">{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="create-toggle-row">
                        <div>
                            <p className="create-toggle-label">Paquete público</p>
                            <p className="create-toggle-sub">Otros usuarios podrán verlo</p>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {error && <p className="create-error">{error}</p>}

                    <button
                        className="create-submit-btn"
                        onClick={handleStep1}
                        disabled={loading}
                        style={{ background: gradient }}
                    >
                        {loading ? "Creando..." : "Continuar"}
                    </button>

                    <button
                        className="create-secondary-btn"
                        onClick={handleStep1}
                        disabled={loading}
                    >
                        Guardar como borrador
                    </button>
                </div>
            )}

            {/* ── CONFIRMAR SALIDA ── */}
            {showExitConfirm && (
                <div className="create-modal-overlay" onClick={() => setShowExitConfirm(false)}>
                    <div className="create-confirm-modal" onClick={e => e.stopPropagation()}>
                        <span className="create-confirm-icon"><WarningIcon /></span>
                        <h3 className="create-confirm-title">¿Salir sin guardar?</h3>
                        <p className="create-confirm-sub">Vas a perder lo que llevas escrito en este paquete.</p>
                        <div className="create-exit-actions">
                            <button className="create-secondary-btn" onClick={() => setShowExitConfirm(false)}>
                                Seguir editando
                            </button>
                            <button className="create-exit-danger-btn" onClick={() => navigate(-1)}>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ── PASO 2: AGREGAR TARJETAS ── */}
            {step === 2 && (
                <div className="create-form">
                    <div className="create-card-form">
                        <div className="create-field">
                            <label className="create-label">Pregunta</label>
                            <textarea
                                className="create-textarea"
                                placeholder="¿Año de fundación de Santiago?"
                                value={newCard.question}
                                onChange={e => setNewCard(p => ({ ...p, question: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <div className="create-field">
                            <label className="create-label">Respuesta</label>
                            <textarea
                                className="create-textarea"
                                placeholder="1541 (12 de febrero)"
                                value={newCard.answer}
                                onChange={e => setNewCard(p => ({ ...p, answer: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        {cardError && <p className="create-error">{cardError}</p>}
                        <button
                            className="create-add-card-btn"
                            onClick={handleAddCard}
                            disabled={savingCard}
                            style={{ background: gradient }}
                        >
                            + Agregar tarjeta
                        </button>
                    </div>

                    {/* LISTA DE TARJETAS */}
                    {cards.length > 0 && (
                        <div className="create-cards-list">
                            {cards.map((card) => (
                                <div className="create-card-item" key={card.id}>
                                    <div className="create-card-content">
                                        <div className="create-card-q">
                                            <span className="create-card-label">P.</span>
                                            <span>{card.question}</span>
                                        </div>
                                        <div className="create-card-a">
                                            <span className="create-card-label">R.</span>
                                            <span>{card.answer}</span>
                                        </div>
                                    </div>
                                    <div className="create-card-actions">
                                        <button
                                            className="create-card-edit-btn"
                                            onClick={() => {}}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="create-card-del-btn"
                                            onClick={() => handleDeleteCard(card.id)}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="create-step2-footer">
                        <button
                            className="create-submit-btn"
                            onClick={() => setStep(3)}
                            style={{ background: gradient }}
                        >
                            {cards.length === 0 ? "Guardar como borrador" : "Publicar paquete"}
                        </button>
                        <button className="create-secondary-btn" onClick={() => setStep(3)}>
                            Seguir editando después
                        </button>
                    </div>
                </div>
            )}

            {/* ── PASO 3: ESTADO FINAL ── */}
            {step === 3 && (
                <div className="create-final">
                    <div className="create-final-card" style={{ background: gradient }}>
                        <img src={FinalImg} alt="" className="final-icon-img" />
                        {form.isPublic ? (
                            <>
                                <h2 className="final-title">¡Paquete publicado!</h2>
                                <p className="final-sub">
                                    "{form.name}" ahora está disponible para que otros estudiantes lo usen.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="final-title">Guardado como borrador</h2>
                                <p className="final-sub">
                                    Puedes publicarlo cuando quieras desde el detalle del paquete.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="create-final-actions">
                        <button
                            className="create-submit-btn"
                            onClick={() => createdId && navigate(`/packages/${createdId}`)}
                            style={{ background: gradient }}
                        >
                            Ver paquete
                        </button>
                        <button
                            className="create-secondary-btn"
                            onClick={() => createdId && navigate(`/packages/${createdId}`)}
                        >
                            Seguir editando
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


function TrashIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

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