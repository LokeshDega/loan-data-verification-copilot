import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    const loan = await db.loanRecord.findUnique({
      where: { id },
      include: {
        exceptions: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          include: {
            user: {
              select: {
                username: true,
                role: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        },
        aiRecommendations: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan record not found' }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error: any) {
    console.error('Error fetching loan detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
