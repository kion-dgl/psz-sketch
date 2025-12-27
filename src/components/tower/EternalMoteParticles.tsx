import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EternalMoteParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

// Create a soft circular gradient texture for round glowing particles
function createGlowTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Create radial gradient for soft glow
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function EternalMoteParticles({ intensity = 'normal' }: EternalMoteParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 150, speed: 0.3, opacity: 0.6, size: 0.4 };
      case 'heavy':
        return { count: 400, speed: 0.5, opacity: 0.8, size: 0.6 };
      default:
        return { count: 250, speed: 0.4, opacity: 0.7, size: 0.5 };
    }
  }, [intensity]);

  const particleCount = config.count;

  // Create glow texture once
  const glowTexture = useMemo(() => createGlowTexture(), []);

  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const driftOffsets = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const swayPhases = new Float32Array(particleCount);
    const swayAmplitudes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Start near ground level and spread throughout space
      positions[i3] = (Math.random() - 0.5) * 60;
      positions[i3 + 1] = Math.random() * 3; // Start low
      positions[i3 + 2] = (Math.random() - 0.5) * 60;

      // Soft glowing green energy colors
      const colorType = Math.random();
      if (colorType < 0.5) {
        // Bright ethereal green
        colors[i3] = 0.2 + Math.random() * 0.15;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 0.3 + Math.random() * 0.2;
      } else if (colorType < 0.8) {
        // Soft pale green glow
        colors[i3] = 0.4 + Math.random() * 0.1;
        colors[i3 + 1] = 0.95 + Math.random() * 0.05;
        colors[i3 + 2] = 0.5 + Math.random() * 0.15;
      } else {
        // Deeper emerald accent
        colors[i3] = 0.1 + Math.random() * 0.1;
        colors[i3 + 1] = 0.7 + Math.random() * 0.2;
        colors[i3 + 2] = 0.25 + Math.random() * 0.15;
      }

      driftOffsets[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.4 + Math.random() * 0.6;
      swayPhases[i] = Math.random() * Math.PI * 2;
      swayAmplitudes[i] = 0.3 + Math.random() * 0.4;
    }

    return { positions, colors, driftOffsets, speeds, swayPhases, swayAmplitudes };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Gentle upward float like reverse snowflakes
      positions[i3 + 1] += config.speed * particleData.speeds[i] * delta;

      // Gentle swaying motion side to side (like snowflakes)
      const swayX = Math.sin(timeRef.current * 0.5 + particleData.swayPhases[i]) * particleData.swayAmplitudes[i] * delta;
      const swayZ = Math.cos(timeRef.current * 0.4 + particleData.driftOffsets[i]) * particleData.swayAmplitudes[i] * 0.7 * delta;

      positions[i3] += swayX;
      positions[i3 + 2] += swayZ;

      // Reset when too high - respawn at ground level
      if (positions[i3 + 1] > 20) {
        positions[i3 + 1] = 0;
        positions[i3] = (Math.random() - 0.5) * 60;
        positions[i3 + 2] = (Math.random() - 0.5) * 60;
      }

      // Wrap around horizontally
      if (positions[i3] > 30) positions[i3] = -30;
      if (positions[i3] < -30) positions[i3] = 30;
      if (positions[i3 + 2] > 30) positions[i3 + 2] = -30;
      if (positions[i3 + 2] < -30) positions[i3 + 2] = 30;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particleData.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        map={glowTexture}
        vertexColors
        transparent
        opacity={config.opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
