import { useState, useEffect } from 'react';
import type { Character, CharacterSlots } from '../../systems/character/types';

interface CharacterSelectWebProps {
  onCharacterSelect?: (character: Character) => void;
  onNewGame?: (slot: number) => void;
}

export default function CharacterSelectWeb({
  onCharacterSelect,
  onNewGame,
}: CharacterSelectWebProps) {
  const [characters, setCharacters] = useState<CharacterSlots>([null, null, null, null]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = () => {
    const stored = localStorage.getItem('characters');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const slots: CharacterSlots = [null, null, null, null];
        for (let i = 0; i < Math.min(parsed.length, 4); i++) {
          slots[i] = parsed[i];
        }
        setCharacters(slots);
      } catch {
        setCharacters([null, null, null, null]);
      }
    }
  };

  const handleSelectCharacter = (character: Character) => {
    localStorage.setItem('selectedCharacterId', character.character_id);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    } else {
      window.location.href = '/web/city-hub';
    }
  };

  const handleNewGame = (slot: number) => {
    if (onNewGame) {
      onNewGame(slot);
    } else {
      window.location.href = `/web/character-create?slot=${slot}`;
    }
  };

  const handleDeleteClick = (slot: number) => {
    setDeleteConfirm(slot);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm !== null) {
      const newCharacters = [...characters];
      newCharacters[deleteConfirm] = null;
      localStorage.setItem('characters', JSON.stringify(newCharacters));
      setCharacters(newCharacters);
      setDeleteConfirm(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SELECT CHARACTER</h1>

      <div style={styles.grid}>
        {characters.map((character, index) => (
          <div
            key={index}
            style={styles.slot}
            data-testid={`character-slot-${index}`}
          >
            {character ? (
              <div style={styles.characterCard}>
                <div style={styles.characterInfo}>
                  <span style={styles.characterName} data-testid="character-name">
                    {character.character_name}
                  </span>
                  <span style={styles.characterClass} data-testid="character-class">
                    {character.class_id}
                  </span>
                  <span style={styles.characterLevel} data-testid="character-level">
                    Lv. {character.level}
                  </span>
                </div>
                <div style={styles.buttonGroup}>
                  <button
                    style={styles.selectButton}
                    onClick={() => handleSelectCharacter(character)}
                    data-testid={`select-character-${index}`}
                  >
                    SELECT
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDeleteClick(index)}
                    data-testid={`delete-character-${index}`}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.emptySlot} data-testid="empty-slot">
                <span style={styles.emptyText}>Empty Slot</span>
                <button
                  style={styles.newGameButton}
                  onClick={() => handleNewGame(index)}
                  data-testid={`new-game-${index}`}
                >
                  NEW GAME
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <a href="/web/title" style={styles.backLink}>← Back to Title</a>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <p style={styles.modalText}>
              Delete {characters[deleteConfirm]?.character_name}?
            </p>
            <p style={styles.modalSubtext}>
              This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button
                style={styles.confirmButton}
                onClick={handleConfirmDelete}
                data-testid="confirm-delete"
              >
                DELETE
              </button>
              <button
                style={styles.cancelButton}
                onClick={handleCancelDelete}
                data-testid="cancel-delete"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
    color: 'white',
  },
  title: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    color: '#6bb8ff',
    letterSpacing: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    maxWidth: '800px',
    width: '100%',
  },
  slot: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
  },
  characterCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
  },
  characterInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  characterName: {
    fontSize: '0.9rem',
    color: '#ffffff',
    marginBottom: '0.5rem',
  },
  characterClass: {
    fontSize: '0.7rem',
    color: '#6bb8ff',
  },
  characterLevel: {
    fontSize: '0.7rem',
    color: '#a6c9ff',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  selectButton: {
    flex: 1,
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  deleteButton: {
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #6a2d2d 0%, #5a1a1a 100%)',
    border: '2px solid #f87171',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  emptySlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '1rem',
  },
  emptyText: {
    fontSize: '0.7rem',
    color: '#4a6a8a',
  },
  newGameButton: {
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #2d4a6a 0%, #1a3a5a 100%)',
    border: '2px solid #6bb8ff',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    cursor: 'pointer',
    letterSpacing: '2px',
  },
  backLink: {
    marginTop: '2rem',
    color: '#6bb8ff',
    textDecoration: 'none',
    fontSize: '0.7rem',
    letterSpacing: '1px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'linear-gradient(135deg, #1a2a4a 0%, #0a1628 100%)',
    border: '2px solid #6bb8ff',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    maxWidth: '400px',
  },
  modalText: {
    fontSize: '0.8rem',
    marginBottom: '0.5rem',
  },
  modalSubtext: {
    fontSize: '0.6rem',
    color: '#f87171',
    marginBottom: '1.5rem',
  },
  modalButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  confirmButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #6a2d2d 0%, #5a1a1a 100%)',
    border: '2px solid #f87171',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #2d4a6a 0%, #1a3a5a 100%)',
    border: '2px solid #6bb8ff',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
};
