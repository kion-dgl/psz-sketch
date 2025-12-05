/**
 * This API endpoint has been removed.
 * The application is now fully client-only.
 * Character data is stored in localStorage on the client.
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'This endpoint has been removed. The app is now client-only.' }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
};

export const DELETE: APIRoute = async () => {
  return new Response(
    JSON.stringify({ error: 'This endpoint has been removed. The app is now client-only.' }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
};
