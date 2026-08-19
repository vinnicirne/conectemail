"use client";

import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao processar solicitação");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-color)" }}>
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "16px" }}>
        
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-flex", background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "50%", marginBottom: "24px", color: "var(--success)" }}>
              <CheckCircle2 size={40} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-color)", marginBottom: "16px" }}>E-mail Enviado!</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
              Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link de redefinição de senha em alguns instantes.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: "inline-block", width: "100%" }}>
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-color)" }}>Recuperar Senha</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>Digite seu e-mail para receber um link de acesso seguro.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {error && (
                <div style={{
                  padding: "12px 16px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  color: "#ef4444",
                  fontSize: "14px",
                  fontWeight: 500,
                  textAlign: "center"
                }}>
                  {error}
                </div>
              )}

              <div className="form-group" style={{ position: "relative" }}>
                <label>E-mail da sua conta</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "42px" }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || !email} 
                style={{ width: "100%", justifyContent: "center", marginTop: "8px", padding: "14px" }}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px", textDecoration: "none", fontWeight: 500 }}>
                <ArrowLeft size={16} /> Voltar
              </Link>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}
