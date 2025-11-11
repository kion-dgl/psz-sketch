/**
 * DELETE /api/characters/:id
 *
 * Soft-deletes a character by setting deletedAt timestamp
 */

import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getCollection } from '../../../mod/mongodb';
import { getUserSession } from '../../../mod/sessionManager';
import type { CharacterDocument } from '../../../mod/collections';

export const DELETE: APIRoute = async ({ params, session }) => {
  try {
    // Check if user is authenticated
    const userSession = await getUserSession(session);
    if (!userSession) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const characterId = params.id;
    if (!characterId) {
      return new Response(
        JSON.stringify({ error: 'Character ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(characterId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid character ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get characters collection
    const charactersCollection = await getCollection<CharacterDocument>('characters');

    // Verify the character belongs to this user
    const character = await charactersCollection.findOne({
      _id: new ObjectId(characterId),
      userId: userSession.fingerprint,
      deletedAt: null,
    });

    if (!character) {
      return new Response(
        JSON.stringify({ error: 'Character not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Soft delete: set deletedAt timestamp
    const result = await charactersCollection.updateOne(
      { _id: new ObjectId(characterId) },
      { $set: { deletedAt: new Date().toISOString() } }
    );

    if (result.modifiedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete character' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in DELETE /api/characters/:id:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
