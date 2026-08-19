import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { emails, source = 'manual' } = await request.json();
    const { id: listId } = await params;

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Nenhum e-mail fornecido' }, { status: 400 });
    }

    // Verificar se a lista existe
    const list = await prisma.contactList.findUnique({ where: { id: listId } });
    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    // Normalizar e-mails
    const normalizedEmails = [...new Set(emails.map((e: string) => e.toLowerCase().trim()).filter((e: string) => e.includes('@')))];

    // Buscar e-mails que já estão na lista para não duplicar
    const existingMembers = await prisma.contactListMember.findMany({
      where: {
        listId,
        email: { in: normalizedEmails }
      },
      select: { email: true }
    });
    
    const existingEmails = new Set(existingMembers.map(m => m.email));
    const newEmails = normalizedEmails.filter(e => !existingEmails.has(e));

    if (newEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        added: 0, 
        duplicates: normalizedEmails.length,
        message: 'Todos os e-mails já estavam na lista' 
      });
    }

    // Inserir os novos
    await prisma.contactListMember.createMany({
      data: newEmails.map(email => ({
        listId,
        email,
        source
      }))
    });

    return NextResponse.json({ 
      success: true, 
      added: newEmails.length, 
      duplicates: existingEmails.size 
    });
  } catch (error) {
    console.error('Error adding members:', error);
    return NextResponse.json({ error: 'Erro ao adicionar membros' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listId } = await params;
    const { memberIds } = await request.json();

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'IDs não fornecidos' }, { status: 400 });
    }

    await prisma.contactListMember.deleteMany({
      where: {
        listId,
        id: { in: memberIds }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting members:', error);
    return NextResponse.json({ error: 'Erro ao remover membros' }, { status: 500 });
  }
}
