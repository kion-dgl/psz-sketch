/**
 * Character Equipment API
 * GET: Get equipment for a character
 */

import type { APIRoute } from 'astro';
import { getEquipment } from '../../../../api';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Character ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const equipment = getEquipment(id);

    return new Response(JSON.stringify(equipment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get equipment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
