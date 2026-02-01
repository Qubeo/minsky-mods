// Minsky Dashboard API Server
// Run with: bun api/index.ts

import { minsky } from './minsky-bridge';
import type { ApiResponse } from './types';

const PORT = 3000;

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function success<T>(data: T): Response {
  return json<ApiResponse<T>>({ success: true, data });
}

function error(message: string, status = 400): Response {
  return json<ApiResponse>({ success: false, error: message }, status);
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // GET /api/version - Get Minsky version
    if (path === '/api/version' && req.method === 'GET') {
      return success({ version: minsky.version() });
    }

    // GET /api/state - Get simulation state
    if (path === '/api/state' && req.method === 'GET') {
      return success(minsky.state());
    }

    // GET /api/variables - Get all variables with values
    if (path === '/api/variables' && req.method === 'GET') {
      return success(minsky.variables());
    }

    // POST /api/model/load - Load a .mky file
    if (path === '/api/model/load' && req.method === 'POST') {
      const body = await req.json() as { path: string };
      if (!body.path) {
        return error('Missing "path" in request body');
      }
      minsky.load(body.path);
      return success({ loaded: true, path: body.path });
    }

    // POST /api/sim/reset - Reset simulation to t=0
    if (path === '/api/sim/reset' && req.method === 'POST') {
      minsky.reset();
      return success({ t: minsky.t() });
    }

    // POST /api/sim/step - Single simulation step
    if (path === '/api/sim/step' && req.method === 'POST') {
      minsky.step();
      return success({ t: minsky.t() });
    }

    // POST /api/sim/run - Run N steps
    if (path === '/api/sim/run' && req.method === 'POST') {
      const body = await req.json() as { steps?: number; variables?: string[] };
      const steps = body.steps || 100;
      const history = minsky.run(steps, body.variables);
      return success({ history, finalT: minsky.t() });
    }

    // GET /api/history - Get time series data for variables
    if (path === '/api/history' && req.method === 'GET') {
      const varsParam = url.searchParams.get('variables');
      const stepsParam = url.searchParams.get('steps');
      const variables = varsParam ? varsParam.split(',') : undefined;
      const steps = stepsParam ? parseInt(stepsParam, 10) : 100;
      const history = minsky.run(steps, variables);
      return success({ history });
    }

    // 404 for unknown routes
    return error(`Not found: ${path}`, 404);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error:', message);
    return error(message, 500);
  }
}

console.log(`Minsky Dashboard API starting on http://localhost:${PORT}`);
console.log(`Minsky version: ${minsky.version()}`);

Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`API server running on http://localhost:${PORT}`);
