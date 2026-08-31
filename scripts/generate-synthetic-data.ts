import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data');

// Ensure the directory exists
if (!fs.existsSync(PUBLIC_DATA_DIR)) {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
}

// Generate users.json
const users = [
  { id: 'usr-1', username: 'alice_operator', role: 'OPERATOR', name: 'Alice Smith' },
  { id: 'usr-2', username: 'bob_reviewer', role: 'REVIEWER', name: 'Bob Jones' },
  { id: 'usr-3', username: 'charlie_consumer', role: 'CONSUMER', name: 'Charlie Brown' }
];
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'users.json'), JSON.stringify(users, null, 2));

// Generate validation_rules.json
const validationRules = {
  interestRateMin: 2.0,
  interestRateMax: 15.0,
  allowedStates: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
  requiredFields: ['loan_id', 'borrower_id', 'loan_type', 'origination_date', 'original_principal', 'current_balance', 'interest_rate', 'term_months', 'borrower_state', 'payment_status']
};
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'validation_rules.json'), JSON.stringify(validationRules, null, 2));

// Helper to format date
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generate CSV rows
interface LoanRecordData {
  loan_id: string;
  borrower_id: string;
  loan_type: string;
  origination_date: string;
  maturity_date: string;
  original_principal: string;
  current_balance: string;
  interest_rate: string;
  term_months: string;
  borrower_state: string;
  loan_purpose: string;
  credit_grade: string;
  employment_length: string;
  income_band: string;
  payment_status: string;
  days_past_due: string;
  servicer_name: string;
  last_payment_date: string;
  last_updated_at: string;
  document_status: string;
  source_system: string;
}

function writeCsv(filename: string, headers: string[], rows: string[][]) {
  const content = [headers.join(','), ...rows.map(r => r.map(val => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(','))].join('\n');
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, filename), content);
}

const headers = [
  'loan_id', 'borrower_id', 'loan_type', 'origination_date', 'maturity_date',
  'original_principal', 'current_balance', 'interest_rate', 'term_months',
  'borrower_state', 'loan_purpose', 'credit_grade', 'employment_length',
  'income_band', 'payment_status', 'days_past_due', 'servicer_name',
  'last_payment_date', 'last_updated_at', 'document_status', 'source_system'
];

const loanTapeRows: string[][] = [];
const servicerUpdateRows: string[][] = [];
const documentManifestRows: string[][] = [['loan_id', 'document_status']];

const states = ['NY', 'CA', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'XX']; // XX is invalid
const loanTypes = ['Fixed', 'ARM', 'FHA', 'VA'];
const loanPurposes = ['Purchase', 'Refinance', 'DebtConsolidation'];
const creditGrades = ['A', 'B', 'C', 'D', 'E', 'F', 'HR'];
const employmentLengths = ['< 1 year', '1-3 years', '3-5 years', '5+ years'];
const incomeBands = ['$0-$50k', '$50k-$100k', '$100k-$150k', '$150k+'];
const paymentStatuses = ['Current', 'Grace Period', 'Late (30-59 days)', 'Late (60-89 days)', 'Default', 'Closed'];

// Generate 1200 records
for (let i = 1001; i <= 2200; i++) {
  const loanId = `LN-${i}`;
  const borrowerId = `BW-${2000 + i}`;
  const loanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
  
  const origYear = 2020 + Math.floor(Math.random() * 5);
  const origMonth = 1 + Math.floor(Math.random() * 12);
  const origDay = 1 + Math.floor(Math.random() * 28);
  const origDate = new Date(origYear, origMonth - 1, origDay);
  
  const termMonths = Math.random() > 0.8 ? 180 : 360;
  const matDate = new Date(origDate.getTime());
  matDate.setMonth(matDate.getMonth() + termMonths);
  
  const originalPrincipal = Math.floor(100000 + Math.random() * 400000);
  let currentBalance = Math.floor(originalPrincipal * (0.5 + Math.random() * 0.5));
  let paymentStatus = paymentStatuses[Math.floor(Math.random() * 4)]; // mostly current/grace/late
  let daysPastDue = paymentStatus === 'Current' ? 0 : Math.floor(Math.random() * 45);
  
  const interestRate = (3.5 + Math.random() * 6).toFixed(3);
  const borrowerState = states[Math.floor(Math.random() * (states.length - 1))]; // mostly valid
  const loanPurpose = loanPurposes[Math.floor(Math.random() * loanPurposes.length)];
  const creditGrade = creditGrades[Math.floor(Math.random() * creditGrades.length)];
  const employmentLength = employmentLengths[Math.floor(Math.random() * employmentLengths.length)];
  const incomeBand = incomeBands[Math.floor(Math.random() * incomeBands.length)];
  const servicerName = i % 2 === 0 ? 'Apex Servicing' : 'Summit Mortgage';
  
  const lastPayDate = new Date(matDate.getTime());
  lastPayDate.setFullYear(2026, 7, Math.floor(1 + Math.random() * 28)); // around Aug 2026
  
  const lastUpdated = new Date(2026, 7, 28);
  const docStatus = Math.random() > 0.85 ? 'Missing_Note' : 'Complete';
  
  // Create some INTENTIONAL anomalies based on loanId modulo
  let rowLoanId = loanId;
  let rowBorrowerId = borrowerId;
  let rowOrigDateStr = formatDate(origDate);
  let rowMatDateStr = formatDate(matDate);
  let rowOrigPrincipalStr = originalPrincipal.toString();
  let rowCurrentBalanceStr = currentBalance.toString();
  let rowInterestRateStr = interestRate;
  let rowBorrowerState = borrowerState;
  let rowPaymentStatus = paymentStatus;
  let rowDaysPastDue = daysPastDue.toString();
  let rowDocStatus = docStatus;
  let rowLastPayDateStr = formatDate(lastPayDate);
  let rowLastUpdatedStr = formatDate(lastUpdated);

  if (i === 1005) {
    // 1. Missing loan ID
    rowLoanId = '';
  } else if (i === 1010) {
    // 2. Duplicate loan ID
    rowLoanId = 'LN-1009';
  } else if (i === 1015 || i === 1016) {
    // 3. Duplicate borrower + loan amount + origination date
    rowBorrowerId = 'BW-9999';
    rowOrigPrincipalStr = '250000';
    rowOrigDateStr = '2023-05-15';
  } else if (i === 1020) {
    // 4. Invalid date formats
    rowOrigDateStr = '05/15/2022';
  } else if (i === 1025) {
    // 5. Maturity date before origination date
    rowMatDateStr = '2019-01-01';
  } else if (i === 1030) {
    // 6. Negative principal balance
    rowOrigPrincipalStr = '-5000';
  } else if (i === 1035) {
    // 7. Current balance greater than original principal
    rowCurrentBalanceStr = (originalPrincipal + 50000).toString();
  } else if (i === 1040) {
    // 8. Interest rate outside expected range
    rowInterestRateStr = '24.500';
  } else if (i === 1045) {
    // 9. Payment status inconsistent with days past due
    rowPaymentStatus = 'Current';
    rowDaysPastDue = '75';
  } else if (i === 1050) {
    // 10. Missing document status (will be handled by document_manifest.csv missing value)
    rowDocStatus = '';
  } else if (i === 1055) {
    // 11. Stale records (we will check last_updated_at)
    rowLastUpdatedStr = '2020-01-01';
  } else if (i === 1060) {
    // 12. Invalid state code
    rowBorrowerState = 'XX';
  } else if (i === 1065) {
    // 13. Loans marked closed but still showing positive balance
    rowPaymentStatus = 'Closed';
    rowCurrentBalanceStr = '150000';
  }

  // Push to loan tape
  loanTapeRows.push([
    rowLoanId, rowBorrowerId, loanType, rowOrigDateStr, rowMatDateStr,
    rowOrigPrincipalStr, rowCurrentBalanceStr, rowInterestRateStr, termMonths.toString(),
    rowBorrowerState, loanPurpose, creditGrade, employmentLength,
    incomeBand, rowPaymentStatus, rowDaysPastDue, servicerName,
    rowLastPayDateStr, rowLastUpdatedStr, '', 'OriginationSystem' // doc status is empty in tape, comes from manifest
  ]);

  // Create doc manifest records
  documentManifestRows.push([loanId, rowDocStatus || 'Complete']);

  // In servicer_update.csv, add some conflicting or updated records
  // For i = 1070, create conflicting current balance
  if (i === 1070) {
    servicerUpdateRows.push([
      loanId, borrowerId, loanType, rowOrigDateStr, rowMatDateStr,
      rowOrigPrincipalStr, (currentBalance - 20000).toString(), rowInterestRateStr, termMonths.toString(),
      rowBorrowerState, loanPurpose, creditGrade, employmentLength,
      incomeBand, rowPaymentStatus, rowDaysPastDue, servicerName,
      rowLastPayDateStr, formatDate(new Date(2026, 7, 29)), '', 'ServicerPortal' // conflicting balance
    ]);
  } else if (i === 1075) {
    // Conflicting payment status
    servicerUpdateRows.push([
      loanId, borrowerId, loanType, rowOrigDateStr, rowMatDateStr,
      rowOrigPrincipalStr, rowCurrentBalanceStr, rowInterestRateStr, termMonths.toString(),
      rowBorrowerState, loanPurpose, creditGrade, employmentLength,
      incomeBand, 'Late (60-89 days)', '62', servicerName,
      rowLastPayDateStr, formatDate(new Date(2026, 7, 29)), '', 'ServicerPortal'
    ]);
  } else if (i % 50 === 0) {
    // Normal update row
    servicerUpdateRows.push([
      loanId, borrowerId, loanType, rowOrigDateStr, rowMatDateStr,
      rowOrigPrincipalStr, (currentBalance * 0.95).toFixed(0), rowInterestRateStr, termMonths.toString(),
      rowBorrowerState, loanPurpose, creditGrade, employmentLength,
      incomeBand, rowPaymentStatus, rowDaysPastDue, servicerName,
      rowLastPayDateStr, formatDate(new Date(2026, 7, 29)), '', 'ServicerPortal'
    ]);
  }
}

// Write the loan tape CSV
writeCsv('loan_tape.csv', headers, loanTapeRows);

// Write document manifest CSV
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'document_manifest.csv'), 
  documentManifestRows.map(r => r.join(',')).join('\n')
);

// Write servicer update CSV
writeCsv('servicer_update.csv', headers, servicerUpdateRows);

// Create a small expected_exception_sample.csv for previewing
const exceptionSampleHeaders = ['loan_id', 'exception_type', 'field', 'severity', 'description'];
const exceptionSampleRows = [
  ['LN-1005', 'MISSING_FIELD', 'loan_id', 'HIGH', 'Loan record is missing its unique identifier (loan_id).'],
  ['LN-1009', 'DUPLICATE_RECORD', 'loan_id', 'HIGH', 'Duplicate loan identifier found: LN-1009.'],
  ['LN-1020', 'INVALID_FORMAT', 'origination_date', 'MEDIUM', 'Date is not in YYYY-MM-DD format: 05/15/2022.'],
  ['LN-1025', 'INVALID_VALUE', 'maturity_date', 'HIGH', 'Maturity date 2019-01-01 is prior to origination date.'],
  ['LN-1035', 'INVALID_VALUE', 'current_balance', 'HIGH', 'Current balance exceeds original principal loan amount.'],
  ['LN-1070', 'CONFLICTING_DATA', 'current_balance', 'HIGH', 'Conflict found between source systems: OriginationSystem reports balance vs servicer portal.']
];
writeCsv('expected_exception_sample.csv', exceptionSampleHeaders, exceptionSampleRows);

console.log('Synthetic data generation completed successfully in public/data/');
