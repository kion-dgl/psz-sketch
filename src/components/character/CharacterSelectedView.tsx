/**
 * Character Selected View
 *
 * The lobby screen showing the selected character with a 3D preview.
 * Provides options to start the game in Online or Offline mode.
 */

import { useState, useEffect } from 'react';
import CharacterPreview from './CharacterPreview';
import { useCharacterStore, type Character } from '../../stores/characterStore';

interface CharacterSelectedViewProps {
  characterId: string;
}

export default function CharacterSelectedView({ characterId }: CharacterSelectedViewProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setSelectedCharacter } = useCharacterStore();

  useEffect(() => {
    loadCharacter();
  }, [characterId]);

  const loadCharacter = () => {
    try {
      const stored = localStorage.getItem('characters') || '[]';
      const chars = JSON.parse(stored);
      const found = chars.find((c: Character | null) => c?.character_id === characterId);
      
      if (!found) {
        setError('Character not found');
        setLoading(false);
        return;
      }

      setCharacter(found);
      setLoading(false);
    } catch (err) {
      console.error('Error loading character:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/character-select';
  };

  const handleStartOffline = () => {
    if (character) {
      // Save character to global state
      setSelectedCharacter(character);
      // Navigate to first game screen
      window.location.href = '/stage/city';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Loading character...</p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'white',
        flexDirection: 'column'
      }}>
        <p style={{ color: '#ffcccc', fontSize: '1.2rem', marginBottom: '1rem' }}>
          Failed to load character
        </p>
        <p style={{ color: '#ffcccc', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {error || 'Character not found'}
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '0.75rem 2rem',
            background: 'white',
            color: '#1e3c72',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Back to Character Select
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      padding: '2rem'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        Character Lobby
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        width: '100%',
        marginBottom: '3rem',
        alignItems: 'center'
      }}>
        {/* Character 3D Preview */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          padding: '2rem',
          minHeight: '400px'
        }}>
          <CharacterPreview
            classId={character.class_id}
            variationIndex={(character as any).variation_index ?? 0}
            textureId={character.texture_id}
            autoRotate={true}
          />
        </div>

        {/* Character Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              {character.character_name}
            </h2>
            <p style={{
              fontSize: '1.2rem',
              opacity: 0.9
            }}>
              {character.class_id}
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.25rem' }}>Level</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{character.level}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.25rem' }}>Experience</div>
              <div style={{ fontSize: '1.2rem' }}>{character.experience} XP</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <button
              onClick={handleStartOffline}
              style={{
                padding: '1rem 2rem',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#45a049';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#4CAF50';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
              }}
            >
              Start Game (Offline)
            </button>

            <button
              disabled
              style={{
                padding: '1rem 2rem',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.5)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'not-allowed',
                opacity: 0.5
              }}
            >
              Start Game (Online) - Coming Soon
            </button>

            <button
              onClick={handleBack}
              style={{
                padding: '0.75rem 2rem',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              ← Back to Character Select
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 968px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
