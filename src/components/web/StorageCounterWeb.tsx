import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { InventorySlot } from '../../systems/inventory/types';
import {
  getSharedStorage,
  getInventory,
  depositToStorage,
  withdrawFromStorage,
  depositMesetaToStorage,
  withdrawMesetaFromStorage,
} from '../../systems/inventory';

type Tab = 'storage' | 'deposit' | 'withdraw';

export default function StorageCounterWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('storage');
  const [selectedStorageItem, setSelectedStorageItem] = useState<InventorySlot | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventorySlot | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mesetaAmount, setMesetaAmount] = useState(100);
  const [message, setMessage] = useState('');
  const [storageItems, setStorageItems] = useState<InventorySlot[]>([]);
  const [storageMeseta, setStorageMeseta] = useState(0);
  const [inventoryItems, setInventoryItems] = useState<InventorySlot[]>([]);

  useEffect(() => {
    loadSelectedCharacter();
  }, []);

  useEffect(() => {
    if (character) {
      refreshData();
    }
  }, [character]);

  const loadSelectedCharacter = () => {
    const selectedId = localStorage.getItem('selectedCharacterId');
    if (!selectedId) {
      window.location.href = '/web/character-select';
      return;
    }

    const stored = localStorage.getItem('characters');
    if (stored) {
      try {
        const characters = JSON.parse(stored);
        const found = characters.find((c: Character | null) =>
          c?.character_id === selectedId
        );
        if (found) {
          setCharacter(found);
        } else {
          window.location.href = '/web/character-select';
        }
      } catch {
        window.location.href = '/web/character-select';
      }
    } else {
      window.location.href = '/web/character-select';
    }
  };

  const refreshData = () => {
    if (!character) return;

    // Refresh storage data
    const storage = getSharedStorage();
    setStorageItems(storage.items);
    setStorageMeseta(storage.meseta);

    // Refresh inventory data
    const inventory = getInventory(character.character_id);
    setInventoryItems(inventory.items);

    // Refresh character meseta
    const stored = localStorage.getItem('characters');
    if (stored) {
      const characters = JSON.parse(stored);
      const found = characters.find((c: Character | null) =>
        c?.character_id === character.character_id
      );
      if (found) {
        setCharacter(found);
      }
    }
  };

  const handleDepositMeseta = () => {
    if (!character) return;

    const result = depositMesetaToStorage(character.character_id, mesetaAmount);
    if (result.success) {
      setMessage(`Deposited ${mesetaAmount.toLocaleString()} meseta`);
      refreshData();
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleWithdrawMeseta = () => {
    if (!character) return;

    const result = withdrawMesetaFromStorage(character.character_id, mesetaAmount);
    if (result.success) {
      setMessage(`Withdrew ${mesetaAmount.toLocaleString()} meseta`);
      refreshData();
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDepositItem = () => {
    if (!character || !selectedInventoryItem) return;

    const result = depositToStorage(character.character_id, selectedInventoryItem.item.id, quantity);
    if (result.success) {
      setMessage(`Deposited ${quantity}x ${selectedInventoryItem.item.name}`);
      setSelectedInventoryItem(null);
      setQuantity(1);
      refreshData();
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleWithdrawItem = () => {
    if (!character || !selectedStorageItem) return;

    const result = withdrawFromStorage(character.character_id, selectedStorageItem.item.id, quantity);
    if (result.success) {
      setMessage(`Withdrew ${quantity}x ${selectedStorageItem.item.name}`);
      setSelectedStorageItem(null);
      setQuantity(1);
      refreshData();
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  if (!character) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  const characterMeseta = character.meseta ?? 0;

  return (
    <div style={styles.container} data-testid="storage-counter">
      {/* Header */}
      <div style={styles.header}>
        <a href="/web/city-hub" style={styles.backButton} data-testid="back-button">
          &#8592; Back to City
        </a>
        <h1 style={styles.title}>STORAGE</h1>
        <div style={styles.balances}>
          <div style={styles.mesetaDisplay}>
            <span style={styles.mesetaLabel}>Wallet:</span>
            <span style={styles.mesetaAmount} data-testid="character-meseta">
              {characterMeseta.toLocaleString()}
            </span>
          </div>
          <div style={styles.storageDisplay}>
            <span style={styles.mesetaLabel}>Storage:</span>
            <span style={styles.storageAmount} data-testid="storage-meseta">
              {storageMeseta.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['storage', 'deposit', 'withdraw'] as Tab[]).map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => {
              setActiveTab(tab);
              setSelectedStorageItem(null);
              setSelectedInventoryItem(null);
              setQuantity(1);
            }}
            data-testid={`tab-${tab}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Meseta Transfer Section */}
      <div style={styles.mesetaSection}>
        <h3 style={styles.sectionTitle}>MESETA TRANSFER</h3>
        <div style={styles.mesetaControls}>
          <input
            type="number"
            value={mesetaAmount}
            onChange={(e) => setMesetaAmount(Math.max(1, parseInt(e.target.value) || 1))}
            style={styles.mesetaInput}
            data-testid="meseta-input"
          />
          <button
            style={{
              ...styles.actionButton,
              ...(mesetaAmount > characterMeseta ? styles.buttonDisabled : {}),
            }}
            onClick={handleDepositMeseta}
            disabled={mesetaAmount > characterMeseta}
            data-testid="deposit-meseta-button"
          >
            DEPOSIT
          </button>
          <button
            style={{
              ...styles.actionButton,
              ...styles.withdrawButton,
              ...(mesetaAmount > storageMeseta ? styles.buttonDisabled : {}),
            }}
            onClick={handleWithdrawMeseta}
            disabled={mesetaAmount > storageMeseta}
            data-testid="withdraw-meseta-button"
          >
            WITHDRAW
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      <div style={styles.content}>
        {activeTab === 'storage' && (
          <div style={styles.itemList} data-testid="storage-items">
            <h3 style={styles.sectionTitle}>STORED ITEMS ({storageItems.length})</h3>
            {storageItems.length === 0 ? (
              <div style={styles.emptyMessage}>No items in storage</div>
            ) : (
              storageItems.map(slot => (
                <div
                  key={slot.item.id}
                  style={styles.itemRow}
                  data-testid={`storage-item-${slot.item.id}`}
                >
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{slot.item.name}</span>
                    <span style={styles.itemRarity}>
                      {'★'.repeat(slot.item.rarity)}
                    </span>
                  </div>
                  <div style={styles.itemQuantity}>x{slot.quantity}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'deposit' && (
          <div style={styles.itemList} data-testid="inventory-items">
            <h3 style={styles.sectionTitle}>YOUR INVENTORY ({inventoryItems.length})</h3>
            {inventoryItems.length === 0 ? (
              <div style={styles.emptyMessage}>No items in inventory</div>
            ) : (
              inventoryItems.map(slot => (
                <div
                  key={slot.item.id}
                  style={{
                    ...styles.itemRow,
                    ...(selectedInventoryItem?.item.id === slot.item.id ? styles.itemRowSelected : {}),
                  }}
                  onClick={() => {
                    setSelectedInventoryItem(slot);
                    setQuantity(1);
                  }}
                  data-testid={`inventory-item-${slot.item.id}`}
                >
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{slot.item.name}</span>
                    <span style={styles.itemRarity}>
                      {'★'.repeat(slot.item.rarity)}
                    </span>
                  </div>
                  <div style={styles.itemQuantity}>x{slot.quantity}</div>
                </div>
              ))
            )}

            {selectedInventoryItem && (
              <div style={styles.transferControls}>
                <div style={styles.quantityControl}>
                  <button
                    style={styles.quantityButton}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedInventoryItem.quantity, parseInt(e.target.value) || 1)))}
                    style={styles.quantityInput}
                    data-testid="deposit-quantity"
                  />
                  <button
                    style={styles.quantityButton}
                    onClick={() => setQuantity(q => Math.min(selectedInventoryItem.quantity, q + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  style={styles.transferButton}
                  onClick={handleDepositItem}
                  data-testid="deposit-item-button"
                >
                  DEPOSIT {quantity}x {selectedInventoryItem.item.name}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div style={styles.itemList} data-testid="storage-items-withdraw">
            <h3 style={styles.sectionTitle}>STORED ITEMS ({storageItems.length})</h3>
            {storageItems.length === 0 ? (
              <div style={styles.emptyMessage}>No items in storage</div>
            ) : (
              storageItems.map(slot => (
                <div
                  key={slot.item.id}
                  style={{
                    ...styles.itemRow,
                    ...(selectedStorageItem?.item.id === slot.item.id ? styles.itemRowSelected : {}),
                  }}
                  onClick={() => {
                    setSelectedStorageItem(slot);
                    setQuantity(1);
                  }}
                  data-testid={`withdraw-item-${slot.item.id}`}
                >
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{slot.item.name}</span>
                    <span style={styles.itemRarity}>
                      {'★'.repeat(slot.item.rarity)}
                    </span>
                  </div>
                  <div style={styles.itemQuantity}>x{slot.quantity}</div>
                </div>
              ))
            )}

            {selectedStorageItem && (
              <div style={styles.transferControls}>
                <div style={styles.quantityControl}>
                  <button
                    style={styles.quantityButton}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedStorageItem.quantity, parseInt(e.target.value) || 1)))}
                    style={styles.quantityInput}
                    data-testid="withdraw-quantity"
                  />
                  <button
                    style={styles.quantityButton}
                    onClick={() => setQuantity(q => Math.min(selectedStorageItem.quantity, q + 1))}
                  >
                    +
                  </button>
                </div>
                <button
                  style={styles.transferButton}
                  onClick={handleWithdrawItem}
                  data-testid="withdraw-item-button"
                >
                  WITHDRAW {quantity}x {selectedStorageItem.item.name}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div style={styles.message} data-testid="message">{message}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)',
    padding: '2rem',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
    color: 'white',
  },
  loading: {
    fontSize: '0.8rem',
    color: '#6bb8ff',
    textAlign: 'center',
    marginTop: '2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  backButton: {
    color: '#6bb8ff',
    textDecoration: 'none',
    fontSize: '0.7rem',
  },
  title: {
    fontSize: '1rem',
    color: '#a78bfa',
    letterSpacing: '4px',
  },
  balances: {
    display: 'flex',
    gap: '1rem',
  },
  mesetaDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    background: 'rgba(252, 211, 77, 0.1)',
    border: '2px solid #fcd34d',
    borderRadius: '4px',
  },
  storageDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    background: 'rgba(167, 139, 250, 0.1)',
    border: '2px solid #a78bfa',
    borderRadius: '4px',
  },
  mesetaLabel: {
    fontSize: '0.5rem',
    color: '#888',
  },
  mesetaAmount: {
    fontSize: '0.7rem',
    color: '#fcd34d',
  },
  storageAmount: {
    fontSize: '0.7rem',
    color: '#a78bfa',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: '#6bb8ff',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  tabActive: {
    background: 'rgba(167, 139, 250, 0.2)',
    borderColor: '#a78bfa',
    color: '#a78bfa',
  },
  mesetaSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '0.7rem',
    color: '#a78bfa',
    marginBottom: '1rem',
    marginTop: 0,
  },
  mesetaControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  mesetaInput: {
    width: '120px',
    height: '36px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    textAlign: 'center',
  },
  actionButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  withdrawButton: {
    background: 'linear-gradient(135deg, #6a2d4a 0%, #5a1a3a 100%)',
    borderColor: '#f472b6',
  },
  buttonDisabled: {
    background: '#3a3a4e',
    borderColor: '#555',
    color: '#666',
    cursor: 'not-allowed',
  },
  content: {
    marginTop: '1rem',
  },
  itemList: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  emptyMessage: {
    fontSize: '0.6rem',
    color: '#4a6a8a',
    textAlign: 'center',
    padding: '2rem',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    cursor: 'pointer',
    border: '2px solid transparent',
  },
  itemRowSelected: {
    borderColor: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.1)',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  itemName: {
    fontSize: '0.7rem',
  },
  itemRarity: {
    fontSize: '0.6rem',
    color: '#fcd34d',
  },
  itemQuantity: {
    fontSize: '0.7rem',
    color: '#a78bfa',
  },
  transferControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(167, 139, 250, 0.1)',
    borderRadius: '4px',
    flexWrap: 'wrap',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  quantityButton: {
    width: '32px',
    height: '32px',
    background: '#2d4a6a',
    border: '2px solid #6bb8ff',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  quantityInput: {
    width: '60px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    textAlign: 'center',
  },
  transferButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #4a2d6a 0%, #3a1a5a 100%)',
    border: '2px solid #a78bfa',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
    flex: 1,
  },
  message: {
    position: 'fixed',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '1rem 2rem',
    background: 'rgba(167, 139, 250, 0.9)',
    borderRadius: '4px',
    color: '#1a1a1a',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
};
