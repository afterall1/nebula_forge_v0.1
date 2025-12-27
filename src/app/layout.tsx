import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Nebula Forge",
    description: "Visual Programming Platform for Backtest & Manipulation Detection",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
