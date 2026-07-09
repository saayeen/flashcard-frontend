import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem("jati-theme") as Theme) ?? "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("jati-theme", theme);
    }, [theme]);

    const toggleTheme = (e?: React.MouseEvent) => {
        const newTheme = theme === "light" ? "dark" : "light";

        // View Transitions API — animación circular desde el punto de click
        if (!document.startViewTransition || !e) {
            setTheme(newTheme);
            return;
        }

        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            setTheme(newTheme);
            document.documentElement.setAttribute("data-theme", newTheme);
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ];
            document.documentElement.animate(
                { clipPath: newTheme === "dark" ? clipPath : [...clipPath].reverse() },
                {
                    duration: 400,
                    easing: "ease-in",
                    pseudoElement: newTheme === "dark"
                        ? "::view-transition-new(root)"
                        : "::view-transition-old(root)",
                }
            );
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}