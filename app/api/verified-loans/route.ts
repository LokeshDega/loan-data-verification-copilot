import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const verifiedLoans = await db.loanRecord.findMany({
      where: {
        status: 'VERIFIED'
      },
      include: {
        auditLogs: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: {
        verifiedAt: 'desc'
      }
    });

    return NextResponse.json(verifiedLoans);
  } catch (error: any) {
    console.error('Error fetching verified loans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
