import { useState, useRef } from "react";
import "./Taginput.css";

interface Props {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    max?: number;
}

export default function TagInput({ tags, onChange, placeholder = "Agrega etiqueta", max = 10 }: Props) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (raw: string) => {
        const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
        if (!tag || tags.includes(tag) || tags.length >= max) return;
        onChange([...tags, tag]);
        setInput("");
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === "," || e.key === " ") {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="tag-input-wrapper" onClick={() => inputRef.current?.focus()}>
            {tags.map(tag => (
                <span key={tag} className="tag-chip">
                    #{tag}
                    <button className="tag-chip-remove" onClick={e => { e.stopPropagation(); removeTag(tag); }} type="button" aria-label={`Quitar ${tag}`}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </button>
                </span>
            ))}
            {tags.length < max && (
                <input
                    ref={inputRef}
                    className="tag-input-field"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => addTag(input)}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    maxLength={30}
                />
            )}
        </div>
    );
}