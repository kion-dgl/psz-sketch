import { useState, useEffect } from 'react';
import CharacterPreview from './CharacterPreview';

interface CharacterCreationFormProps {
  slot: number;
}

const classGroups = {
  Human: ['HUmar', 'HUmarl', 'RAmar', 'RAmarl', 'FOmar', 'FOmarl'],
  Cast: ['HUcast', 'HUcaseal', 'RAcast', 'RAcaseal'],
  Newman: ['HUnewm', 'HUnewearl', 'FOnewm', 'FOnewearl'],
};

export default function CharacterCreationForm({ slot }: CharacterCreationFormProps) {
  const [step, setStep] = useState(1); // 1 = class selection, 2 = customization
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

  const handleClassSelect = (selectedClassId: string) => {
    setClassId(selectedClassId);
    setStep(2);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!characterName.trim() || !classId || !textureId) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      // Save character to localStorage
      const stored = localStorage.getItem('characters') || '[]';
      const chars = JSON.parse(stored);
      
      // Ensure array has 4 slots
      while (chars.length < 4) {
        chars.push(null);
      }

      // Create new character
      const newCharacter = {
        character_id: `char_${Date.now()}`,
        character_name: characterName.trim(),
        level: 1,
        slot,
        class_id: classId,
        texture_id: textureId,
        experience: 0,
        created_at: new Date().toISOString(),
      };

      // Check if slot is already occupied
      if (chars[slot] !== null) {
        setError('Slot already occupied');
        setSubmitting(false);
        return;
      }

      chars[slot] = newCharacter;
      localStorage.setItem('characters', JSON.stringify(chars));

      window.location.href = `/character-selected/${newCharacter.character_id}`;
    } catch (err) {
      console.error('Error creating character:', err);
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setSubmitting(false);
    }
  };

  // Step 1: Class Selection
  if (step === 1) {
    return (
      <>
        {/* Back to Character Select Button */}
        <a
          href="/character-select"
          className="btn btn-ghost text-white absolute top-8 left-8"
        >
          ← Back
        </a>

        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(classGroups).map(([race, classes]) => (
              <div key={race} className="bg-white/10 border-[5px] border-[#a6c9ff] rounded-lg p-6">
                <h3 className="text-xl text-white mb-4 text-center uppercase" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem' }}>
                  {race}
                </h3>
                <div className="space-y-2">
                  {classes.map((className) => (
                    <button
                      key={className}
                      onClick={() => handleClassSelect(className)}
                      className="btn btn-primary w-full text-xs"
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem' }}
                    >
                      {className}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Step 2: Character Customization
  return (
    <>
      {/* Back to Class Selection Button */}
      <button
        type="button"
        onClick={() => setStep(1)}
        className="btn btn-ghost text-white absolute top-8 left-8"
      >
        ← Back to Class Selection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 w-full max-w-7xl h-full">
        {/* Form Column */}
        <div className="bg-white/10 border-[5px] border-[#a6c9ff] rounded-lg p-8 flex flex-col justify-between">
          <div className="space-y-6 flex-1 flex flex-col">
          <div className="space-y-6 flex-1">
            {/* Selected Class Display */}
            <div>
              <label className="block mb-2 font-bold text-lg text-white">
                Class
              </label>
              <div className="p-3 bg-white/20 border-2 border-white/30 rounded-lg text-white">
                {classId}
              </div>
            </div>

            <div>
              <label htmlFor="texture-id" className="block mb-2 font-bold text-lg text-white">
                Appearance
              </label>
              <select
                id="texture-id"
                value={textureId}
                onChange={(e) => setTextureId(e.target.value)}
                required
                className="select w-full bg-white/20 border-2 border-white/30 text-white"
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

            <div>
              <label htmlFor="character-name" className="block mb-2 font-bold text-lg text-white">
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
                className="input w-full bg-white/20 border-2 border-white/30 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          </div>
        </div>

        {/* Preview Column */}
        <div className="flex items-center justify-center bg-white/10 border-[5px] border-[#a6c9ff] rounded-lg p-8">
          <div className="w-full h-full">
            <CharacterPreview classId={classId || null} textureId={textureId} />
          </div>
        </div>
      </div>

      {/* Create Character Button - Bottom Right */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className={`btn btn-primary btn-lg absolute bottom-8 right-8 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {submitting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Creating...
          </>
        ) : (
          'Create Character'
        )}
      </button>
    </>
  );
}
