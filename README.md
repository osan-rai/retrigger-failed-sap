# Retrigger Failed SAP

A clean Node.js script to fetch failed SAP XML export audits from the PortPro API.

## Prerequisites

- Node.js 18+ (for native fetch API support)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Update the `.env` file with your actual bearer token.

## Usage

Run the script:
```bash
npm start
```

Or directly with Node.js:
```bash
node -r dotenv/config index.js
```

## Environment Variables

- `BEARER_TOKEN` - Your API authentication token (required)

## API Endpoint

**URL:** `https://new-api.dev.portpro.io/tms/sap-xml-export/audits`

**Query Parameters:**
- `limit` - Number of records to fetch (default: 50)
- `status` - Filter by status (default: FAILED)

## Response

The script will output the JSON response from the API and show the total number of audits found.
