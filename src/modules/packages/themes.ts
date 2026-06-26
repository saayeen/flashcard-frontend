export interface Theme {
    id: string;
    name: string;
    gradient: string;
    preview: string;
}

export const THEMES: Theme[] = [
    { id: "blue",    name: "Océano",     gradient: "linear-gradient(135deg, #2784EF, #A9CEF9)", preview: "#2784EF" },
    { id: "sunset",  name: "Atardecer",  gradient: "linear-gradient(135deg, #FF9A5C, #FF6B9D)", preview: "#FF9A5C" },
    { id: "nature",  name: "Naturaleza", gradient: "linear-gradient(135deg, #43E97B, #38B2F8)", preview: "#43E97B" },
    { id: "candy",   name: "Candy",      gradient: "linear-gradient(135deg, #F953C6, #B91D73)", preview: "#F953C6" },
    { id: "golden",  name: "Dorado",     gradient: "linear-gradient(135deg, #F7971E, #FFD200)", preview: "#F7971E" },
    { id: "galaxy",  name: "Galaxia",    gradient: "linear-gradient(135deg, #4776E6, #8E54E9)", preview: "#4776E6" },
    { id: "aurora",  name: "Aurora",     gradient: "linear-gradient(135deg, #56CCF2, #2F80ED)", preview: "#56CCF2" },
    { id: "rose",    name: "Rosa",       gradient: "linear-gradient(135deg, #FF9A9E, #FECFEF)", preview: "#FF9A9E" },
];

export function getThemeGradient(themeId: string): string {
    return THEMES.find(t => t.id === themeId)?.gradient ?? THEMES[0].gradient;
}