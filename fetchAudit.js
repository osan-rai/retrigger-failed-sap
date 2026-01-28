const https = require('https');

/**
 * Fetch failed SAP XML export audits
 * @param {number} limit - Number of records to fetch
 * @param {string} status - Status filter (e.g., 'FAILED')
 * @returns {Promise<Object>} API response data
 */
async function fetchFailedAudits(limit = 17, status = 'VALIDATION_FAILED') {
  const baseUrl = 'https://api.medlog.portpro.io/tms/sap-xml-export/audits';
  const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODVlYTAzOGVhZGM2YTg2NDYzZWY3MzYiLCJhZG1pbklkIjoiNjk3ODYyZTgyYjVmY2VmMzlmNzA4ZGQ4IiwiaWF0IjoxNzY5NjA1MzQ0LCJleHAiOjE3Njk2MTA3NDR9.t2edGh7pP9puiWEm6ZLuj33KQsIx-P6pVSSO8aYow7M";

  if (!token) {
    throw new Error('BEARER_TOKEN environment variable is not set');
  }

  const url = `${baseUrl}?limit=${limit}&status=${status}`;

  const options = {
    method: 'GET',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'authorization': token,
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
    console.error('Error fetching failed audits:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('Fetching failed SAP XML export audits...\n');

    const data = await fetchFailedAudits();

    console.log('✓ Successfully fetched data');
    // console.log('Response:', JSON.stringify(data, null, 2));
    const auditId = data.audits[0]._id;

    // If data contains audits array, show count
    if (data.audits && Array.isArray(data.audits)) {
      console.log(`\nTotal audits found: ${data.audits.length}`);
    }

  } catch (error) {
    console.error('✗ Failed to fetch audits');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchFailedAudits };
