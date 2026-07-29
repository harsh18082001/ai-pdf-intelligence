import type { IncomingMessage, ServerResponse } from 'http';

// Set CORS headers on EVERY response, before Express can crash
function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-session-id'
  );
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Always set CORS headers first
  setCorsHeaders(res);

  // Handle preflight OPTIONS immediately — don't even load Express
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // Dynamically import the Express app so any crash is caught
    const { default: app } = await import('../src/app.js');
    app(req, res);
  } catch (err: any) {
    console.error('Fatal server error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Internal server error', details: err.message }));
  }
}
