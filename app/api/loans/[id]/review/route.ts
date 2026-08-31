import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRecordHash } from '@/lib/validation';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { action, fields, reviewerNotes, userId } = body; 
    // action: "APPROVE" | "REJECT" | "UPDATE_FIELDS"
    // fields: Record<string, any> (key value pair of fields to update)
    // reviewerNotes: string
    // userId: string (e.g. 'usr-2' for Bob Reviewer)

    const actorId = userId || 'usr-2';

    const record = await db.loanRecord.findUnique({
      where: { id },
      include: { exceptions: true }
    });

    if (!record) {
      return NextResponse.json({ error: 'Loan record not found' }, { status: 404 });
    }

    if (action === 'UPDATE_FIELDS') {
      if (!fields || Object.keys(fields).length === 0) {
        return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
      }

      // We will perform updates in a transaction
      const updatedRecord = await db.$transaction(async (tx) => {
        // Build update object
        const updateData: any = {};
        const fieldAuditDetails: any[] = [];

        for (const [key, value] of Object.entries(fields)) {
          // Mapping camelCase schema to snake_case equivalent if necessary
          // Note: our schema uses camelCase: loanId, borrowerId, originalPrincipal, currentBalance...
          let dbField = key;
          let oldValue = (record as any)[dbField];
          let newValue: any = value;

          // Convert value to appropriate type
          if (dbField === 'originalPrincipal' || dbField === 'currentBalance' || dbField === 'interestRate') {
            newValue = parseFloat(value as any);
          } else if (dbField === 'termMonths' || dbField === 'daysPastDue') {
            newValue = parseInt(value as any, 10);
          }

          updateData[dbField] = newValue;
          fieldAuditDetails.push({ field: dbField, oldValue: String(oldValue), newValue: String(newValue) });

          // Auto-resolve any exception matching this field
          // We map database field to exception field (usually matching, e.g. 'current_balance' or 'currentBalance')
          const matchingEx = record.exceptions.find(ex => 
            ex.field === dbField || 
            ex.field.replace(/_([a-z])/g, (g) => g[1].toUpperCase()) === dbField ||
            dbField.replace(/([A-Z])/g, "_$1").toLowerCase() === ex.field
          );

          if (matchingEx && !matchingEx.resolved) {
            await tx.exception.update({
              where: { id: matchingEx.id },
              data: {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: actorId
              }
            });
          }
        }

        if (reviewerNotes) {
          updateData.reviewerNotes = reviewerNotes;
        }

        const updated = await tx.loanRecord.update({
          where: { id },
          data: updateData,
          include: { exceptions: true }
        });

        // Write Audit Logs
        for (const audit of fieldAuditDetails) {
          await tx.auditLog.create({
            data: {
              loanRecordId: id,
              action: 'FIELD_EDIT',
              details: JSON.stringify(audit),
              userId: actorId,
            }
          });
        }

        if (reviewerNotes) {
          await tx.auditLog.create({
            data: {
              loanRecordId: id,
              action: 'COMMENT',
              details: JSON.stringify({ comment: reviewerNotes }),
              userId: actorId,
            }
          });
        }

        return updated;
      });

      return NextResponse.json({ success: true, record: updatedRecord });
    }

    if (action === 'APPROVE') {
      // Check if there are unresolved exceptions
      const unresolvedExceptions = record.exceptions.filter(ex => !ex.resolved);
      
      const approvedRecord = await db.$transaction(async (tx) => {
        // Resolve all remaining exceptions automatically on approval
        for (const ex of unresolvedExceptions) {
          await tx.exception.update({
            where: { id: ex.id },
            data: {
              resolved: true,
              resolvedAt: new Date(),
              resolvedBy: actorId
            }
          });
        }

        // Fetch temporary record update to calculate hash
        const tempRecord = { ...record, status: 'VERIFIED' };
        if (reviewerNotes) tempRecord.reviewerNotes = reviewerNotes;
        const hash = await generateRecordHash(tempRecord);

        const updated = await tx.loanRecord.update({
          where: { id },
          data: {
            status: 'VERIFIED',
            hash,
            verifiedAt: new Date(),
            verifiedBy: actorId,
            reviewerNotes: reviewerNotes || record.reviewerNotes
          },
          include: { exceptions: true }
        });

        // Audit logs
        await tx.auditLog.create({
          data: {
            loanRecordId: id,
            action: 'APPROVE',
            details: JSON.stringify({ hash, automaticallyResolvedCount: unresolvedExceptions.length }),
            userId: actorId,
          }
        });

        return updated;
      });

      return NextResponse.json({ success: true, record: approvedRecord });
    }

    if (action === 'REJECT') {
      const rejectedRecord = await db.$transaction(async (tx) => {
        const updated = await tx.loanRecord.update({
          where: { id },
          data: {
            status: 'REJECTED',
            verifiedAt: new Date(),
            verifiedBy: actorId,
            reviewerNotes: reviewerNotes || record.reviewerNotes
          },
          include: { exceptions: true }
        });

        // Audit logs
        await tx.auditLog.create({
          data: {
            loanRecordId: id,
            action: 'REJECT',
            details: JSON.stringify({ reason: reviewerNotes || 'Rejected by reviewer' }),
            userId: actorId,
          }
        });

        return updated;
      });

      return NextResponse.json({ success: true, record: rejectedRecord });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error during review action:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
