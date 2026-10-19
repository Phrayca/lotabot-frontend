import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/Toast";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Lotabot",
  description: "Ton robot de trading, à ta poche",
};

// Applique la preference de theme enregistree AVANT le premier rendu, pour eviter un
// flash de mauvais theme au chargement de la page. "auto" (ou rien d'enregistre) ne
// touche a rien : la regle @media (prefers-color-scheme) dans globals.css suffit alors.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = window.localStorage.getItem("lotabot_theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
