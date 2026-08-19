import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
// date-fns removido para usar Intl nativo
import { ArrowLeft, MailOpen } from "lucide-react";

export default async function EmailDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: email } = await supabase
    .from('Email')
    .select('*')
    .eq('id', id)
    .single();

  if (!email) {
    notFound();
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/" className="btn-secondary" style={{ padding: "8px 12px" }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Detalhes do Email</h1>
      </div>

      <div style={{ display: "flex", gap: "32px", flex: 1 }}>
        {/* Email Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="glass-panel" style={{ padding: "24px", background: "var(--bg-color)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px", fontSize: "15px" }}>
              <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Para:</div>
              <div style={{ fontWeight: 600 }}>{email.toAddress}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Assunto:</div>
              <div>{email.subject}</div>

              <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Status:</div>
              <div>
                <span className={`badge ${email.status.toLowerCase()}`}>{email.status}</span>
              </div>

              <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Enviado em:</div>
              <div>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(email.createdAt))}</div>

              {email.resendId && (
                <>
                  <div style={{ color: "var(--text-muted)", fontWeight: 500 }}>Resend ID:</div>
                  <div style={{ fontSize: "13px", fontFamily: "monospace" }}>{email.resendId}</div>
                </>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "24px", background: "var(--bg-color)", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "50%", 
              background: "rgba(139, 92, 246, 0.1)", 
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <MailOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{email.openedCount}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Vezes Aberto</div>
            </div>
            {email.lastOpenedAt && (
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Última abertura</div>
                <div style={{ fontWeight: 500, fontSize: "14px" }}>
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(email.lastOpenedAt))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Content Preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: 600 }}>Conteúdo Enviado</h3>
          <div style={{ 
            flex: 1, 
            background: "#fff", 
            borderRadius: "12px", 
            border: "1px solid var(--border-color)",
            overflow: "hidden"
          }}>
            <iframe 
              srcDoc={email.htmlContent}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Email Content"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
