import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Blueprint color palette
                forge: {
                    bg: "#020617",        // slate-950
                    surface: "#0f172a",   // slate-900
                    border: "#1e3a5f",    // tech blue border
                    accent: "#0ea5e9",    // sky-500
                    glow: "#38bdf8",      // sky-400
                    text: "#e2e8f0",      // slate-200
                    muted: "#64748b",     // slate-500
                },
            },
            fontFamily: {
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            backgroundImage: {
                "grid-pattern":
                    "linear-gradient(rgba(30, 58, 95, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 58, 95, 0.3) 1px, transparent 1px)",
            },
            backgroundSize: {
                "grid": "20px 20px",
            },
        },
    },
    plugins: [],
};

export default config;
