import { useState, useEffect } from 'react';
import CharacterPreview from './CharacterPreview';

interface CharacterCreationFormProps {
  slot: number;
}

export default function CharacterCreationForm({ slot }: CharacterCreationFormProps) {
  const [characterName, setCharacterName] = useState('');
  const [classId, setClassId] = useState('');
  const [textureId, setTextureId] = useState('tex_01');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Validate slot on mount
  useEffect(() => {
    if (isNaN(slot) || slot < 0 || slot > 3) {
      alert('Invalid slot parameter');
      window.location.href = '/character-select';
    }
  }, [slot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!characterName.trim() || !classId || !textureId) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slot,
          name: characterName.trim(),
          class_id: classId,
          texture_id: textureId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create character');
      }

      const character = await response.json();
      window.location.href = `/character-selected/${character.character_id}`;
    } catch (err) {
      console.error('Error creating character:', err);
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '400px 1fr',
      gap: '2rem',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Form Column */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        padding: '2rem'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="character-name" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: 'white'
            }}>
              Character Name
            </label>
            <input
              type="text"
              id="character-name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              maxLength={50}
              required
              placeholder="Enter character name"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: 'all 0.3s'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="class-id" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: 'white'
            }}>
              Class
            </label>
            <select
              id="class-id"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: 'all 0.3s'
              }}
            >
              <option value="">Select a class</option>
              <optgroup label="Hunter">
                <option value="HUmar">HUmar</option>
                <option value="HUmarl">HUmarl</option>
                <option value="HUcast">HUcast</option>
                <option value="HUcaseal">HUcaseal</option>
                <option value="HUnewm">HUnewm</option>
                <option value="HUnewearl">HUnewearl</option>
              </optgroup>
              <optgroup label="Ranger">
                <option value="RAmar">RAmar</option>
                <option value="RAmarl">RAmarl</option>
                <option value="RAcast">RAcast</option>
                <option value="RAcaseal">RAcaseal</option>
              </optgroup>
              <optgroup label="Force">
                <option value="FOmar">FOmar</option>
                <option value="FOmarl">FOmarl</option>
                <option value="FOnewm">FOnewm</option>
                <option value="FOnewearl">FOnewearl</option>
              </optgroup>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="texture-id" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: 'white'
            }}>
              Appearance
            </label>
            <select
              id="texture-id"
              value={textureId}
              onChange={(e) => setTextureId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                transition: 'all 0.3s'
              }}
            >
              <option value="">Select appearance</option>
              <option value="tex_01">Texture 1</option>
              <option value="tex_02">Texture 2</option>
              <option value="tex_03">Texture 3</option>
              <option value="tex_04">Texture 4</option>
              <option value="tex_05">Texture 5</option>
              <option value="tex_06">Texture 6</option>
              <option value="tex_07">Texture 7</option>
              <option value="tex_08">Texture 8</option>
              <option value="tex_09">Texture 9</option>
              <option value="tex_10">Texture 10</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                background: '#4CAF50',
                color: 'white',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                'Create Character'
              )}
            </button>
            <a
              href="/character-select"
              style={{
                flex: 1,
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
            >
              Cancel
            </a>
          </div>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(244, 67, 54, 0.2)',
              border: '1px solid #f44336',
              borderRadius: '8px',
              color: '#ffcccc',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Preview Column */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ width: '100%', height: '600px' }}>
          <CharacterPreview classId={classId || null} textureId={textureId} />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
