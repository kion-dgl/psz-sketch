import { useState, useEffect } from 'react';
import { CHARACTER_RACES, type CharacterClass } from '../../config/characterConfig';
import { createAndSaveCharacter, validateCharacterName, validateClassId } from '../../systems/character';

interface CharacterCreateWebProps {
  slot: number;
  onCreated?: (characterId: string) => void;
}

const classGroups = {
  Human: ['HUmar', 'HUmarl', 'RAmar', 'RAmarl', 'FOmar', 'FOmarl'],
  Newman: ['HUnewm', 'HUnewearl', 'FOnewm', 'FOnewearl'],
  Cast: ['HUcast', 'HUcaseal', 'RAcast', 'RAcaseal'],
};

const hairColorNames = ['Blonde', 'Brown', 'Black'];
const skinToneNames = ['Light', 'Medium', 'Dark'];

export default function CharacterCreateWeb({ slot, onCreated }: CharacterCreateWebProps) {
  const [step, setStep] = useState<'class' | 'customize'>('class');
  const [classId, setClassId] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [variationIndex, setVariationIndex] = useState(0);
  const [bodyColorIndex, setBodyColorIndex] = useState(0);
  const [hairColorIndex, setHairColorIndex] = useState(0);
  const [skinToneIndex, setSkinToneIndex] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validate slot on mount
  useEffect(() => {
    if (isNaN(slot) || slot < 0 || slot > 3) {
      window.location.href = '/web/character-select';
    }
  }, [slot]);

  const findClassConfig = (id: string): CharacterClass | null => {
    for (const race of CHARACTER_RACES) {
      const found = race.classes.find(c => c.id === id);
      if (found) return found;
    }
    return null;
  };

  const handleClassSelect = (selectedClassId: string) => {
    setClassId(selectedClassId);
    setVariationIndex(0);
    setBodyColorIndex(0);
    setStep('customize');
  };

  const handleBack = () => {
    if (step === 'customize') {
      setStep('class');
      setClassId('');
    } else {
      window.location.href = '/web/character-select';
    }
  };

  const handleCreate = () => {
    setError('');

    // Validate name
    const nameResult = validateCharacterName(characterName);
    if (!nameResult.valid) {
      setError(nameResult.errors.join(', '));
      return;
    }

    // Validate class
    const classResult = validateClassId(classId);
    if (!classResult.valid) {
      setError(classResult.errors.join(', '));
      return;
    }

    setSubmitting(true);

    try {
      const character = createAndSaveCharacter({
        name: characterName,
        classId,
        slot,
        variationIndex,
        bodyColorIndex,
        hairColorIndex,
        skinToneIndex,
      });

      if (onCreated) {
        onCreated(character.character_id);
      } else {
        window.location.href = '/web/city-hub';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setSubmitting(false);
    }
  };

  const classConfig = findClassConfig(classId);

  if (step === 'class') {
    return (
      <div style={styles.container}>
        <button style={styles.backButton} onClick={handleBack} data-testid="back-button">
          ← Back
        </button>
        <h1 style={styles.title}>SELECT CLASS</h1>

        <div style={styles.classGrid}>
          {Object.entries(classGroups).map(([race, classes]) => (
            <div key={race} style={styles.raceSection}>
              <h2 style={styles.raceTitle}>{race}</h2>
              <div style={styles.classList}>
                {classes.map((cls) => (
                  <button
                    key={cls}
                    style={styles.classButton}
                    onClick={() => handleClassSelect(cls)}
                    data-testid={`class-${cls}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={handleBack} data-testid="back-button">
        ← Back
      </button>
      <h1 style={styles.title}>CUSTOMIZE: {classId}</h1>

      <div style={styles.customizeGrid}>
        {/* Options Panel */}
        <div style={styles.optionsPanel}>
          {/* Head Type */}
          {classConfig && (
            <div style={styles.optionGroup}>
              <label style={styles.optionLabel}>Head Type</label>
              <div style={styles.optionButtons}>
                {classConfig.variations.map((_, index) => (
                  <button
                    key={index}
                    style={{
                      ...styles.optionButton,
                      ...(variationIndex === index ? styles.optionButtonActive : {}),
                    }}
                    onClick={() => setVariationIndex(index)}
                    data-testid={`variation-${index}`}
                  >
                    Type {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body Color */}
          {classConfig && (
            <div style={styles.optionGroup}>
              <label style={styles.optionLabel}>Body Color</label>
              <div style={styles.optionButtons}>
                {classConfig.colors.map((color, index) => (
                  <button
                    key={index}
                    style={{
                      ...styles.optionButton,
                      ...(bodyColorIndex === index ? styles.optionButtonActive : {}),
                    }}
                    onClick={() => setBodyColorIndex(index)}
                    data-testid={`body-color-${index}`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hair Color */}
          <div style={styles.optionGroup}>
            <label style={styles.optionLabel}>Hair Color</label>
            <div style={styles.optionButtons}>
              {hairColorNames.map((name, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.optionButton,
                    ...(hairColorIndex === index ? styles.optionButtonActive : {}),
                  }}
                  onClick={() => setHairColorIndex(index)}
                  data-testid={`hair-color-${index}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Tone */}
          <div style={styles.optionGroup}>
            <label style={styles.optionLabel}>Skin Tone</label>
            <div style={styles.optionButtons}>
              {skinToneNames.map((name, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.optionButton,
                    ...(skinToneIndex === index ? styles.optionButtonActive : {}),
                  }}
                  onClick={() => setSkinToneIndex(index)}
                  data-testid={`skin-tone-${index}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div style={styles.previewPanel}>
          <div style={styles.preview}>
            <div style={styles.previewPlaceholder}>
              <span style={styles.previewIcon}>👤</span>
              <span style={styles.previewClass}>{classId}</span>
              <span style={styles.previewVariation}>Type {variationIndex + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Name Input and Create Button */}
      <div style={styles.footer}>
        <div style={styles.nameSection}>
          <label style={styles.nameLabel}>Character Name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            maxLength={50}
            placeholder="Enter name..."
            style={styles.nameInput}
            data-testid="character-name-input"
          />
        </div>

        {error && (
          <div style={styles.error} data-testid="validation-error">
            {error}
          </div>
        )}

        <button
          style={{
            ...styles.createButton,
            ...(submitting ? styles.createButtonDisabled : {}),
          }}
          onClick={handleCreate}
          disabled={submitting}
          data-testid="create-character"
        >
          {submitting ? 'CREATING...' : 'CREATE CHARACTER'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Press Start 2P', system-ui, sans-serif",
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    background: 'transparent',
    border: 'none',
    color: '#6bb8ff',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    cursor: 'pointer',
    letterSpacing: '1px',
  },
  title: {
    fontSize: '1rem',
    marginBottom: '2rem',
    color: '#6bb8ff',
    letterSpacing: '4px',
  },
  classGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    maxWidth: '900px',
    width: '100%',
  },
  raceSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  raceTitle: {
    fontSize: '0.8rem',
    color: '#a6c9ff',
    marginBottom: '1rem',
    textAlign: 'center',
    letterSpacing: '2px',
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  classButton: {
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #2d4a6a 0%, #1a3a5a 100%)',
    border: '2px solid #6bb8ff',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.6rem',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.2s',
  },
  customizeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    maxWidth: '900px',
    width: '100%',
    flex: 1,
  },
  optionsPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  optionLabel: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
    letterSpacing: '1px',
  },
  optionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  optionButton: {
    padding: '0.5rem 0.75rem',
    background: 'linear-gradient(135deg, #2d4a6a 0%, #1a3a5a 100%)',
    border: '2px solid #3a5a8a',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.5rem',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.2s',
  },
  optionButtonActive: {
    background: 'linear-gradient(135deg, #3d6a8a 0%, #2a5a7a 100%)',
    borderColor: '#6bb8ff',
  },
  previewPanel: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #3a5a8a',
    borderRadius: '8px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    color: '#4a6a8a',
  },
  previewIcon: {
    fontSize: '4rem',
    opacity: 0.5,
  },
  previewClass: {
    fontSize: '0.8rem',
    color: '#6bb8ff',
  },
  previewVariation: {
    fontSize: '0.6rem',
    color: '#4a6a8a',
  },
  footer: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    maxWidth: '500px',
  },
  nameSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  nameLabel: {
    fontSize: '0.6rem',
    color: '#a6c9ff',
    letterSpacing: '1px',
  },
  nameInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #3a5a8a',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    outline: 'none',
  },
  error: {
    padding: '0.75rem 1rem',
    background: 'rgba(248, 113, 113, 0.1)',
    border: '2px solid #f87171',
    borderRadius: '4px',
    color: '#f87171',
    fontSize: '0.6rem',
    width: '100%',
    textAlign: 'center',
  },
  createButton: {
    padding: '1rem 3rem',
    background: 'linear-gradient(135deg, #2d6a4a 0%, #1a5a3a 100%)',
    border: '2px solid #4ade80',
    color: 'white',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
    cursor: 'pointer',
    letterSpacing: '2px',
    transition: 'all 0.2s',
  },
  createButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
