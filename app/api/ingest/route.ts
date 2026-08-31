import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateLoanRecord, generateRecordHash } from '@/lib/validation';
import Papa from 'papaparse';

// Seed mock users if database is empty
async function ensureUsersSeeded() {
  const count = await db.user.count();
  if (count === 0) {
    await db.user.createMany({
      data: [
        { id: 'usr-1', username: 'alice_operator', role: 'OPERATOR' },
        { id: 'usr-2', username: 'bob_reviewer', role: 'REVIEWER' },
        { id: 'usr-3', username: 'charlie_consumer', role: 'CONSUMER' }
      ]
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUsersSeeded();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const sourceType = formData.get('sourceType') as string; // "LOAN_TAPE" | "SERVICER_UPDATE" | "DOCUMENT_MANIFEST"
    const userId = (formData.get('userId') as string) || 'usr-1';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!['LOAN_TAPE', 'SERVICER_UPDATE', 'DOCUMENT_MANIFEST'].includes(sourceType)) {
      return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV', details: parsed.errors }, { status: 400 });
    }

    const rowCount = parsed.data.length;

    // Create an Upload record
    const upload = await db.upload.create({
      data: {
        filename: file.name,
        rowCount,
        status: 'PENDING',
        sourceType,
      },
    });

    // We fetch validation rules (validation_rules.json) if available
    let rules: any = {};
    try {
      const rulesData = await db.upload.findFirst({
        where: { sourceType: 'VALIDATION_RULES' },
        orderBy: { uploadedAt: 'desc' }
      });
      if (rulesData) {
        // rules = JSON.parse(rulesData.payload);
      }
    } catch (e) {}

    // Load context for validation
    // Fetch all existing loan ids in the database to prevent duplicate ingestion key collisions
    const existingLoans = await db.loanRecord.findMany({ select: { loanId: true, borrowerId: true, originalPrincipal: true, originationDate: true } });
    const existingLoanIds = new Set(existingLoans.map(l => l.loanId));
    const existingBorrowerCombos = new Set(
      existingLoans.map(l => `${l.borrowerId}_${l.originalPrincipal}_${l.originationDate}`)
    );

    // Document manifest caching
    const documentManifest: Record<string, string> = {};
    // Load existing document manifest data from database
    const existingManifestUploads = await db.upload.findMany({
      where: { sourceType: 'DOCUMENT_MANIFEST' },
      include: { records: true }
    });
    for (const u of existingManifestUploads) {
      for (const r of u.records) {
        documentManifest[r.loanId] = r.documentStatus;
      }
    }

    // Servicer updates caching
    const servicerUpdates: Record<string, any> = {};
    // Load existing servicer updates
    const existingServicerUploads = await db.upload.findMany({
      where: { sourceType: 'SERVICER_UPDATE' },
      include: { records: true }
    });
    for (const u of existingServicerUploads) {
      for (const r of u.records) {
        servicerUpdates[r.loanId] = {
          current_balance: r.currentBalance,
          payment_status: r.paymentStatus,
          interest_rate: r.interestRate
        };
      }
    }

    if (sourceType === 'LOAN_TAPE') {
      // Ingesting primary loan records
      for (const row of parsed.data as any[]) {
        const loanId = row.loan_id || `TEMP-${Math.random().toString(36).substr(2, 9)}`;
        const originalPrincipal = parseFloat(row.original_principal) || 0;
        const currentBalance = parseFloat(row.current_balance) || 0;
        const interestRate = parseFloat(row.interest_rate) || 0;
        const termMonths = parseInt(row.term_months, 10) || 0;
        const daysPastDue = parseInt(row.days_past_due, 10) || 0;

        // Run validation
        const exceptions = validateLoanRecord(row, {
          existingLoanIds,
          existingBorrowerCombos,
          documentManifest,
          servicerUpdates,
          rules,
        });

        // Store Record
        const record = await db.loanRecord.create({
          data: {
            loanId: row.loan_id || '',
            borrowerId: row.borrower_id || '',
            loanType: row.loan_type || '',
            originationDate: row.origination_date || '',
            maturityDate: row.maturity_date || '',
            originalPrincipal,
            currentBalance,
            interestRate,
            termMonths,
            borrowerState: row.borrower_state || '',
            loanPurpose: row.loan_purpose || '',
            creditGrade: row.credit_grade || '',
            employmentLength: row.employment_length || '',
            incomeBand: row.income_band || '',
            paymentStatus: row.payment_status || '',
            daysPastDue,
            servicerName: row.servicer_name || '',
            lastPaymentDate: row.last_payment_date || '',
            lastUpdatedAt: row.last_updated_at || '',
            documentStatus: documentManifest[row.loan_id] || 'Missing',
            sourceSystem: row.source_system || 'TapeUpload',
            status: 'PENDING',
            hash: '', // generated on verification
            uploadId: upload.id,
          },
        });

        // Store Exceptions
        if (exceptions.length > 0) {
          await db.exception.createMany({
            data: exceptions.map(ex => ({
              loanRecordId: record.id,
              type: ex.type,
              field: ex.field,
              message: ex.message,
              severity: ex.severity,
            })),
          });
        }

        // Log Ingestion Audit
        await db.auditLog.create({
          data: {
            loanRecordId: record.id,
            action: 'UPLOAD',
            details: JSON.stringify({
              uploadId: upload.id,
              sourceFile: file.name,
              exceptionCount: exceptions.length,
            }),
            userId,
          },
        });
      }
    } else if (sourceType === 'DOCUMENT_MANIFEST') {
      // Ingesting document statuses
      for (const row of parsed.data as any[]) {
        const loanId = row.loan_id;
        const docStatus = row.document_status || 'Missing';

        if (!loanId) continue;

        // Check if we have active loan tape records with this loanId
        const activeRecords = await db.loanRecord.findMany({
          where: { loanId, status: 'PENDING' },
          include: { exceptions: true }
        });

        for (const record of activeRecords) {
          // Update record document status
          await db.loanRecord.update({
            where: { id: record.id },
            data: { documentStatus: docStatus }
          });

          // Check if there was a MISSING_DOCUMENTATION exception
          const hasDocEx = record.exceptions.find(e => e.type === 'MISSING_DOCUMENTATION');
          if (docStatus.toLowerCase() === 'complete' && hasDocEx) {
            // Resolve this exception
            await db.exception.update({
              where: { id: hasDocEx.id },
              data: { resolved: true, resolvedAt: new Date(), resolvedBy: 'System' }
            });
          } else if (docStatus.toLowerCase() !== 'complete' && !hasDocEx) {
            // Create a new exception
            await db.exception.create({
              data: {
                loanRecordId: record.id,
                type: 'MISSING_DOCUMENTATION',
                field: 'document_status',
                message: `Required document manifest status is missing or incomplete (Current: '${docStatus}').`,
                severity: 'MEDIUM',
              }
            });
          }

          await db.auditLog.create({
            data: {
              loanRecordId: record.id,
              action: 'FIELD_EDIT',
              details: JSON.stringify({
                field: 'document_status',
                oldValue: record.documentStatus,
                newValue: docStatus,
                trigger: 'Document Manifest Ingestion'
              }),
              userId,
            }
          });
        }
      }
    } else if (sourceType === 'SERVICER_UPDATE') {
      // Ingesting servicer updates
      for (const row of parsed.data as any[]) {
        const loanId = row.loan_id;
        if (!loanId) continue;

        const activeRecords = await db.loanRecord.findMany({
          where: { loanId, status: 'PENDING' },
          include: { exceptions: true }
        });

        for (const record of activeRecords) {
          // Check for conflicts
          const fields = ['current_balance', 'payment_status', 'interest_rate'];
          for (const f of fields) {
            let recordVal: any;
            let rowVal: any;
            let fieldMapName: string;

            if (f === 'current_balance') {
              recordVal = record.currentBalance;
              rowVal = parseFloat(row.current_balance);
              fieldMapName = 'currentBalance';
            } else if (f === 'interest_rate') {
              recordVal = record.interestRate;
              rowVal = parseFloat(row.interest_rate);
              fieldMapName = 'interestRate';
            } else {
              recordVal = record.paymentStatus;
              rowVal = row.payment_status;
              fieldMapName = 'paymentStatus';
            }

            if (rowVal !== undefined && !isNaN(rowVal) && rowVal !== '') {
              let hasConflict = false;
              if (f === 'current_balance' || f === 'interest_rate') {
                hasConflict = Math.abs(recordVal - rowVal) > 0.01;
              } else {
                hasConflict = recordVal !== rowVal;
              }

              if (hasConflict) {
                // Check if a SOURCE_CONFLICT exception already exists for this field
                const exists = record.exceptions.find(e => e.type === 'SOURCE_CONFLICT' && e.field === f);
                if (!exists) {
                  await db.exception.create({
                    data: {
                      loanRecordId: record.id,
                      type: 'SOURCE_CONFLICT',
                      field: f,
                      message: `Conflict between sources: Tape has ${f}='${recordVal}' but Servicer Update has ${f}='${rowVal}'.`,
                      severity: 'HIGH',
                    }
                  });
                }
              }
            }
          }

          await db.auditLog.create({
            data: {
              loanRecordId: record.id,
              action: 'FIELD_EDIT',
              details: JSON.stringify({
                trigger: 'Servicer Update Ingestion',
                update: row,
              }),
              userId,
            }
          });
        }
      }
    }

    // Mark upload as PROCESSED
    await db.upload.update({
      where: { id: upload.id },
      data: { status: 'PROCESSED' },
    });

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      rowCount,
      message: `Successfully processed ${rowCount} rows for source type: ${sourceType}.`,
    });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await db.exception.deleteMany({});
    await db.auditLog.deleteMany({});
    await db.aIRecommendation.deleteMany({});
    await db.loanRecord.deleteMany({});
    await db.upload.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully. Ready for fresh uploads.'
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
