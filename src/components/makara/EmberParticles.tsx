import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EmberParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function EmberParticles({ intensity = 'light' }: EmberParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 800, speed: 0.8, opacity: 0.7, size: 0.12 };
      case 'heavy':
        return { count: 2500, speed: 1.5, opacity: 0.9, size: 0.15 };
      default:
        return { count: 1500, speed: 1.0, opacity: 0.8, size: 0.13 };
    }
  }, [intensity]);

  const particleCount = config.count;

  // Store particle data
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const driftOffsets = new Float32Array(particleCount);
    const driftAmplitudes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large area
      positions[i3] = (Math.random() - 0.5) * 80; // x
      positions[i3 + 1] = Math.random() * 25; // y (0-25 height, starts lower for rising effect)
      positions[i3 + 2] = (Math.random() - 0.5) * 80; // z

      // Color variation - red to orange embers
      const colorVariant = Math.random();
      if (colorVariant < 0.5) {
        // Deep red
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.1 + Math.random() * 0.2;
        colors[i3 + 2] = 0.05 + Math.random() * 0.1;
      } else if (colorVariant < 0.8) {
        // Orange-red
        colors[i3] = 0.95 + Math.random() * 0.05;
        colors[i3 + 1] = 0.3 + Math.random() * 0.3;
        colors[i3 + 2] = 0.05 + Math.random() * 0.1;
      } else {
        // Pale pink/white (flower petal-like)
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.6 + Math.random() * 0.3;
        colors[i3 + 2] = 0.6 + Math.random() * 0.3;
      }

      // Random drift parameters
      driftOffsets[i] = Math.random() * Math.PI * 2;
      driftAmplitudes[i] = 0.2 + Math.random() * 0.4;
      speeds[i] = 0.5 + Math.random() * 1.0;
    }

    return { positions, colors, driftOffsets, driftAmplitudes, speeds };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Embers float upward slowly
      positions[i3 + 1] += config.speed * particleData.speeds[i] * delta;

      // Gentle swaying/drifting motion
      const driftX = Math.sin(timeRef.current * 0.3 + particleData.driftOffsets[i]) * particleData.driftAmplitudes[i] * delta;
      const driftZ = Math.cos(timeRef.current * 0.2 + particleData.driftOffsets[i] * 1.3) * particleData.driftAmplitudes[i] * 0.7 * delta;

      positions[i3] += driftX;
      positions[i3 + 2] += driftZ;

      // Reset if too high - respawn near ground
      if (positions[i3 + 1] > 30) {
        positions[i3 + 1] = -2 + Math.random() * 4;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 80;
      }

      // Wrap around horizontally
      if (positions[i3] > 40) positions[i3] = -40;
      if (positions[i3] < -40) positions[i3] = 40;
      if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
      if (positions[i3 + 2] < -40) positions[i3 + 2] = 40;
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
