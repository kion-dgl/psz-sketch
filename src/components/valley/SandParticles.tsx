import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SandParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 1000;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a large area
      positions[i3] = (Math.random() - 0.5) * 100; // x
      positions[i3 + 1] = Math.random() * 5; // y (0-5 height)
      positions[i3 + 2] = (Math.random() - 0.5) * 100; // z

      // Random velocities for wind effect
      velocities[i3] = Math.random() * 0.5 + 0.2; // x drift
      velocities[i3 + 1] = Math.random() * 0.1 - 0.05; // y wobble
      velocities[i3 + 2] = Math.random() * 0.2 - 0.1; // z drift
    }

    return { positions, velocities };
  }, []);

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
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#e8d4a8"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
