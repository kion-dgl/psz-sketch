/**
 * Game State API
 * GET: Get current game state
 */

import type { APIRoute } from 'astro';
import { getState } from '../../../cli/api-v2';

export const GET: APIRoute = async () => {
  try {
    const state = getState();

    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get game state' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
