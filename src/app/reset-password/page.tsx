"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, KeyRound } from "lucide-react";
import Link from "next/link";

// Componente interno separado para usar useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Link de recuperação inválido ou ausente.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link de recuperação inválido.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao redefinir a senha");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="glass-panel" style={{ width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "20px", color: "var(--danger)", marginBottom: "16px" }}>Link Inválido</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>O token de recuperação não foi fornecido.</p>
        <Link href="/login" className="btn-primary" style={{ width: "100%" }}>Voltar ao Login</Link>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "16px" }}>
      {success ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "50%", marginBottom: "24px", color: "var(--success)" }}>
            <CheckCircle2 size={40} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-color)", marginBottom: "16px" }}>Senha Alterada!</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>
            Sua nova senha foi salva com sucesso. Você já pode acessar o painel administrativo.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: "inline-block", width: "100%" }}>
            Fazer Login
          </Link>
        </div>
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", background: "var(--primary)", padding: "12px", borderRadius: "50%", marginBottom: "16px", color: "#fff" }}>
              <Lock size={32} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-color)" }}>Nova Senha</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>Digite e confirme a sua nova senha de acesso seguro.</p>
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
              <label>Nova Senha</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  className="input-field"
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <label>Confirme a Senha</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="password"
                  className="input-field"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !password || !confirmPassword}
              style={{ width: "100%", justifyContent: "center", marginTop: "8px", padding: "14px" }}
            >
              {loading ? "Salvando..." : "Redefinir Senha"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// Página principal com Suspense obrigatório para useSearchParams no Next.js 16
export default function ResetPasswordPage() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-color)" }}>
      <Suspense fallback={
        <div style={{ color: "var(--text-muted)", fontSize: "16px" }}>Carregando...</div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
