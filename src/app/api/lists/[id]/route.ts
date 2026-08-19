import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const list = await prisma.contactList.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json({ error: 'Erro ao buscar lista' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.contactList.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Erro ao excluir lista' }, { status: 500 });
  }
}
