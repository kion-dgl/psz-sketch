import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function SnowParticles({ intensity = 'light' }: SnowParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 1500, speed: 2, opacity: 0.6, size: 0.08 };
      case 'heavy':
        return { count: 5000, speed: 4, opacity: 0.8, size: 0.1 };
      default:
        return { count: 3000, speed: 3, opacity: 0.7, size: 0.09 };
    }
  }, [intensity]);

  const particleCount = config.count;

  // Store initial random values for consistent swaying patterns
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const swayOffsets = new Float32Array(particleCount);
    const swayAmplitudes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large area
      positions[i3] = (Math.random() - 0.5) * 100; // x
      positions[i3 + 1] = Math.random() * 35; // y (0-35 height)
      positions[i3 + 2] = (Math.random() - 0.5) * 100; // z

      // Random sway parameters for each snowflake
      swayOffsets[i] = Math.random() * Math.PI * 2;
      swayAmplitudes[i] = 0.3 + Math.random() * 0.5;
    }

    return { positions, swayOffsets, swayAmplitudes };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Snow falls slowly
      positions[i3 + 1] -= config.speed * delta;

      // Gentle swaying motion (sine wave)
      const swayX = Math.sin(timeRef.current * 0.5 + particleData.swayOffsets[i]) * particleData.swayAmplitudes[i] * delta;
      const swayZ = Math.cos(timeRef.current * 0.3 + particleData.swayOffsets[i] * 1.5) * particleData.swayAmplitudes[i] * 0.5 * delta;

      positions[i3] += swayX;
      positions[i3 + 2] += swayZ;

      // Slight wind drift
      positions[i3] += 0.2 * delta;

      // Reset if below ground
      if (positions[i3 + 1] < 0) {
        positions[i3 + 1] = 35;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;
      }

      // Wrap around horizontally
      if (positions[i3] > 50) positions[i3] = -50;
      if (positions[i3] < -50) positions[i3] = 50;
      if (positions[i3 + 2] > 50) positions[i3 + 2] = -50;
      if (positions[i3 + 2] < -50) positions[i3 + 2] = 50;
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
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        color="#ffffff"
        transparent
        opacity={config.opacity}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}
