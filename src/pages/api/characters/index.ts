/**
 * GET /api/characters - Returns all active characters for the authenticated user
 * POST /api/characters - Creates a new character
 */

import type { APIRoute } from 'astro';
import { getCollection } from '../../../mod/mongodb';
import { getUserSession } from '../../../mod/sessionManager';
import type { CharacterDocument } from '../../../mod/collections';

export const GET: APIRoute = async ({ session }) => {
  try {
    // Check if user is authenticated
    const userSession = await getUserSession(session);
    if (!userSession) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get characters collection
    const charactersCollection = await getCollection<CharacterDocument>('characters');

    // Fetch all active characters for this user
    const characters = await charactersCollection
      .find({
        userId: userSession.fingerprint,
        deletedAt: null,
      })
      .sort({ slot: 1 }) // Sort by slot number
      .toArray();

    // Map to API response format
    const responseData = characters.map((char) => ({
      character_id: char._id?.toString(),
      character_name: char.name,
      level: char.level,
      slot: char.slot,
      class_id: char.classId,
      texture_id: char.textureId,
      experience: char.experience,
      created_at: char.createdAt,
    }));

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in GET /api/characters:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, session }) => {
  try {
    // Check if user is authenticated
    const userSession = await getUserSession(session);
    if (!userSession) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { slot, name, class_id, texture_id } = body;

    // Validate required fields
    if (slot === undefined || !name || !class_id || !texture_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: slot, name, class_id, texture_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate slot number
    if (!Number.isInteger(slot) || slot < 0 || slot > 3) {
      return new Response(
        JSON.stringify({ error: 'Slot must be an integer between 0 and 3' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate class_id
    const validClasses = [
      'HUcaseal', 'HUcast', 'HUmar', 'HUmarl', 'HUnewm', 'HUnewearl',
      'RAcast', 'RAcaseal', 'RAmar', 'RAmarl',
      'FOmar', 'FOmarl', 'FOnewm', 'FOnewearl'
    ];
    if (!validClasses.includes(class_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid class_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get characters collection
    const charactersCollection = await getCollection<CharacterDocument>('characters');

    // Check if user already has a character in this slot
    const existingCharacter = await charactersCollection.findOne({
      userId: userSession.fingerprint,
      slot: slot,
      deletedAt: null,
    });

    if (existingCharacter) {
      return new Response(
        JSON.stringify({ error: 'Slot already occupied' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new character
    const newCharacter: Omit<CharacterDocument, '_id'> = {
      userId: userSession.fingerprint,
      name: name,
      slot: slot,
      classId: class_id,
      textureId: texture_id,
      level: 1,
      experience: 0,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    const result = await charactersCollection.insertOne(newCharacter as any);

    if (!result.insertedId) {
      return new Response(
        JSON.stringify({ error: 'Failed to create character' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return created character
    const responseData = {
      character_id: result.insertedId.toString(),
      character_name: newCharacter.name,
      level: newCharacter.level,
      slot: newCharacter.slot,
      class_id: newCharacter.classId,
      texture_id: newCharacter.textureId,
      experience: newCharacter.experience,
      created_at: newCharacter.createdAt,
    };

    return new Response(
      JSON.stringify(responseData),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in POST /api/characters:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
