import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resolvedParam = searchParams.get('resolved'); // "true" | "false"
    const severity = searchParams.get('severity'); // "HIGH" | "MEDIUM" | "LOW"
    const type = searchParams.get('type');

    const where: any = {};

    if (resolvedParam === 'true') {
      where.resolved = true;
    } else if (resolvedParam === 'false') {
      where.resolved = false;
    } else {
      // By default, only return unresolved exceptions
      where.resolved = false;
    }

    if (severity) {
      where.severity = severity;
    }

    if (type) {
      where.type = type;
    }

    const exceptions = await db.exception.findMany({
      where,
      include: {
        loanRecord: {
          select: {
            loanId: true,
            borrowerId: true,
            currentBalance: true,
            paymentStatus: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(exceptions);
  } catch (error: any) {
    console.error('Error fetching exceptions list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
