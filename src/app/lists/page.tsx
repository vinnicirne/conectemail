"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, Calendar } from "lucide-react";

type ContactList = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    members: number;
  };
};

export default function ListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para criar nova
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      setLists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setCreating(true);

    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewName("");
        setNewDesc("");
        fetchLists();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta lista? Todos os contatos nela serão perdidos.")) return;

    try {
      await fetch(`/api/lists/${id}`, { method: "DELETE" });
      setLists(lists.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-color)" }}>Listas de Contatos</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Gerencie seus públicos-alvo para campanhas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Plus size={20} />
          Nova Lista
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Carregando...</div>
      ) : lists.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "64px 20px" }}>
          <div style={{ display: "inline-flex", background: "rgba(37, 99, 235, 0.1)", padding: "16px", borderRadius: "50%", marginBottom: "16px" }}>
            <Users size={40} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-color)", marginBottom: "8px" }}>Nenhuma lista criada</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Crie sua primeira lista e importe seus contatos.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Criar Lista</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {lists.map(list => (
            <div key={list.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-color)" }}>{list.name}</h3>
                <button 
                  onClick={() => handleDelete(list.id)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  title="Excluir Lista"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {list.description && (
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px", flex: 1 }}>{list.description}</p>
              )}

              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={16} />
                  {list._count.members} contatos
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={16} />
                  {new Date(list.createdAt).toLocaleDateString()}
                </div>
              </div>

              <Link href={`/lists/${list.id}`} className="btn-secondary" style={{ textAlign: "center", width: "100%", justifyContent: "center" }}>
                Gerenciar Lista
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "400px", padding: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Criar Nova Lista</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label>Nome da Lista</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="Ex: Clientes VIP" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea 
                  className="input-field" 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Detalhes sobre a origem desses contatos" 
                  rows={3} 
                />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={!newName || creating}>
                  {creating ? "Criando..." : "Criar Lista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
