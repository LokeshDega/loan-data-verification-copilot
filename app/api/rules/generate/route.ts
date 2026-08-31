import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ruleDescription } = body;

    if (!ruleDescription || typeof ruleDescription !== 'string') {
      return NextResponse.json({ error: 'No rule description provided' }, { status: 400 });
    }

    let jsonRule: Record<string, any> = {};
    let testCode = '';
    let explanation = '';
    let modelName = 'Rule-based Generator Fallback';

    if (geminiApiKey) {
      modelName = 'gemini-1.5-flash';
      const promptText = `
        You are a Fintech QA Engineer. Your job is to translate a natural language loan validation rule into a structured JSON schema configuration and a TypeScript unit test case.
        
        Natural Language business rule:
        "${ruleDescription}"
        
        LoanRecord interface properties:
        - loanId: string
        - borrowerId: string
        - loanType: string (e.g. "Fixed", "ARM", "FHA", "VA")
        - originationDate: string (YYYY-MM-DD)
        - maturityDate: string (YYYY-MM-DD)
        - originalPrincipal: number
        - currentBalance: number
        - interestRate: number (percentage, e.g. 5.25)
        - termMonths: number
        - borrowerState: string (US state code, e.g. "NY")
        - paymentStatus: string (e.g. "Current", "Late (30-59 days)", "Closed")
        - daysPastDue: number
        - servicerName: string
        - documentStatus: string (e.g. "Complete", "Missing")
        
        Please generate:
        1. A structured JSON representation of the validation parameters.
        2. A Jest/Vitest TypeScript unit test case that mocks a record violating this rule and asserts the validation function returns an exception.
        3. A plain English explanation of how this rule should be evaluated.
        
        Your response must be a valid JSON with the following structure:
        {
          "jsonRule": {
            "ruleName": "Name of rule",
            "conditions": {
              "field": "interestRate",
              "operator": "lessThanOrEqual",
              "value": 10.0
            }
          },
          "testCode": "// Write complete TypeScript unit test block here",
          "explanation": "Plain English explanation here"
        }
        Do not return any markdown formatting outside of the JSON block.
      `;

      try {
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const model = ai.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await model.generateContent(promptText);
        const text = result.response.text() || '';
        const parsed = JSON.parse(text.trim());
        jsonRule = parsed.jsonRule;
        testCode = parsed.testCode;
        explanation = parsed.explanation;
      } catch (err: any) {
        console.error('Gemini rule generation failed, using fallback template:', err);
        const fallback = getFallbackRule(ruleDescription);
        jsonRule = fallback.jsonRule;
        testCode = fallback.testCode;
        explanation = fallback.explanation;
        modelName = 'Fallback (Gemini errored)';
      }
    } else {
      const fallback = getFallbackRule(ruleDescription);
      jsonRule = fallback.jsonRule;
      testCode = fallback.testCode;
      explanation = fallback.explanation;
    }

    return NextResponse.json({
      ruleDescription,
      jsonRule,
      testCode,
      explanation,
      model: modelName,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating rule:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function getFallbackRule(ruleDescription: string) {
  const descLower = ruleDescription.toLowerCase();
  let field = 'interestRate';
  let operator = 'lessThanOrEqual';
  let value: any = 10.0;

  if (descLower.includes('state')) {
    field = 'borrowerState';
    operator = 'in';
    value = ['NY', 'CA', 'TX'];
  } else if (descLower.includes('balance') || descLower.includes('principal')) {
    field = 'currentBalance';
    operator = 'lessThanOrEqual';
    value = 'originalPrincipal';
  }

  const jsonRule = {
    ruleName: ruleDescription.substring(0, 40) + '...',
    conditions: {
      field,
      operator,
      value
    }
  };

  const testCode = `import { validateLoanRecord } from '@/lib/validation';

describe('Custom Validation Rule: ${jsonRule.ruleName}', () => {
  it('should flag records that violate the custom rule constraint', () => {
    const invalidRecord = {
      loan_id: 'LN-TEST-RULE',
      borrower_id: 'BW-TEST',
      ${field === 'borrowerState' ? 'borrower_state: "XX"' : field === 'interestRate' ? 'interest_rate: 99.9' : 'current_balance: 500000, original_principal: 100000'}
    };
    
    // Evaluate rule constraints
    const exceptions = validateLoanRecord(invalidRecord, {
      existingLoanIds: new Set(),
      existingBorrowerCombos: new Set(),
      documentManifest: {},
      servicerUpdates: {},
      rules: {
        customRules: [${JSON.stringify(jsonRule, null, 2)}]
      }
    });
    
    expect(exceptions.length).toBeGreaterThan(0);
    expect(exceptions.some(e => e.field === '${field === 'borrowerState' ? 'borrower_state' : field === 'interestRate' ? 'interest_rate' : 'current_balance'}')).toBe(true);
  });
});`;

  return {
    jsonRule,
    testCode,
    explanation: `Evaluates if the record property '${field}' satisfies the operator '${operator}' with constraint value '${value}' as implied by the rule: "${ruleDescription}".`
  };
}
