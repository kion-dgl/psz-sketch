import { useState } from 'react';

interface EquipMenuProps {
  onBack: () => void;
}

// Equipment slot types
type EquipSlot = 'weapon' | 'armor' | 'mag';

interface WeaponData {
  name: string;
  type: string;
  atp: number;
  atpBase: number;
  ata: number;
  ataBase: number;
  lvRequired: number;
  rarity: number;
  classes: string[]; // HH, NH, CH, HR, CR, HF, NF etc.
}

interface ArmorData {
  name: string;
  dfp: number;
  dfpBase: number;
  evp: number;
  evpBase: number;
  lvRequired: number;
  rarity: number;
  slots: number; // 0-4 unit slots
  units: string[]; // equipped units
}

interface MagData {
  name: string;
  level: number;
  sync: number;
  iq: number;
}

// Sample data
const SAMPLE_WEAPON: WeaponData = {
  name: 'Cutlass',
  type: 'Saber',
  atp: 93,
  atpBase: 93,
  ata: 203,
  ataBase: 203,
  lvRequired: 1,
  rarity: 5,
  classes: ['HH', 'NH', 'CH', 'HR', 'CR', 'HF', 'NF'],
};

const SAMPLE_ARMOR: ArmorData = {
  name: 'Normal Frame',
  dfp: 15,
  dfpBase: 15,
  evp: 10,
  evpBase: 10,
  lvRequired: 1,
  rarity: 1,
  slots: 0,
  units: [],
};

const SAMPLE_MAG: MagData = {
  name: 'Mag',
  level: 5,
  sync: 120,
  iq: 50,
};

export default function EquipMenu({ onBack }: EquipMenuProps) {
  const [selectedSlot, setSelectedSlot] = useState<EquipSlot>('weapon');
  const [page, setPage] = useState(1);
  const totalPages = 3;

  const equipment = [
    { slot: 'weapon' as EquipSlot, icon: '⚔', data: SAMPLE_WEAPON },
    { slot: 'armor' as EquipSlot, icon: '🛡', data: SAMPLE_ARMOR },
    { slot: 'mag' as EquipSlot, icon: '◎', data: SAMPLE_MAG },
  ];

  const selectedEquip = equipment.find(e => e.slot === selectedSlot);

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.header}>
          <span style={styles.headerText}>Current Equipment</span>
        </div>
        <div style={styles.equipList}>
          {equipment.map((item) => (
            <button
              key={item.slot}
              onClick={() => setSelectedSlot(item.slot)}
              style={{
                ...styles.equipItem,
                ...(selectedSlot === item.slot ? styles.equipItemSelected : {}),
              }}
            >
              <span style={styles.equipIcon}>{item.icon}</span>
              <span style={styles.equipName}>
                {item.slot === 'weapon' && (item.data as WeaponData).name}
                {item.slot === 'armor' && (item.data as ArmorData).name}
                {item.slot === 'mag' && (item.data as MagData).name}
              </span>
            </button>
          ))}
        </div>
        <div style={styles.footer}>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>START</span> Close
          </span>
          <span style={styles.footerHint}>
            <span style={styles.buttonHint}>Y</span> Info
          </span>
        </div>
      </div>

      {/* Right Panel - Details */}
      <div style={styles.rightPanel}>
        <div style={styles.pageNav}>
          <button
            style={styles.navArrow}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >◀</button>
          <span style={styles.pageIndicator}>
            <span style={styles.lrHint}>L</span>
            {page}/{totalPages}
            <span style={styles.lrHint}>R</span>
          </span>
          <button
            style={styles.navArrow}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >▶</button>
        </div>

        <div style={styles.detailsContent}>
          {selectedSlot === 'weapon' && <WeaponDetails weapon={SAMPLE_WEAPON} />}
          {selectedSlot === 'armor' && <ArmorDetails armor={SAMPLE_ARMOR} />}
          {selectedSlot === 'mag' && <MagDetails mag={SAMPLE_MAG} />}
        </div>
      </div>

      {/* Back button overlay */}
      <button onClick={onBack} style={styles.backButton}>← Back</button>
    </div>
  );
}

function WeaponDetails({ weapon }: { weapon: WeaponData }) {
  return (
    <>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>Type:</span>
        <span style={styles.detailValue}>{weapon.type}</span>
      </div>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>ATP</span>
      </div>
      <div style={styles.statRow}>
        <span style={styles.statValue}>{weapon.atpBase}</span>
        <span style={styles.statTotal}>{weapon.atp}</span>
      </div>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>ATA</span>
      </div>
      <div style={styles.statRow}>
        <span style={styles.statValue}>{weapon.ataBase}</span>
        <span style={styles.statTotal}>{weapon.ata}</span>
      </div>
      <div style={styles.spacer} />
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>Lv Required</span>
        <span style={styles.detailValue}>{weapon.lvRequired}</span>
      </div>
      <div style={styles.classRow}>
        {weapon.classes.map((cls) => (
          <span key={cls} style={styles.classTag}>{cls}</span>
        ))}
      </div>
      <div style={styles.rarityRow}>
        {Array.from({ length: weapon.rarity }, (_, i) => (
          <span key={i} style={styles.starFilled}>★</span>
        ))}
        {Array.from({ length: 10 - weapon.rarity }, (_, i) => (
          <span key={i} style={styles.starEmpty}>★</span>
        ))}
      </div>
    </>
  );
}

function ArmorDetails({ armor }: { armor: ArmorData }) {
  return (
    <>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>DFP</span>
      </div>
      <div style={styles.statRow}>
        <span style={styles.statValue}>{armor.dfpBase}</span>
        <span style={styles.statTotal}>{armor.dfp}</span>
      </div>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>EVP</span>
      </div>
      <div style={styles.statRow}>
        <span style={styles.statValue}>{armor.evpBase}</span>
        <span style={styles.statTotal}>{armor.evp}</span>
      </div>
      <div style={styles.spacer} />
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>Slots</span>
        <span style={styles.detailValue}>{armor.slots}</span>
      </div>
      {armor.slots > 0 && (
        <div style={styles.unitSlots}>
          {Array.from({ length: armor.slots }, (_, i) => (
            <div key={i} style={styles.unitSlot}>
              {armor.units[i] || '---'}
            </div>
          ))}
        </div>
      )}
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>Lv Required</span>
        <span style={styles.detailValue}>{armor.lvRequired}</span>
      </div>
      <div style={styles.rarityRow}>
        {Array.from({ length: armor.rarity }, (_, i) => (
          <span key={i} style={styles.starFilled}>★</span>
        ))}
        {Array.from({ length: 10 - armor.rarity }, (_, i) => (
          <span key={i} style={styles.starEmpty}>★</span>
        ))}
      </div>
    </>
  );
}

function MagDetails({ mag }: { mag: MagData }) {
  return (
    <>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>Level</span>
        <span style={styles.detailValue}>{mag.level}</span>
      </div>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>Sync</span>
        <span style={styles.detailValue}>{mag.sync}%</span>
      </div>
      <div style={styles.detailRow}>
        <span style={styles.detailLabel}>IQ</span>
        <span style={styles.detailValue}>{mag.iq}</span>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '4px',
    position: 'relative',
  },
  leftPanel: {
    width: '320px',
    background: 'linear-gradient(180deg, #7cb8d8 0%, #5a9cc8 100%)',
    border: '3px solid #2a5a7a',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  rightPanel: {
    width: '180px',
    background: 'linear-gradient(180deg, #7cb8d8 0%, #5a9cc8 100%)',
    border: '3px solid #2a5a7a',
    borderRadius: '8px',
    overflow: 'hidden',
    padding: '8px',
  },
  header: {
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    padding: '8px 12px',
    borderBottom: '2px solid #2a5a7a',
    textAlign: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    textShadow: '1px 1px 0 #2a5a7a',
  },
  equipList: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minHeight: '150px',
  },
  equipItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '4px',
    color: '#1a3a5a',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'left',
    cursor: 'pointer',
  },
  equipItemSelected: {
    background: '#f0a020',
    color: '#1a1a1a',
  },
  equipIcon: {
    width: '24px',
    height: '24px',
    background: '#2a5a7a',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
  },
  equipName: {
    flex: 1,
  },
  footer: {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #4a8ab8 0%, #3a7aa8 100%)',
    borderTop: '2px solid #2a5a7a',
  },
  footerHint: {
    fontSize: '11px',
    color: '#ffffff',
  },
  buttonHint: {
    display: 'inline-block',
    background: '#2a5a7a',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '3px',
    marginRight: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  pageNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  navArrow: {
    background: '#2a5a7a',
    color: '#4f8',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  pageIndicator: {
    color: '#1a3a5a',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  lrHint: {
    display: 'inline-block',
    background: '#1a3a5a',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '3px',
    margin: '0 4px',
    fontSize: '10px',
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#1a3a5a',
    fontSize: '12px',
  },
  detailValue: {
    color: '#1a1a1a',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
  },
  statValue: {
    color: '#1a3a5a',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  statTotal: {
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  spacer: {
    height: '12px',
  },
  classRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px',
    marginTop: '8px',
  },
  classTag: {
    background: '#e8d858',
    color: '#1a1a1a',
    fontSize: '9px',
    fontWeight: 'bold',
    padding: '2px 4px',
    borderRadius: '2px',
  },
  rarityRow: {
    marginTop: '8px',
  },
  starFilled: {
    color: '#f0d020',
    fontSize: '12px',
  },
  starEmpty: {
    color: '#1a3a5a',
    fontSize: '12px',
  },
  unitSlots: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '4px',
  },
  unitSlot: {
    background: '#3a6a8a',
    color: '#ffffff',
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '3px',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: '-30px',
    left: '0',
    padding: '4px 12px',
    background: '#2a5a7a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer',
  },
};
