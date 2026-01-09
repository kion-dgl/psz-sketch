import { useState } from 'react';

type CharacterType = 'Humar' | 'Hunewearl' | 'Hucast' | 'Hucaseal' |
  'Ramar' | 'Ramarl' | 'Racast' | 'Racaseal' |
  'Fomar' | 'Fomarl' | 'Fonewm' | 'Fonewearl';

interface StatsProps {
  // Tab 1 - Basic
  level: number;
  characterType: CharacterType;
  expPts: number;
  toNextLv: number;
  meseta: number;

  // Tab 2 - Combat (total and base in parentheses)
  atp: number;
  atpBase: number;
  dfp: number;
  dfpBase: number;
  ata: number;
  ataBase: number;
  evp: number;
  evpBase: number;
  mst: number;
  mstBase: number;

  // Tab 3 - Resistances
  rFire: number;
  rIce: number;
  rThunder: number;
  rLight: number;
  rDark: number;

  // Tab 4 - Materials
  materialsUsed: number;
  materialsMax: number;
  matHP: number;
  matPower: number;
  matHit: number;
  matMind: number;
  matPP: number;
  matGuard: number;
  matSwift: number;
}

type TabId = 1 | 2 | 3 | 4;

export default function Stats(props: StatsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(1);

  return (
    <div style={styles.container}>
      {/* Tab buttons */}
      <div style={styles.tabBar}>
        {([1, 2, 3, 4] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.content}>
        {activeTab === 1 && <Tab1 {...props} />}
        {activeTab === 2 && <Tab2 {...props} />}
        {activeTab === 3 && <Tab3 {...props} />}
        {activeTab === 4 && <Tab4 {...props} />}
      </div>
    </div>
  );
}

function Tab1({ level, characterType, expPts, toNextLv, meseta }: StatsProps) {
  return (
    <div style={styles.rows}>
      <Row label="Level" value={level} />
      <Row label="Type" value={characterType} />
      <Row label="Exp Pts" value={expPts.toLocaleString()} />
      <Row label="To Next Lv" value={toNextLv.toLocaleString()} />
      <Row label="Meseta" value={meseta.toLocaleString()} />
    </div>
  );
}

function Tab2({ atp, atpBase, dfp, dfpBase, ata, ataBase, evp, evpBase, mst, mstBase }: StatsProps) {
  return (
    <div style={styles.rows}>
      <StatRow label="ATP" total={atp} base={atpBase} />
      <StatRow label="DFP" total={dfp} base={dfpBase} />
      <StatRow label="ATA" total={ata} base={ataBase} />
      <StatRow label="EVP" total={evp} base={evpBase} />
      <StatRow label="MST" total={mst} base={mstBase} />
    </div>
  );
}

function Tab3({ rFire, rIce, rThunder, rLight, rDark }: StatsProps) {
  return (
    <div style={styles.rows}>
      <Row label="R-Fire" value={`${rFire}%`} />
      <Row label="R-Ice" value={`${rIce}%`} />
      <Row label="R-Thunder" value={`${rThunder}%`} />
      <Row label="R-Light" value={`${rLight}%`} />
      <Row label="R-Dark" value={`${rDark}%`} />
    </div>
  );
}

function Tab4({ materialsUsed, materialsMax, matHP, matPower, matHit, matMind, matPP, matGuard, matSwift }: StatsProps) {
  return (
    <div style={styles.rows}>
      <Row label="Materials" value={`${materialsUsed}/${materialsMax}`} />
      <div style={styles.twoColumns}>
        <div style={styles.column}>
          <Row label="HP" value={matHP} />
          <Row label="Power" value={matPower} />
          <Row label="Hit" value={matHit} />
          <Row label="Mind" value={matMind} />
        </div>
        <div style={styles.column}>
          <Row label="PP" value={matPP} />
          <Row label="Guard" value={matGuard} />
          <Row label="Swift" value={matSwift} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

function StatRow({ label, total, base }: { label: string; total: number; base: number }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>
        {total} <span style={styles.base}>({base})</span>
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '220px',
    background: 'linear-gradient(180deg, #2a3a5a 0%, #1a2a4a 100%)',
    border: '2px solid #4a6a9a',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  tabBar: {
    display: 'flex',
    background: '#1a2a3a',
    borderBottom: '1px solid #4a6a9a',
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    borderRight: '1px solid #3a4a6a',
    color: '#6a8aaa',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    background: '#2a4a6a',
    color: '#ffffff',
  },
  content: {
    padding: '12px',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  twoColumns: {
    display: 'flex',
    gap: '16px',
    marginTop: '4px',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '12px',
    color: '#8aa8cc',
  },
  value: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  base: {
    color: '#6a8aaa',
    fontWeight: 'normal',
  },
};
