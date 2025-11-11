/**
 * POST /api/logout
 *
 * Destroys the user's session
 */

import type { APIRoute } from 'astro';
import { destroyUserSession } from '../../mod/sessionManager';

export const POST: APIRoute = async ({ session }) => {
  try {
    await destroyUserSession(session);

    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in /api/logout:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
