/**
 * Character Inventory API
 * GET: Get inventory for a character
 */

import type { APIRoute } from 'astro';
import { getInventory } from '../../../../api';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Character ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const inventory = getInventory(id);

    // Convert to client format
    const clientInventory = inventory.map(slot => ({
      item_id: slot.item.id,
      item: slot.item,
      quantity: slot.quantity,
    }));

    return new Response(JSON.stringify(clientInventory), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get inventory' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
