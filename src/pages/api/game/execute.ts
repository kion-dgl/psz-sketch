/**
 * Game Execute API
 * POST: Execute a game command for a character
 */

import type { APIRoute } from 'astro';
import { execute, getState, resetState } from '../../../cli/api-v2';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command) {
      return new Response(
        JSON.stringify({ success: false, message: 'Command required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = execute(command);

    // Get the updated state after command execution
    const state = getState();

    return new Response(
      JSON.stringify({ ...result, state }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Command execution failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
