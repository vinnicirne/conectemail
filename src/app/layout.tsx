import type { Metadata } from "next";
import "./globals.css";
import SidebarWrapper from "./components/SidebarWrapper";

export const metadata: Metadata = {
  title: "Conect Email",
  description: "Painel de envio e rastreamento de emails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-container">
          <SidebarWrapper />
          
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
