import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SandParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy'; // light = clear, normal = default, heavy = sandstorm
}

export default function SandParticles({ intensity = 'normal' }: SandParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Adjust particle count and speed based on intensity
  const config = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 300, speedMult: 0.5, opacity: 0.3, size: 0.03 };
      case 'heavy':
        return { count: 3000, speedMult: 3.0, opacity: 0.8, size: 0.08 };
      default:
        return { count: 1000, speedMult: 1.0, opacity: 0.6, size: 0.05 };
    }
  }, [intensity]);

  const particleCount = config.count;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large area
      positions[i3] = (Math.random() - 0.5) * 100; // x
      positions[i3 + 1] = Math.random() * 5; // y (0-5 height)
      positions[i3 + 2] = (Math.random() - 0.5) * 100; // z

      // Random velocities for wind effect (scaled by intensity)
      velocities[i3] = (Math.random() * 0.5 + 0.2) * config.speedMult; // x drift
      velocities[i3 + 1] = (Math.random() * 0.1 - 0.05) * config.speedMult; // y wobble
      velocities[i3 + 2] = (Math.random() * 0.2 - 0.1) * config.speedMult; // z drift
    }

    return { positions, velocities };
  }, [particleCount, config.speedMult]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Update positions based on velocity
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;

      // Wrap around if particle goes too far
      if (positions[i3] > 50) positions[i3] = -50;
      if (positions[i3] < -50) positions[i3] = 50;
      if (positions[i3 + 2] > 50) positions[i3 + 2] = -50;
      if (positions[i3 + 2] < -50) positions[i3 + 2] = 50;

      // Reset height if too low or too high
      if (positions[i3 + 1] < 0) positions[i3 + 1] = 5;
      if (positions[i3 + 1] > 5) positions[i3 + 1] = 0;
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
        color="#e8d4a8"
        transparent
        opacity={config.opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
