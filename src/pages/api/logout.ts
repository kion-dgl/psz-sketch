/**
 * This API endpoint has been removed.
 * The application is now fully client-only.
 * All authentication and data storage happens in the browser (IndexedDB, localStorage).
 */

import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'This endpoint has been removed. The app is now client-only.' }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
};
