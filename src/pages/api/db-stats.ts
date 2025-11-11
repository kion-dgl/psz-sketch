/**
 * GET /api/db-stats
 *
 * Returns MongoDB collection statistics
 * Useful for debugging and monitoring during development
 *
 * Note: In production, you may want to protect this endpoint
 * or remove it entirely for security
 */

import type { APIRoute } from 'astro';
import { connectToDatabase } from '../../mod/mongodb';
import { getCollectionStats } from '../../mod/collections';

export const GET: APIRoute = async () => {
  try {
    const db = await connectToDatabase();
    const stats = await getCollectionStats(db);

    // Add database name and connection info
    const response = {
      database: db.databaseName,
      collections: stats,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch database statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
