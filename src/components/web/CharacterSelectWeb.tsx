/**
 * CharacterSelectWeb - Character selection with state visualization
 * Shows character details, stats, and equipment preview
 */

import { useState, useEffect } from 'react';
import type { Character, CharacterSlots } from '../../systems/character/types';
import { getInventory } from '../../systems/inventory/inventory';
import type { InventorySlot } from '../../systems/inventory/types';

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
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<InventorySlot[]>([]);

  useEffect(() => {
    loadCharacters();
  }, []);

  // Load inventory when character is selected
  useEffect(() => {
    if (selectedSlot !== null && characters[selectedSlot]) {
      const char = characters[selectedSlot];
      if (char) {
        const inv = getInventory(char.character_id);
        setSelectedInventory(inv.items);
      }
    } else {
      setSelectedInventory([]);
    }
  }, [selectedSlot, characters]);

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
      if (selectedSlot === deleteConfirm) {
        setSelectedSlot(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const selectedCharacter = selectedSlot !== null ? characters[selectedSlot] : null;

  // Get class type for coloring
  const getClassColor = (classId: string) => {
    if (classId.toUpperCase().startsWith('HU')) return '#e94560';
    if (classId.toUpperCase().startsWith('RA')) return '#4ecca3';
    if (classId.toUpperCase().startsWith('FO')) return '#4a90d9';
    return '#888';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/web/title" style={styles.backLink} data-testid="back-to-title">← Back to Title</a>
        <h1 style={styles.title}>SELECT CHARACTER</h1>
        <div style={styles.slotCount} data-testid="slot-count">
          {characters.filter(c => c !== null).length}/4 Characters
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* Left Panel - Character Details */}
        <aside style={styles.detailsPanel} data-testid="character-details-panel">
          <h3 style={styles.panelTitle}>Character Details</h3>
          {selectedCharacter ? (
            <div style={styles.detailsContent}>
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Name</div>
                <div style={styles.detailValue} data-testid="detail-name">{selectedCharacter.character_name}</div>
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Class</div>
                <div style={{ ...styles.detailValue, color: getClassColor(selectedCharacter.class_id) }} data-testid="detail-class">
                  {selectedCharacter.class_id}
                </div>
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Level</div>
                <div style={styles.detailValue} data-testid="detail-level">{selectedCharacter.level}</div>
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Experience</div>
                <div style={styles.detailValue} data-testid="detail-exp">{selectedCharacter.experience.toLocaleString()}</div>
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Meseta</div>
                <div style={{ ...styles.detailValue, color: '#fcd34d' }} data-testid="detail-meseta">
                  {(selectedCharacter.meseta ?? 0).toLocaleString()}
                </div>
              </div>
              <div style={styles.detailSection}>
                <div style={styles.detailLabel}>Created</div>
                <div style={styles.detailValue} data-testid="detail-created">
                  {new Date(selectedCharacter.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Inventory Preview */}
              <div style={styles.inventoryPreview}>
                <div style={styles.detailLabel}>Inventory ({selectedInventory.length} items)</div>
                <div style={styles.inventoryList} data-testid="inventory-preview">
                  {selectedInventory.length > 0 ? (
                    selectedInventory.slice(0, 5).map((slot, i) => (
                      <div key={i} style={styles.inventoryItem} data-testid={`preview-item-${slot.item.id}`}>
                        {slot.item.name} x{slot.quantity}
                      </div>
                    ))
                  ) : (
                    <div style={styles.emptyText}>No items</div>
                  )}
                  {selectedInventory.length > 5 && (
                    <div style={styles.moreItems}>+{selectedInventory.length - 5} more...</div>
                  )}
                </div>
              </div>

              {/* Play Button */}
              <button
                style={styles.playButton}
                onClick={() => handleSelectCharacter(selectedCharacter)}
                data-testid="play-selected"
              >
                PLAY AS {selectedCharacter.character_name.toUpperCase()}
              </button>
            </div>
          ) : (
            <div style={styles.noSelection}>
              <p>Select a character to view details</p>
            </div>
          )}
        </aside>

        {/* Center - Character Slots */}
        <main style={styles.slotsArea}>
          <div style={styles.grid} data-testid="character-grid">
            {characters.map((character, index) => (
              <div
                key={index}
                style={{
                  ...styles.slot,
                  ...(selectedSlot === index ? styles.slotSelected : {}),
                }}
                onClick={() => setSelectedSlot(index)}
                data-testid={`character-slot-${index}`}
              >
                {character ? (
                  <div style={styles.characterCard}>
                    <div style={styles.slotHeader}>
                      <span style={styles.slotNumber}>Slot {index + 1}</span>
                      <span style={{ ...styles.classTag, background: getClassColor(character.class_id) }}>
                        {character.class_id.substring(0, 2)}
                      </span>
                    </div>
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
                      <span style={styles.characterMeseta}>
                        {(character.meseta ?? 0).toLocaleString()} Meseta
                      </span>
                    </div>
                    <div style={styles.buttonGroup}>
                      <button
                        style={styles.selectButton}
                        onClick={(e) => { e.stopPropagation(); handleSelectCharacter(character); }}
                        data-testid={`select-character-${index}`}
                      >
                        SELECT
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(index); }}
                        data-testid={`delete-character-${index}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptySlot} data-testid="empty-slot">
                    <div style={styles.slotHeader}>
                      <span style={styles.slotNumber}>Slot {index + 1}</span>
                    </div>
                    <span style={styles.emptyText}>Empty Slot</span>
                    <button
                      style={styles.newGameButton}
                      onClick={(e) => { e.stopPropagation(); handleNewGame(index); }}
                      data-testid={`new-game-${index}`}
                    >
                      + NEW GAME
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Right Panel - Quick Stats */}
        <aside style={styles.statsPanel} data-testid="stats-panel">
          <h3 style={styles.panelTitle}>Account Stats</h3>
          <div style={styles.statsContent}>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Total Characters</div>
              <div style={styles.statValue} data-testid="stat-total-chars">
                {characters.filter(c => c !== null).length}
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Highest Level</div>
              <div style={styles.statValue} data-testid="stat-highest-level">
                {Math.max(0, ...characters.filter(c => c !== null).map(c => c!.level))}
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Total Meseta</div>
              <div style={{ ...styles.statValue, color: '#fcd34d' }} data-testid="stat-total-meseta">
                {characters.filter(c => c !== null).reduce((sum, c) => sum + (c!.meseta ?? 0), 0).toLocaleString()}
              </div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statLabel}>Total Play Time</div>
              <div style={styles.statValue} data-testid="stat-playtime">
                --:--:--
              </div>
            </div>
          </div>

          <div style={styles.classBreakdown}>
            <div style={styles.statLabel}>Classes</div>
            <div style={styles.classStats}>
              <div style={styles.classStat}>
                <span style={{ color: '#e94560' }}>HU</span>
                <span data-testid="stat-hunters">{characters.filter(c => c?.class_id.toUpperCase().startsWith('HU')).length}</span>
              </div>
              <div style={styles.classStat}>
                <span style={{ color: '#4ecca3' }}>RA</span>
                <span data-testid="stat-rangers">{characters.filter(c => c?.class_id.toUpperCase().startsWith('RA')).length}</span>
              </div>
              <div style={styles.classStat}>
                <span style={{ color: '#4a90d9' }}>FO</span>
                <span data-testid="stat-forces">{characters.filter(c => c?.class_id.toUpperCase().startsWith('FO')).length}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div style={styles.modal} data-testid="delete-modal">
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Delete Character?</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete <strong>{characters[deleteConfirm]?.character_name}</strong>?
            </p>
            <p style={styles.modalSubtext}>
              This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={handleCancelDelete}
                data-testid="cancel-delete"
              >
                CANCEL
              </button>
              <button
                style={styles.confirmButton}
                onClick={handleConfirmDelete}
                data-testid="confirm-delete"
              >
                DELETE
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
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 24px',
    background: '#16213e',
    borderBottom: '2px solid #0f3460',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    color: '#6bb8ff',
    textDecoration: 'none',
    fontSize: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#6bb8ff',
    letterSpacing: '4px',
  },
  slotCount: {
    fontSize: '12px',
    color: '#888',
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  detailsPanel: {
    width: '280px',
    padding: '16px',
    background: '#16213e',
    borderRight: '2px solid #0f3460',
    overflowY: 'auto',
  },
  panelTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#e94560',
    borderBottom: '1px solid #3a5a8a',
    paddingBottom: '8px',
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '13px',
    color: '#fff',
  },
  inventoryPreview: {
    marginTop: '12px',
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  inventoryList: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inventoryItem: {
    fontSize: '11px',
    color: '#aaa',
    padding: '4px 8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '2px',
  },
  moreItems: {
    fontSize: '10px',
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '4px',
  },
  playButton: {
    marginTop: '16px',
    padding: '12px',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
  },
  noSelection: {
    color: '#666',
    fontSize: '12px',
    textAlign: 'center',
    padding: '24px',
  },
  slotsArea: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    maxWidth: '700px',
    margin: '0 auto',
  },
  slot: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '16px',
    minHeight: '180px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  slotSelected: {
    borderColor: '#4ecca3',
    background: 'rgba(74, 222, 128, 0.05)',
  },
  slotHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  slotNumber: {
    fontSize: '10px',
    color: '#666',
    textTransform: 'uppercase',
  },
  classTag: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '2px',
    color: 'white',
    fontWeight: 'bold',
  },
  characterCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  characterInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  characterName: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  characterClass: {
    fontSize: '12px',
    color: '#6bb8ff',
  },
  characterLevel: {
    fontSize: '11px',
    color: '#a6c9ff',
  },
  characterMeseta: {
    fontSize: '10px',
    color: '#fcd34d',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  selectButton: {
    flex: 1,
    padding: '8px',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #6a2d2d 0%, #5a1a1a 100%)',
    border: '2px solid #f87171',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
  },
  emptySlot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
  },
  emptyText: {
    fontSize: '12px',
    color: '#4a6a8a',
  },
  newGameButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #2d4a6a 0%, #1a3a5a 100%)',
    border: '2px solid #6bb8ff',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  statsPanel: {
    width: '220px',
    padding: '16px',
    background: '#16213e',
    borderLeft: '2px solid #0f3460',
    overflowY: 'auto',
  },
  statsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '10px',
    color: '#888',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: 'bold',
  },
  classBreakdown: {
    marginTop: '24px',
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '4px',
  },
  classStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '12px',
  },
  classStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
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
    background: '#16213e',
    border: '2px solid #e94560',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#e94560',
  },
  modalText: {
    fontSize: '12px',
    marginBottom: '8px',
  },
  modalSubtext: {
    fontSize: '10px',
    color: '#f87171',
    marginBottom: '24px',
  },
  modalButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  confirmButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #6a2d2d 0%, #5a1a1a 100%)',
    border: '2px solid #f87171',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: '10px 24px',
    background: 'transparent',
    border: '2px solid #6bb8ff',
    borderRadius: '4px',
    color: '#6bb8ff',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
