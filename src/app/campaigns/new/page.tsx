"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Eye, Users, FileText } from "lucide-react";

type ContactList = {
  id: string;
  name: string;
  _count: { members: number };
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  
  // Lista Options
  const [savedLists, setSavedLists] = useState<ContactList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("manual");
  const [listMembers, setListMembers] = useState<string[]>([]);
  
  const [recipientsText, setRecipientsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        setSavedLists(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchListMembers = async (listId: string) => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (res.ok) {
        const data = await res.json();
        setListMembers(data.members.map((m: any) => m.email));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedListId(val);
    if (val !== "manual") {
      fetchListMembers(val);
    } else {
      setListMembers([]);
    }
  };

  // Computed state for recipients preview
  const parseRecipients = (text: string) => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches.map(e => e.toLowerCase())));
  };

  const manualRecipients = parseRecipients(recipientsText);
  // Final recipients is either the selected list members OR the manually typed ones
  const finalRecipients = selectedListId === "manual" ? manualRecipients : listMembers;

  const handleCreateAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !subject.trim() || !html.trim() || finalRecipients.length === 0) {
      setError("Preencha todos os campos e certifique-se de que há destinatários válidos.");
      return;
    }

    setLoading(true);

    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, html, recipients: finalRecipients }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData.error || "Erro ao criar campanha");
      }

      const campaignId = createData.campaignId;

      const sendRes = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST"
      });

      if (!sendRes.ok) {
        const sendData = await sendRes.json();
        throw new Error(sendData.error || "Erro ao iniciar disparo");
      }

      router.push(`/campaigns/${campaignId}`);

    } catch (err: any) {
      setError(err.message || "Erro ao criar e enviar campanha.");
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Criar Nova Campanha</h1>
      </div>

      <div style={{ display: "flex", gap: "24px", flex: 1, minHeight: "600px" }}>
        {/* Editor (Left) */}
        <form onSubmit={handleCreateAndSend} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          
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

          <div className="form-group">
            <label>Nome da Campanha (Interno)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ex: Oferta de Black Friday - Lote 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
              <label>Público-Alvo (Destinatários)</label>
              <span style={{ fontSize: "12px", color: finalRecipients.length > 0 ? "var(--primary)" : "var(--text-muted)", fontWeight: 600 }}>
                {finalRecipients.length} contatos prontos
              </span>
            </div>
            
            <select 
              className="input-field" 
              value={selectedListId} 
              onChange={handleListChange}
              style={{ marginBottom: "12px" }}
            >
              <option value="manual">Colar lista manualmente</option>
              {savedLists.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l._count.members} contatos)</option>
              ))}
            </select>

            {selectedListId === "manual" && (
              <textarea 
                className="input-field" 
                style={{ minHeight: "100px", fontSize: "13px" }}
                placeholder="cliente1@email.com, cliente2@email.com&#10;ou um por linha..."
                value={recipientsText}
                onChange={(e) => setRecipientsText(e.target.value)}
              />
            )}
          </div>

          <div className="form-group">
            <label>Assunto do E-mail</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Temos novidades para você..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Corpo do Email (HTML)</label>
            <textarea 
              className="input-field" 
              style={{ flex: 1, fontFamily: "monospace", fontSize: "13px", minHeight: "200px" }}
              placeholder="<h1>Olá!</h1><p>Insira seu HTML aqui...</p>"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !name || !subject || !html || finalRecipients.length === 0} 
            style={{ alignSelf: "flex-start", marginTop: "8px" }}
          >
            {loading ? "Iniciando disparo..." : (
              <>
                <Send size={18} />
                Iniciar Envio em Massa
              </>
            )}
          </button>
        </form>

        {/* Preview (Right) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500 }}>
            <FileText size={18} />
            Resumo da Campanha
          </div>
          
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Users size={16} color="var(--primary)" />
              <strong>Público:</strong> {finalRecipients.length} destinatários
              {selectedListId !== "manual" && <span style={{ color: "var(--text-muted)" }}> (via lista salva)</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={16} color="var(--primary)" />
              <strong>Ação:</strong> Os e-mails serão processados em pequenos lotes em segundo plano para proteger a reputação do seu domínio.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, marginTop: "8px" }}>
            <Eye size={18} />
            Preview HTML
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
