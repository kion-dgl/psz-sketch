import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Create a procedural Earth texture with oceans (blue) and land (green/brown)
 */
function createEarthTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Ocean base
  ctx.fillStyle = '#1a5a7d';
  ctx.fillRect(0, 0, 512, 512);

  // Add continents using Perlin-like blobs (simplified)
  ctx.fillStyle = '#2d8659';
  // North America
  ctx.beginPath();
  ctx.ellipse(100, 150, 80, 100, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.beginPath();
  ctx.ellipse(150, 300, 50, 80, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Europe/Africa
  ctx.beginPath();
  ctx.ellipse(300, 200, 100, 120, 0, 0, Math.PI * 2);
  ctx.fill();

  // Asia
  ctx.beginPath();
  ctx.ellipse(400, 120, 110, 100, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Add some brown for deserts
  ctx.fillStyle = '#8b7355';
  ctx.beginPath();
  ctx.ellipse(320, 240, 40, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Create a procedural Moon texture with craters
 */
function createMoonTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Moon base (light gray)
  ctx.fillStyle = '#d0d0d0';
  ctx.fillRect(0, 0, 256, 256);

  // Add noise/craters
  const imageData = ctx.getImageData(0, 0, 256, 256);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 40 - 20;
    data[i] = Math.max(0, Math.min(255, 208 + noise)); // R
    data[i + 1] = Math.max(0, Math.min(255, 208 + noise)); // G
    data[i + 2] = Math.max(0, Math.min(255, 208 + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);

  // Add some darker craters
  ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 15 + 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function Moon() {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (moonRef.current) {
      const time = clock.getElapsedTime();
      // Moon orbits around earth
      const radius = 3;
      moonRef.current.position.x = Math.cos(time * 0.5) * radius;
      moonRef.current.position.z = Math.sin(time * 0.5) * radius;
      // Moon also rotates on its own axis
      moonRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <mesh ref={moonRef} position={[3, 0, 0]}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial
        color="#c9c9c9"
        roughness={0.85}
        metalness={0}
        map={createMoonTexture()}
      />
    </mesh>
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1.4, 64, 64]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.6}
        metalness={0.05}
        map={createEarthTexture()}
      />
    </mesh>
  );
}

function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Sun mesh (background, far away) */}
      <mesh ref={sunRef} position={[40, 25, -60]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#fff8dc" />
      </mesh>
      {/* Sun glow via light */}
      <pointLight position={[40, 25, -60]} intensity={1.5} color="#ffeb3b" distance={200} />
    </group>
  );
}

function Stars() {
  const starsRef = useRef<THREE.Points>(null);
  // Memoize star positions so they don't re-randomize on every render
  const starPositions = useMemo(() => {
    const positions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return positions;
  }, []);

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starPositions.length / 3}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#bcd6ff" />
    </points>
  );
}

export default function SpaceScene() {
  return (
    <div className="space-scene-full">
      <Canvas camera={{ position: [0, 1.6, 6], fov: 55 }}>
        <color attach="background" args={[0x030712]} />
        <fog attach="fog" args={[new THREE.Fog('#040817', 12, 28)]} />
        <ambientLight intensity={0.3} />
        <Sun />
        <Stars />
        <Earth />
        <Moon />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

/* Keep the canvas pinned to its container; styled at call site */
