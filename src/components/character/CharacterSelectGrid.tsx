import { useState, useEffect } from 'react';

interface Character {
  character_id: string;
  character_name: string;
  level: number;
  slot: number;
  class_id: string;
  texture_id: string;
}

export default function CharacterSelectGrid() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error(`Failed to load characters: ${response.statusText}`);
      }

      const data = await response.json();
      setCharacters(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading characters:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const handleDeleteClick = (character: Character) => {
    setCharacterToDelete(character);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!characterToDelete) return;

    try {
      const response = await fetch(`/api/characters/${characterToDelete.character_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete character');
      }

      setDeleteModalOpen(false);
      setCharacterToDelete(null);
      await loadCharacters();
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Failed to delete character. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCharacterToDelete(null);
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        margin: '2rem 0',
        color: 'white'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p>Loading characters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        margin: '2rem 0',
        color: 'white'
      }}>
        <p style={{ color: '#ffcccc', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
          Failed to load characters
        </p>
        <p style={{ color: '#ffcccc', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {error}
        </p>
        <button
          onClick={loadCharacters}
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
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '2rem',
        maxWidth: '900px',
        width: '100%'
      }}>
        {[0, 1, 2, 3].map((slotNum) => {
          const character = characters.find(c => c.slot === slotNum);

          return (
            <div
              key={slotNum}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '2rem',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                fontSize: '0.9rem',
                opacity: 0.6,
                color: 'white'
              }}>
                Slot {slotNum + 1}
              </div>

              {character ? (
                <>
                  <button
                    onClick={() => handleDeleteClick(character)}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#d32f2f';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f44336';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Delete
                  </button>

                  <div
                    onClick={() => window.location.href = `/character-selected/${character.character_id}`}
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      width: '100%',
                      color: 'white'
                    }}
                  >
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      {character.character_name}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      marginBottom: '1rem'
                    }}>
                      Level {character.level} {character.class_id}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: 'white'
                }}>
                  <p style={{
                    fontSize: '1.1rem',
                    opacity: 0.6,
                    marginBottom: '1rem'
                  }}>
                    Empty Slot
                  </p>
                  <a
                    href={`/character-create?slot=${slotNum}`}
                    style={{
                      display: 'inline-block',
                      padding: '1rem 2rem',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#45a049';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#4CAF50';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Create Character
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelDelete();
            }
          }}
        >
          <div style={{
            background: '#1e3c72',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            color: 'white'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>
              Delete Character?
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Are you sure you want to delete <strong>{characterToDelete?.character_name}</strong>?
            </p>
            <p style={{
              color: '#ffcccc',
              fontSize: '0.9rem',
              marginBottom: '2rem'
            }}>
              This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#f44336',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#d32f2f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f44336';
                }}
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .character-slots {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
