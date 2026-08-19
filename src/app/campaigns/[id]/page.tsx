"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

export default function CampaignDetailsPage() {
  const { id } = useParams() as { id: string };
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados
  const fetchCampaign = () => {
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setCampaign(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaign();
    // Se a campanha estiver enviando, faz polling a cada 3 segundos
    const interval = setInterval(() => {
      if (campaign?.status === 'SENDING' || !campaign) {
        fetchCampaign();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, campaign?.status]);

  if (loading && !campaign) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Carregando detalhes...</div>;
  }

  if (!campaign) {
    return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>Campanha não encontrada.</div>;
  }

  const recipients = campaign.recipients || [];
  const total = recipients.length;
  const sent = recipients.filter((r: any) => r.status === 'SENT').length;
  const failed = recipients.filter((r: any) => r.status === 'FAILED').length;
  const pending = recipients.filter((r: any) => r.status === 'PENDING').length;
  const progressPercent = total === 0 ? 0 : Math.round(((sent + failed) / total) * 100);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      
      <div style={{ marginBottom: "24px" }}>
        <Link href="/campaigns" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "14px", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Voltar para Campanhas
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "4px" }}>{campaign.name}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Assunto: {campaign.subject}</p>
          </div>
          <div style={{ 
            background: campaign.status === 'SENDING' ? "#dbeafe" : campaign.status === 'COMPLETED' ? "#dcfce3" : "#f3f4f6",
            color: campaign.status === 'SENDING' ? "#2563eb" : campaign.status === 'COMPLETED' ? "#16a34a" : "#4b5563",
            padding: "6px 12px", borderRadius: "16px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px"
          }}>
            {campaign.status === 'SENDING' && <Loader2 size={16} className="animate-spin" />}
            Status: {campaign.status}
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", fontWeight: 500 }}>
          <span>Progresso do Disparo</span>
          <span>{progressPercent}% ({sent + failed} de {total})</span>
        </div>
        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--primary)", width: `${progressPercent}%`, transition: "width 0.5s ease" }} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <div>
              <div style={{ fontSize: "20px", fontWeight: 600 }}>{sent}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Enviados com sucesso</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <XCircle size={20} color="#dc2626" />
            <div>
              <div style={{ fontSize: "20px", fontWeight: 600 }}>{failed}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Falhas</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="#64748b" />
            <div>
              <div style={{ fontSize: "20px", fontWeight: 600 }}>{pending}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Aguardando na fila</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Destinatários */}
      <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Histórico de Envio</h2>
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-muted)" }}>Destinatário</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-muted)" }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-muted)" }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{r.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  {r.status === 'SENT' && <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={14}/> Enviado</span>}
                  {r.status === 'FAILED' && <span style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={14}/> Falhou</span>}
                  {r.status === 'PENDING' && <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14}/> Na fila</span>}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "13px" }}>
                  {r.error ? r.error : r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Nenhum destinatário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
