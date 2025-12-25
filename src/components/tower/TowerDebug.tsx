import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface TextureInfo {
  name: string;
  key: string;
  filename: string;
  texture: THREE.Texture;
  material: THREE.Material;
}

function getTowerDir(mapId: string): string {
  // Tower uses s080, s081, s082, etc. for floors 0-7, s08e for elevator
  const match = mapId.match(/^s08([0-7e])_/);
  if (match) {
    return `stages/tower_${match[1]}`;
  }
  return 'stages/tower_0';
}

function getTextureFilename(texture: THREE.Texture): string {
  if (texture.name) {
    const parts = texture.name.split('/');
    return parts[parts.length - 1];
  }
  const image = texture.image as { src?: string } | null;
  if (image && image.src) {
    const parts = image.src.split('/');
    return parts[parts.length - 1];
  }
  return 'unknown';
}

function TowerDebugScene({
  selectedMap,
  textureSettings,
  onTexturesLoaded
}: {
  selectedMap: string;
  textureSettings: Record<string, any>;
  onTexturesLoaded: (textures: TextureInfo[]) => void;
}) {
  const [cleanedScene, setCleanedScene] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setCleanedScene(null);

    const loader = new GLTFLoader();
    const towerDir = getTowerDir(selectedMap);
    const glbPath = `/${towerDir}/${selectedMap}/lndmd/${selectedMap}_m.glb`;

    loader.load(glbPath, (gltf) => {
      const objectsToRemove: THREE.Object3D[] = [];
      gltf.scene.traverse((object) => {
        if (object.type === 'Label') objectsToRemove.push(object);
      });
      objectsToRemove.forEach(obj => { if (obj.parent) obj.parent.remove(obj); });

      const textureInstanceCounts: Record<string, number> = {};
      const textureList: TextureInfo[] = [];

      const processTexture = (originalTexture: THREE.Texture, material: THREE.Material, type: 'diffuse' | 'normal', assignBack: (tex: THREE.Texture) => void) => {
        const filename = getTextureFilename(originalTexture);
        const instanceKey = `${filename}_${type}`;
        textureInstanceCounts[instanceKey] = (textureInstanceCounts[instanceKey] || 0) + 1;
        const instanceNum = textureInstanceCounts[instanceKey];
        const texture = originalTexture.clone();
        texture.needsUpdate = true;
        assignBack(texture);
        const key = `${filename}#${instanceNum}`;
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.wrapT = THREE.MirroredRepeatWrapping;
        if (textureSettings[key]) {
          const settings = textureSettings[key];
          texture.repeat.set(settings.repeatX || 1, settings.repeatY || 1);
          texture.offset.set(settings.offsetX || 0, settings.offsetY || 0);
        }
        texture.needsUpdate = true;
        textureList.push({ name: `${filename} #${instanceNum}`, key, filename, texture, material });
      };

      gltf.scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            const m = mat as any;
            if (m.map) processTexture(m.map, mat, 'diffuse', (tex) => { m.map = tex; });
            if (m.normalMap) processTexture(m.normalMap, mat, 'normal', (tex) => { m.normalMap = tex; });
          });
        }
      });

      onTexturesLoaded(textureList);
      setCleanedScene(gltf.scene);
      setLoading(false);
    });
  }, [selectedMap]);

  if (loading || !cleanedScene) return null;
  return <primitive object={cleanedScene} />;
}

// Tower floor maps
const TOWER_0_MAPS = ['s080_sa0'];
const TOWER_1_MAPS = ['s081_ga1', 's081_sa1', 's081_ib1', 's081_lb1'];
const TOWER_2_MAPS = ['s082_ga1', 's082_sa1', 's082_ib1', 's082_lb1'];
const TOWER_3_MAPS = ['s083_ga1', 's083_sa1', 's083_ib1', 's083_lb1'];
const TOWER_4_MAPS = ['s084_ga1', 's084_sa1', 's084_ib1', 's084_lb1'];
const TOWER_5_MAPS = ['s085_ga1', 's085_sa1', 's085_ib1', 's085_lb1'];
const TOWER_6_MAPS = ['s086_ga1', 's086_sa1', 's086_ib1', 's086_lb1'];
const TOWER_7_MAPS = ['s087_na1'];
const TOWER_E_MAPS = ['s08e_ib1'];

export default function TowerDebug() {
  const [selectedMap, setSelectedMap] = useState('s080_sa0');
  const [textureAdjustments, setTextureAdjustments] = useState<Record<string, any>>({});
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedTextureIndex, setSelectedTextureIndex] = useState(0);
  const [repeatX, setRepeatX] = useState(1);
  const [repeatY, setRepeatY] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectedTexture = textures[selectedTextureIndex];

  useEffect(() => {
    if (selectedTexture) {
      setRepeatX(selectedTexture.texture.repeat.x);
      setRepeatY(selectedTexture.texture.repeat.y);
      setOffsetX(selectedTexture.texture.offset.x);
      setOffsetY(selectedTexture.texture.offset.y);
      const image = selectedTexture.texture.image as CanvasImageSource | null;
      if (image) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(image, 0, 0, 256, 256); setPreviewUrl(canvas.toDataURL()); }
      }
    }
  }, [selectedTexture]);

  useEffect(() => {
    if (selectedTexture) {
      selectedTexture.texture.repeat.set(repeatX, repeatY);
      selectedTexture.texture.offset.set(offsetX, offsetY);
      selectedTexture.texture.needsUpdate = true;
      setTextureAdjustments(prev => ({ ...prev, [selectedTexture.key]: { repeatX, repeatY, offsetX, offsetY } }));
    }
  }, [repeatX, repeatY, offsetX, offsetY, selectedTextureIndex]);

  const handleTexturesLoaded = (loadedTextures: TextureInfo[]) => { setTextures(loadedTextures); setSelectedTextureIndex(0); };
  const handleExportJSON = () => {
    const json = JSON.stringify(textureAdjustments, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tower_texture_config.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div style={{ width: '320px', height: '100vh', background: '#1a1a1a', color: 'white', padding: '15px', fontFamily: 'monospace', fontSize: '12px', overflowY: 'auto', boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Eternal Tower - Texture Debug</div>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '15px' }}>Use orbit controls to view the model</div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Map:</label>
          <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer' }}>
            <optgroup label="Floor 0">{TOWER_0_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 1">{TOWER_1_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 2">{TOWER_2_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 3">{TOWER_3_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 4">{TOWER_4_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 5">{TOWER_5_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 6">{TOWER_6_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Floor 7 - Summit">{TOWER_7_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
            <optgroup label="Elevator">{TOWER_E_MAPS.map((map) => (<option key={map} value={map}>{map}</option>))}</optgroup>
          </select>
        </div>
        {textures.length > 0 && (<>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Texture ({textures.length} total)</label>
            <select value={selectedTextureIndex} onChange={(e) => setSelectedTextureIndex(Number(e.target.value))} style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
              {textures.map((t, i) => (<option key={i} value={i}>{t.name}</option>))}
            </select>
          </div>
          {previewUrl && (<div style={{ marginBottom: '15px', textAlign: 'center' }}><div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Preview</div><img src={previewUrl} alt="Texture preview" style={{ width: '100%', maxWidth: '200px', border: '2px solid #555', borderRadius: '4px' }} /></div>)}
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '3px' }}>Repeat X: {repeatX.toFixed(1)}</label><input type="range" min="0.1" max="10" step="0.1" value={repeatX} onChange={(e) => setRepeatX(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '3px' }}>Repeat Y: {repeatY.toFixed(1)}</label><input type="range" min="0.1" max="10" step="0.1" value={repeatY} onChange={(e) => setRepeatY(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '3px' }}>Offset X: {offsetX.toFixed(1)}</label><input type="range" min="-5" max="5" step="0.1" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '3px' }}>Offset Y: {offsetY.toFixed(1)}</label><input type="range" min="-5" max="5" step="0.1" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <button onClick={() => { setRepeatX(1); setRepeatY(1); setOffsetX(0); setOffsetY(0); }} style={{ width: '100%', padding: '10px', background: '#c86432', color: 'white', border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>Reset to Default</button>
        </>)}
        <button onClick={handleExportJSON} style={{ width: '100%', padding: '10px', background: '#32c832', color: 'white', border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>Export JSON</button>
        <a href="/stage/tower" style={{ display: 'block', width: '100%', padding: '10px', background: '#c83232', color: 'white', textDecoration: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }}>Back to Tower</a>
      </div>
      <div style={{ flex: 1, height: '100vh' }}>
        <Canvas shadows>
          <OrbitControls />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
          <Suspense fallback={null}><TowerDebugScene selectedMap={selectedMap} textureSettings={textureAdjustments} onTexturesLoaded={handleTexturesLoaded} /></Suspense>
        </Canvas>
      </div>
    </div>
  );
}
