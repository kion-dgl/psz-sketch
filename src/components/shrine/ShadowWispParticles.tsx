import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShadowWispParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function ShadowWispParticles({ intensity = 'light' }: ShadowWispParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 600, speed: 0.4, opacity: 0.3, size: 0.1 };
      case 'heavy':
        return { count: 1500, speed: 0.6, opacity: 0.45, size: 0.14 };
      default:
        return { count: 1000, speed: 0.5, opacity: 0.35, size: 0.12 };
    }
  }, [intensity]);

  const particleCount = config.count;

  // Dark particle data - subtle black wisps rising from floor
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const driftOffsets = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Start near ground level
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 3; // Start low
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Very dark colors - black to dark purple
      const darkness = Math.random();
      if (darkness < 0.7) {
        // Pure black/near-black
        const shade = 0.02 + Math.random() * 0.06;
        colors[i3] = shade;
        colors[i3 + 1] = shade;
        colors[i3 + 2] = shade + 0.01;
      } else {
        // Slight dark purple tint
        colors[i3] = 0.05 + Math.random() * 0.05;
        colors[i3 + 1] = 0.02 + Math.random() * 0.03;
        colors[i3 + 2] = 0.08 + Math.random() * 0.06;
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

      // Rise upward slowly
      positions[i3 + 1] += config.speed * particleData.speeds[i] * delta;

      // Very subtle horizontal drift
      const driftX = Math.sin(timeRef.current * 0.15 + particleData.driftOffsets[i]) * 0.02 * delta;
      const driftZ = Math.cos(timeRef.current * 0.1 + particleData.driftOffsets[i]) * 0.02 * delta;

      positions[i3] += driftX;
      positions[i3 + 2] += driftZ;

      // Reset when too high - respawn at floor
      if (positions[i3 + 1] > 15) {
        positions[i3 + 1] = 0;
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
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}
