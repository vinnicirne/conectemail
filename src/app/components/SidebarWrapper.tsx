"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Mail, PenSquare, Megaphone, Users } from "lucide-react";

export default function SidebarWrapper() {
  const pathname = usePathname();

  // Esconder a barra lateral nas telas de autenticação
  const hiddenPaths = ["/login", "/forgot-password", "/reset-password"];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return (
    <aside className="sidebar glass-panel animate-fade-in">
      <div style={{ padding: '0 16px 24px', fontWeight: 700, fontSize: '18px', color: 'var(--accent)' }}>
        Conect Email
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          <Mail size={20} />
          Inbox
        </Link>
        <Link href="/compose" className={`nav-link ${pathname.startsWith('/compose') ? 'active' : ''}`}>
          <PenSquare size={20} />
          Nova Mensagem
        </Link>
        <Link href="/campaigns" className={`nav-link ${pathname.startsWith('/campaigns') ? 'active' : ''}`}>
          <Megaphone size={20} />
          Campanhas
        </Link>
        <Link href="/lists" className={`nav-link ${pathname.startsWith('/lists') ? 'active' : ''}`}>
          <Users size={20} />
          Listas
        </Link>
      </nav>
    </aside>
  );
}
