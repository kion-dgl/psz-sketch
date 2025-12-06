import { useState, useEffect } from 'react';
import CharacterPreview from './CharacterPreview';
import { findCharacterClass } from '../../config/characterConfig';

interface CharacterCreationFormProps {
  slot: number;
}

const classGroups = {
  Human: ['HUmar', 'HUmarl', 'RAmar', 'RAmarl', 'FOmar', 'FOmarl'],
  Cast: ['HUcast', 'HUcaseal', 'RAcast', 'RAcaseal'],
  Newman: ['HUnewm', 'HUnewearl', 'FOnewm', 'FOnewearl'],
};

const hairColorNames = ['Blonde', 'Brown', 'Black'];
const skinToneNames = ['Light', 'Medium', 'Dark'];

export default function CharacterCreationForm({ slot }: CharacterCreationFormProps) {
  const [step, setStep] = useState(1); // 1 = class selection, 2 = customization
  const [characterName, setCharacterName] = useState('');
  const [classId, setClassId] = useState('');
  const [variationIndex, setVariationIndex] = useState(0);
  const [bodyColorIndex, setBodyColorIndex] = useState(0);
  const [hairColorIndex, setHairColorIndex] = useState(0);
  const [skinToneIndex, setSkinToneIndex] = useState(0);
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
    setVariationIndex(0);
    setBodyColorIndex(0);
    setHairColorIndex(0);
    setSkinToneIndex(0);
    setStep(2);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!characterName.trim() || !classId) {
      setError('Please fill in all fields');
      return;
    }

    // Calculate the texture ID from the selections
    // skinTone is: hairColorIndex * 3 + skinToneIndex (0-8)
    const actualSkinTone = hairColorIndex * 3 + skinToneIndex;
    const textureId = `${actualSkinTone}_${bodyColorIndex}`;

    setSubmitting(true);

    try {
      // Save character to localStorage
      const stored = localStorage.getItem('characters') || '[]';
      const chars = JSON.parse(stored);
      
      // Ensure array has 4 slots
      while (chars.length < 4) {
        chars.push(null);
      }

      // Get the character class to access the variation
      const characterClass = findCharacterClass(classId);
      if (!characterClass) {
        throw new Error('Character class not found');
      }

      // Create new character
      const newCharacter = {
        character_id: `char_${Date.now()}`,
        character_name: characterName.trim(),
        level: 1,
        slot,
        class_id: classId,
        variation_index: variationIndex,
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
  const characterClass = classId ? findCharacterClass(classId) : null;

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Header with Back Button and Class Name */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="btn btn-ghost text-white"
        >
          ← Back
        </button>
        <h2 className="text-white text-xl" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem' }}>
          {classId}
        </h2>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      {/* Main Content - Fixed height to fit viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-0">
        {/* Form Column - Scrollable if needed */}
        <div className="bg-white/10 border-[5px] border-[#a6c9ff] rounded-lg p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Head Variation */}
          {characterClass && (
            <div>
              <label className="block mb-2 font-bold text-sm text-white">
                Head Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {characterClass.variations.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setVariationIndex(index)}
                    className={`btn btn-sm ${variationIndex === index ? 'btn-primary' : 'btn-ghost'} text-white`}
                  >
                    Type {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body Color */}
          {characterClass && (
            <div>
              <label className="block mb-2 font-bold text-sm text-white">
                Body Color
              </label>
              <div className="grid grid-cols-1 gap-2">
                {characterClass.colors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setBodyColorIndex(index)}
                    className={`btn btn-sm ${bodyColorIndex === index ? 'btn-primary' : 'btn-ghost'} text-white text-xs`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hair Color */}
          <div>
            <label className="block mb-2 font-bold text-sm text-white">
              Hair Color
            </label>
            <div className="grid grid-cols-1 gap-2">
              {hairColorNames.map((name, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setHairColorIndex(index)}
                  className={`btn btn-sm ${hairColorIndex === index ? 'btn-primary' : 'btn-ghost'} text-white`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Tone */}
          <div>
            <label className="block mb-2 font-bold text-sm text-white">
              Skin Tone
            </label>
            <div className="grid grid-cols-1 gap-2">
              {skinToneNames.map((name, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSkinToneIndex(index)}
                  className={`btn btn-sm ${skinToneIndex === index ? 'btn-primary' : 'btn-ghost'} text-white`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="flex items-center justify-center bg-white/10 border-[5px] border-[#a6c9ff] rounded-lg p-6 min-h-0">
          <div className="w-full h-full">
            <CharacterPreview
              classId={classId || null}
              variationIndex={variationIndex}
              bodyColorIndex={bodyColorIndex}
              hairColorIndex={hairColorIndex}
              skinToneIndex={skinToneIndex}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row - Character Name and Create Button */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <label htmlFor="character-name" className="block mb-2 font-bold text-sm text-white">
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
          {error && (
            <div className="text-red-400 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={`btn btn-primary btn-lg ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
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
      </div>
    </div>
  );
}
