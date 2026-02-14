/**
 * MetadataTab — Stub for Milestone 3
 *
 * Will allow editing quest metadata, message packs, and story triggers.
 */

export default function MetadataTab() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      color: '#888',
    }}>
      <div style={{ fontSize: '48px', opacity: 0.3 }}>3</div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: '#666' }}>
        Metadata & Messages
      </div>
      <div style={{ fontSize: '13px', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>
        Milestone 3 will add quest metadata editing: quest name, description,
        type, difficulty, recommended level, NPC message packs,
        story triggers, and cutscene placement.
      </div>
    </div>
  );
}
