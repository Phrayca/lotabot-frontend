import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/Toast";

export const metadata: Metadata = {
  title: "Lotabot",
  description: "Ton robot de trading, à ta poche",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
