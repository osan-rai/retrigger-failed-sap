const https = require('https');

/**
 * Fetch SAP XML export audits with automatic pagination
 * @param {number} limit - Number of records to fetch per page (default: 50)
 * @param {number} offset - Starting offset (default: 0)
 * @param {string} startDate - Start date filter (ISO format)
 * @param {string} endDate - End date filter (ISO format)
 * @returns {Promise<Object>} API response data with all audits
 */
async function fetchFailedAudits(limit = 50, offset = 0, startDate = '2026-01-28T00:00:00.000Z', endDate = '2026-01-28T23:59:59.999Z') {
  const baseUrl = 'https://api.medlog.portpro.io/tms/sap-xml-export/audits';
  const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODVlYTAzOGVhZGM2YTg2NDYzZWY3MzYiLCJhZG1pbklkIjoiNjk3ODYyZTgyYjVmY2VmMzlmNzA4ZGQ4IiwiaWF0IjoxNzcwMDU1NDQwLCJleHAiOjE3NzAwNjA4NDB9.OcdFR434qdpaV4EUisWWgfwJSHxux9cLoyw2ps4If_k";

  if (!token) {
    throw new Error('BEARER_TOKEN environment variable is not set');
  }

  const allAudits = [];
  let currentOffset = 0;
  let hasMoreData = true;

  console.log('Starting pagination fetch...');

  while (hasMoreData) {
    const url = `${baseUrl}?limit=${limit}&offset=${currentOffset}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

    const options = {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': token,
        'origin': 'https://medlog.portpro.io',
        'priority': 'u=1, i',
        'referer': 'https://medlog.portpro.io/',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
      }
    };

    try {
      console.log(`Fetching offset ${currentOffset}...`);
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if we have audits in the response
      if (data.data && data.data.audits && data.data.audits.length > 0) {
        allAudits.push(...data.data.audits);
        console.log(`✓ Fetched ${data.data.audits.length} audits (total so far: ${allAudits.length})`);
        
        // Check pagination info if available, otherwise check if we got fewer results than limit
        if (data.pagination && data.pagination.hasMore === false) {
          hasMoreData = false;
        } else if (data.data.audits.length < limit) {
          hasMoreData = false;
        } else {
          currentOffset += limit;
        }
      } else {
        console.log('No more audits found');
        hasMoreData = false;
      }
    } catch (error) {
      console.error('Error fetching failed audits:', error.message);
      throw error;
    }
  }

  console.log(`\n✓ Pagination complete! Total audits fetched: ${allAudits.length}\n`);

  // Extract just the id and portpro_invoice_number for summary
  const summary = allAudits.map(audit => ({
    id: audit.id,
    portpro_invoice_number: audit.portpro_invoice_number
  }));

  console.log('Summary of fetched audits:');
  console.log(JSON.stringify(summary, null, 2));

  return {
    data: {
      audits: allAudits,
      total: allAudits.length
    }
  };
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
