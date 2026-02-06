/**
 * Character by ID API
 * GET: Get a specific character
 * DELETE: Delete a character
 */

import type { APIRoute } from 'astro';
import {
  getCharacter,
  deleteCharacter,
} from '../../../api';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Character ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const char = getCharacter(id);
    if (!char) {
      return new Response(
        JSON.stringify({ error: 'Character not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert to client format
    const clientChar = {
      character_id: char.id,
      character_name: char.name,
      class_id: char.class_id,
      level: char.level,
      experience: char.experience,
      slot: char.slot,
      variation_index: char.variation_index,
      texture_id: char.texture_id,
      created_at: char.created_at,
      meseta: char.meseta,
    };

    return new Response(JSON.stringify(clientChar), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get character' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Character ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = deleteCharacter(id);
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete character' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
