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
  refreshWeaponShop,
  SHOP_IDS,
} from '../../systems/shop';
import type { ShopItem, EquipmentShopItem } from '../../systems/shop/types';
import {
  getAllFields,
  isFieldUnlocked,
  initializeDefaultFields,
} from '../../systems/field';
import type { Field } from '../../systems/field/types';
import type { Difficulty } from '../../systems/mission/types';
import { meetsLevelForDifficulty, getCompletedMissions, restoreCompletedMissions } from '../../systems/mission';
import { getCompletedFields, restoreCompletedFields } from '../../systems/field';
import { VALID_CLASS_IDS, MAX_SLOTS } from '../../systems/character/types';
import type { Character, CharacterSlots } from '../../systems/character/types';
import {
  loadGameData,
  saveGameData,
  resetAllGameData,
  type PersistedCharacterData,
  type PersistedGameData,
  type PersistedEquipment,
} from '../../systems/persistence';
import type { WeaponItem, ArmorItem, UnitItem } from '../../systems/inventory/types';

export default function GamePlayWeb() {
  const [gameState, setGameState] = useState<ReturnType<typeof getState> | null>(null);
  const [logs, setLogs] = useState<{ id: number; message: string }[]>([]);
  const [logCounter, setLogCounter] = useState(0);
  const [commandInput, setCommandInput] = useState('');
  const [shopTab, setShopTab] = useState<'items' | 'weapons'>('items');
  const [weaponShopTab, setWeaponShopTab] = useState<'weapons' | 'armor' | 'units'>('weapons');
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

    // Restore equipment (use set-weapon/set-frame/set-unit to directly restore without inventory swap)
    if (data.equipment?.weapon) {
      execute(`set-weapon ${JSON.stringify(data.equipment.weapon)}`);
    }
    if (data.equipment?.frame) {
      execute(`set-frame ${JSON.stringify(data.equipment.frame)}`);
    }
    if (data.equipment?.unit1) {
      execute(`set-unit 1 ${JSON.stringify(data.equipment.unit1)}`);
    }
    if (data.equipment?.unit2) {
      execute(`set-unit 2 ${JSON.stringify(data.equipment.unit2)}`);
    }
    if (data.equipment?.unit3) {
      execute(`set-unit 3 ${JSON.stringify(data.equipment.unit3)}`);
    }
    if (data.equipment?.unit4) {
      execute(`set-unit 4 ${JSON.stringify(data.equipment.unit4)}`);
    }

    // Restore completed missions and fields
    if (data.completedMissions && data.completedMissions.length > 0) {
      restoreCompletedMissions(character.character_id, data.completedMissions);
    }
    if (data.completedFields && data.completedFields.length > 0) {
      restoreCompletedFields(character.character_id, data.completedFields);
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
        weapon: (gameState.equipment?.weapon as WeaponItem) || null,
        frame: (gameState.equipment?.frame as ArmorItem) || null,
        unit1: (gameState.equipment?.unit1 as UnitItem) || null,
        unit2: (gameState.equipment?.unit2 as UnitItem) || null,
        unit3: (gameState.equipment?.unit3 as UnitItem) || null,
        unit4: (gameState.equipment?.unit4 as UnitItem) || null,
      },
      completedMissions: getCompletedMissions(gameState.character.character_id),
      completedFields: getCompletedFields(gameState.character.character_id),
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
            weapon: (newState.equipment?.weapon as WeaponItem) || null,
            frame: (newState.equipment?.frame as ArmorItem) || null,
            unit1: (newState.equipment?.unit1 as UnitItem) || null,
            unit2: (newState.equipment?.unit2 as UnitItem) || null,
            unit3: (newState.equipment?.unit3 as UnitItem) || null,
            unit4: (newState.equipment?.unit4 as UnitItem) || null,
          },
          completedMissions: getCompletedMissions(newChar.character_id),
          completedFields: getCompletedFields(newChar.character_id),
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
          onClick={() => executeCommand('goto weapon-shop')}
          data-testid="goto-weapon-shop"
        >
          Weapon Shop
        </button>
        <button
          style={styles.cityButtonDisabled}
          disabled
          data-testid="goto-custom-shop"
        >
          Custom Shop
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

      <h3 style={styles.citySectionTitle}>Man Hole</h3>
      <div style={styles.cityMenu}>
        <button
          style={styles.cityButtonDisabled}
          disabled
          data-testid="goto-photon-collector"
        >
          Photon Collector
        </button>
        <button
          style={styles.cityButtonDisabled}
          disabled
          data-testid="goto-enemy-collector"
        >
          Enemy Collector
        </button>
      </div>
    </div>
  );

  // Stack limits for consumables (must match api.ts)
  const STACK_LIMITS: Record<string, number> = {
    monomate: 10, dimate: 10, trimate: 10,
    monofluid: 10, difluid: 10, trifluid: 10,
    'sol-atomizer': 10, 'moon-atomizer': 10, 'star-atomizer': 5,
    'scape-doll': 1, telepipe: 10, 'photon-drop': 99,
  };

  const getItemStackInfo = (itemId: string) => {
    const invItem = gameState?.inventory?.find(i => i.id === itemId);
    const currentQty = invItem?.quantity ?? 0;
    const maxStack = STACK_LIMITS[itemId] ?? 99; // weapons/armor have no limit
    const atMaxStack = currentQty >= maxStack;
    return { currentQty, maxStack, atMaxStack };
  };

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
            const { currentQty, maxStack, atMaxStack } = getItemStackInfo(item.id);
            const isConsumable = shopTab === 'items';

            // Determine button state and style
            let buttonStyle = styles.buyBtn;
            let buttonText = 'Buy';
            let isDisabled = false;

            if (isConsumable && atMaxStack) {
              buttonStyle = styles.buyBtnMaxStack;
              buttonText = `Max (${maxStack})`;
              isDisabled = true;
            } else if (!affordable) {
              buttonStyle = styles.buyBtnDisabled;
              isDisabled = true;
            }

            return (
              <div key={item.id} style={styles.itemRow} data-testid={`shop-item-${item.id}`}>
                <span style={styles.itemName}>
                  {item.name}
                  {isConsumable && currentQty > 0 && (
                    <span style={styles.itemOwned}> ({currentQty}/{maxStack})</span>
                  )}
                </span>
                <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
                <button
                  style={buttonStyle}
                  onClick={() => handleBuyItem(item)}
                  disabled={isDisabled}
                  data-testid={`buy-${item.id}`}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeaponShopContent = () => {
    // Get items from the armor shop (which has weapons, armor, and units via refreshWeaponShop)
    const allItems = getShopItems(SHOP_IDS.ARMOR_SHOP) as EquipmentShopItem[];
    const meseta = gameState?.character?.meseta ?? 0;
    const inventorySlots = gameState?.inventorySlots ?? 0;
    const maxSlots = gameState?.maxInventorySlots ?? 40;
    const inventoryFull = inventorySlots >= maxSlots;

    // Filter items by current tab
    const filteredItems = allItems.filter(item => {
      if (weaponShopTab === 'weapons') return item.category === 'weapon';
      if (weaponShopTab === 'armor') return item.category === 'armor';
      if (weaponShopTab === 'units') return item.category === 'unit';
      return false;
    });

    const handleBuyEquipment = (item: EquipmentShopItem) => {
      if (!gameState?.character) return;
      if (inventoryFull) {
        addLog(`Inventory full. (${maxSlots}/${maxSlots} slots)`);
        return;
      }
      executeCommand(`buy-equipment ${item.id}`);
    };

    const formatItemName = (item: EquipmentShopItem): string => {
      return item.name;
    };

    const formatItemStats = (item: EquipmentShopItem): string => {
      if (item.category === 'weapon') {
        const elemStr = item.element && item.element !== 'None'
          ? ` | ${item.element} ${item.elementPercent}%`
          : '';
        return `ATK: ${item.attack}${elemStr}`;
      }
      if (item.category === 'armor') {
        const slotStr = item.slots && item.slots > 0 ? ` | ${item.slots} slots` : '';
        return `DEF: ${item.defense} | EVA: ${item.evasion}${slotStr}`;
      }
      return item.description;
    };

    const getRarityColor = (rarity: number): string => {
      switch (rarity) {
        case 1: return '#ccc';
        case 2: return '#4ade80';
        case 3: return '#60a5fa';
        case 4: return '#a78bfa';
        default: return '#ccc';
      }
    };

    return (
      <div style={styles.locationContent}>
        <div style={styles.locationHeader}>
          <h2 style={styles.locationTitle}>WEAPON SHOP</h2>
          <div style={styles.shopHeaderActions}>
            <button
              style={styles.refreshBtn}
              onClick={() => { refreshWeaponShop(); refreshState(); addLog('Shop inventory refreshed!'); }}
              data-testid="refresh-shop"
            >
              Refresh
            </button>
            <button style={styles.backBtn} onClick={() => executeCommand('goto city')}>← Back</button>
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            style={weaponShopTab === 'weapons' ? styles.tabActive : styles.tab}
            onClick={() => setWeaponShopTab('weapons')}
            data-testid="tab-weapons"
          >
            Weapons
          </button>
          <button
            style={weaponShopTab === 'armor' ? styles.tabActive : styles.tab}
            onClick={() => setWeaponShopTab('armor')}
            data-testid="tab-armor"
          >
            Armor
          </button>
          <button
            style={weaponShopTab === 'units' ? styles.tabActive : styles.tab}
            onClick={() => setWeaponShopTab('units')}
            data-testid="tab-units"
          >
            Units
          </button>
        </div>

        <p style={styles.inventorySlotInfo}>
          Inventory: {inventorySlots}/{maxSlots} slots
        </p>

        <div style={styles.equipmentList}>
          {filteredItems.map(item => {
            const affordable = canAfford(meseta, item);
            const rarityColor = getRarityColor(item.rarity);

            // Determine button state
            let buttonStyle = styles.buyBtn;
            let buttonText = 'Buy';
            let isDisabled = false;

            if (inventoryFull) {
              buttonStyle = styles.buyBtnMaxStack;
              buttonText = 'Full';
              isDisabled = true;
            } else if (!affordable) {
              buttonStyle = styles.buyBtnDisabled;
              buttonText = 'No $';
              isDisabled = true;
            }

            return (
              <div key={item.id} style={styles.equipmentRow} data-testid={`equip-item-${item.id}`}>
                <div style={styles.equipmentInfo}>
                  <span style={{ ...styles.equipmentName, color: rarityColor }}>
                    {formatItemName(item)}
                  </span>
                  <span style={styles.equipmentStats}>
                    {formatItemStats(item)}
                  </span>
                  {item.requiredLevel && (
                    <span style={styles.equipmentLevel}>Lv.{item.requiredLevel}</span>
                  )}
                </div>
                <span style={styles.itemPrice}>{formatPrice(item.price)}</span>
                <button
                  style={buttonStyle}
                  onClick={() => handleBuyEquipment(item)}
                  disabled={isDisabled}
                  data-testid={`buy-${item.id}`}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <p style={styles.emptyMessage}>No items available in this category.</p>
          )}
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
          <div style={styles.headerBtnGroup}>
            <button
              style={styles.fieldHeaderBtn}
              onClick={() => executeCommand('goto inventory')}
              data-testid="field-inventory"
            >
              Inventory
            </button>
            <button
              style={styles.fieldHeaderBtn}
              onClick={() => executeCommand('use-telepipe')}
              data-testid="use-telepipe"
            >
              Telepipe
            </button>
          </div>
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
        {/* Items on ground are optional - player can pick up or ignore and proceed */}
        {!hasEnemies && combat && (
          gameState?.isAtFinalStage ? (
            <div style={styles.fieldComplete}>
              <p style={styles.fieldCompleteText}>
                {gameState?.sessionType === 'mission' ? 'Mission Complete!' : 'Field Complete!'}
              </p>
              <button
                style={styles.returnBtn}
                onClick={() => executeCommand('complete-field')}
                data-testid="complete-field"
              >
                {gameState?.sessionType === 'mission' ? 'Return to Guild' : 'Return to City'}
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

  const renderInventoryContent = () => {
    const backLocation = gameState?.previousLocation || 'city';
    return (
      <div style={styles.locationContent}>
        <div style={styles.locationHeader}>
          <h2 style={styles.locationTitle}>INVENTORY ({gameState?.inventorySlots ?? 0}/{gameState?.maxInventorySlots ?? 40})</h2>
          <button style={styles.backBtn} onClick={() => executeCommand(`goto ${backLocation}`)}>← Back</button>
        </div>
        <div style={styles.inventoryGrid}>
          {gameState?.inventory && gameState.inventory.length > 0 ? (
            gameState.inventory.map(item => {
              const isWeapon = item.type === 'weapon';
              const isArmor = item.type === 'armor';
              const isUnit = item.type === 'unit';
              const isFrame = isArmor; // Armor items are always frames now
              const isEquipped = item.equipped === true;
              const canEquip = isWeapon || isArmor || isUnit;
              const armorSlots = isFrame ? item.unitSlots : null;
              const itemKey = isEquipped ? `equipped-${item.id}` : item.id;

              // Determine the correct equip command
              const getEquipCommand = () => {
                if (isWeapon) return `equip-weapon ${item.id}`;
                if (isUnit) return `equip-unit ${item.id}`;
                return `equip-frame ${item.id}`;
              };

              return (
                <div key={itemKey} style={styles.invCard} data-testid={`inv-item-${item.id}`}>
                  <div style={styles.invItemName}>{item.name}</div>
                  <div style={styles.invItemQty}>x{item.quantity}</div>
                  {isWeapon && <div style={styles.invItemStat}>ATK: {item.attack}</div>}
                  {isFrame && (
                    <div style={styles.invItemStat}>
                      DEF: {item.defense}
                      {armorSlots != null && armorSlots > 0 && <span style={styles.armorSlots}> [{armorSlots}S]</span>}
                    </div>
                  )}
                  {isUnit && <div style={styles.invItemStat}>{item.description}</div>}
                  {item.type === 'consumable' && <div style={styles.invItemEffect}>{item.effect}</div>}
                  {canEquip && (
                    <button
                      style={isEquipped ? styles.equippedBtn : styles.equipBtn}
                      onClick={() => executeCommand(getEquipCommand())}
                      disabled={isEquipped}
                      data-testid={`equip-${item.id}`}
                    >
                      {isEquipped ? 'Equipped' : 'Equip'}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={styles.emptyText}>No items</div>
          )}
        </div>
      </div>
    );
  };

  // Class table organized by Race (rows) and Class/Gender (columns)
  // Format: { race: { classType: { male: classId | null, female: classId | null } } }
  const CLASS_TABLE: Record<string, Record<string, { male: string | null; female: string | null }>> = {
    Human: {
      Hunter: { male: 'HUmar', female: 'HUmarl' },
      Ranger: { male: 'RAmar', female: 'RAmarl' },
      Force: { male: 'FOmar', female: 'FOmarl' },
    },
    Newman: {
      Hunter: { male: 'HUnewm', female: 'HUnewearl' },
      Ranger: { male: null, female: null },
      Force: { male: 'FOnewm', female: 'FOnewearl' },
    },
    Cast: {
      Hunter: { male: 'HUcast', female: 'HUcaseal' },
      Ranger: { male: 'RAcast', female: 'RAcaseal' },
      Force: { male: null, female: null },
    },
  };

  const CLASS_TYPES = ['Hunter', 'Ranger', 'Force'];
  const RACES = ['Human', 'Newman', 'Cast'];

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
      <table style={styles.classTable}>
        <thead>
          <tr>
            <th style={styles.classTableHeader}></th>
            {CLASS_TYPES.map(classType => (
              <th key={classType} colSpan={2} style={styles.classTypeHeader}>
                {classType}
              </th>
            ))}
          </tr>
          <tr>
            <th style={styles.classTableHeader}></th>
            {CLASS_TYPES.map(classType => (
              <>
                <th key={`${classType}-m`} style={styles.genderHeader}>M</th>
                <th key={`${classType}-f`} style={styles.genderHeader}>F</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {RACES.map(race => (
            <tr key={race}>
              <td style={styles.raceCell}>{race}</td>
              {CLASS_TYPES.map(classType => {
                const classes = CLASS_TABLE[race][classType];
                return (
                  <>
                    <td key={`${race}-${classType}-m`} style={styles.classCell}>
                      {classes.male ? (
                        <button
                          style={styles.classBtn}
                          onClick={() => handleCreateCharacter(classes.male!)}
                          data-testid={`create-${classes.male}`}
                        >
                          {classes.male}
                        </button>
                      ) : (
                        <span style={styles.noClass}>-</span>
                      )}
                    </td>
                    <td key={`${race}-${classType}-f`} style={styles.classCell}>
                      {classes.female ? (
                        <button
                          style={styles.classBtn}
                          onClick={() => handleCreateCharacter(classes.female!)}
                          data-testid={`create-${classes.female}`}
                        >
                          {classes.female}
                        </button>
                      ) : (
                        <span style={styles.noClass}>-</span>
                      )}
                    </td>
                  </>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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
      case 'weapon-shop': return renderWeaponShopContent();
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
        <div style={styles.headerButtons}>
          {gameState?.character && (
            <button
              style={styles.switchCharBtn}
              onClick={async () => {
                await saveCurrentCharacter();
                resetState();
                setActiveSlot(null);
                refreshState();
                addLog('Returned to character select.');
              }}
              data-testid="switch-character"
            >
              Switch
            </button>
          )}
          <button
            style={styles.resetBtn}
            onClick={() => { resetState(); refreshState(); setLogs([]); addLog('Game reset.'); }}
            data-testid="reset-game"
          >
            Reset
          </button>
        </div>
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
          <h3 style={styles.panelTitle}>INVENTORY ({gameState?.inventorySlots ?? 0}/{gameState?.maxInventorySlots ?? 40})</h3>
          <div style={styles.invList}>
            {gameState?.inventory && gameState.inventory.length > 0 ? (
              gameState.inventory.map(item => {
                const slots = item.type === 'armor' ? item.unitSlots : null;
                const isEquipped = item.equipped;
                const itemKey = isEquipped ? `equipped-${item.id}` : item.id;
                return (
                  <div key={itemKey} style={isEquipped ? styles.invRowEquipped : styles.invRow} data-testid={`sidebar-inv-${item.id}`}>
                    <span>
                      {isEquipped && <span style={styles.equippedMarker}>E </span>}
                      {item.name}
                      {slots !== null && slots > 0 && <span style={styles.armorSlots}> [{slots}]</span>}
                    </span>
                    {!isEquipped && <span style={styles.invQty}>x{item.quantity}</span>}
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyText}>Empty</div>
            )}
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
  headerButtons: {
    display: 'flex',
    gap: '8px',
  },
  switchCharBtn: {
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    cursor: 'pointer',
    fontSize: '11px',
  },
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
  cityButtonDisabled: {
    padding: '12px 16px',
    background: '#1a1a2e',
    border: '1px solid #444',
    color: '#555',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'not-allowed',
    textAlign: 'left',
  },
  citySectionTitle: {
    margin: '20px 0 8px 0',
    fontSize: '12px',
    color: '#888',
    letterSpacing: '1px',
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
  buyBtnMaxStack: {
    padding: '4px 12px',
    background: '#1a1a2e',
    border: '1px solid #a78bfa',
    color: '#a78bfa',
    fontFamily: 'monospace',
    cursor: 'not-allowed',
    fontSize: '10px',
  },
  itemOwned: {
    color: '#888',
    fontSize: '11px',
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
  headerBtnGroup: {
    display: 'flex',
    gap: '8px',
  },
  fieldHeaderBtn: {
    padding: '8px 16px',
    background: '#2d3a4a',
    border: '1px solid #60a5fa',
    color: '#60a5fa',
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
  equipBtn: {
    marginTop: '6px',
    padding: '4px 8px',
    background: '#2d4a6a',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  equippedBtn: {
    marginTop: '6px',
    padding: '4px 8px',
    background: '#1a3a2a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    fontSize: '10px',
    cursor: 'default',
    width: '100%',
  },
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
  classTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  },
  classTableHeader: {
    padding: '8px',
    textAlign: 'left' as const,
    color: '#888',
    fontSize: '11px',
    borderBottom: '1px solid #333',
  },
  classTypeHeader: {
    padding: '8px',
    textAlign: 'center' as const,
    color: '#e94560',
    fontSize: '12px',
    letterSpacing: '1px',
    borderBottom: '1px solid #333',
  },
  genderHeader: {
    padding: '4px 8px',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '10px',
    borderBottom: '1px solid #333',
  },
  raceCell: {
    padding: '12px 8px',
    color: '#4ade80',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    borderBottom: '1px solid #222',
  },
  classCell: {
    padding: '8px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #222',
  },
  noClass: {
    color: '#444',
    fontSize: '14px',
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
  invRowEquipped: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    padding: '4px',
    background: '#1a2d1a',
    border: '1px solid #4ade80',
  },
  equippedMarker: {
    color: '#4ade80',
    fontWeight: 'bold',
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
  armorSlots: { color: '#a78bfa', fontSize: '9px' },
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
  // Weapon shop styles
  shopHeaderActions: {
    display: 'flex',
    gap: '8px',
  },
  refreshBtn: {
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid #fcd34d',
    color: '#fcd34d',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  equipmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  equipmentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: '#252540',
    borderRadius: '4px',
    border: '1px solid #333',
  },
  equipmentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  equipmentName: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  equipmentStats: {
    fontSize: '10px',
    color: '#888',
  },
  equipmentLevel: {
    fontSize: '9px',
    color: '#e94560',
  },
  emptyMessage: {
    color: '#555',
    fontSize: '12px',
    textAlign: 'center' as const,
    padding: '16px',
  },
  inventorySlotInfo: {
    margin: '0 0 12px 0',
    fontSize: '11px',
    color: '#888',
  },
};
