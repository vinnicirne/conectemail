import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Listar campanhas
export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { recipients: true }
        }
      }
    });

    return NextResponse.json(campaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Criar nova campanha e salvar os contatos (mas não envia ainda)
export async function POST(request: Request) {
  try {
    const { name, subject, html, recipients } = await request.json();

    if (!name || !subject || !html || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Criar a campanha
    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        html,
        status: 'DRAFT'
      }
    });

    // Inserir os destinatários
    // Em SQLite local e batch pequeno, createMany é simulado. Se falhar no SQLite antigo, usar loop.
    // Mas o Prisma V6 suporta createMany no SQLite!
    await prisma.campaignRecipient.createMany({
      data: recipients.map((email: string) => ({
        campaignId: campaign.id,
        email,
        status: 'PENDING'
      }))
    });

    return NextResponse.json({ success: true, campaignId: campaign.id });

  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
  }
}
