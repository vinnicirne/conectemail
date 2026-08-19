import { supabase } from "@/lib/supabase";
import Link from "next/link";
// date-fns removido para usar Intl nativo

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: emails } = await supabase
    .from("Email")
    .select("*")
    .order("createdAt", { ascending: false });

  const emailsList = emails || [];

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "32px", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Caixa de Saída</h1>
        <Link href="/compose" className="btn-primary">
          Nova Mensagem
        </Link>
      </div>

      {emailsList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          Nenhum email enviado ainda.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {emailsList.map((email) => (
            <Link key={email.id} href={`/emails/${email.id}`} style={{ textDecoration: "none" }}>
              <div
                className="email-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 1fr 1fr",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "var(--bg-color)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  gap: "16px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email.toAddress}
                </div>
                <div style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email.subject}
                </div>
                <div>
                  <span className={`badge ${email.status.toLowerCase()}`}>
                    {email.status}
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "right" }}>
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(email.createdAt))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
