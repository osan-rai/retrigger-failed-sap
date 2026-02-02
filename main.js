/**
 * Main script to fetch failed SAP audits and retry them
 * This orchestrates the entire process:
 * 1. Fetch failed audits
 * 2. Extract audit IDs
 * 3. Retry each failed audit
 */

const { fetchFailedAudits } = require('./fetchAudit.js');
const { retryMultipleAudits } = require('./retrySap.js');

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('SAP XML Export - Fetch and Retry Failed Audits');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Fetch failed audits
    console.log('📥 STEP 1: Fetching failed audits...\n');
    const response = await fetchFailedAudits();

    // Extract audits from response structure: response.data.audits
    const audits = response?.data?.audits || [];

    // Check if we have audits
    if (audits.length === 0) {
      console.log('✓ No failed audits found. Nothing to retry!');
      return;
    }

    console.log(`✓ Successfully fetched ${audits.length} failed audits\n`);

    // Step 2: Extract audit IDs (using 'id' field from the response)
    const auditIds = audits.map(audit => audit.id);
    console.log(JSON.stringify(auditIds, null, 2));

    const invoiceNumbers = audits.map(audit => audit.portpro_invoice_number);
    console.log(JSON.stringify(invoiceNumbers, null, 2));

    // // Step 3: Retry the failed audits
    console.log('='.repeat(60));
    console.log('🔄 STEP 2: Retrying failed audits...');
    console.log('='.repeat(60));
    console.log();

    const results = await retryMultipleAudits(auditIds, 500);

    // // // Step 4: Show final summary
    console.log();
    console.log('='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total failed audits found: ${auditIds.length}`);
    console.log(`✓ Successfully retried: ${results.success.length}`);
    console.log(`✗ Failed to retry: ${results.failed.length}`);
    console.log('='.repeat(60));

    if (results.failed.length > 0) {
      console.log('\n⚠️  Audits that could not be retried:');
      results.failed.forEach(({ auditId, error }) => {
        console.log(`  - Audit ${auditId}: ${error}`);
      });
    }

    if (results.success.length > 0) {
      console.log('\n✅ All successful retries completed!');
    }

  } catch (error) {
    console.error('\n❌ Error in main process:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
