import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loanIds } = body; 

    if (!loanIds || !Array.isArray(loanIds) || loanIds.length === 0) {
      return NextResponse.json({ error: 'No loan IDs provided' }, { status: 400 });
    }

    const loans = await db.loanRecord.findMany({
      where: {
        OR: [
          { id: { in: loanIds } },
          { loanId: { in: loanIds } }
        ]
      },
      include: {
        exceptions: {
          where: { resolved: false }
        }
      }
    });

    if (loans.length === 0) {
      return NextResponse.json({ error: 'No matching loan records found' }, { status: 404 });
    }

    const allExceptions: any[] = [];
    const loanSummaryList: any[] = [];

    for (const loan of loans) {
      if (loan.exceptions.length > 0) {
        loanSummaryList.push({
          id: loan.id,
          loanId: loan.loanId,
          borrowerId: loan.borrowerId,
          exceptionCount: loan.exceptions.length,
          exceptions: loan.exceptions.map(e => ({
            type: e.type,
            field: e.field,
            message: e.message,
            severity: e.severity
          }))
        });
        allExceptions.push(...loan.exceptions);
      }
    }

    if (allExceptions.length === 0) {
      return NextResponse.json({
        summary: 'No unresolved exceptions were found in this batch of loans. The selected records appear clean and verified.',
        exceptionCount: 0,
        loanCount: loans.length
      });
    }

    let summary = '';
    let modelUsed = 'Rule-based Batch Analyzer';

    if (geminiApiKey) {
      modelUsed = 'gemini-1.5-flash';
      const promptText = `
        You are a Fintech Senior Loan Auditor and Data Quality Assistant.
        You have been given a batch of loan records that failed automated ingestion validation.
        
        Batch Summary Data:
        - Total selected loans: ${loans.length}
        - Loans with exceptions: ${loanSummaryList.length}
        - Total unresolved exceptions: ${allExceptions.length}
        
        List of loans and their exceptions:
        ${JSON.stringify(loanSummaryList, null, 2)}
        
        Please provide a concise, high-level executive audit summary of this batch (3-5 sentences).
        Your summary must:
        1. Identify the most common types of errors in this batch (e.g. data mismatches, missing documents, date issues).
        2. Identify any systemic issues (e.g., if multiple loans from the same servicer or origination source have the same problem).
        3. Recommend next action items for the Reviewer.
        
        Write in a professional, clear financial audit tone. Output plain text (markdown formats like bolding or bullet points are fine).
      `;

      try {
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({ model: modelUsed });
        const result = await model.generateContent(promptText);
        summary = result.response.text() || '';
      } catch (err: any) {
        console.error('Gemini batch summary failed, falling back to rule-based analysis:', err);
        summary = getRuleBasedBatchSummary(loanSummaryList, allExceptions);
        modelUsed = 'Rule-based Fallback (' + modelUsed + ' failed)';
      }
    } else {
      summary = getRuleBasedBatchSummary(loanSummaryList, allExceptions);
    }

    return NextResponse.json({
      summary,
      exceptionCount: allExceptions.length,
      loanCount: loans.length,
      loansWithExceptionsCount: loanSummaryList.length,
      model: modelUsed,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating batch summary:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function getRuleBasedBatchSummary(loanSummaryList: any[], allExceptions: any[]): string {
  const typeCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const fieldCounts: Record<string, number> = {};

  for (const ex of allExceptions) {
    typeCounts[ex.type] = (typeCounts[ex.type] || 0) + 1;
    severityCounts[ex.severity] = (severityCounts[ex.severity] || 0) + 1;
    fieldCounts[ex.field] = (fieldCounts[ex.field] || 0) + 1;
  }

  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const primaryErrorType = sortedTypes[0] ? sortedTypes[0][0] : 'various data quality violations';
  const primaryErrorCount = sortedTypes[0] ? sortedTypes[0][1] : 0;

  return `Batch Audit Report: Analyzed ${loanSummaryList.length} loans containing ${allExceptions.length} unresolved exceptions (${severityCounts.HIGH} High, ${severityCounts.MEDIUM} Medium, ${severityCounts.LOW} Low severity). The most frequent error type encountered is ${primaryErrorType} (occurring ${primaryErrorCount} times). Reviewers are advised to prioritize resolving the High severity anomalies (such as balance discrepancies or date order failures) before proceeding with final verification.`;
}
