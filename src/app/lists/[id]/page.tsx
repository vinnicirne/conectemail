"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, FileText, Upload, Trash2, CheckCircle2 } from "lucide-react";

type ContactListMember = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

type ContactList = {
  id: string;
  name: string;
  description: string | null;
  members: ContactListMember[];
};

export default function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);
  const router = useRouter();
  const [list, setList] = useState<ContactList | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"members" | "paste" | "csv">("members");

  // State para colar texto
  const [pastedText, setPastedText] = useState("");
  const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<{ added: number, duplicates: number } | null>(null);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  const fetchList = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (res.ok) {
        setList(await res.json());
      } else {
        router.push("/lists");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);

    // Regex simples para extrair emails
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(regex) || [];
    const uniqueEmails = [...new Set(matches.map(em => em.toLowerCase()))];
    setExtractedEmails(uniqueEmails);
  };

  const handleAddExtracted = async () => {
    if (extractedEmails.length === 0) return;
    setAdding(true);
    setResult(null);

    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: extractedEmails, source: 'manual' })
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ added: data.added, duplicates: data.duplicates });
        setPastedText("");
        setExtractedEmails([]);
        fetchList(); // recarrega a lista
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar contatos");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remover este contato da lista?")) return;

    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: [memberId] })
      });

      if (res.ok) {
        setList(prev => prev ? {
          ...prev,
          members: prev.members.filter(m => m.id !== memberId)
        } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Carregando...</div>;
  if (!list) return null;

  return (
    <div className="animate-fade-in" style={{ padding: "16px 0" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/lists" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "14px", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Voltar para Listas
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-color)" }}>{list.name}</h1>
            {list.description && <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>{list.description}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "14px" }}>
            <Users size={18} />
            <span style={{ fontWeight: 600, color: "var(--text-color)" }}>{list.members.length}</span> contatos
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "1px" }}>
        <button
          onClick={() => setActiveTab("members")}
          style={{
            background: "none", border: "none", padding: "12px 16px", cursor: "pointer", fontSize: "15px", fontWeight: 500,
            color: activeTab === "members" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "members" ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: "-1px"
          }}
        >
          Membros da Lista
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          style={{
            background: "none", border: "none", padding: "12px 16px", cursor: "pointer", fontSize: "15px", fontWeight: 500,
            color: activeTab === "paste" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "paste" ? "2px solid var(--primary)" : "2px solid transparent",
            marginBottom: "-1px"
          }}
        >
          Colar Texto / E-mails
        </button>
      </div>

      {activeTab === "members" && (
        <div className="glass-panel" style={{ padding: "0" }}>
          {list.members.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Esta lista está vazia. Vá para a aba "Colar Texto" para importar contatos.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>E-mail</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>Adicionado em</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, width: "80px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.members.map(member => (
                  <tr key={member.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "16px 24px", color: "var(--text-color)" }}>{member.email}</td>
                    <td style={{ padding: "16px 24px", color: "var(--text-muted)", fontSize: "14px" }}>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}
                        title="Remover Contato"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "paste" && (
        <div className="glass-panel" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Extração Automática</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
            Cole qualquer texto contendo e-mails (pode estar bagunçado, com vírgulas ou textos no meio). O sistema encontrará os e-mails automaticamente.
          </p>

          <textarea
            className="input-field"
            value={pastedText}
            onChange={handleTextChange}
            placeholder="Cole o texto aqui..."
            style={{ width: "100%", height: "200px", fontFamily: "monospace", resize: "vertical", marginBottom: "24px" }}
          />

          {result && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "8px", marginBottom: "24px", color: "var(--success)" }}>
              <CheckCircle2 size={24} />
              <div>
                <strong style={{ display: "block" }}>Importação concluída!</strong>
                <span style={{ fontSize: "14px" }}>{result.added} novos contatos adicionados. {result.duplicates} duplicados ignorados.</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "8px" }}>
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>{extractedEmails.length}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px", marginLeft: "8px" }}>e-mails válidos encontrados</span>
            </div>
            <button
              className="btn-primary"
              onClick={handleAddExtracted}
              disabled={extractedEmails.length === 0 || adding}
            >
              {adding ? "Adicionando..." : "Importar para a Lista"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
