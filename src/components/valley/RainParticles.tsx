import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RainParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function RainParticles({ intensity = 'normal' }: RainParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 2000, speed: 15, opacity: 0.3, size: 0.02 };
      case 'heavy':
        return { count: 8000, speed: 25, opacity: 0.6, size: 0.04 };
      default:
        return { count: 4000, speed: 20, opacity: 0.4, size: 0.03 };
    }
  }, [intensity]);

  const particleCount = config.count;

  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large area
      positions[i3] = (Math.random() - 0.5) * 100; // x
      positions[i3 + 1] = Math.random() * 30; // y (0-30 height)
      positions[i3 + 2] = (Math.random() - 0.5) * 100; // z
    }

    return positions;
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Rain falls down quickly
      positions[i3 + 1] -= config.speed * delta;

      // Slight wind drift
      positions[i3] += 0.5 * delta;

      // Reset if below ground
      if (positions[i3 + 1] < 0) {
        positions[i3 + 1] = 30;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;
      }

      // Wrap around horizontally
      if (positions[i3] > 50) positions[i3] = -50;
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
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        color="#aaccff"
        transparent
        opacity={config.opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
