import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // "PENDING" | "VERIFIED" | "REJECTED"
    const search = searchParams.get('search'); // loanId or borrowerId
    const hasExceptions = searchParams.get('hasExceptions'); // "true" | "false"

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { loanId: { contains: search } },
        { borrowerId: { contains: search } }
      ];
    }

    if (hasExceptions === 'true') {
      where.exceptions = {
        some: {
          resolved: false
        }
      };
    } else if (hasExceptions === 'false') {
      where.exceptions = {
        none: {
          resolved: false
        }
      };
    }

    const loans = await db.loanRecord.findMany({
      where,
      include: {
        _count: {
          select: {
            exceptions: {
              where: { resolved: false }
            }
          }
        },
        exceptions: {
          where: { resolved: false }
        }
      },
      orderBy: {
        loanId: 'asc'
      }
    });

    // Format output
    const formatted = loans.map(loan => ({
      ...loan,
      exceptionCount: loan._count.exceptions,
      _count: undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
