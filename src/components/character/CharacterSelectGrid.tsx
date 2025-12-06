import { useState, useEffect, useRef } from 'react';

interface Character {
  character_id: string;
  character_name: string;
  level: number;
  slot: number;
  class_id: string;
  variation_index?: number; // Optional for backwards compatibility
  texture_id: string;
}

export default function CharacterSelectGrid() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (deleteModalOpen && modalRef.current) {
      modalRef.current.showModal();
    } else if (modalRef.current) {
      modalRef.current.close();
    }
  }, [deleteModalOpen]);

  const loadCharacters = async () => {
    // Load characters from localStorage (client-side only)
    try {
      const stored = localStorage.getItem('characters');
      if (stored) {
        const chars = JSON.parse(stored);
        setCharacters(chars.filter((c: Character) => c !== null));
      }
    } catch (err) {
      console.error('Error loading characters:', err);
    }
  };

  const handleDeleteClick = (character: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    setCharacterToDelete(character);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!characterToDelete) return;

    try {
      const stored = localStorage.getItem('characters') || '[]';
      const chars = JSON.parse(stored);
      const updated = chars.map((c: Character | null, idx: number) =>
        idx === characterToDelete.slot ? null : c
      );
      localStorage.setItem('characters', JSON.stringify(updated));

      setDeleteModalOpen(false);
      setCharacterToDelete(null);
      loadCharacters();
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('Failed to delete character. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCharacterToDelete(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-8 md:gap-12 flex-1 items-center content-center">
        {[0, 1, 2, 3].map((slotNum) => {
          const character = characters.find(c => c.slot === slotNum);

          return (
            <div
              key={slotNum}
              className="card bg-white border-[5px] border-[#a6c9ff] shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => character && (window.location.href = `/character-selected/${character.character_id}`)}
              onKeyDown={(e) => {
                if (character && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  window.location.href = `/character-selected/${character.character_id}`;
                }
              }}
              role="button"
              tabIndex={character ? 0 : -1}
            >
              <div className="card-body p-8 flex items-center justify-center">
                {character ? (
                  <>
                    <button
                      onClick={(e) => handleDeleteClick(character, e)}
                      className="btn btn-error btn-xs absolute top-2 right-2 z-10"
                    >
                      Delete
                    </button>

                    <div className="flex gap-3 h-full w-full">
                      {/* Character Image - 1/3 width */}
                      <div className="w-1/3 flex items-center justify-center bg-gray-100 rounded">
                        <div className="avatar placeholder">
                          <div className="bg-blue-500 text-white w-16 rounded-full">
                            <span className="text-xl uppercase" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}>
                              {character.character_name.substring(0, 2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Character Details - 2/3 width */}
                      <div className="w-2/3 flex flex-col justify-center">
                        {/* Top Line: Name and Level */}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-800 uppercase leading-tight" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem' }}>
                            {character.character_name}
                          </h3>
                          <span className="text-xl font-bold text-blue-600 ml-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem' }}>
                            LV{character.level}
                          </span>
                        </div>

                        {/* Middle: Class */}
                        <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>
                          {character.class_id}
                        </p>

                        {/* Bottom: Details */}
                        <div className="text-xs text-gray-500 mt-auto" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.4rem' }}>
                          <p>Play Time: 00:00</p>
                          <p>Progress: 0%</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4">
                    <h3 className="card-title justify-center text-gray-700 uppercase" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '1rem' }}>
                      New Game
                    </h3>
                    <p className="text-sm text-gray-500" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>
                      Create a new Hunter
                    </p>
                    <a
                      href={`/character-create?slot=${slotNum}`}
                      className="btn btn-primary btn-sm px-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Start
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* daisyUI Modal for Delete Confirmation */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box bg-gradient-to-b from-[#1e3a8a] to-[#3b82f6] border-4 border-[#3b82f6]">
          <h3 className="font-bold text-2xl text-white mb-4 text-center uppercase" style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
            Delete Character?
          </h3>
          <p className="text-white mb-2 text-center" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem' }}>
            Delete{' '}
            <strong className="text-yellow-300">{characterToDelete?.character_name}</strong>?
          </p>
          <p className="text-red-300 text-sm mb-6 text-center" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>
            This action cannot be undone.
          </p>
          <div className="modal-action justify-center">
            <button
              onClick={handleConfirmDelete}
              className="btn btn-error"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="btn"
            >
              Cancel
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCancelDelete} aria-label="Close">close</button>
        </form>
      </dialog>
    </>
  );
}
