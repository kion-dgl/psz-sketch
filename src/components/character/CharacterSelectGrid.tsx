import { useState, useEffect } from 'react';
import { getAllCharacters, deleteCharacter, type CharacterData } from '../../lib/characterStorage';
import CharacterPreview from './CharacterPreview';

export default function CharacterSelectGrid() {
  const [characters, setCharacters] = useState<(CharacterData | null)[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const chars = await getAllCharacters();
      setCharacters(chars);
    } catch (err) {
      console.error('Error loading characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (character: CharacterData) => {
    setCharacterToDelete(character);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!characterToDelete) return;

    try {
      await deleteCharacter(characterToDelete.slot);
      await loadCharacters();
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Failed to delete character. Please try again.');
    } finally {
      setDeleteModalOpen(false);
      setCharacterToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCharacterToDelete(null);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatPlayTime = (seconds?: number) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="text-center my-8 text-white text-xl">
        Loading characters...
      </div>
    );
  }

  const hasAnyCharacter = characters.some(c => c !== null);

  if (!hasAnyCharacter) {
    return (
      <div className="text-center my-8 text-white">
        <p className="text-xl mb-4">No characters created yet</p>
        <a
          href="/character-create?slot=0"
          className="inline-block px-8 py-3 bg-gradient-to-b from-yellow-500 to-yellow-600 text-white border-2 border-yellow-700 rounded font-mono font-bold hover:from-yellow-400 hover:to-yellow-500 transition-all"
        >
          Create Your First Character
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 max-w-5xl w-full">
        {[0, 1, 2, 3].map((slotNum) => {
          const character = characters[slotNum];

          return (
            <div
              key={slotNum}
              className="relative bg-gradient-to-b from-blue-50 to-blue-100 border-4 border-blue-900 rounded-lg shadow-lg hover:border-blue-700 transition-all overflow-hidden"
              style={{ minHeight: '200px' }}
            >
              {character ? (
                <>
                  <button
                    onClick={() => handleDeleteClick(character)}
                    className="absolute top-4 right-4 z-10 bg-red-500 text-white border-2 border-red-800 rounded px-4 py-2 font-bold text-sm hover:bg-red-600 transition-all"
                  >
                    Delete
                  </button>

                  <div
                    onClick={() => window.location.href = `/character-selected/${character.character_id}`}
                    className="flex items-stretch h-full cursor-pointer p-6"
                  >
                    {/* LEFT: Character Info */}
                    <div className="flex-1 flex flex-col justify-center text-black font-mono pr-6">
                      <div className="text-4xl font-bold tracking-wide mb-2">{character.character_name}</div>
                      <div className="text-3xl font-bold tracking-wider mb-6">{character.class_id}</div>
                      
                      <div className="text-2xl font-bold mb-2">LV{character.level}</div>
                      
                      <div className="text-base space-y-1 opacity-90">
                        <div>Last save</div>
                        <div className="font-bold">{formatDate(character.last_played || character.created_at)}</div>
                        <div className="font-bold">{formatTime(character.last_played || character.created_at)}</div>
                        
                        <div className="mt-3">Play time</div>
                        <div className="font-bold">{formatPlayTime(character.play_time)}</div>
                      </div>
                    </div>

                    {/* MIDDLE: Dotted divider */}
                    <div className="flex flex-col justify-around py-4 px-2 text-blue-400 text-2xl font-bold">
                      <div>:</div>
                      <div>:</div>
                      <div>:</div>
                    </div>

                    {/* RIGHT: 3D Character Preview */}
                    <div className="w-80 h-full flex items-center justify-center bg-black border-4 border-blue-900 rounded">
                      <CharacterPreview 
                        classId={character.class_id} 
                        textureId={character.texture_id}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <a
                  href={`/character-create?slot=${slotNum}`}
                  className="flex items-center justify-center h-full min-h-[200px] group"
                >
                  <span className="text-5xl font-mono font-bold text-yellow-600 tracking-widest drop-shadow-lg group-hover:text-yellow-500 group-hover:scale-105 transition-all">
                    New Game
                  </span>
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelDelete();
            }
          }}
        >
          <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-4 border-blue-900 rounded-xl p-8 max-w-md text-center text-black">
            <h2 className="text-3xl font-mono font-bold mb-4">Delete Character?</h2>
            <p className="font-mono mb-2">
              Are you sure you want to delete <strong>{characterToDelete?.character_name}</strong>?
            </p>
            <p className="text-red-600 text-sm mb-6 font-mono">
              This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleConfirmDelete}
                className="px-8 py-3 bg-red-500 text-white border-2 border-red-800 rounded font-mono font-bold hover:bg-red-600 transition-all"
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-8 py-3 bg-white text-black border-2 border-blue-900 rounded font-mono font-bold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
