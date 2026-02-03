/**
 * GamePlayWeb - Integrated game interface
 * Center content swaps based on location, stats/inventory always visible
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { execute, resetState, getState, getAvailableCommands } from '../../cli/api';
import type { DetailedItem } from '../../cli/types';
import {
  getShopItems,
  purchaseItem,
  canAfford,
  formatPrice,
  initializeDefaultShops,
  SHOP_IDS,
} from '../../systems/shop';
import type { ShopItem } from '../../systems/shop/types';
import {
  getAllFields,
  isFieldUnlocked,
  initializeDefaultFields,
} from '../../systems/field';
import type { Field } from '../../systems/field/types';
import type { Difficulty } from '../../systems/mission/types';
import { meetsLevelForDifficulty } from '../../systems/mission';
import { VALID_CLASS_IDS, MAX_SLOTS } from '../../systems/character/types';
import type { Character, CharacterSlots } from '../../systems/character/types';
import {
  loadGameData,
  saveGameData,
  resetAllGameData,
  type PersistedCharacterData,
  type PersistedGameData,
} from '../../systems/persistence';

export default function GamePlayWeb() {
  const [gameState, setGameState] = useState<ReturnType<typeof getState> | null>(null);
  const [logs, setLogs] = useState<{ id: number; message: string }[]>([]);
  const [logCounter, setLogCounter] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [shopTab, setShopTab] = useState<'items' | 'weapons'>('items');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  // Character slot management
  const [characterSlots, setCharacterSlots] = useState<CharacterSlots>([null, null, null, null]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game systems and load persisted data
  useEffect(() => {
    const initGame = async () => {
      initializeDefaultShops();
      initializeDefaultFields();
      resetState();

      // Load persisted game data from IndexedDB
      const gameData = await loadGameData();

      // Convert persisted data to character slots
      const slots: CharacterSlots = [null, null, null, null];
      for (let i = 0; i < 4; i++) {
        const charData = gameData.characters[i];
        if (charData) {
          slots[i] = charData.character;
        }
      }
      setCharacterSlots(slots);

      // If there was a last active slot with a character, auto-select it
      if (gameData.lastActiveSlot !== null && slots[gameData.lastActiveSlot]) {
        const char = slots[gameData.lastActiveSlot]!;
        const charData = gameData.characters[gameData.lastActiveSlot];
        if (charData) {
          // Load the full character state including inventory
          loadCharacterWithData(char, gameData.lastActiveSlot, charData);
        }
      }

      refreshState();
      setIsLoading(false);
      addLog('Welcome! Select or create a character to begin.');
    };

    initGame();
  }, []);

  // Auto-save game state when it changes (debounced)
  useEffect(() => {
    if (isLoading || activeSlot === null || !gameState?.character) return;

    // Debounce saves to avoid too many writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCurrentCharacter();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState, activeSlot, isLoading]);

  const loadCharacterWithData = (character: Character, slot: number, data: PersistedCharacterData) => {
    // Load character into game state
    const charJson = JSON.stringify(character);
    execute(`load-character ${charJson}`);

    // Restore inventory
    if (data.inventory) {
      for (const entry of data.inventory) {
        execute(`add-item ${JSON.stringify(entry.item)} ${entry.quantity}`);
      }
    }

    // Restore equipment
    if (data.equipment?.weapon) {
      execute(`equip-weapon ${data.equipment.weapon.id}`);
    }
    if (data.equipment?.frame) {
      execute(`equip-frame ${data.equipment.frame.id}`);
    }

    setActiveSlot(slot);
  };

  const saveCurrentCharacter = async () => {
    if (activeSlot === null || !gameState?.character) return;

    const gameData = await loadGameData();

    // Build persisted character data from current state
    const charData: PersistedCharacterData = {
      character: gameState.character,
      inventory: gameState.inventory?.map(item => ({
        item: item as any, // Full item data
        quantity: item.quantity,
      })) || [],
      equipment: {
        weapon: (gameState.equipment?.weapon as any) || null,
        frame: (gameState.equipment?.frame as any) || null,
      },
      completedMissions: [], // TODO: track from mission system
      completedFields: [], // TODO: track from field system
    };

    gameData.characters[activeSlot] = charData;
    gameData.lastActiveSlot = activeSlot;
    await saveGameData(gameData);
  };

  const handleSelectCharacter = async (character: Character, slot: number) => {
    // Save current character before switching
    if (activeSlot !== null) {
      await saveCurrentCharacter();
    }

    // Load persisted data for this character
    const gameData = await loadGameData();
    const charData = gameData.characters[slot];

    if (charData) {
      loadCharacterWithData(character, slot, charData);
    } else {
      // No persisted data, just load character
      const charJson = JSON.stringify(character);
      execute(`load-character ${charJson}`);
      setActiveSlot(slot);
    }

    refreshState();
    addLog(`Selected ${character.character_name} (${character.class_id})`);
    setSelectedSlot(null);

    // Update last active slot
    gameData.lastActiveSlot = slot;
    await saveGameData(gameData);
  };

  const handleCreateCharacter = async (classId: string) => {
    if (selectedSlot === null) return;

    const result = executeCommand(`create-character ${classId} Hero`);
    if (result.success) {
      // Get the created character from game state
      const newState = getState();
      if (newState.character) {
        const newSlots = [...characterSlots] as CharacterSlots;
        const newChar = { ...newState.character, slot: selectedSlot };
        newSlots[selectedSlot] = newChar;
        setCharacterSlots(newSlots);
        setActiveSlot(selectedSlot);

        // Save to IndexedDB
        const gameData = await loadGameData();
        gameData.characters[selectedSlot] = {
          character: newChar,
          inventory: newState.inventory?.map(item => ({
            item: item as any,
            quantity: item.quantity,
          })) || [],
          equipment: {
            weapon: (newState.equipment?.weapon as any) || null,
            frame: (newState.equipment?.frame as any) || null,
          },
          completedMissions: [],
          completedFields: [],
        };
        gameData.lastActiveSlot = selectedSlot;
        await saveGameData(gameData);

        addLog(`Created ${newState.character.character_name} in slot ${selectedSlot + 1}`);
      }
    }
    setSelectedSlot(null);
  };

  const handleDeleteCharacter = async () => {
    if (deleteConfirm === null) return;

    const charToDelete = characterSlots[deleteConfirm];
    const newSlots = [...characterSlots] as CharacterSlots;
    newSlots[deleteConfirm] = null;
    setCharacterSlots(newSlots);

    // Update IndexedDB
    const gameData = await loadGameData();
    gameData.characters[deleteConfirm] = null;
    if (gameData.lastActiveSlot === deleteConfirm) {
      gameData.lastActiveSlot = null;
    }
    await saveGameData(gameData);

    // If this was the active character, reset game state
    if (gameState?.character?.character_id === charToDelete?.character_id) {
      resetState();
      setActiveSlot(null);
      refreshState();
    }

    addLog(`Deleted character from slot ${deleteConfirm + 1}`);
    setDeleteConfirm(null);
  };

  const handleResetAll = async () => {
    // Reset all persisted data
    await resetAllGameData();

    // Reset in-memory state
    resetState();
    setCharacterSlots([null, null, null, null]);
    setActiveSlot(null);
    setResetConfirm(false);
    refreshState();

    addLog('All game data has been reset.');
  };

  const refreshState = useCallback(() => {
    setGameState(getState());
  }, []);

  const addLog = useCallback((message: string) => {
    setLogCounter(prev => {
      const newId = prev + 1;
      setLogs(logs => [...logs.slice(-20), { id: newId, message }]);
      return newId;
    });
  }, []);

  const executeCommand = useCallback((command: string) => {
    const result = execute(command);
    addLog(`> ${command}\n${result.message}`);
    refreshState();
    return result;
  }, [addLog, refreshState]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      executeCommand(commandInput.trim());
      setCommandInput('');
    }
  };

  // Shop actions
  const handleBuyItem = (item: ShopItem) => {
    if (!gameState?.character) return;
    const shopId = shopTab === 'weapons' ? SHOP_IDS.WEAPON_SHOP : SHOP_IDS.ITEM_SHOP;
    const result = purchaseItem(shopId, item.id, 1, gameState.character.meseta ?? 0);
    if (result.success) {
      // Update via CLI to sync state
      executeCommand(`buy ${item.id}`);
    } else {
      addLog(result.message);
    }
  };

  // Field actions
  const handleEnterField = (field: Field) => {
    executeCommand(`enter-field ${field.id} ${difficulty}`);
  };

  // Location-based content renderers
  const renderCityContent = () => (
    <div style={styles.locationContent}>
      <h2 style={styles.locationTitle}>DAIRON CITY</h2>
      <div style={styles.cityMenu}>
        <button
          style={styles.cityButton}
          onClick={() => executeCommand('goto shop')}
          data-testid="goto-shop"
        >
          Item Shop
        </button>
        <button
          style={styles.cityButton}
          onClick={() => executeCommand('goto teleporter')}
          data-testid="goto-teleporter"
        >
          Teleporter
        </button>
        <button
          style={styles.cityButton}
          onClick={() => executeCommand('goto guild')}
          data-testid="goto-guild"
        >
          Guild Counter
        </button>
        <button
          style={styles.cityButton}
          onClick={() => executeCommand('goto inventory')}
          data-testid="goto-inventory"
        >
          Inventory
        </button>
      </div>
    </div>
  );

  const renderShopContent = () => {
    const shopId = shopTab === 'weapons' ? SHOP_IDS.WEAPON_SHOP : SHOP_IDS.ITEM_SHOP;
    const items = getShopItems(shopId);
    const meseta = gameState?.character?.meseta ?? 0;

    return (
      <div style={styles.locationContent}>
        <div style={styles.locationHeader}>
          <h2 style={styles.locationTitle}>ITEM SHOP</h2>
          <button style={styles.backBtn} onClick={() => executeCommand('goto city')}>← Back</button>
        </div>

        <div style={styles.tabs}>
          <button
            style={shopTab === 'items' ? styles.tabActive : styles.tab}
            onClick={() => setShopTab('items')}
          >
            Items
          </button>
          <button
            style={shopTab === 'weapons' ? styles.tabActive : styles.tab}
            onClick={() => setShopTab('weapons')}
          >
            Weapons
          </button>
        </div>

        <div style={styles.itemList}>
          {items.map(item => {
            const affordable = canAfford(meseta, item);
            return (
              <div key={item.id} style={styles.itemRow} data-testid={`shop-item-${item.id}`}>
                <span style={styles.itemName}>{item.name}</span>
                <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
                <button
                  style={affordable ? styles.buyBtn : styles.buyBtnDisabled}
                  onClick={() => handleBuyItem(item)}
                  disabled={!affordable}
                  data-testid={`buy-${item.id}`}
                >
                  Buy
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTeleporterContent = () => {
    const fields = getAllFields();
    const charId = gameState?.character?.character_id ?? '';
    const level = gameState?.character?.level ?? 1;

    return (
      <div style={styles.locationContent}>
        <div style={styles.locationHeader}>
          <h2 style={styles.locationTitle}>TELEPORTER</h2>
          <button style={styles.backBtn} onClick={() => executeCommand('goto city')}>← Back</button>
        </div>

        <p style={styles.locationDesc}>Select a field to explore freely.</p>

        <div style={styles.difficultyRow}>
          <span style={styles.diffLabel}>Difficulty:</span>
          {(['normal', 'hard', 'super-hard'] as Difficulty[]).map(diff => {
            const enabled = meetsLevelForDifficulty(level, diff);
            return (
              <button
                key={diff}
                style={!enabled ? styles.diffDisabled : difficulty === diff ? styles.diffActive : styles.diff}
                onClick={() => enabled && setDifficulty(diff)}
                disabled={!enabled}
                data-testid={`difficulty-${diff}`}
              >
                {diff}
              </button>
            );
          })}
        </div>

        <div style={styles.itemList}>
          {fields.map(field => {
            const unlocked = isFieldUnlocked(field.id, charId, level);
            return (
              <div key={field.id} style={styles.itemRow} data-testid={`field-${field.id}`}>
                <span style={unlocked ? styles.itemName : styles.itemNameLocked}>{field.name}</span>
                <span style={styles.fieldLevel}>Lv.{field.recommendedLevel}</span>
                <button
                  style={unlocked ? styles.buyBtn : styles.buyBtnDisabled}
                  onClick={() => handleEnterField(field)}
                  disabled={!unlocked}
                  data-testid={`enter-field-${field.id}`}
                >
                  {unlocked ? 'Enter' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGuildContent = () => {
    // Get missions from the list-missions command
    const missionsResult = execute('list-missions');
    const missions = missionsResult.data as Array<{
      id: string;
      name: string;
      description: string;
      areaId: string;
      requiredLevel: number;
      recommendedLevel: number;
      rewards: { baseExp: number; baseMeseta: number };
      unlocked: boolean;
    }> || [];

    const handleAcceptMission = (missionId: string) => {
      executeCommand(`enter-mission ${missionId} normal`);
    };

    return (
      <div style={styles.locationContent}>
        <div style={styles.locationHeader}>
          <h2 style={styles.locationTitle}>GUILD COUNTER</h2>
          <button style={styles.backBtn} onClick={() => executeCommand('goto city')}>← Back</button>
        </div>

        <p style={styles.locationDesc}>Accept missions for rewards.</p>

        <div style={styles.missionList}>
          {missions.map((mission) => (
            <div key={mission.id} style={styles.missionItem}>
              <div style={styles.missionInfo}>
                <span style={mission.unlocked ? styles.missionName : styles.missionNameLocked}>
                  {mission.name}
                </span>
                <span style={styles.missionArea}>Lv.{mission.recommendedLevel} - {mission.areaId}</span>
              </div>
              <span style={styles.missionReward}>
                {mission.rewards.baseExp} EXP + {mission.rewards.baseMeseta} Meseta
              </span>
              {mission.unlocked ? (
                <button
                  style={styles.buyBtn}
                  onClick={() => handleAcceptMission(mission.id)}
                  data-testid={`accept-${mission.id}`}
                >
                  Accept
                </button>
              ) : (
                <button style={styles.buyBtnDisabled} disabled>
                  Locked
                </button>
              )}
            </div>
          ))}
          {missions.length === 0 && (
            <p style={styles.emptyMessage}>No missions available.</p>
          )}
        </div>
      </div>
    );
  };

  const renderFieldContent = () => {
    const combat = gameState?.playerCombat;
    const enemies = gameState?.enemies || [];
    const drops = gameState?.droppedItems || [];
    const hasEnemies = enemies.length > 0;
    const hasDrops = drops.length > 0;
    const consumables = gameState?.inventory?.filter(i => i.type === 'consumable') || [];

    const currentStage = gameState?.currentStage;
    const stageTitle = currentStage
      ? `${currentStage.areaName} ${currentStage.variantName}`
      : `Stage ${(gameState?.stageIndex ?? 0) + 1}`;
    const waveInfo = gameState?.totalWaves && gameState.totalWaves > 1
      ? ` (Wave ${gameState.currentWave}/${gameState.totalWaves})`
      : '';

    return (
      <div style={styles.locationContent}>
        <div style={styles.locationHeader}>
          <h2 style={styles.locationTitle}>FIELD - {stageTitle}{waveInfo}</h2>
          <button
            style={styles.telepipeBtn}
            onClick={() => executeCommand('use-telepipe')}
            data-testid="use-telepipe"
          >
            Telepipe
          </button>
        </div>

        {/* Player HP/TP */}
        {combat && (
          <div style={styles.playerStatus}>
            <div style={styles.statBar}>
              <span style={styles.statLabel}>HP</span>
              <div style={styles.barOuter}>
                <div style={{ ...styles.barInner, width: `${(combat.hp / combat.maxHp) * 100}%`, background: '#4ade80' }} />
              </div>
              <span style={styles.statNum}>{combat.hp}/{combat.maxHp}</span>
            </div>
            <div style={styles.statBar}>
              <span style={styles.statLabel}>TP</span>
              <div style={styles.barOuter}>
                <div style={{ ...styles.barInner, width: `${(combat.tp / combat.maxTp) * 100}%`, background: '#60a5fa' }} />
              </div>
              <span style={styles.statNum}>{combat.tp}/{combat.maxTp}</span>
            </div>
          </div>
        )}

        {/* Enemies */}
        {hasEnemies && (
          <div style={styles.enemySection}>
            <h3 style={styles.sectionTitle}>ENEMIES</h3>
            <div style={styles.enemyList}>
              {enemies.map((enemy, idx) => (
                <div key={enemy.id} style={styles.enemyRow}>
                  <div style={styles.enemyInfo}>
                    <span style={styles.enemyName}>{enemy.name}</span>
                    <div style={styles.enemyHpBar}>
                      <div style={{
                        ...styles.barInner,
                        width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                        background: '#ef4444'
                      }} />
                    </div>
                    <span style={styles.enemyHp}>{enemy.hp}/{enemy.maxHp}</span>
                  </div>
                  <button
                    style={styles.attackBtn}
                    onClick={() => executeCommand(`attack ${idx}`)}
                    data-testid={`attack-${idx}`}
                  >
                    Attack
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropped Items */}
        {hasDrops && (
          <div style={styles.dropsSection}>
            <h3 style={styles.sectionTitle}>DROPPED ITEMS</h3>
            <div style={styles.dropsList}>
              {drops.map(drop => (
                <button
                  key={drop.dropId}
                  style={drop.type === 'meseta' ? styles.mesetaDropBtn : styles.dropBtn}
                  onClick={() => executeCommand(`pickup-item ${drop.dropId}`)}
                  data-testid={`pickup-${drop.dropId}`}
                >
                  {drop.name}
                </button>
              ))}
              {drops.length > 1 && (
                <button
                  style={styles.pickupAllBtn}
                  onClick={() => executeCommand('pickup-all')}
                  data-testid="pickup-all"
                >
                  Pick Up All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stage Complete - different UI for final stage vs intermediate stages */}
        {!hasEnemies && !hasDrops && combat && (
          gameState?.isAtFinalStage ? (
            <div style={styles.fieldComplete}>
              <p style={styles.fieldCompleteText}>Field Complete!</p>
              <button
                style={styles.returnBtn}
                onClick={() => executeCommand('complete-field')}
                data-testid="complete-field"
              >
                Return to City
              </button>
            </div>
          ) : (
            <div style={styles.stageComplete}>
              <p style={styles.stageCompleteText}>Stage Clear!</p>
              <button
                style={styles.nextStageBtn}
                onClick={() => executeCommand('next-stage')}
                data-testid="next-stage"
              >
                Next Stage
              </button>
            </div>
          )
        )}

        {/* Quick Items */}
        {consumables.length > 0 && (
          <div style={styles.quickItems}>
            <h3 style={styles.sectionTitle}>ITEMS</h3>
            <div style={styles.itemBtns}>
              {consumables.slice(0, 4).map(item => (
                <button
                  key={item.id}
                  style={styles.itemBtn}
                  onClick={() => executeCommand(`use-item ${item.id}`)}
                  data-testid={`use-${item.id}`}
                >
                  {item.name} x{item.quantity}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInventoryContent = () => (
    <div style={styles.locationContent}>
      <div style={styles.locationHeader}>
        <h2 style={styles.locationTitle}>INVENTORY</h2>
        <button style={styles.backBtn} onClick={() => executeCommand('goto city')}>← Back</button>
      </div>
      <div style={styles.inventoryGrid}>
        {gameState?.inventory && gameState.inventory.length > 0 ? (
          gameState.inventory.map(item => (
            <div key={item.id} style={styles.invCard} data-testid={`inv-item-${item.id}`}>
              <div style={styles.invItemName}>{item.name}</div>
              <div style={styles.invItemQty}>x{item.quantity}</div>
              {item.type === 'weapon' && <div style={styles.invItemStat}>ATK: {item.attack}</div>}
              {item.type === 'consumable' && <div style={styles.invItemEffect}>{item.effect}</div>}
            </div>
          ))
        ) : (
          <div style={styles.emptyText}>No items</div>
        )}
      </div>
    </div>
  );

  // Group classes by race for display
  const CLASS_GROUPS = {
    Human: ['HUmar', 'HUmarl', 'RAmar', 'RAmarl', 'FOmar', 'FOmarl'],
    Newman: ['HUnewm', 'HUnewearl', 'FOnewm', 'FOnewearl'],
    Cast: ['HUcast', 'HUcaseal', 'RAcast', 'RAcaseal'],
  };

  const renderCharacterSlots = () => (
    <div style={styles.locationContent}>
      <h2 style={styles.locationTitle}>SELECT CHARACTER</h2>
      <div style={styles.slotList}>
        {characterSlots.map((char, idx) => (
          <div key={idx} style={styles.slotRow} data-testid={`character-slot-${idx}`}>
            {char ? (
              <>
                <div style={styles.slotInfo}>
                  <span style={styles.slotName}>{char.character_name}</span>
                  <span style={styles.slotClass}>{char.class_id}</span>
                  <span style={styles.slotLevel}>Lv.{char.level}</span>
                </div>
                <div style={styles.slotActions}>
                  <button
                    style={styles.selectBtn}
                    onClick={() => handleSelectCharacter(char, idx)}
                    data-testid={`select-character-${idx}`}
                  >
                    Select
                  </button>
                  <button
                    style={styles.deleteSmallBtn}
                    onClick={() => setDeleteConfirm(idx)}
                    data-testid={`delete-character-${idx}`}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.emptySlotRow}>
                <span style={styles.emptySlotText}>Slot {idx + 1} - Empty</span>
                <button
                  style={styles.newGameBtn}
                  onClick={() => setSelectedSlot(idx)}
                  data-testid={`new-game-${idx}`}
                >
                  New Game
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reset All Button */}
      <div style={styles.resetSection}>
        <button
          style={styles.resetAllBtn}
          onClick={() => setResetConfirm(true)}
          data-testid="reset-all-btn"
        >
          Reset All Data
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <p style={styles.modalText}>
              Delete {characterSlots[deleteConfirm]?.character_name}?
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.confirmDeleteBtn}
                onClick={handleDeleteCharacter}
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

      {/* Reset All Confirmation Modal */}
      {resetConfirm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <p style={styles.modalText}>
              Reset ALL game data? This will delete all characters and cannot be undone.
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.confirmDeleteBtn}
                onClick={handleResetAll}
                data-testid="confirm-reset"
              >
                Yes, Reset Everything
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setResetConfirm(false)}
                data-testid="cancel-reset"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClassSelection = () => (
    <div style={styles.locationContent}>
      <div style={styles.locationHeader}>
        <h2 style={styles.locationTitle}>SELECT CLASS - Slot {(selectedSlot ?? 0) + 1}</h2>
        <button style={styles.backBtn} onClick={() => setSelectedSlot(null)}>← Back</button>
      </div>
      <div style={styles.classGroups}>
        {Object.entries(CLASS_GROUPS).map(([race, classes]) => (
          <div key={race} style={styles.classGroup}>
            <h3 style={styles.raceName}>{race}</h3>
            <div style={styles.createMenu}>
              {classes.map(classId => (
                <button
                  key={classId}
                  style={styles.classBtn}
                  onClick={() => handleCreateCharacter(classId)}
                  data-testid={`create-${classId}`}
                >
                  {classId}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNoCharacter = () => {
    // If a slot is selected, show class selection
    if (selectedSlot !== null) {
      return renderClassSelection();
    }
    // Otherwise show character slots
    return renderCharacterSlots();
  };

  const renderLocationContent = () => {
    if (!gameState?.character) return renderNoCharacter();

    switch (gameState.location) {
      case 'city': return renderCityContent();
      case 'shop': return renderShopContent();
      case 'teleporter': return renderTeleporterContent();
      case 'guild': return renderGuildContent();
      case 'field': return renderFieldContent();
      case 'inventory': return renderInventoryContent();
      default: return renderCityContent();
    }
  };

  return (
    <div style={styles.container} data-testid="gameplay">
      {/* Header */}
      <header style={styles.header}>
        <span style={styles.title}>PSZ</span>
        <span style={styles.location} data-testid="current-location">
          {gameState?.location?.toUpperCase() || 'TITLE'}
        </span>
        <button
          style={styles.resetBtn}
          onClick={() => { resetState(); refreshState(); setLogs([]); addLog('Game reset.'); }}
          data-testid="reset-game"
        >
          Reset
        </button>
      </header>

      <div style={styles.main}>
        {/* Left - Stats */}
        <aside style={styles.statsPanel} data-testid="stats-panel">
          <h3 style={styles.panelTitle}>CHARACTER</h3>
          {gameState?.character ? (
            <>
              <div style={styles.statRow}>
                <span>Name</span>
                <span data-testid="char-name">{gameState.character.character_name}</span>
              </div>
              <div style={styles.statRow}>
                <span>Class</span>
                <span data-testid="char-class">{gameState.character.class_id}</span>
              </div>
              <div style={styles.statRow}>
                <span>Level</span>
                <span data-testid="char-level">{gameState.character.level}</span>
              </div>
              <div style={styles.statRow}>
                <span>EXP</span>
                <span data-testid="char-exp">{gameState.character.experience}</span>
              </div>
              <div style={styles.statRow}>
                <span>Meseta</span>
                <span style={styles.meseta} data-testid="char-meseta">
                  {(gameState.character.meseta ?? 0).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <div style={styles.noChar}>No character</div>
          )}

          {/* Log */}
          <h3 style={{ ...styles.panelTitle, marginTop: '16px' }}>LOG</h3>
          <div style={styles.logPanel} data-testid="game-log">
            {logs.map(log => (
              <div key={log.id} style={styles.logEntry}>{log.message}</div>
            ))}
          </div>
        </aside>

        {/* Center - Location Content */}
        <main style={styles.centerPanel}>
          {renderLocationContent()}

          {/* Command Input */}
          <form onSubmit={handleCommandSubmit} style={styles.commandBar}>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Type command..."
              data-testid="command-input"
              style={styles.commandInput}
            />
            <button type="submit" style={styles.commandBtn} data-testid="submit-command">
              Run
            </button>
          </form>
        </main>

        {/* Right - Inventory */}
        <aside style={styles.inventoryPanel} data-testid="inventory-panel">
          <h3 style={styles.panelTitle}>INVENTORY</h3>
          <div style={styles.invList}>
            {gameState?.inventory && gameState.inventory.length > 0 ? (
              gameState.inventory.map(item => (
                <div key={item.id} style={styles.invRow} data-testid={`sidebar-inv-${item.id}`}>
                  <span>{item.name}</span>
                  <span style={styles.invQty}>x{item.quantity}</span>
                </div>
              ))
            ) : (
              <div style={styles.emptyText}>Empty</div>
            )}
          </div>

          <h3 style={{ ...styles.panelTitle, marginTop: '16px' }}>EQUIPMENT</h3>
          <div style={styles.equipList}>
            {['weapon', 'frame', 'barrier'].map(slot => {
              const item = gameState?.equipment?.[slot as keyof typeof gameState.equipment];
              return (
                <div key={slot} style={styles.equipRow} data-testid={`equip-slot-${slot}`}>
                  <span style={styles.equipLabel}>{slot}</span>
                  <span style={item ? styles.equipItem : styles.equipEmpty}>
                    {item?.name || '--'}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    fontFamily: 'monospace',
    color: '#ccc',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#16213e',
    borderBottom: '1px solid #333',
  },
  title: { color: '#4ade80', fontWeight: 'bold', fontSize: '16px' },
  location: { color: '#a78bfa', fontSize: '12px' },
  resetBtn: {
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid #666',
    color: '#888',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  statsPanel: {
    width: '180px',
    padding: '12px',
    background: '#16213e',
    borderRight: '1px solid #333',
    overflowY: 'auto',
  },
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  inventoryPanel: {
    width: '180px',
    padding: '12px',
    background: '#16213e',
    borderLeft: '1px solid #333',
    overflowY: 'auto',
  },
  panelTitle: {
    margin: '0 0 8px 0',
    fontSize: '11px',
    color: '#e94560',
    letterSpacing: '1px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    marginBottom: '4px',
  },
  meseta: { color: '#fcd34d' },
  noChar: { color: '#555', fontSize: '11px' },
  logPanel: {
    maxHeight: '200px',
    overflowY: 'auto',
    fontSize: '10px',
  },
  logEntry: {
    padding: '4px',
    marginBottom: '2px',
    background: '#0d1117',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  locationContent: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
  },
  locationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  locationTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#a78bfa',
  },
  backBtn: {
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  cityMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '200px',
  },
  cityButton: {
    padding: '12px 16px',
    background: '#252540',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  tab: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #444',
    color: '#888',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  tabActive: {
    padding: '6px 12px',
    background: '#333',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    background: '#252540',
    borderRadius: '2px',
  },
  itemName: { flex: 1, color: '#fff' },
  itemNameLocked: { flex: 1, color: '#555' },
  itemPrice: { color: '#4ade80', width: '80px', textAlign: 'right' },
  fieldLevel: { color: '#888', width: '60px' },
  buyBtn: {
    padding: '4px 12px',
    background: '#2d6a4a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  buyBtnDisabled: {
    padding: '4px 12px',
    background: '#333',
    border: '1px solid #555',
    color: '#555',
    fontFamily: 'monospace',
    cursor: 'not-allowed',
  },
  difficultyRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '12px',
  },
  diffLabel: { color: '#888', fontSize: '11px' },
  diff: {
    padding: '4px 8px',
    background: 'transparent',
    border: '1px solid #444',
    color: '#888',
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'pointer',
  },
  diffActive: {
    padding: '4px 8px',
    background: '#333',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'pointer',
  },
  diffDisabled: {
    padding: '4px 8px',
    background: 'transparent',
    border: '1px solid #333',
    color: '#444',
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'not-allowed',
  },
  fieldStatus: {
    textAlign: 'center',
    padding: '24px',
  },
  telepipeBtn: {
    padding: '8px 16px',
    background: '#4a4a2d',
    border: '1px solid #fcd34d',
    color: '#fcd34d',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  inventoryGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  invCard: {
    padding: '8px',
    background: '#252540',
    border: '1px solid #3a5a8a',
    borderRadius: '4px',
    minWidth: '100px',
  },
  invItemName: { color: '#fff', fontSize: '12px' },
  invItemQty: { color: '#888', fontSize: '10px' },
  invItemStat: { color: '#e94560', fontSize: '10px' },
  invItemEffect: { color: '#4ade80', fontSize: '10px' },
  createMenu: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  classBtn: {
    padding: '12px 20px',
    background: '#252540',
    border: '1px solid #a78bfa',
    color: '#a78bfa',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  // Character slot styles
  slotList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '450px',
  },
  slotRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#252540',
    border: '1px solid #333',
    borderRadius: '4px',
  },
  slotInfo: {
    display: 'flex',
    gap: '16px',
    alignItems: 'baseline',
  },
  slotName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  slotClass: {
    color: '#6bf',
    fontSize: '11px',
  },
  slotLevel: {
    color: '#888',
    fontSize: '11px',
  },
  slotActions: {
    display: 'flex',
    gap: '8px',
  },
  selectBtn: {
    padding: '6px 12px',
    background: '#2d6a4a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  deleteSmallBtn: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #f87171',
    color: '#f87171',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  emptySlotRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  emptySlotText: {
    color: '#555',
    fontSize: '12px',
  },
  newGameBtn: {
    padding: '6px 16px',
    background: '#333',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  modal: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalContent: {
    background: '#252540',
    padding: '24px',
    borderRadius: '4px',
    border: '1px solid #f87171',
    textAlign: 'center' as const,
  },
  modalText: {
    color: '#fff',
    marginBottom: '16px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  confirmDeleteBtn: {
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
  resetSection: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #333',
    textAlign: 'center' as const,
  },
  resetAllBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #666',
    color: '#666',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
    fontSize: '11px',
  },
  classGroups: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  classGroup: {
    marginBottom: '8px',
  },
  raceName: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#e94560',
    letterSpacing: '1px',
  },
  commandBar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    background: '#16213e',
    borderTop: '1px solid #333',
  },
  commandInput: {
    flex: 1,
    padding: '8px',
    background: '#0d1117',
    border: '1px solid #333',
    color: '#fff',
    fontFamily: 'monospace',
  },
  commandBtn: {
    padding: '8px 16px',
    background: '#e94560',
    border: 'none',
    color: '#fff',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  invList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  invRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    padding: '4px',
    background: '#0d1117',
  },
  invQty: { color: '#666' },
  emptyText: { color: '#555', fontSize: '10px' },
  equipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  equipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    padding: '4px',
    background: '#0d1117',
  },
  equipLabel: { color: '#666', textTransform: 'capitalize' },
  equipItem: { color: '#4ade80' },
  equipEmpty: { color: '#444' },
  // Field combat styles
  playerStatus: {
    marginBottom: '16px',
    padding: '12px',
    background: '#252540',
    borderRadius: '4px',
  },
  statBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  statLabel: {
    width: '24px',
    fontSize: '11px',
    color: '#888',
  },
  barOuter: {
    flex: 1,
    height: '12px',
    background: '#1a1a2e',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  barInner: {
    height: '100%',
    transition: 'width 0.2s',
  },
  statNum: {
    width: '70px',
    fontSize: '10px',
    color: '#888',
    textAlign: 'right',
  },
  fieldActions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  actionBtn: {
    padding: '8px 16px',
    background: '#2d6a4a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '11px',
    color: '#e94560',
  },
  enemySection: {
    marginBottom: '16px',
  },
  enemyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  enemyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    background: '#252540',
    borderRadius: '4px',
  },
  enemyInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  enemyName: {
    width: '100px',
    fontSize: '11px',
    color: '#fff',
  },
  enemyHpBar: {
    flex: 1,
    height: '8px',
    background: '#1a1a2e',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  enemyHp: {
    width: '60px',
    fontSize: '10px',
    color: '#888',
    textAlign: 'right',
  },
  attackBtn: {
    padding: '6px 12px',
    background: '#7f1d1d',
    border: '1px solid #ef4444',
    color: '#ef4444',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
  },
  quickItems: {
    marginTop: '16px',
  },
  itemBtns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  itemBtn: {
    padding: '6px 12px',
    background: '#1a4a3a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'pointer',
  },
  // Dropped items styles
  dropsSection: {
    marginTop: '16px',
    padding: '12px',
    background: '#2d2d1a',
    borderRadius: '4px',
    border: '1px solid #fcd34d',
  },
  dropsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  dropBtn: {
    padding: '8px 16px',
    background: '#4a4a2d',
    border: '1px solid #fcd34d',
    color: '#fcd34d',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  mesetaDropBtn: {
    padding: '8px 16px',
    background: '#3d3d1a',
    border: '1px solid #fbbf24',
    color: '#fbbf24',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  pickupAllBtn: {
    padding: '8px 16px',
    background: '#5a5a2d',
    border: '2px solid #fcd34d',
    color: '#fcd34d',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  // Stage complete styles
  stageComplete: {
    marginTop: '16px',
    padding: '16px',
    background: '#1a2d1a',
    borderRadius: '4px',
    border: '1px solid #4ade80',
    textAlign: 'center' as const,
  },
  stageCompleteText: {
    margin: '0 0 12px 0',
    color: '#4ade80',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  nextStageBtn: {
    padding: '10px 24px',
    background: '#2d6a4a',
    border: '2px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  // Field complete styles
  fieldComplete: {
    marginTop: '16px',
    padding: '20px',
    background: '#1a1a3d',
    borderRadius: '4px',
    border: '2px solid #a78bfa',
    textAlign: 'center' as const,
  },
  fieldCompleteText: {
    margin: '0 0 8px 0',
    color: '#a78bfa',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  fieldCompleteSubtext: {
    margin: '0 0 16px 0',
    color: '#888',
    fontSize: '12px',
  },
  returnBtn: {
    padding: '12px 32px',
    background: '#4a2d6a',
    border: '2px solid #a78bfa',
    color: '#a78bfa',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  // Location description
  locationDesc: {
    color: '#888',
    fontSize: '12px',
    marginBottom: '16px',
  },
  // Mission list styles
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  missionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#252540',
    borderRadius: '4px',
    border: '1px solid #333',
  },
  missionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  missionName: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  missionNameLocked: {
    color: '#555',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  missionArea: {
    color: '#6bf',
    fontSize: '10px',
  },
  missionReward: {
    color: '#fcd34d',
    fontSize: '10px',
    width: '140px',
  },
  comingSoon: {
    color: '#555',
    fontSize: '11px',
    fontStyle: 'italic',
    marginTop: '16px',
    textAlign: 'center' as const,
  },
};
