import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/Toast";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Lotabot",
  description: "Ton robot de trading, à ta poche",
};

// Applique la preference de theme enregistree AVANT le premier rendu, pour eviter un
// flash de mauvais theme au chargement de la page (le mode sombre reste la valeur par
// defaut tant que rien n'est enregistre : on ne touche a rien dans ce cas).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    if (window.localStorage.getItem("lotabot_theme") === "light") {
      document.documentElement.setAttribute("data-theme", "light");
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
