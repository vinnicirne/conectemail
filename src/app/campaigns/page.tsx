"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Megaphone, Calendar, Users, Activity } from "lucide-react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCampaigns(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Rascunho</span>;
      case "SENDING": return <span style={{ background: "#dbeafe", color: "#2563eb", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Enviando</span>;
      case "COMPLETED": return <span style={{ background: "#dcfce3", color: "#16a34a", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Concluída</span>;
      case "FAILED": return <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>Falhou</span>;
      default: return <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{status}</span>;
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Megaphone size={24} color="var(--primary)" />
            Campanhas
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Crie disparos em massa para suas listas de contatos.</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={18} />
          Nova Campanha
        </Link>
      </div>

      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Carregando campanhas...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", border: "1px dashed var(--border-color)", borderRadius: "12px", background: "rgba(255,255,255,0.5)" }}>
            <Megaphone size={48} color="var(--border-color)" style={{ marginBottom: "16px", opacity: 0.5 }} />
            <h3 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "8px" }}>Nenhuma campanha criada</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>Comece enviando seu primeiro e-mail em massa para seus clientes.</p>
            <Link href="/campaigns/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {campaigns.map(campaign => (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div 
                  className="email-card"
                  style={{ 
                    padding: "20px", 
                    background: "#fff", 
                    borderRadius: "12px", 
                    border: "1px solid var(--border-color)",
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    alignItems: "center",
                    gap: "16px"
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{campaign.name}</h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{campaign.subject}</p>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <Users size={16} />
                    {campaign._count?.recipients || 0} contatos
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "14px" }}>
                    <Calendar size={16} />
                    {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {getStatusBadge(campaign.status)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
