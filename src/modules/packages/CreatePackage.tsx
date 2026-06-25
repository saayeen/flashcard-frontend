import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { CreatePackageRequest } from "../../types/index";
import "./CreatePackage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function CreatePackage() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState<CreatePackageRequest>({
        name: "",
        description: "",
        category: "",
        isPublic: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setError("El nombre es obligatorio");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/packages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) throw new Error("No se pudo crear el paquete");

            const created = await response.json();
            navigate(`/packages/${created.id}`);
        } catch {
            setError("Ocurrió un error al crear el paquete");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-page">
            <div className="create-header">
                <button className="create-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <h1 className="create-title">Nuevo paquete</h1>
            </div>

            <div className="create-form">
                <div className="create-field">
                    <label className="create-label">Nombre</label>
                    <input
                        className="create-input"
                        name="name"
                        placeholder="Ej: Vocabulario inglés B2"
                        value={form.name}
                        onChange={handleChange}
                        maxLength={80}
                    />
                </div>

                <div className="create-field">
                    <label className="create-label">Descripción</label>
                    <textarea
                        className="create-textarea"
                        name="description"
                        placeholder="¿De qué trata este paquete?"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        maxLength={300}
                    />
                </div>

                <div className="create-field">
                    <label className="create-label">Categoría</label>
                    <input
                        className="create-input"
                        name="category"
                        placeholder="Ej: Idiomas, Ciencias, Historia..."
                        value={form.category}
                        onChange={handleChange}
                        maxLength={50}
                    />
                </div>

                <div className="create-toggle-row">
                    <div>
                        <p className="create-toggle-label">Paquete público</p>
                        <p className="create-toggle-sub">Otros usuarios podrán verlo y usarlo</p>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            name="isPublic"
                            checked={form.isPublic}
                            onChange={handleChange}
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>

                {error && <p className="create-error">{error}</p>}

                <button
                    className="create-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Creando..." : "Crear paquete"}
                </button>
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