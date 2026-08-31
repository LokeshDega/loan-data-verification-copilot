import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const totalLoans = await db.loanRecord.count();
    const pendingReview = await db.loanRecord.count({ where: { status: 'PENDING' } });
    const verifiedLoans = await db.loanRecord.count({ where: { status: 'VERIFIED' } });
    const rejectedLoans = await db.loanRecord.count({ where: { status: 'REJECTED' } });

    // Calculate Data Quality Score
    // Formula: (Number of records without unresolved exceptions / Total records) * 100
    const recordsWithNoExceptions = await db.loanRecord.count({
      where: {
        exceptions: {
          none: {
            resolved: false
          }
        }
      }
    });

    const dataQualityScore = totalLoans > 0 
      ? Math.round((recordsWithNoExceptions / totalLoans) * 100)
      : 0;

    // Get exceptions grouping by type
    const exceptions = await db.exception.findMany({
      where: { resolved: false }
    });

    const exceptionsByType: Record<string, number> = {};
    const exceptionsBySeverity: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    for (const ex of exceptions) {
      exceptionsByType[ex.type] = (exceptionsByType[ex.type] || 0) + 1;
      exceptionsBySeverity[ex.severity] = (exceptionsBySeverity[ex.severity] || 0) + 1;
    }

    // Get uploads history
    const uploadHistory = await db.upload.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 10
    });

    // Get recent reviewer decisions from Audit Logs
    const recentAuditLogs = await db.auditLog.findMany({
      where: {
        action: { in: ['APPROVE', 'REJECT', 'FIELD_EDIT'] }
      },
      include: {
        loanRecord: {
          select: {
            loanId: true,
            borrowerId: true
          }
        },
        user: {
          select: {
            username: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    const recentDecisions = recentAuditLogs.map(log => ({
      id: log.id,
      loanRecordId: log.loanRecordId,
      loanId: log.loanRecord?.loanId || 'N/A',
      borrowerId: log.loanRecord?.borrowerId || 'N/A',
      action: log.action,
      timestamp: log.timestamp,
      details: JSON.parse(log.details),
      user: log.user?.username || 'System'
    }));

    return NextResponse.json({
      totalLoans,
      pendingReview,
      verifiedLoans,
      rejectedLoans,
      dataQualityScore,
      exceptionsByType,
      exceptionsBySeverity,
      uploadHistory,
      recentDecisions
    });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
