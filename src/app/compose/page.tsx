"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Eye } from "lucide-react";

export default function ComposePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Restaurar rascunho
  useEffect(() => {
    setMounted(true);
    const savedTo = localStorage.getItem("draft_to");
    const savedSubject = localStorage.getItem("draft_subject");
    const savedHtml = localStorage.getItem("draft_html");
    if (savedTo) setTo(savedTo);
    if (savedSubject) setSubject(savedSubject);
    if (savedHtml) setHtml(savedHtml);
  }, []);

  // Autocomplete Inteligente (com debounce)
  useEffect(() => {
    setLoadingContacts(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/contacts?q=${encodeURIComponent(to)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setContacts(data);
        })
        .catch(() => {})
        .finally(() => setLoadingContacts(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [to]);

  const handleToChange = (val: string) => {
    setTo(val);
    localStorage.setItem("draft_to", val);
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    localStorage.setItem("draft_subject", val);
  };

  const handleHtmlChange = (val: string) => {
    setHtml(val);
    localStorage.setItem("draft_html", val);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!to.trim() || !subject.trim() || !html.trim()) {
      setError("Preencha todos os campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      setError("Email do destinatário inválido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });

      if (res.ok) {
        localStorage.removeItem("draft_to");
        localStorage.removeItem("draft_subject");
        localStorage.removeItem("draft_html");
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error?.message || data.error || "Erro ao enviar email");
      }
    } catch (err) {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const filteredContacts = contacts.filter(c => c !== to);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Nova Mensagem</h1>
      </div>

      <div style={{ display: "flex", gap: "24px", flex: 1, minHeight: "600px" }}>
        {/* Editor (Left) */}
        <form onSubmit={handleSend} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#ef4444",
              fontSize: "14px",
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ position: "relative" }}>
            <label>Destinatário</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="cliente@exemplo.com"
              value={to}
              autoComplete="off"
              onChange={(e) => {
                handleToChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSuggestions(false);
              }}
              required
            />
            {showSuggestions && (loadingContacts || filteredContacts.length > 0) && (
              <div role="listbox" style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--bg-color)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                boxShadow: "var(--shadow)",
                zIndex: 10,
                maxHeight: "250px",
                overflowY: "auto",
                marginTop: "4px"
              }}>
                {loadingContacts ? (
                  <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "13px" }}>
                    Buscando contatos...
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div 
                      key={contact}
                      role="option"
                      tabIndex={0}
                      onClick={() => {
                        handleToChange(contact);
                        setShowSuggestions(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToChange(contact);
                          setShowSuggestions(false);
                        }
                      }}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(107, 114, 128, 0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "var(--accent)", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 600, fontSize: "14px", textTransform: "uppercase"
                      }}>
                        {contact[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "14px" }}>{contact}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Assunto</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Novidades da semana..."
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Corpo do Email (HTML)</label>
            <textarea 
              className="input-field" 
              style={{ flex: 1, fontFamily: "monospace", fontSize: "13px" }}
              placeholder="<h1>Olá!</h1><p>Insira seu HTML aqui...</p>"
              value={html}
              onChange={(e) => handleHtmlChange(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !to || !subject || !html} 
            style={{ alignSelf: "flex-start" }}
          >
            {loading ? "Enviando..." : (
              <>
                <Send size={18} />
                Enviar Email
              </>
            )}
          </button>
        </form>

        {/* Preview (Right) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
            <Eye size={18} />
            Preview em tempo real
          </div>
          <div style={{ 
            flex: 1, 
            background: "#fff", 
            borderRadius: "8px", 
            border: "1px solid var(--border-color)",
            overflow: "hidden"
          }}>
            <iframe 
              srcDoc={html || '<div style="color:#9ca3af;font-family:sans-serif;padding:20px;">O preview aparecerá aqui...</div>'}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="Email Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
