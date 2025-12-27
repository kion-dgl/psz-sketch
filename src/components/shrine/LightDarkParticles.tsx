import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightDarkParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function LightDarkParticles({ intensity = 'normal' }: LightDarkParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 500, speed: 0.35, opacity: 0.35, size: 0.12 };
      case 'heavy':
        return { count: 1200, speed: 0.5, opacity: 0.5, size: 0.16 };
      default:
        return { count: 800, speed: 0.4, opacity: 0.4, size: 0.14 };
    }
  }, [intensity]);

  const particleCount = config.count;

  // Mixed light and dark particle data
  const particleData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const driftOffsets = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Start near ground level
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 4;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Mix of light and dark particles
      const particleType = Math.random();

      if (particleType < 0.5) {
        // Dark particles - deep black to dark purple
        const shade = 0.02 + Math.random() * 0.08;
        colors[i3] = shade;
        colors[i3 + 1] = shade * 0.8;
        colors[i3 + 2] = shade + 0.03;
      } else if (particleType < 0.8) {
        // Light particles - pale ethereal white/blue
        const brightness = 0.7 + Math.random() * 0.3;
        colors[i3] = brightness * 0.9;
        colors[i3 + 1] = brightness * 0.95;
        colors[i3 + 2] = brightness;
      } else {
        // Golden/warm light particles
        const brightness = 0.6 + Math.random() * 0.3;
        colors[i3] = brightness;
        colors[i3 + 1] = brightness * 0.85;
        colors[i3 + 2] = brightness * 0.5;
      }

      driftOffsets[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.4 + Math.random() * 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, colors, driftOffsets, speeds, phases };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    timeRef.current += delta;
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Rise upward with varying speeds
      positions[i3 + 1] += config.speed * particleData.speeds[i] * delta;

      // Gentle swaying motion
      const swayX = Math.sin(timeRef.current * 0.2 + particleData.driftOffsets[i]) * 0.03 * delta;
      const swayZ = Math.cos(timeRef.current * 0.15 + particleData.phases[i]) * 0.03 * delta;

      positions[i3] += swayX;
      positions[i3 + 2] += swayZ;

      // Reset when too high - respawn at floor
      if (positions[i3 + 1] > 18) {
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
          args={[particleData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particleData.colors, 3]}
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
