/**
 * Characters API
 * GET: List all characters
 * POST: Create a new character
 */

import type { APIRoute } from 'astro';
import {
  getAllCharacters,
  createCharacter,
  type Character,
} from '../../../api';

export const GET: APIRoute = async () => {
  try {
    const characters = getAllCharacters();

    // Convert API characters to client format
    const clientChars = characters.map(char => {
      if (!char) return null;
      return {
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
    });

    return new Response(JSON.stringify(clientChars), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get characters' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slot, classId, name } = body;

    if (slot === undefined || !classId || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: slot, classId, name' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = createCharacter(slot, classId, name);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert to client format
    const char = result.data!;
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
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create character' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
