type TooltipType = 'enemy' | 'item';

type EnemyAttribute = 'Native' | 'A.Beast' | 'Machine' | 'Dark' | 'Unknown';

interface EnemyTooltipData {
  type: 'enemy';
  name: string;
  attribute: EnemyAttribute;
}

interface ItemTooltipData {
  type: 'item';
  name: string;
  rarity: number; // 1-10 stars
}

export type TooltipData = EnemyTooltipData | ItemTooltipData;

interface TooltipProps {
  data: TooltipData;
}

// Attribute colors matching PSO style
const ATTRIBUTE_COLORS: Record<EnemyAttribute, string> = {
  Native: '#8bc34a',    // Green
  'A.Beast': '#ff9800', // Orange
  Machine: '#9e9e9e',   // Gray
  Dark: '#9c27b0',      // Purple
  Unknown: '#607d8b',   // Blue-gray
};

export default function Tooltip({ data }: TooltipProps) {
  return (
    <div style={styles.container}>
      <div style={styles.name}>{data.name}</div>
      {data.type === 'enemy' ? (
        <div style={styles.attributeRow}>
          <span style={styles.label}>Attribute: </span>
          <span style={{ color: ATTRIBUTE_COLORS[data.attribute] }}>
            {data.attribute}
          </span>
        </div>
      ) : (
        <div style={styles.rarityRow}>
          {Array.from({ length: data.rarity }, (_, i) => (
            <span key={i} style={styles.star}>★</span>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(180deg, #2a3a5a 0%, #1a2a4a 100%)',
    border: '2px solid #4a6a9a',
    borderRadius: '4px',
    padding: '8px 12px',
    minWidth: '120px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  name: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '4px',
  },
  attributeRow: {
    fontSize: '12px',
    color: '#aabbcc',
  },
  label: {
    color: '#8899aa',
  },
  rarityRow: {
    display: 'flex',
    gap: '2px',
  },
  star: {
    color: '#ffd700',
    fontSize: '12px',
  },
};
