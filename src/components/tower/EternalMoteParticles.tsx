import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EternalMoteParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function EternalMoteParticles({ intensity = 'normal' }: EternalMoteParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 400, speed: 0.15, opacity: 0.5, size: 0.08 };
      case 'heavy':
        return { count: 1000, speed: 0.25, opacity: 0.7, size: 0.12 };
      default:
        return { count: 600, speed: 0.2, opacity: 0.6, size: 0.1 };
    }
  }, [intensity]);

  const particleCount = config.count;

  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const driftOffsets = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Spread throughout the space
      positions[i3] = (Math.random() - 0.5) * 60;
      positions[i3 + 1] = Math.random() * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;

      // Ethereal golden/white light motes
      const colorType = Math.random();
      if (colorType < 0.5) {
        // Warm golden glow
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.8 + Math.random() * 0.15;
        colors[i3 + 2] = 0.5 + Math.random() * 0.2;
      } else if (colorType < 0.8) {
        // Soft white
        const white = 0.85 + Math.random() * 0.15;
        colors[i3] = white;
        colors[i3 + 1] = white;
        colors[i3 + 2] = white * 0.95;
      } else {
        // Pale blue accent
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.8 + Math.random() * 0.15;
        colors[i3 + 2] = 0.95 + Math.random() * 0.05;
      }

      driftOffsets[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions, colors, driftOffsets, speeds };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Gentle floating motion - slight upward drift
      positions[i3 + 1] += config.speed * particleData.speeds[i] * delta * 0.3;

      // Slow orbital drift
      const driftX = Math.sin(timeRef.current * 0.2 + particleData.driftOffsets[i]) * 0.015 * delta;
      const driftZ = Math.cos(timeRef.current * 0.15 + particleData.driftOffsets[i]) * 0.015 * delta;

      positions[i3] += driftX;
      positions[i3 + 2] += driftZ;

      // Reset when too high - respawn at random height
      if (positions[i3 + 1] > 25) {
        positions[i3 + 1] = Math.random() * 5;
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
          count={particleCount}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particleData.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
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
