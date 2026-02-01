/**
 * CharacterSelectWeb - Simple character select UI mirroring CLI
 * Shows 4 slots with select/new/delete actions
 */

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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SELECT CHARACTER</h1>

      <div style={styles.slots}>
        {characters.map((char, idx) => (
          <div key={idx} style={styles.slot} data-testid={`character-slot-${idx}`}>
            {char ? (
              <>
                <div style={styles.charInfo}>
                  <span style={styles.charName}>{char.character_name}</span>
                  <span style={styles.charClass}>{char.class_id}</span>
                  <span style={styles.charLevel}>Lv. {char.level}</span>
                </div>
                <div style={styles.actions}>
                  <button
                    style={styles.selectBtn}
                    onClick={() => handleSelectCharacter(char)}
                    data-testid={`select-character-${idx}`}
                  >
                    Select
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDeleteClick(idx)}
                    data-testid={`delete-character-${idx}`}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.emptySlot} data-testid="empty-slot">
                <span style={styles.emptyText}>-- Empty --</span>
                <button
                  style={styles.newBtn}
                  onClick={() => handleNewGame(idx)}
                  data-testid={`new-game-${idx}`}
                >
                  New Game
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <p>Delete {characters[deleteConfirm]?.character_name}?</p>
            <div style={styles.modalActions}>
              <button
                style={styles.confirmBtn}
                onClick={handleConfirmDelete}
                data-testid="confirm-delete"
              >
                Yes, Delete
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
                data-testid="cancel-delete"
              >
                Cancel
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
    background: '#1a1a2e',
    fontFamily: 'monospace',
    color: '#ccc',
    padding: '24px',
  },
  title: {
    color: '#a78bfa',
    fontSize: '18px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  slots: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
    margin: '0 auto',
  },
  slot: {
    padding: '16px',
    border: '1px solid #333',
    borderRadius: '4px',
    background: '#252540',
  },
  charInfo: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
    alignItems: 'baseline',
  },
  charName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  charClass: {
    color: '#6bf',
    fontSize: '12px',
  },
  charLevel: {
    color: '#888',
    fontSize: '12px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  selectBtn: {
    padding: '6px 16px',
    background: '#2d6a4a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  deleteBtn: {
    padding: '6px 16px',
    background: 'transparent',
    border: '1px solid #f87171',
    color: '#f87171',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  emptySlot: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
  },
  newBtn: {
    padding: '6px 16px',
    background: '#333',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  modal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    background: '#252540',
    padding: '24px',
    borderRadius: '4px',
    border: '1px solid #f87171',
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '16px',
  },
  confirmBtn: {
    padding: '8px 16px',
    background: '#7f1d1d',
    border: '1px solid #f87171',
    color: '#f87171',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  cancelBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #888',
    color: '#888',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
  },
};
