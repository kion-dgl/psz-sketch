import { useState, useEffect } from 'react';
import type { Character } from '../../systems/character/types';
import type { Field, FieldResult } from '../../systems/field/types';
import type { Mission, MissionResult, Difficulty } from '../../systems/mission/types';
import {
  getAllFields,
  isFieldUnlocked,
  hasFieldCompleted,
  initializeDefaultFields,
} from '../../systems/field';
import {
  getAllMissions,
  isMissionUnlocked,
  hasMissionCompleted,
  initializeDefaultMissions,
  meetsLevelForDifficulty,
} from '../../systems/mission';
import {
  setSessionConfig,
  enterField,
  enterMission,
  getSessionState,
  isInSession,
  hasPendingRewards,
  getPendingResult,
  claimRewards,
  useTelepipe,
  abandonSession,
  canResume,
  resumeSession,
} from '../../systems/session';

type Tab = 'fields' | 'missions' | 'active' | 'report';

export default function MissionCounterWeb() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('fields');
  const [fields, setFields] = useState<Field[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [message, setMessage] = useState('');
  const [pendingResult, setPendingResult] = useState<FieldResult | MissionResult | null>(null);

  useEffect(() => {
    initializeDefaultFields();
    initializeDefaultMissions();
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
          setSessionConfig(found.character_id, found.level);
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

    // Get all fields
    const allFields = getAllFields();
    setFields(allFields);

    // Get all missions
    const allMissions = getAllMissions();
    setMissions(allMissions);

    // Check for pending rewards
    if (hasPendingRewards()) {
      setPendingResult(getPendingResult());
      setActiveTab('report');
    } else if (isInSession()) {
      setActiveTab('active');
    }
  };

  const isFieldAvailable = (field: Field): boolean => {
    if (!character) return false;
    return isFieldUnlocked(field.id, character.character_id, character.level);
  };

  const isMissionAvailable = (mission: Mission): boolean => {
    if (!character) return false;
    return isMissionUnlocked(mission.id, character.character_id, character.level);
  };

  const canSelectDifficulty = (difficulty: Difficulty): boolean => {
    if (!character) return false;
    return meetsLevelForDifficulty(character.level, difficulty);
  };

  const handleEnterField = () => {
    if (!selectedField || !character) return;

    const success = enterField(selectedField.id, selectedDifficulty);
    if (success) {
      setMessage(`Entering ${selectedField.name}...`);
      // In a real game, this would transition to the field scene
      // For now, we'll simulate completion after showing the message
      setActiveTab('active');
    } else {
      setMessage('Cannot enter field');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEnterMission = () => {
    if (!selectedMission || !character) return;

    const success = enterMission(selectedMission.id, selectedDifficulty);
    if (success) {
      setMessage(`Starting ${selectedMission.name}...`);
      setActiveTab('active');
    } else {
      setMessage('Cannot start mission');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleTelepipe = () => {
    useTelepipe();
    setMessage('Used Telepipe - returned to city');
    refreshData();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAbandon = () => {
    abandonSession();
    setMessage('Session abandoned');
    setActiveTab('fields');
    setSelectedField(null);
    setSelectedMission(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResume = () => {
    if (resumeSession()) {
      setMessage('Resuming session...');
      setActiveTab('active');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClaimRewards = () => {
    const result = claimRewards();
    if (result) {
      // Apply rewards to character
      if (!character) return;

      const expGained = result.expGained;
      const mesetaGained = result.mesetaGained;

      const updatedCharacter = {
        ...character,
        experience: character.experience + expGained,
        meseta: (character.meseta ?? 0) + mesetaGained,
      };

      // Save updated character
      const stored = localStorage.getItem('characters');
      if (stored) {
        const characters = JSON.parse(stored);
        const index = characters.findIndex((c: Character | null) =>
          c?.character_id === character.character_id
        );
        if (index !== -1) {
          characters[index] = updatedCharacter;
          localStorage.setItem('characters', JSON.stringify(characters));
        }
      }

      setCharacter(updatedCharacter);
      setMessage('Rewards claimed!');
      setPendingResult(null);
      setActiveTab('fields');
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

  const sessionState = getSessionState();

  return (
    <div style={styles.container} data-testid="mission-counter">
      {/* Header */}
      <div style={styles.header}>
        <a href="/web/city-hub" style={styles.backButton} data-testid="back-button">
          &#8592; Back to City
        </a>
        <h1 style={styles.title}>GUILD COUNTER</h1>
        <div style={styles.levelDisplay}>
          <span style={styles.levelLabel}>Lv</span>
          <span style={styles.levelValue} data-testid="character-level">
            {character.level}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['fields', 'missions', 'active', 'report'] as Tab[]).map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
              ...(tab === 'report' && hasPendingRewards() ? styles.tabHighlight : {}),
            }}
            onClick={() => setActiveTab(tab)}
            data-testid={`tab-${tab}`}
          >
            {tab.toUpperCase()}
            {tab === 'report' && hasPendingRewards() && ' !'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Fields Tab */}
        {activeTab === 'fields' && (
          <div style={styles.splitView}>
            <div style={styles.listPanel} data-testid="field-list">
              <h3 style={styles.sectionTitle}>AVAILABLE FIELDS</h3>
              {fields.map(field => {
                const available = isFieldAvailable(field);
                const completed = hasFieldCompleted(character.character_id, field.id);
                return (
                  <div
                    key={field.id}
                    style={{
                      ...styles.listItem,
                      ...(selectedField?.id === field.id ? styles.listItemSelected : {}),
                      ...(!available ? styles.listItemLocked : {}),
                    }}
                    onClick={() => available && setSelectedField(field)}
                    data-testid={`field-${field.id}`}
                  >
                    <div style={styles.listItemContent}>
                      <span style={styles.listItemName}>
                        {completed && '✓ '}
                        {field.name}
                      </span>
                      <span style={styles.listItemLevel}>Lv.{field.recommendedLevel}</span>
                    </div>
                    {!available && <span style={styles.lockIcon}>🔒</span>}
                  </div>
                );
              })}
            </div>

            <div style={styles.detailPanel} data-testid="field-details">
              {selectedField ? (
                <>
                  <h3 style={styles.detailTitle}>{selectedField.name}</h3>
                  <p style={styles.detailDescription}>{selectedField.description}</p>
                  <div style={styles.detailInfo}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Required Level:</span>
                      <span style={styles.infoValue}>{selectedField.requiredLevel}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Recommended:</span>
                      <span style={styles.infoValue}>Lv.{selectedField.recommendedLevel}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Stages:</span>
                      <span style={styles.infoValue}>{selectedField.stageSequence.length} (a→e→b→z)</span>
                    </div>
                    {selectedField.bossId && (
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Boss:</span>
                        <span style={styles.infoValue}>{selectedField.bossId}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.difficultySelect}>
                    <span style={styles.difficultyLabel}>DIFFICULTY</span>
                    <div style={styles.difficultyButtons}>
                      {(['normal', 'hard', 'super-hard'] as Difficulty[]).map(diff => (
                        <button
                          key={diff}
                          style={{
                            ...styles.difficultyButton,
                            ...(selectedDifficulty === diff ? styles.difficultyButtonActive : {}),
                            ...(!canSelectDifficulty(diff) ? styles.difficultyButtonDisabled : {}),
                          }}
                          onClick={() => canSelectDifficulty(diff) && setSelectedDifficulty(diff)}
                          disabled={!canSelectDifficulty(diff)}
                          data-testid={`difficulty-${diff}`}
                        >
                          {diff.toUpperCase().replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    style={styles.enterButton}
                    onClick={handleEnterField}
                    data-testid="enter-field-button"
                  >
                    ENTER FIELD
                  </button>
                </>
              ) : (
                <div style={styles.noSelection}>Select a field to view details</div>
              )}
            </div>
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <div style={styles.splitView}>
            <div style={styles.listPanel} data-testid="mission-list">
              <h3 style={styles.sectionTitle}>AVAILABLE MISSIONS</h3>
              {missions.map(mission => {
                const available = isMissionAvailable(mission);
                const completed = hasMissionCompleted(character.character_id, mission.id);
                return (
                  <div
                    key={mission.id}
                    style={{
                      ...styles.listItem,
                      ...(selectedMission?.id === mission.id ? styles.listItemSelected : {}),
                      ...(!available ? styles.listItemLocked : {}),
                    }}
                    onClick={() => available && setSelectedMission(mission)}
                    data-testid={`mission-${mission.id}`}
                  >
                    <div style={styles.listItemContent}>
                      <span style={styles.listItemName}>
                        {completed && '✓ '}
                        {mission.name}
                      </span>
                      <span style={styles.listItemLevel}>Lv.{mission.recommendedLevel}</span>
                    </div>
                    {!available && <span style={styles.lockIcon}>🔒</span>}
                  </div>
                );
              })}
            </div>

            <div style={styles.detailPanel} data-testid="mission-details">
              {selectedMission ? (
                <>
                  <h3 style={styles.detailTitle}>{selectedMission.name}</h3>
                  <p style={styles.detailDescription}>{selectedMission.description}</p>
                  <div style={styles.detailInfo}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Party Size:</span>
                      <span style={styles.infoValue}>{selectedMission.partySize}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Recommended:</span>
                      <span style={styles.infoValue}>Lv.{selectedMission.recommendedLevel}</span>
                    </div>
                  </div>

                  <div style={styles.objectivesSection}>
                    <h4 style={styles.objectivesTitle}>OBJECTIVES</h4>
                    {selectedMission.objectives.map(obj => (
                      <div key={obj.id} style={styles.objectiveItem}>
                        • {obj.description}
                      </div>
                    ))}
                  </div>

                  <div style={styles.difficultySelect}>
                    <span style={styles.difficultyLabel}>DIFFICULTY</span>
                    <div style={styles.difficultyButtons}>
                      {(['normal', 'hard', 'super-hard'] as Difficulty[]).map(diff => (
                        <button
                          key={diff}
                          style={{
                            ...styles.difficultyButton,
                            ...(selectedDifficulty === diff ? styles.difficultyButtonActive : {}),
                            ...(!canSelectDifficulty(diff) ? styles.difficultyButtonDisabled : {}),
                          }}
                          onClick={() => canSelectDifficulty(diff) && setSelectedDifficulty(diff)}
                          disabled={!canSelectDifficulty(diff)}
                        >
                          {diff.toUpperCase().replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    style={styles.enterButton}
                    onClick={handleEnterMission}
                    data-testid="enter-mission-button"
                  >
                    ACCEPT MISSION
                  </button>
                </>
              ) : (
                <div style={styles.noSelection}>Select a mission to view details</div>
              )}
            </div>
          </div>
        )}

        {/* Active Tab */}
        {activeTab === 'active' && (
          <div style={styles.activePanel} data-testid="active-session">
            {isInSession() ? (
              <>
                <h3 style={styles.activeTitle}>
                  {sessionState.activeType === 'field' ? 'FIELD IN PROGRESS' : 'MISSION IN PROGRESS'}
                </h3>
                <div style={styles.activeInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Location:</span>
                    <span style={styles.infoValue}>{sessionState.activeId}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Difficulty:</span>
                    <span style={styles.infoValue}>{sessionState.difficulty.toUpperCase()}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Stage:</span>
                    <span style={styles.infoValue}>{sessionState.currentStageIndex + 1}</span>
                  </div>
                </div>

                {canResume() ? (
                  <div style={styles.telepipeStatus}>
                    <p style={styles.telepipeMessage}>Telepipe active - session paused</p>
                    <button
                      style={styles.resumeButton}
                      onClick={handleResume}
                      data-testid="resume-button"
                    >
                      RESUME SESSION
                    </button>
                  </div>
                ) : (
                  <button
                    style={styles.telepipeButton}
                    onClick={handleTelepipe}
                    data-testid="telepipe-button"
                  >
                    USE TELEPIPE
                  </button>
                )}

                {sessionState.telepipeUsed && (
                  <button
                    style={styles.abandonButton}
                    onClick={handleAbandon}
                    data-testid="abandon-button"
                  >
                    ABANDON SESSION
                  </button>
                )}
              </>
            ) : (
              <div style={styles.noSession}>
                <p>No active session</p>
                <p style={styles.noSessionHint}>Select a field or mission to begin</p>
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div style={styles.reportPanel} data-testid="report-section">
            {pendingResult ? (
              <>
                <h2 style={styles.reportTitle}>
                  {'fieldId' in pendingResult ? 'FIELD COMPLETE!' : 'MISSION COMPLETE!'}
                </h2>
                <div style={styles.reportGrade}>
                  Grade: <span style={styles.gradeValue}>{pendingResult.grade}</span>
                </div>

                <div style={styles.rewardsSection}>
                  <h3 style={styles.rewardsTitle}>REWARDS</h3>
                  <div style={styles.rewardRow}>
                    <span style={styles.rewardLabel}>EXP:</span>
                    <span style={styles.rewardValue}>+{pendingResult.expGained.toLocaleString()}</span>
                  </div>
                  <div style={styles.rewardRow}>
                    <span style={styles.rewardLabel}>Meseta:</span>
                    <span style={styles.rewardValue}>+{pendingResult.mesetaGained.toLocaleString()}</span>
                  </div>

                  {pendingResult.itemsGained && pendingResult.itemsGained.length > 0 && (
                    <div style={styles.itemsSection}>
                      <span style={styles.rewardLabel}>Items:</span>
                      {pendingResult.itemsGained.map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                          {'itemId' in item ? item.itemId : (item as any).itemId} x
                          {'quantity' in item ? item.quantity : 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  style={styles.claimButton}
                  onClick={handleClaimRewards}
                  data-testid="claim-rewards-button"
                >
                  CLAIM REWARDS
                </button>
              </>
            ) : (
              <div style={styles.noRewards}>
                <p>No pending rewards</p>
                <p style={styles.noRewardsHint}>Complete a field or mission to earn rewards</p>
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
  levelDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(107, 184, 255, 0.1)',
    border: '2px solid #6bb8ff',
    borderRadius: '4px',
  },
  levelLabel: {
    fontSize: '0.5rem',
    color: '#888',
  },
  levelValue: {
    fontSize: '0.8rem',
    color: '#6bb8ff',
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
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
  tabHighlight: {
    borderColor: '#fcd34d',
    color: '#fcd34d',
  },
  content: {
    marginTop: '1rem',
  },
  splitView: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '1rem',
    minHeight: '400px',
  },
  listPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1rem',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: '0.7rem',
    color: '#a78bfa',
    marginBottom: '1rem',
    marginTop: 0,
  },
  listItem: {
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
  listItemSelected: {
    borderColor: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.1)',
  },
  listItemLocked: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  listItemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  listItemName: {
    fontSize: '0.65rem',
  },
  listItemLevel: {
    fontSize: '0.5rem',
    color: '#6bb8ff',
  },
  lockIcon: {
    fontSize: '0.8rem',
  },
  detailPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  detailTitle: {
    fontSize: '0.9rem',
    color: '#a78bfa',
    marginBottom: '1rem',
    marginTop: 0,
  },
  detailDescription: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
    marginBottom: '1rem',
    lineHeight: 1.6,
  },
  detailInfo: {
    marginBottom: '1rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.6rem',
  },
  infoLabel: {
    color: '#888',
  },
  infoValue: {
    color: '#6bb8ff',
  },
  objectivesSection: {
    marginBottom: '1rem',
  },
  objectivesTitle: {
    fontSize: '0.6rem',
    color: '#a78bfa',
    marginBottom: '0.5rem',
  },
  objectiveItem: {
    fontSize: '0.55rem',
    color: '#a6c9ff',
    marginBottom: '0.25rem',
    paddingLeft: '0.5rem',
  },
  difficultySelect: {
    marginBottom: '1rem',
  },
  difficultyLabel: {
    fontSize: '0.6rem',
    color: '#888',
    display: 'block',
    marginBottom: '0.5rem',
  },
  difficultyButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  difficultyButton: {
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: '#6bb8ff',
    fontFamily: 'inherit',
    fontSize: '0.5rem',
    cursor: 'pointer',
  },
  difficultyButtonActive: {
    background: 'rgba(107, 184, 255, 0.2)',
    borderColor: '#6bb8ff',
  },
  difficultyButtonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  enterButton: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    cursor: 'pointer',
    letterSpacing: '2px',
  },
  noSelection: {
    fontSize: '0.6rem',
    color: '#4a6a8a',
    textAlign: 'center',
    marginTop: '4rem',
  },
  activePanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
  },
  activeTitle: {
    fontSize: '0.9rem',
    color: '#a78bfa',
    marginBottom: '2rem',
  },
  activeInfo: {
    marginBottom: '2rem',
    textAlign: 'left',
    maxWidth: '300px',
    margin: '0 auto 2rem',
  },
  telepipeStatus: {
    marginBottom: '1rem',
  },
  telepipeMessage: {
    fontSize: '0.6rem',
    color: '#fcd34d',
    marginBottom: '1rem',
  },
  telepipeButton: {
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #4a4a2d 0%, #3a3a1a 100%)',
    border: '2px solid #fcd34d',
    borderRadius: '4px',
    color: '#fcd34d',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  resumeButton: {
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  abandonButton: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: '2px solid #f87171',
    borderRadius: '4px',
    color: '#f87171',
    fontFamily: 'inherit',
    fontSize: '0.5rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  noSession: {
    fontSize: '0.7rem',
    color: '#4a6a8a',
  },
  noSessionHint: {
    fontSize: '0.5rem',
    color: '#3a4a6a',
    marginTop: '0.5rem',
  },
  reportPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
  },
  reportTitle: {
    fontSize: '1.2rem',
    color: '#4ade80',
    marginBottom: '1rem',
  },
  reportGrade: {
    fontSize: '0.8rem',
    color: '#888',
    marginBottom: '2rem',
  },
  gradeValue: {
    fontSize: '1.5rem',
    color: '#fcd34d',
  },
  rewardsSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    textAlign: 'left',
  },
  rewardsTitle: {
    fontSize: '0.7rem',
    color: '#a78bfa',
    marginBottom: '1rem',
  },
  rewardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.7rem',
  },
  rewardLabel: {
    color: '#888',
  },
  rewardValue: {
    color: '#4ade80',
  },
  itemsSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #3a5a8a',
  },
  itemRow: {
    fontSize: '0.6rem',
    color: '#fcd34d',
    marginTop: '0.25rem',
    paddingLeft: '1rem',
  },
  claimButton: {
    padding: '1rem 3rem',
    background: 'linear-gradient(135deg, #6a4a2d 0%, #5a3a1a 100%)',
    border: '2px solid #fcd34d',
    borderRadius: '4px',
    color: '#fcd34d',
    fontFamily: 'inherit',
    fontSize: '0.8rem',
    cursor: 'pointer',
    letterSpacing: '2px',
  },
  noRewards: {
    fontSize: '0.7rem',
    color: '#4a6a8a',
  },
  noRewardsHint: {
    fontSize: '0.5rem',
    color: '#3a4a6a',
    marginTop: '0.5rem',
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
