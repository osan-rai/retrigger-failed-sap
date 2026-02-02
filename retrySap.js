/**
 * Script to retry failed SAP XML export audits
 */

const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODVlYTAzOGVhZGM2YTg2NDYzZWY3MzYiLCJhZG1pbklkIjoiNjk3ODYyZTgyYjVmY2VmMzlmNzA4ZGQ4IiwiaWF0IjoxNzcwMDU1NDQwLCJleHAiOjE3NzAwNjA4NDB9.OcdFR434qdpaV4EUisWWgfwJSHxux9cLoyw2ps4If_k"

/**
 * Retry a specific SAP XML export audit
 * @param {number|string} auditId - The audit ID to retry
 * @returns {Promise<Object>} API response data
 */
async function retrySapAudit(auditId) {
  const url = `https://api.medlog.portpro.io/tms/sap-xml-export/audits/${auditId}/retry`;

  const options = {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'authorization': token,
      'content-length': '0',
      'origin': 'https://medlog.portpro.io',
      'referer': 'https://medlog.portpro.io/',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
    }
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error retrying audit ${auditId}:`, error.message);
    throw error;
  }
}

/**
 * Retry multiple audits with delay between requests
 * @param {Array<number|string>} auditIds - Array of audit IDs to retry
 * @param {number} delayMs - Delay between requests in milliseconds
 */
async function retryMultipleAudits(auditIds, delayMs = 500) {
  const results = {
    success: [],
    failed: []
  };

  console.log(`Starting retry for ${auditIds.length} audits...\n`);

  for (let i = 0; i < auditIds.length; i++) {
    const auditId = auditIds[i];
    
    try {
      console.log(`[${i + 1}/${auditIds.length}] Retrying audit ${auditId}...`);
      const data = await retrySapAudit(auditId);
      results.success.push({ auditId, data });
      console.log(`✓ Successfully retried audit ${auditId}`);
    } catch (error) {
      results.failed.push({ auditId, error: error.message });
      console.error(`✗ Failed to retry audit ${auditId}`);
    }

    // Add delay between requests to avoid rate limiting
    if (i < auditIds.length - 1) {
      console.log(`⏳ Waiting ${delayMs / 1000} seconds before next retry...\n`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node retry_sap.js <auditId>              # Retry a single audit');
    console.log('  node retry_sap.js <id1> <id2> <id3>      # Retry multiple audits');
    console.log('  node retry_sap.js --file <filename>      # Retry audits from file (one ID per line)');
    console.log('\nExamples:');
    console.log('  node retry_sap.js 2273');
    console.log('  node retry_sap.js 2273 2274 2275');
    console.log('  node retry_sap.js --file audit_ids.txt');
    process.exit(0);
  }

  try {
    let auditIds = [];

    // Check if reading from file
    if (args[0] === '--file') {
      if (!args[1]) {
        throw new Error('Please provide a filename after --file');
      }
      
      const fs = require('fs');
      const fileContent = fs.readFileSync(args[1], 'utf-8');
      auditIds = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')); // Filter empty lines and comments
    } else {
      // Use command line arguments as audit IDs
      auditIds = args;
    }

    if (auditIds.length === 0) {
      throw new Error('No audit IDs provided');
    }

    if (auditIds.length === 1) {
      // Single audit
      console.log(`Retrying audit ${auditIds[0]}...\n`);
      const data = await retrySapAudit(auditIds[0]);
      console.log('✓ Successfully retried audit');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      // Multiple audits
      const results = await retryMultipleAudits(auditIds);
      
      console.log('\n' + '='.repeat(50));
      console.log('SUMMARY');
      console.log('='.repeat(50));
      console.log(`Total audits: ${auditIds.length}`);
      console.log(`✓ Successful: ${results.success.length}`);
      console.log(`✗ Failed: ${results.failed.length}`);
      
      if (results.failed.length > 0) {
        console.log('\nFailed audits:');
        results.failed.forEach(({ auditId, error }) => {
          console.log(`  - Audit ${auditId}: ${error}`);
        });
      }
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { retrySapAudit, retryMultipleAudits };
