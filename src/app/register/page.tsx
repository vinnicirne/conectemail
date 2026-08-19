"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, KeyRound, User, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(data.error || "Erro ao criar conta.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "var(--bg-color)",
    }}>
      <div
        className="glass-panel animate-fade-in"
        style={{ width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "16px" }}
      >
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              display: "inline-flex",
              background: "rgba(16, 185, 129, 0.1)",
              padding: "16px",
              borderRadius: "50%",
              marginBottom: "24px",
              color: "#10b981"
            }}>
              <CheckCircle2 size={40} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-color)", marginBottom: "12px" }}>
              Conta criada!
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Redirecionando para o login...
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{
                display: "inline-flex",
                background: "var(--primary)",
                padding: "12px",
                borderRadius: "50%",
                marginBottom: "16px",
                color: "#fff"
              }}>
                <UserPlus size={32} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-color)" }}>
                Criar Conta
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>
                Preencha os dados para acessar o painel.
              </p>
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

              <div className="form-group">
                <label>Nome (opcional)</label>
                <div style={{ position: "relative" }}>
                  <User size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: "42px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>E-mail *</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "42px" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Senha *</label>
                <div style={{ position: "relative" }}>
                  <KeyRound size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "42px" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirmar Senha *</label>
                <div style={{ position: "relative" }}>
                  <KeyRound size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Repita a senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    style={{ paddingLeft: "42px" }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", marginTop: "8px", padding: "14px" }}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>

              <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>
                Já tem uma conta?{" "}
                <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                  Entrar
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
