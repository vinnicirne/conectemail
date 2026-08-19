import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    const eventType = payload?.type;
    const emailId = payload?.data?.email_id;

    if (!emailId || !eventType) {
      return NextResponse.json({ error: 'Missing email_id or type' }, { status: 400 });
    }

    // Buscamos o email no nosso banco de dados pelo ID do Resend
    const emailRecord = await prisma.email.findUnique({
      where: { resendId: emailId }
    });

    if (!emailRecord) {
      return NextResponse.json({ error: 'Email record not found' }, { status: 404 });
    }

    // Atualizamos o status baseado no evento do Resend
    if (eventType === 'email.delivered') {
      await prisma.email.update({
        where: { id: emailRecord.id },
        data: { status: 'DELIVERED' }
      });
    } else if (eventType === 'email.opened') {
      await prisma.email.update({
        where: { id: emailRecord.id },
        data: { 
          status: 'OPENED',
          openedCount: emailRecord.openedCount + 1,
          lastOpenedAt: new Date()
        }
      });
    } else if (eventType === 'email.bounced') {
      await prisma.email.update({
        where: { id: emailRecord.id },
        data: { status: 'BOUNCED' }
      });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
