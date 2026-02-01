/**
 * MissionCounterWeb - Simple guild counter UI mirroring CLI
 * Shows fields and missions with enter buttons
 */

import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { Field } from '../../systems/field/types';
import type { Mission, Difficulty } from '../../systems/mission/types';
import {
  getAllFields,
  isFieldUnlocked,
  initializeDefaultFields,
} from '../../systems/field';
import {
  getAllMissions,
  isMissionUnlocked,
  initializeDefaultMissions,
  meetsLevelForDifficulty,
} from '../../systems/mission';
import {
  setSessionConfig,
  enterField,
  enterMission,
} from '../../systems/session';

type Tab = 'fields' | 'missions';

export default function MissionCounterWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('fields');
  const [fields, setFields] = useState<Field[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [message, setMessage] = useState('');

  useEffect(() => {
    initializeDefaultFields();
    initializeDefaultMissions();
    loadSelectedCharacter();
  }, []);

  useEffect(() => {
    if (character) {
      setFields(getAllFields());
      setMissions(getAllMissions());
      setSessionConfig(character.character_id, character.level);
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
    }
  };

  const handleEnterField = (field: Field) => {
    const success = enterField(field.id, selectedDifficulty);
    if (success) {
      setMessage(`Entering ${field.name}...`);
      // In a real game, navigate to field gameplay
    } else {
      setMessage('Cannot enter field');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleEnterMission = (mission: Mission) => {
    const success = enterMission(mission.id, selectedDifficulty);
    if (success) {
      setMessage(`Starting ${mission.name}...`);
    } else {
      setMessage('Cannot start mission');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  if (!character) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container} data-testid="mission-counter">
      {/* Header */}
      <div style={styles.header}>
        <a href="/web/city-hub" style={styles.back} data-testid="back-button">← Back</a>
        <span style={styles.title}>GUILD COUNTER</span>
        <span style={styles.level} data-testid="character-level">Lv. {character.level}</span>
      </div>

      {/* Difficulty */}
      <div style={styles.difficultyRow}>
        <span style={styles.diffLabel}>Difficulty:</span>
        {(['normal', 'hard', 'super-hard'] as Difficulty[]).map(diff => {
          const enabled = meetsLevelForDifficulty(character.level, diff);
          const active = selectedDifficulty === diff;
          return (
            <button
              key={diff}
              style={!enabled ? styles.diffDisabled : active ? styles.diffActive : styles.diff}
              onClick={() => enabled && setSelectedDifficulty(diff)}
              disabled={!enabled}
              data-testid={`difficulty-${diff}`}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'fields' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('fields')}
          data-testid="tab-fields"
        >
          Fields
        </button>
        <button
          style={activeTab === 'missions' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('missions')}
          data-testid="tab-missions"
        >
          Missions
        </button>
      </div>

      {/* List */}
      <div style={styles.list}>
        {activeTab === 'fields' ? (
          fields.map(field => {
            const unlocked = isFieldUnlocked(field.id, character.character_id, character.level);
            return (
              <div key={field.id} style={styles.row} data-testid={`field-${field.id}`}>
                <div style={styles.info}>
                  <span style={unlocked ? styles.name : styles.nameLocked}>
                    {field.name}
                  </span>
                  <span style={styles.level}>Lv.{field.recommendedLevel}</span>
                </div>
                <button
                  style={unlocked ? styles.enterBtn : styles.enterBtnDisabled}
                  onClick={() => handleEnterField(field)}
                  disabled={!unlocked}
                  data-testid={`enter-field-${field.id}`}
                >
                  {unlocked ? 'Enter' : 'Locked'}
                </button>
              </div>
            );
          })
        ) : (
          missions.map(mission => {
            const unlocked = isMissionUnlocked(mission.id, character.character_id, character.level);
            return (
              <div key={mission.id} style={styles.row} data-testid={`mission-${mission.id}`}>
                <div style={styles.info}>
                  <span style={unlocked ? styles.name : styles.nameLocked}>
                    {mission.name}
                  </span>
                  <span style={styles.level}>Lv.{mission.recommendedLevel}</span>
                </div>
                <button
                  style={unlocked ? styles.enterBtn : styles.enterBtnDisabled}
                  onClick={() => handleEnterMission(mission)}
                  disabled={!unlocked}
                  data-testid={`enter-mission-${mission.id}`}
                >
                  {unlocked ? 'Start' : 'Locked'}
                </button>
              </div>
            );
          })
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
    background: '#1a1a2e',
    fontFamily: 'monospace',
    color: '#ccc',
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  back: {
    color: '#6bf',
    textDecoration: 'none',
  },
  title: {
    color: '#a78bfa',
    fontWeight: 'bold',
  },
  level: {
    color: '#888',
    fontSize: '12px',
  },
  difficultyRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  diffLabel: {
    color: '#888',
    fontSize: '12px',
  },
  diff: {
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid #444',
    color: '#888',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
  },
  diffActive: {
    padding: '4px 12px',
    background: '#333',
    border: '1px solid #6bf',
    color: '#6bf',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'pointer',
  },
  diffDisabled: {
    padding: '4px 12px',
    background: 'transparent',
    border: '1px solid #333',
    color: '#444',
    fontFamily: 'monospace',
    fontSize: '11px',
    cursor: 'not-allowed',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tab: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #444',
    color: '#888',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  tabActive: {
    padding: '8px 16px',
    background: '#333',
    border: '1px solid #a78bfa',
    color: '#a78bfa',
    fontFamily: 'monospace',
    cursor: 'pointer',
  },
  list: {
    border: '1px solid #333',
    borderRadius: '4px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #222',
  },
  info: {
    display: 'flex',
    gap: '16px',
    alignItems: 'baseline',
  },
  name: {
    color: '#fff',
  },
  nameLocked: {
    color: '#555',
  },
  enterBtn: {
    padding: '6px 16px',
    background: '#2d6a4a',
    border: '1px solid #4ade80',
    color: '#4ade80',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  enterBtnDisabled: {
    padding: '6px 16px',
    background: '#333',
    border: '1px solid #555',
    color: '#555',
    fontFamily: 'monospace',
    cursor: 'not-allowed',
    borderRadius: '2px',
  },
  message: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    background: '#a78bfa',
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
  },
};
