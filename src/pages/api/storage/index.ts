/**
 * Storage API
 * GET: Get shared storage
 */

import type { APIRoute } from 'astro';
import { getStorage } from '../../../api';

export const GET: APIRoute = async () => {
  try {
    const storage = getStorage();

    // Convert to client format
    const clientStorage = {
      items: storage.items.map(slot => ({
        item_id: slot.item_id,
        item: slot.item,
        quantity: slot.quantity,
      })),
      meseta: storage.meseta,
      maxSlots: storage.maxSlots,
    };

    return new Response(JSON.stringify(clientStorage), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get storage' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
