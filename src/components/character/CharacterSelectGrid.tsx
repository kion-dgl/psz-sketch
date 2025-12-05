import { useState, useEffect } from 'react';
import { getAllCharacters, deleteCharacter, type CharacterData } from '../../lib/characterStorage';
import CharacterPreview from './CharacterPreview';

export default function CharacterSelectGrid() {
  const [characters, setCharacters] = useState<(CharacterData | null)[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const chars = await getAllCharacters();
      setCharacters(chars);
    } catch (err) {
      console.error('Error loading characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (character: CharacterData) => {
    setCharacterToDelete(character);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!characterToDelete) return;

    try {
      await deleteCharacter(characterToDelete.slot);
      await loadCharacters();
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Failed to delete character. Please try again.');
    } finally {
      setDeleteModalOpen(false);
      setCharacterToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCharacterToDelete(null);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year}\n${hours}:${minutes}`;
  };

  const formatPlayTime = (seconds?: number) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        margin: '2rem 0',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Loading characters...
      </div>
    );
  }

  const hasAnyCharacter = characters.some(c => c !== null);

  if (!hasAnyCharacter) {
    return (
      <div style={{
        textAlign: 'center',
        margin: '2rem 0',
        color: 'white'
      }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          No characters created yet
        </p>
        <a
          href="/character-create?slot=0"
          className="psz-button"
        >
          Create Your First Character
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="character-select-container">
        {[0, 1, 2, 3].map((slotNum) => {
          const character = characters[slotNum];

          return (
            <div
              key={slotNum}
              className="character-slot"
            >
              {character ? (
                <>
                  <button
                    onClick={() => handleDeleteClick(character)}
                    className="delete-button"
                  >
                    Delete
                  </button>

                  <div
                    onClick={() => window.location.href = `/character-selected/${character.character_id}`}
                    className="character-info"
                  >
                    <div className="character-preview-container">
                      <CharacterPreview 
                        classId={character.class_id} 
                        textureId={character.texture_id}
                      />
                    </div>
                    
                    <div className="character-details">
                      <div className="character-name-row">
                        <span className="character-name">{character.character_name}</span>
                        <span className="character-class">{character.class_id}</span>
                      </div>
                      
                      <div className="character-level">
                        LV {character.level}
                      </div>
                      
                      <div className="character-meta">
                        <div className="meta-item">
                          <span className="meta-label">Last save</span>
                          <span className="meta-value">{formatDate(character.last_played || character.created_at)}</span>
                        </div>
                        
                        <div className="meta-item">
                          <span className="meta-label">Play time</span>
                          <span className="meta-value">{formatPlayTime(character.play_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <a
                  href={`/character-create?slot=${slotNum}`}
                  className="new-game-slot"
                >
                  <span className="new-game-text">New Game</span>
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCancelDelete();
          }
        }}>
          <div className="modal-content">
            <h2 className="modal-title">Delete Character?</h2>
            <p className="modal-message">
              Are you sure you want to delete <strong>{characterToDelete?.character_name}</strong>?
            </p>
            <p className="modal-warning">
              This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button onClick={handleConfirmDelete} className="modal-button delete-confirm">
                Delete
              </button>
              <button onClick={handleCancelDelete} className="modal-button cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .character-select-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 900px;
          width: 100%;
        }

        .character-slot {
          background: linear-gradient(to bottom, #e8f4ff 0%, #d0e8ff 100%);
          border: 3px solid #4a6f9e;
          border-radius: 8px;
          padding: 1.5rem;
          min-height: 180px;
          display: flex;
          position: relative;
          transition: all 0.2s;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .character-slot:hover {
          border-color: #5d8bc7;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }

        .delete-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #f44336;
          color: white;
          border: 2px solid #c62828;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: bold;
          transition: all 0.2s;
          z-index: 2;
        }

        .delete-button:hover {
          background: #d32f2f;
          transform: scale(1.05);
        }

        .character-info {
          display: flex;
          gap: 1.5rem;
          cursor: pointer;
          width: 100%;
          align-items: center;
        }

        .character-preview-container {
          width: 200px;
          height: 150px;
          flex-shrink: 0;
          background: #1a1a1a;
          border-radius: 6px;
          border: 2px solid #4a6f9e;
          overflow: hidden;
        }

        .character-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: #1a1a1a;
        }

        .character-name-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 1rem;
        }

        .character-name {
          font-size: 1.8rem;
          font-weight: bold;
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        .character-class {
          font-size: 1.2rem;
          font-family: monospace;
          opacity: 0.8;
        }

        .character-level {
          font-size: 1.5rem;
          font-family: monospace;
          font-weight: bold;
          letter-spacing: 0.1em;
        }

        .character-meta {
          display: flex;
          gap: 2rem;
          margin-top: 0.5rem;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .meta-label {
          font-size: 0.85rem;
          font-family: monospace;
          opacity: 0.7;
        }

        .meta-value {
          font-size: 0.95rem;
          font-family: monospace;
          font-weight: bold;
          white-space: pre-line;
        }

        .new-game-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          text-decoration: none;
          transition: all 0.2s;
        }

        .new-game-text {
          font-size: 1.8rem;
          font-family: monospace;
          font-weight: bold;
          color: #f4a900;
          letter-spacing: 0.1em;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .new-game-slot:hover .new-game-text {
          transform: scale(1.05);
          color: #ffb700;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: linear-gradient(to bottom, #e8f4ff 0%, #d0e8ff 100%);
          border: 3px solid #4a6f9e;
          border-radius: 12px;
          padding: 2rem;
          max-width: 400px;
          text-align: center;
          color: #1a1a1a;
        }

        .modal-title {
          margin-bottom: 1rem;
          font-size: 1.8rem;
          font-family: monospace;
          font-weight: bold;
        }

        .modal-message {
          margin-bottom: 1rem;
          font-family: monospace;
        }

        .modal-warning {
          color: #d32f2f;
          font-size: 0.9rem;
          margin-bottom: 2rem;
          font-family: monospace;
        }

        .modal-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .modal-button {
          padding: 0.75rem 2rem;
          border: 2px solid #4a6f9e;
          border-radius: 8px;
          font-size: 1rem;
          font-family: monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-button.delete-confirm {
          background: #f44336;
          color: white;
          border-color: #c62828;
        }

        .modal-button.delete-confirm:hover {
          background: #d32f2f;
        }

        .modal-button.cancel {
          background: white;
          color: #1a1a1a;
        }

        .modal-button.cancel:hover {
          background: #f0f0f0;
        }

        .psz-button {
          padding: 0.75rem 2rem;
          background: linear-gradient(to bottom, #f4a900 0%, #e09600 100%);
          color: white;
          border: 2px solid #b87900;
          border-radius: 4px;
          font-size: 1rem;
          font-family: monospace;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .psz-button:hover {
          background: linear-gradient(to bottom, #ffb700 0%, #f4a900 100%);
        }

        @media (max-width: 768px) {
          .character-info {
            flex-direction: column;
          }

          .character-preview-container {
            width: 100%;
          }

          .character-meta {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </>
  );
}
