const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting API Tests ===');
  
  try {
    // 1. Test GET /api/loans
    console.log('\nTesting GET /api/loans...');
    const loansRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/loans',
      method: 'GET'
    });
    console.log(`Status: ${loansRes.statusCode}`);
    if (loansRes.statusCode !== 200) throw new Error('GET /api/loans failed');
    console.log(`Fetched ${loansRes.body.length} loans.`);

    if (loansRes.body.length === 0) {
      console.log('No loans found in database. Ingest some records first.');
      return;
    }

    const firstLoan = loansRes.body.find(l => l.loanId);
    if (!firstLoan) throw new Error('No loans with valid loanId found');
    const uuid = firstLoan.id;
    const loanId = firstLoan.loanId;
    console.log(`Using loan UUID: ${uuid}, CSV loanId: ${loanId}`);

    // 2. Test GET /api/loans/:id
    console.log(`\nTesting GET /api/loans/${uuid}...`);
    const loanDetailRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/loans/${uuid}`,
      method: 'GET'
    });
    console.log(`Status: ${loanDetailRes.statusCode}`);
    if (loanDetailRes.statusCode !== 200) throw new Error('GET /api/loans/:id failed');
    console.log(`Fetched loan detail: ${loanDetailRes.body.loanId}`);

    // 3. Test GET /api/exceptions
    console.log('\nTesting GET /api/exceptions...');
    const exceptionsRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/exceptions?resolved=false',
      method: 'GET'
    });
    console.log(`Status: ${exceptionsRes.statusCode}`);
    if (exceptionsRes.statusCode !== 200) throw new Error('GET /api/exceptions failed');
    console.log(`Fetched ${exceptionsRes.body.length} active exceptions.`);

    // 4. Test GET /api/audit/:loanId (using CSV loanId)
    console.log(`\nTesting GET /api/audit/${loanId}...`);
    const auditRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/audit/${loanId}`,
      method: 'GET'
    });
    console.log(`Status: ${auditRes.statusCode}`);
    if (auditRes.statusCode !== 200) throw new Error('GET /api/audit/:loanId failed');
    console.log(`Fetched ${auditRes.body.auditLogs.length} audit logs for loan ${loanId}.`);

    // 5. Test POST /api/exceptions/batch-summary
    console.log('\nTesting POST /api/exceptions/batch-summary...');
    const batchRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/exceptions/batch-summary',
      method: 'POST',
    }, { loanIds: [uuid] });
    console.log(`Status: ${batchRes.statusCode}`);
    if (batchRes.statusCode !== 200) throw new Error('POST /api/exceptions/batch-summary failed');
    console.log(`Batch Summary: ${batchRes.body.summary.substring(0, 100)}...`);

    // 6. Test POST /api/rules/generate
    console.log('\nTesting POST /api/rules/generate...');
    const ruleRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/rules/generate',
      method: 'POST',
    }, { ruleDescription: 'Interest rates must not exceed 8% for NY state.' });
    console.log(`Status: ${ruleRes.statusCode}`);
    if (ruleRes.statusCode !== 200) throw new Error('POST /api/rules/generate failed');
    console.log(`Generated explanation: ${ruleRes.body.explanation}`);

    // 7. Test GET /api/summary
    console.log('\nTesting GET /api/summary...');
    const summaryRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/summary',
      method: 'GET'
    });
    console.log(`Status: ${summaryRes.statusCode}`);
    if (summaryRes.statusCode !== 200) throw new Error('GET /api/summary failed');
    console.log(`Data Quality Score: ${summaryRes.body.dataQualityScore}%`);

    console.log('\n=== All API Tests Passed Successfully ===');
  } catch (err) {
    console.error('\nTest execution failed:', err.message);
    process.exit(1);
  }
}

runTests();
