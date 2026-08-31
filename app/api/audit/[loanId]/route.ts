import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, props: { params: Promise<{ loanId: string }> }) {
  try {
    const params = await props.params;
    const { loanId } = params;

    const loan = await db.loanRecord.findFirst({
      where: {
        OR: [
          { id: loanId },
          { loanId: loanId }
        ]
      },
      select: {
        id: true,
        loanId: true,
        borrowerId: true,
        status: true
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan record not found' }, { status: 404 });
    }

    const auditLogs = await db.auditLog.findMany({
      where: {
        loanRecordId: loan.id
      },
      include: {
        user: {
          select: {
            username: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    return NextResponse.json({
      loan: {
        id: loan.id,
        loanId: loan.loanId,
        borrowerId: loan.borrowerId,
        status: loan.status
      },
      auditLogs
    });
  } catch (error: any) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
