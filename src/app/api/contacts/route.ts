import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    // Buscar emails únicos que já enviamos mensagens (limitado a 20)
    const emails = await prisma.email.findMany({
      where: {
        toAddress: {
          contains: q
        }
      },
      select: {
        toAddress: true
      },
      distinct: ['toAddress'],
      take: 20
    });

    const contacts = emails.map(e => e.toAddress);

    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 });
  }
}
