import { db } from './db';

export interface ValidationException {
  type: string;
  field: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

const DEFAULT_ALLOWED_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const VALID_PAYMENT_STATUSES = [
  'Current', 'Grace Period', 'Late (30-59 days)', 'Late (60-89 days)', 'Default', 'Closed'
];

// Helper to parse dates in YYYY-MM-DD format
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function validateLoanRecord(
  record: any,
  context: {
    existingLoanIds: Set<string>;
    existingBorrowerCombos: Set<string>;
    documentManifest: Record<string, string>;
    servicerUpdates: Record<string, any>;
    rules: {
      interestRateMin?: number;
      interestRateMax?: number;
      allowedStates?: string[];
      requiredFields?: string[];
    };
  }
): ValidationException[] {
  const exceptions: ValidationException[] = [];
  const rules = context.rules;
  const requiredFields = rules.requiredFields || ['loan_id', 'borrower_id', 'original_principal', 'current_balance', 'origination_date'];
  
  // 1. Required fields presence check
  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      exceptions.push({
        type: 'MISSING_FIELD',
        field,
        message: `Required field '${field}' is missing or empty.`,
        severity: 'HIGH',
      });
    }
  }

  // If loan_id is missing, we stop early for identifier errors
  if (!record.loan_id) {
    return exceptions;
  }

  // 2. Duplicate loan ID check
  if (context.existingLoanIds.has(record.loan_id)) {
    exceptions.push({
      type: 'DUPLICATE_RECORD',
      field: 'loan_id',
      message: `Duplicate loan_id '${record.loan_id}' found in the dataset.`,
      severity: 'HIGH',
    });
  } else {
    context.existingLoanIds.add(record.loan_id);
  }

  // 3. Duplicate borrower + loan amount + origination date combination
  if (record.borrower_id && record.original_principal && record.origination_date) {
    const comboKey = `${record.borrower_id}_${record.original_principal}_${record.origination_date}`;
    if (context.existingBorrowerCombos.has(comboKey)) {
      exceptions.push({
        type: 'DUPLICATE_BORROWER_COMBO',
        field: 'borrower_id',
        message: `Suspicious duplicate loan: Borrower ${record.borrower_id} has another loan with the same amount ($${record.original_principal}) and origination date (${record.origination_date}).`,
        severity: 'MEDIUM',
      });
    } else {
      context.existingBorrowerCombos.add(comboKey);
    }
  }

  // 4. Validate numeric values
  const originalPrincipal = parseFloat(record.original_principal);
  const currentBalance = parseFloat(record.current_balance);
  const interestRate = parseFloat(record.interest_rate);
  const termMonths = parseInt(record.term_months, 10);
  const daysPastDue = parseInt(record.days_past_due, 10);

  if (record.original_principal && isNaN(originalPrincipal)) {
    exceptions.push({
      type: 'INVALID_NUMBER',
      field: 'original_principal',
      message: `Original principal value '${record.original_principal}' is not a valid number.`,
      severity: 'HIGH',
    });
  }

  if (record.current_balance && isNaN(currentBalance)) {
    exceptions.push({
      type: 'INVALID_NUMBER',
      field: 'current_balance',
      message: `Current balance value '${record.current_balance}' is not a valid number.`,
      severity: 'HIGH',
    });
  }

  if (record.interest_rate && isNaN(interestRate)) {
    exceptions.push({
      type: 'INVALID_NUMBER',
      field: 'interest_rate',
      message: `Interest rate value '${record.interest_rate}' is not a valid number.`,
      severity: 'HIGH',
    });
  }

  if (record.term_months && isNaN(termMonths)) {
    exceptions.push({
      type: 'INVALID_NUMBER',
      field: 'term_months',
      message: `Term months value '${record.term_months}' is not a valid integer.`,
      severity: 'HIGH',
    });
  }

  if (record.days_past_due && isNaN(daysPastDue)) {
    exceptions.push({
      type: 'INVALID_NUMBER',
      field: 'days_past_due',
      message: `Days past due value '${record.days_past_due}' is not a valid integer.`,
      severity: 'HIGH',
    });
  }

  // 5. Positive principal and balance values
  if (!isNaN(originalPrincipal) && originalPrincipal < 0) {
    exceptions.push({
      type: 'NEGATIVE_VALUE',
      field: 'original_principal',
      message: 'Original principal cannot be negative.',
      severity: 'HIGH',
    });
  }

  if (!isNaN(currentBalance) && currentBalance < 0) {
    exceptions.push({
      type: 'NEGATIVE_VALUE',
      field: 'current_balance',
      message: 'Current balance cannot be negative.',
      severity: 'HIGH',
    });
  }

  // 6. Balance not greater than original principal
  if (!isNaN(originalPrincipal) && !isNaN(currentBalance) && currentBalance > originalPrincipal) {
    exceptions.push({
      type: 'INVALID_BALANCE',
      field: 'current_balance',
      message: `Current balance ($${currentBalance}) cannot exceed original principal ($${originalPrincipal}).`,
      severity: 'HIGH',
    });
  }

  // 7. Interest rate outside expected range
  if (!isNaN(interestRate)) {
    const minRate = rules.interestRateMin ?? 2.0;
    const maxRate = rules.interestRateMax ?? 15.0;
    if (interestRate < minRate || interestRate > maxRate) {
      exceptions.push({
        type: 'OUT_OF_RANGE',
        field: 'interest_rate',
        message: `Interest rate (${interestRate}%) is outside the expected range of ${minRate}% - ${maxRate}%.`,
        severity: 'MEDIUM',
      });
    }
  }

  // 8. Date checks & formats
  const dateFields = ['origination_date', 'maturity_date', 'last_payment_date', 'last_updated_at'];
  const parsedDates: Record<string, Date | null> = {};

  for (const field of dateFields) {
    const val = record[field];
    if (val) {
      // Check if format is YYYY-MM-DD
      const formatRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!formatRegex.test(val)) {
        exceptions.push({
          type: 'INVALID_FORMAT',
          field,
          message: `Date '${val}' must be in YYYY-MM-DD format.`,
          severity: 'MEDIUM',
        });
      }
      
      const parsed = parseDate(val) || new Date(val);
      if (isNaN(parsed.getTime())) {
        exceptions.push({
          type: 'INVALID_DATE',
          field,
          message: `Date value '${val}' is not a valid parseable date.`,
          severity: 'HIGH',
        });
        parsedDates[field] = null;
      } else {
        parsedDates[field] = parsed;
      }
    } else {
      parsedDates[field] = null;
    }
  }

  // 9. Maturity date after origination date
  const origDate = parsedDates['origination_date'];
  const matDate = parsedDates['maturity_date'];
  if (origDate && matDate && matDate.getTime() < origDate.getTime()) {
    exceptions.push({
      type: 'INVALID_DATE_ORDER',
      field: 'maturity_date',
      message: `Maturity date (${record.maturity_date}) cannot be earlier than origination date (${record.origination_date}).`,
      severity: 'HIGH',
    });
  }

  // 10. Valid state codes
  if (record.borrower_state) {
    const allowedStates = rules.allowedStates || DEFAULT_ALLOWED_STATES;
    if (!allowedStates.includes(record.borrower_state.toUpperCase())) {
      exceptions.push({
        type: 'INVALID_STATE',
        field: 'borrower_state',
        message: `Borrower state '${record.borrower_state}' is not a valid US state code.`,
        severity: 'MEDIUM',
      });
    }
  }

  // 11. Valid payment status
  if (record.payment_status && !VALID_PAYMENT_STATUSES.includes(record.payment_status)) {
    exceptions.push({
      type: 'INVALID_STATUS',
      field: 'payment_status',
      message: `Payment status '${record.payment_status}' is invalid. Expected one of: ${VALID_PAYMENT_STATUSES.join(', ')}.`,
      severity: 'MEDIUM',
    });
  }

  // 12. Payment status inconsistent with days past due
  if (record.payment_status && !isNaN(daysPastDue)) {
    if (record.payment_status === 'Current' && daysPastDue > 30) {
      exceptions.push({
        type: 'STATUS_DPD_INCONSISTENCY',
        field: 'payment_status',
        message: `Payment status is 'Current' but days past due is ${daysPastDue}.`,
        severity: 'HIGH',
      });
    } else if (record.payment_status.startsWith('Late') && daysPastDue === 0) {
      exceptions.push({
        type: 'STATUS_DPD_INCONSISTENCY',
        field: 'payment_status',
        message: `Payment status is '${record.payment_status}' but days past due is 0.`,
        severity: 'HIGH',
      });
    }
  }

  // 13. Loans marked closed but showing positive balance
  if (record.payment_status === 'Closed' && !isNaN(currentBalance) && currentBalance > 0) {
    exceptions.push({
      type: 'CLOSED_WITH_BALANCE',
      field: 'current_balance',
      message: `Loan is marked 'Closed' but still has a positive balance of $${currentBalance}.`,
      severity: 'HIGH',
    });
  }

  // 14. Missing document status check from document manifest
  const docStatusFromManifest = context.documentManifest[record.loan_id];
  if (!docStatusFromManifest || docStatusFromManifest.toLowerCase() !== 'complete') {
    exceptions.push({
      type: 'MISSING_DOCUMENTATION',
      field: 'document_status',
      message: `Required document manifest status is missing or incomplete (Current: '${docStatusFromManifest || 'None'}').`,
      severity: 'MEDIUM',
    });
  }

  // 15. Stale record detection (updated older than 180 days ago)
  const lastUpdated = parsedDates['last_updated_at'];
  if (lastUpdated) {
    const daysSinceUpdate = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 180) {
      exceptions.push({
        type: 'STALE_RECORD',
        field: 'last_updated_at',
        message: `Record has not been updated in ${Math.floor(daysSinceUpdate)} days (Last updated: ${record.last_updated_at}).`,
        severity: 'LOW',
      });
    }
  }

  // 16. Conflicting values between loan tape and servicer updates
  const servicerUpdate = context.servicerUpdates[record.loan_id];
  if (servicerUpdate) {
    const fieldsToCompare = ['current_balance', 'payment_status', 'interest_rate'];
    for (const f of fieldsToCompare) {
      if (servicerUpdate[f] !== undefined && servicerUpdate[f] !== '' && record[f] !== undefined) {
        // Handle floating point comparison
        let hasConflict = false;
        if (f === 'current_balance' || f === 'interest_rate') {
          hasConflict = Math.abs(parseFloat(servicerUpdate[f]) - parseFloat(record[f])) > 0.01;
        } else {
          hasConflict = servicerUpdate[f] !== record[f];
        }

        if (hasConflict) {
          exceptions.push({
            type: 'SOURCE_CONFLICT',
            field: f,
            message: `Conflict between sources: Tape has ${f}='${record[f]}' but Servicer Update has ${f}='${servicerUpdate[f]}'.`,
            severity: 'HIGH',
          });
        }
      }
    }
  }

  return exceptions;
}

// Generate record hash to maintain traceability/data integrity (SHA-256)
export async function generateRecordHash(record: any): Promise<string> {
  const fieldsToHash = [
    record.loanId,
    record.borrowerId,
    record.loanType,
    record.originationDate,
    record.maturityDate,
    record.originalPrincipal?.toString(),
    record.currentBalance?.toString(),
    record.interestRate?.toString(),
    record.termMonths?.toString(),
    record.borrowerState,
    record.paymentStatus,
    record.daysPastDue?.toString(),
    record.servicerName,
    record.documentStatus
  ].join('|');

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(fieldsToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback Node-specific crypto if Web Crypto is not available (e.g. backend test)
    const { createHash } = await import('crypto');
    return createHash('sha256').update(fieldsToHash).digest('hex');
  }
}
