import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';
import { getTextureName, getModelPath, getTexturePath, findCharacterClass } from '../../config/characterConfig';
import { loadGLB, loadTexture } from '../../utils/assetCache';

interface CharacterPreviewProps {
  classId: string | null;
  variationIndex: number;
  bodyColorIndex: number;
  hairColorIndex: number;
  skinToneIndex: number;
}

interface ModelProps {
  url: string;
  textureUrl?: string;
}

function CharacterModel({ url, textureUrl }: ModelProps) {
  const group = useRef<Group>(null);
  const gltf = useGLTF(url);

  useEffect(() => {
    if (!textureUrl || !gltf.scene) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      textureUrl,
      (texture) => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;

        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  mat.map = texture;
                  mat.needsUpdate = true;
                });
              } else {
                mesh.material.map = texture;
                mesh.material.needsUpdate = true;
              }
            }
          }
        });
      },
      undefined,
      (error) => console.error('Error loading texture:', error)
    );
  }, [textureUrl, gltf.scene]);

  return <primitive ref={group} object={gltf.scene} />;
}

export default function CharacterPreview({ classId, variationIndex, bodyColorIndex, hairColorIndex, skinToneIndex }: CharacterPreviewProps) {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setModelUrl(null);
      setTextureUrl(null);
      return;
    }

    const loadCharacter = async () => {
      setLoading(true);
      setError(null);

      try {
        const characterClass = findCharacterClass(classId);
        if (!characterClass) {
          throw new Error('Character class not found');
        }

        // Get the selected variation
        const variation = characterClass.variations[variationIndex];

        // Calculate the actual skin tone from hair color and skin tone indices
        // skinTone is: hairColorIndex * 3 + skinToneIndex (0-8)
        const actualSkinTone = hairColorIndex * 3 + skinToneIndex;

        // Load model
        const modelPath = getModelPath(variation);
        const cachedModelUrl = await loadGLB(modelPath);
        setModelUrl(cachedModelUrl);

        // Load texture
        const textureName = getTextureName(variation, bodyColorIndex, actualSkinTone);
        const texturePath = getTexturePath(variation, textureName);
        const cachedTextureUrl = await loadTexture(texturePath);
        setTextureUrl(cachedTextureUrl);

        setLoading(false);
      } catch (err) {
        console.error('Error loading character:', err);
        setError(err instanceof Error ? err.message : 'Failed to load character');
        setLoading(false);
      }
    };

    loadCharacter();
  }, [classId, variationIndex, bodyColorIndex, hairColorIndex, skinToneIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', borderRadius: '12px', overflow: 'hidden' }}>
      {!classId && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#dbeafe',
          fontSize: '1.1rem',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '0.7rem'
        }}>
          Select a class to preview character
        </div>
      )}

      {loading && classId && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#dbeafe',
          fontSize: '1.1rem',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '0.7rem'
        }}>
          Loading character model...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#f44336',
          fontSize: '1.1rem',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '0.7rem'
        }}>
          {error}
        </div>
      )}

      {modelUrl && textureUrl && !loading && (
        <Canvas gl={{ alpha: true }} style={{ background: 'transparent' }}>
          <PerspectiveCamera makeDefault position={[0, 1, 3]} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            target={[0, 0.8, 0]}
          />

          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 7.5]} intensity={0.8} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />

          <Suspense fallback={null}>
            <CharacterModel url={modelUrl} textureUrl={textureUrl} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
