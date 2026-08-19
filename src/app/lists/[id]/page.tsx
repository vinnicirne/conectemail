"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trash2, CheckCircle2, UserPlus, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";

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

type Tab = "members" | "single" | "paste" | "excel";

export default function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: listId } = use(params);
  const router = useRouter();
  const [list, setList] = useState<ContactList | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("members");

  // --- Contato único ---
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [addingSingle, setAddingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState<string | null>(null);

  // --- Colar texto ---
  const [pastedText, setPastedText] = useState("");
  const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<{ added: number; duplicates: number } | null>(null);

  // --- Excel ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelEmails, setExcelEmails] = useState<string[]>([]);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [addingExcel, setAddingExcel] = useState(false);
  const [excelResult, setExcelResult] = useState<{ added: number; duplicates: number } | null>(null);

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

  // ─── Adicionar contato único ──────────────────────────────────────────────
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail.trim()) return;
    setAddingSingle(true);
    setSingleResult(null);

    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [singleEmail.trim()], source: "manual" }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.added > 0) {
          setSingleResult("success");
        } else {
          setSingleResult("duplicate");
        }
        setSingleName("");
        setSingleEmail("");
        fetchList();
      } else {
        setSingleResult("error");
      }
    } catch {
      setSingleResult("error");
    } finally {
      setAddingSingle(false);
    }
  };

  // ─── Colar texto ─────────────────────────────────────────────────────────
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(regex) || [];
    setExtractedEmails([...new Set(matches.map((em) => em.toLowerCase()))]);
  };

  const handleAddExtracted = async () => {
    if (extractedEmails.length === 0) return;
    setAdding(true);
    setResult(null);
    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: extractedEmails, source: "manual" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ added: data.added, duplicates: data.duplicates });
        setPastedText("");
        setExtractedEmails([]);
        fetchList();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  // ─── Excel ────────────────────────────────────────────────────────────────
  const handleExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    setExcelResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Extrai todos os e-mails de qualquer célula da planilha
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const found: string[] = [];
        rows.forEach((row) => {
          row.forEach((cell) => {
            if (cell) {
              const matches = String(cell).match(emailRegex) || [];
              matches.forEach((m) => found.push(m.toLowerCase()));
            }
          });
        });
        setExcelEmails([...new Set(found)]);
      } catch {
        alert("Erro ao ler o arquivo. Certifique-se de que é um arquivo Excel válido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportExcel = async () => {
    if (excelEmails.length === 0) return;
    setAddingExcel(true);
    setExcelResult(null);
    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: excelEmails, source: "csv" }),
      });
      const data = await res.json();
      if (res.ok) {
        setExcelResult({ added: data.added, duplicates: data.duplicates });
        setExcelEmails([]);
        setExcelFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchList();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingExcel(false);
    }
  };

  // ─── Remover membro ───────────────────────────────────────────────────────
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remover este contato da lista?")) return;
    try {
      const res = await fetch(`/api/lists/${listId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: [memberId] }),
      });
      if (res.ok) {
        setList((prev) =>
          prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : null
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Carregando...</div>;
  if (!list) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "members", label: `Membros (${list.members.length})`, icon: <Users size={15} /> },
    { key: "single", label: "Contato Único", icon: <UserPlus size={15} /> },
    { key: "paste", label: "Colar Texto / E-mails", icon: <FileText size={15} /> },
    { key: "excel", label: "Importar Excel", icon: <FileSpreadsheet size={15} /> },
  ];

  const tabStyle = (key: Tab) => ({
    background: "none",
    border: "none",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: activeTab === key ? "var(--primary)" : "var(--text-muted)",
    borderBottom: activeTab === key ? "2px solid var(--primary)" : "2px solid transparent",
    marginBottom: "-1px",
  } as React.CSSProperties);

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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "1px", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Membros ── */}
      {activeTab === "members" && (
        <div className="glass-panel" style={{ padding: "0" }}>
          {list.members.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Esta lista está vazia. Use uma das outras abas para importar contatos.
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
                {list.members.map((member) => (
                  <tr key={member.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "16px 24px", color: "var(--text-color)" }}>{member.email}</td>
                    <td style={{ padding: "16px 24px", color: "var(--text-muted)", fontSize: "14px" }}>
                      {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button onClick={() => handleRemoveMember(member.id)} style={{ background: "none", border: "none", color: "var(--danger, #ef4444)", cursor: "pointer" }} title="Remover">
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

      {/* ── Contato Único ── */}
      {activeTab === "single" && (
        <div className="glass-panel" style={{ padding: "32px", maxWidth: "480px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Adicionar Contato Único</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
            Adicione um contato manualmente pelo e-mail.
          </p>
          <form onSubmit={handleAddSingle} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label>Nome (opcional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: João Silva"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>E-mail *</label>
              <input
                type="email"
                className="input-field"
                placeholder="contato@empresa.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                required
              />
            </div>

            {singleResult === "success" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "14px" }}>
                <CheckCircle2 size={18} /> Contato adicionado com sucesso!
              </div>
            )}
            {singleResult === "duplicate" && (
              <div style={{ color: "#f59e0b", fontSize: "14px" }}>⚠️ Este e-mail já está na lista.</div>
            )}
            {singleResult === "error" && (
              <div style={{ color: "#ef4444", fontSize: "14px" }}>❌ Erro ao adicionar contato.</div>
            )}

            <button type="submit" className="btn-primary" disabled={addingSingle} style={{ alignSelf: "flex-start" }}>
              <UserPlus size={16} />
              {addingSingle ? "Adicionando..." : "Adicionar Contato"}
            </button>
          </form>
        </div>
      )}

      {/* ── Colar Texto ── */}
      {activeTab === "paste" && (
        <div className="glass-panel" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Extração Automática de Texto</h2>
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "8px", marginBottom: "24px", color: "#10b981" }}>
              <CheckCircle2 size={24} />
              <div>
                <strong style={{ display: "block" }}>Importação concluída!</strong>
                <span style={{ fontSize: "14px" }}>{result.added} novos contatos adicionados. {result.duplicates} duplicados ignorados.</span>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.03)", padding: "16px", borderRadius: "8px" }}>
            <div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>{extractedEmails.length}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px", marginLeft: "8px" }}>e-mails válidos encontrados</span>
            </div>
            <button className="btn-primary" onClick={handleAddExtracted} disabled={extractedEmails.length === 0 || adding}>
              {adding ? "Adicionando..." : "Importar para a Lista"}
            </button>
          </div>
        </div>
      )}

      {/* ── Excel ── */}
      {activeTab === "excel" && (
        <div className="glass-panel" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Importar de Excel</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
            Faça upload de um arquivo <strong>.xlsx</strong> ou <strong>.xls</strong>. O sistema vai varrer todas as células e extrair os e-mails encontrados automaticamente.
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--border-color)",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: "24px",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
          >
            <FileSpreadsheet size={40} style={{ color: "var(--primary)", marginBottom: "12px" }} />
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>
              {excelFileName ? excelFileName : "Clique para selecionar o arquivo"}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              {excelFileName ? `${excelEmails.length} e-mails encontrados` : "Suporta .xlsx e .xls"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleExcelFile}
            />
          </div>

          {excelResult && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(16, 185, 129, 0.1)", padding: "16px", borderRadius: "8px", marginBottom: "24px", color: "#10b981" }}>
              <CheckCircle2 size={24} />
              <div>
                <strong style={{ display: "block" }}>Importação concluída!</strong>
                <span style={{ fontSize: "14px" }}>{excelResult.added} novos contatos adicionados. {excelResult.duplicates} duplicados ignorados.</span>
              </div>
            </div>
          )}

          {excelEmails.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.03)", padding: "16px", borderRadius: "8px" }}>
              <div>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>{excelEmails.length}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "14px", marginLeft: "8px" }}>e-mails únicos prontos para importar</span>
              </div>
              <button className="btn-primary" onClick={handleImportExcel} disabled={addingExcel}>
                <FileSpreadsheet size={16} />
                {addingExcel ? "Importando..." : "Importar para a Lista"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
