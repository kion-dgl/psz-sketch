import { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface TextureInfo {
  name: string;
  texture: THREE.Texture;
  material: THREE.Material;
}

interface TexturePanelProps {
  textures: TextureInfo[];
  selectedIndex: number;
  onSelectTexture: (index: number) => void;
  onUpdate: (index: number, adjustments: any) => void;
}

export default function TexturePanel({ textures, selectedIndex, onSelectTexture, onUpdate }: TexturePanelProps) {
  const selectedTexture = textures[selectedIndex];

  const [repeatX, setRepeatX] = useState(selectedTexture?.texture.repeat.x || 1);
  const [repeatY, setRepeatY] = useState(selectedTexture?.texture.repeat.y || 1);
  const [offsetX, setOffsetX] = useState(selectedTexture?.texture.offset.x || 0);
  const [offsetY, setOffsetY] = useState(selectedTexture?.texture.offset.y || 0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTexture) {
      setRepeatX(selectedTexture.texture.repeat.x);
      setRepeatY(selectedTexture.texture.repeat.y);
      setOffsetX(selectedTexture.texture.offset.x);
      setOffsetY(selectedTexture.texture.offset.y);

      // Generate preview image
      const image = selectedTexture.texture.image as HTMLImageElement | undefined;
      if (image && image.width && image.height) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0, 256, 256);
          setPreviewUrl(canvas.toDataURL());
        }
      }
    }
  }, [selectedTexture]);

  useEffect(() => {
    if (selectedTexture) {
      onUpdate(selectedIndex, { repeatX, repeatY, offsetX, offsetY });
    }
  }, [repeatX, repeatY, offsetX, offsetY, selectedIndex]);

  if (!selectedTexture) return null;

  return (
    <Html fullscreen>
      <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      zIndex: 1000,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Texture Selector */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Select Texture ({textures.length} total)
        </label>
        <select
          value={selectedIndex}
          onChange={(e) => onSelectTexture(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '5px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}
        >
          {textures.map((t, i) => (
            <option key={i} value={i}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Texture Preview */}
      {previewUrl && (
        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Preview</div>
          <img
            src={previewUrl}
            alt="Texture preview"
            style={{
              width: '100%',
              maxWidth: '256px',
              border: '2px solid #555',
              borderRadius: '4px'
            }}
          />
        </div>
      )}

      {/* Repeat X */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '3px' }}>
          Repeat X: {repeatX.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={repeatX}
          onChange={(e) => setRepeatX(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <input
          type="number"
          min="0.1"
          max="100"
          step="0.1"
          value={repeatX}
          onChange={(e) => setRepeatX(Number(e.target.value))}
          style={{
            width: '100%',
            marginTop: '3px',
            padding: '3px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Repeat Y */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '3px' }}>
          Repeat Y: {repeatY.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={repeatY}
          onChange={(e) => setRepeatY(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <input
          type="number"
          min="0.1"
          max="100"
          step="0.1"
          value={repeatY}
          onChange={(e) => setRepeatY(Number(e.target.value))}
          style={{
            width: '100%',
            marginTop: '3px',
            padding: '3px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Offset X */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '3px' }}>
          Offset X: {offsetX.toFixed(2)}
        </label>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.01"
          value={offsetX}
          onChange={(e) => setOffsetX(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <input
          type="number"
          min="-100"
          max="100"
          step="0.01"
          value={offsetX}
          onChange={(e) => setOffsetX(Number(e.target.value))}
          style={{
            width: '100%',
            marginTop: '3px',
            padding: '3px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Offset Y */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '3px' }}>
          Offset Y: {offsetY.toFixed(2)}
        </label>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.01"
          value={offsetY}
          onChange={(e) => setOffsetY(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <input
          type="number"
          min="-100"
          max="100"
          step="0.01"
          value={offsetY}
          onChange={(e) => setOffsetY(Number(e.target.value))}
          style={{
            width: '100%',
            marginTop: '3px',
            padding: '3px',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          setRepeatX(1);
          setRepeatY(1);
          setOffsetX(0);
          setOffsetY(0);
        }}
        style={{
          width: '100%',
          padding: '8px',
          background: 'rgba(200, 100, 50, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Reset to Default
      </button>
    </div>
    </Html>
  );
}
