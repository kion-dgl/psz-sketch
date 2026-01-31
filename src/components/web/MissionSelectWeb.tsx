import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { Mission, Difficulty } from '../../systems/mission/types';
import {
  getAvailableMissions,
  getMission,
  getRecommendedDifficulty,
  meetsLevelForDifficulty,
  initializeDefaultMissions,
} from '../../systems/mission';

export default function MissionSelectWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');

  useEffect(() => {
    initializeDefaultMissions();
    loadSelectedCharacter();
  }, []);

  useEffect(() => {
    if (character) {
      const available = getAvailableMissions(character.character_id, character.level);
      setMissions(available);
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

  const handleMissionSelect = (mission: Mission) => {
    setSelectedMission(mission);
    if (character) {
      setSelectedDifficulty(getRecommendedDifficulty(character.level, mission.recommendedLevel));
    }
  };

  const handleStartMission = () => {
    if (!selectedMission || !character) return;

    // Store mission info in localStorage for the mission page
    localStorage.setItem('activeMission', JSON.stringify({
      missionId: selectedMission.id,
      difficulty: selectedDifficulty,
    }));

    // Navigate to mission (would be a gameplay page)
    alert(`Starting ${selectedMission.name} on ${selectedDifficulty}!\n\n(Mission gameplay not implemented in web version)`);
  };

  const difficulties: Difficulty[] = ['normal', 'hard', 'super-hard'];

  if (!character) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} data-testid="mission-select">
      {/* Header */}
      <div style={styles.header}>
        <a href="/web/city-hub" style={styles.backButton} data-testid="back-button">
          ← Back to City
        </a>
        <h1 style={styles.title}>MISSION SELECT</h1>
        <div style={styles.levelDisplay}>
          Lv. {character.level}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Mission List */}
        <div style={styles.missionList}>
          <h2 style={styles.sectionTitle}>Available Missions</h2>
          {missions.length === 0 ? (
            <div style={styles.emptyMessage}>
              No missions available. Level up to unlock more!
            </div>
          ) : (
            missions.map(mission => (
              <div
                key={mission.id}
                style={{
                  ...styles.missionRow,
                  ...(selectedMission?.id === mission.id ? styles.missionRowSelected : {}),
                }}
                onClick={() => handleMissionSelect(mission)}
                data-testid={`mission-${mission.id}`}
              >
                <div style={styles.missionInfo}>
                  <span style={styles.missionName}>{mission.name}</span>
                  <span style={styles.missionArea}>{mission.areaId}</span>
                </div>
                <div style={styles.missionLevel}>
                  Lv. {mission.recommendedLevel}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mission Details */}
        <div style={styles.detailsPanel}>
          {selectedMission ? (
            <div style={styles.details}>
              <h2 style={styles.detailsName}>{selectedMission.name}</h2>
              <p style={styles.detailsDescription}>{selectedMission.description}</p>

              <div style={styles.detailsSection}>
                <h3 style={styles.sectionLabel}>Objectives</h3>
                <ul style={styles.objectiveList}>
                  {selectedMission.objectives.map(obj => (
                    <li key={obj.id} style={styles.objective}>
                      {obj.description}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.detailsSection}>
                <h3 style={styles.sectionLabel}>Rewards</h3>
                <div style={styles.rewards}>
                  <span>EXP: {selectedMission.rewards.baseExp}</span>
                  <span>Meseta: {selectedMission.rewards.baseMeseta}</span>
                </div>
              </div>

              <div style={styles.detailsSection}>
                <h3 style={styles.sectionLabel}>Difficulty</h3>
                <div style={styles.difficultyButtons}>
                  {difficulties.map(diff => (
                    <button
                      key={diff}
                      style={{
                        ...styles.difficultyButton,
                        ...(selectedDifficulty === diff ? styles.difficultyButtonActive : {}),
                        ...(!meetsLevelForDifficulty(character.level, diff) ? styles.difficultyButtonDisabled : {}),
                      }}
                      onClick={() => setSelectedDifficulty(diff)}
                      disabled={!meetsLevelForDifficulty(character.level, diff)}
                      data-testid={`difficulty-${diff}`}
                    >
                      {diff.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                style={styles.startButton}
                onClick={handleStartMission}
                data-testid="start-mission"
              >
                START MISSION
              </button>
            </div>
          ) : (
            <div style={styles.emptyDetails}>
              Select a mission to view details
            </div>
          )}
        </div>
      </div>
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
  },
  backButton: {
    color: '#6bb8ff',
    textDecoration: 'none',
    fontSize: '0.7rem',
  },
  title: {
    fontSize: '1rem',
    color: '#f87171',
    letterSpacing: '4px',
  },
  levelDisplay: {
    fontSize: '0.7rem',
    color: '#a6c9ff',
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  missionList: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1rem',
  },
  sectionTitle: {
    fontSize: '0.7rem',
    color: '#6bb8ff',
    marginBottom: '1rem',
    letterSpacing: '2px',
  },
  emptyMessage: {
    fontSize: '0.6rem',
    color: '#4a6a8a',
    textAlign: 'center',
    padding: '2rem',
  },
  missionRow: {
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
  missionRowSelected: {
    borderColor: '#f87171',
    background: 'rgba(248, 113, 113, 0.1)',
  },
  missionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  missionName: {
    fontSize: '0.7rem',
  },
  missionArea: {
    fontSize: '0.5rem',
    color: '#4a6a8a',
    textTransform: 'uppercase',
  },
  missionLevel: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
  },
  detailsPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  detailsName: {
    fontSize: '0.9rem',
    color: '#ffffff',
    margin: 0,
  },
  detailsDescription: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
    lineHeight: '1.6',
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabel: {
    fontSize: '0.6rem',
    color: '#6bb8ff',
    margin: 0,
    letterSpacing: '1px',
  },
  objectiveList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  objective: {
    fontSize: '0.6rem',
    color: '#e0e0e0',
    padding: '0.25rem 0',
    paddingLeft: '1rem',
    position: 'relative',
  },
  rewards: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.6rem',
    color: '#fcd34d',
  },
  difficultyButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  difficultyButton: {
    flex: 1,
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: '#6bb8ff',
    fontFamily: 'inherit',
    fontSize: '0.5rem',
    cursor: 'pointer',
  },
  difficultyButtonActive: {
    borderColor: '#f87171',
    background: 'rgba(248, 113, 113, 0.2)',
    color: '#f87171',
  },
  difficultyButtonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  startButton: {
    padding: '1rem',
    background: 'linear-gradient(135deg, #6a2d2d 0%, #5a1a1a 100%)',
    border: '2px solid #f87171',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    cursor: 'pointer',
    letterSpacing: '2px',
    marginTop: '1rem',
  },
  emptyDetails: {
    fontSize: '0.6rem',
    color: '#4a6a8a',
    textAlign: 'center',
    padding: '3rem',
  },
};
