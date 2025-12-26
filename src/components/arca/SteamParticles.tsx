import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SteamParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function SteamParticles({ intensity = 'light' }: SteamParticlesProps) {
  const steamRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const steamConfig = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 500, speed: 0.8, opacity: 0.25, size: 0.25 };
      case 'heavy':
        return { count: 1500, speed: 1.2, opacity: 0.4, size: 0.35 };
      default:
        return { count: 900, speed: 1.0, opacity: 0.3, size: 0.3 };
    }
  }, [intensity]);

  const dustConfig = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 300, opacity: 0.4, size: 0.06 };
      case 'heavy':
        return { count: 800, opacity: 0.6, size: 0.08 };
      default:
        return { count: 500, opacity: 0.5, size: 0.07 };
    }
  }, [intensity]);

  // Steam particle data - rising vapor from vents
  const steamData = useMemo(() => {
    const count = steamConfig.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const driftOffsets = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random positions - steam rises from various points
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 5; // Start low
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Steam is white/gray
      const brightness = 0.7 + Math.random() * 0.25;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness + 0.05; // Slight blue tint

      driftOffsets[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.6 + Math.random() * 0.8;
      sizes[i] = 0.8 + Math.random() * 0.4;
    }

    return { positions, colors, driftOffsets, speeds, sizes };
  }, [steamConfig.count]);

  // Metallic dust particle data - industrial atmosphere
  const dustData = useMemo(() => {
    const count = dustConfig.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const driftOffsets = new Float32Array(count);
    const driftAmplitudes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random positions throughout the area
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Metallic colors - gray, rust, copper tones
      const colorVariant = Math.random();
      if (colorVariant < 0.5) {
        // Gray metallic
        const gray = 0.4 + Math.random() * 0.3;
        colors[i3] = gray;
        colors[i3 + 1] = gray;
        colors[i3 + 2] = gray;
      } else if (colorVariant < 0.75) {
        // Rust orange
        colors[i3] = 0.6 + Math.random() * 0.2;
        colors[i3 + 1] = 0.3 + Math.random() * 0.15;
        colors[i3 + 2] = 0.1 + Math.random() * 0.1;
      } else {
        // Copper/bronze
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.45 + Math.random() * 0.15;
        colors[i3 + 2] = 0.2 + Math.random() * 0.15;
      }

      driftOffsets[i] = Math.random() * Math.PI * 2;
      driftAmplitudes[i] = 0.05 + Math.random() * 0.15;
    }

    return { positions, colors, driftOffsets, driftAmplitudes };
  }, [dustConfig.count]);

  useFrame((state, delta) => {
    timeRef.current += delta;

    // Animate steam - rising and dispersing
    if (steamRef.current) {
      const positions = steamRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < steamConfig.count; i++) {
        const i3 = i * 3;

        // Rise upward
        positions[i3 + 1] += steamConfig.speed * steamData.speeds[i] * delta;

        // Spread outward as it rises (thermal expansion)
        const height = positions[i3 + 1];
        const spreadFactor = Math.min(height * 0.02, 0.3);
        const driftX = Math.sin(timeRef.current * 0.3 + steamData.driftOffsets[i]) * spreadFactor * delta;
        const driftZ = Math.cos(timeRef.current * 0.25 + steamData.driftOffsets[i] * 1.2) * spreadFactor * delta;

        positions[i3] += driftX;
        positions[i3 + 2] += driftZ;

        // Reset when too high - respawn near ground
        if (positions[i3 + 1] > 20) {
          positions[i3 + 1] = Math.random() * 2;
          positions[i3] = (Math.random() - 0.5) * 80;
          positions[i3 + 2] = (Math.random() - 0.5) * 80;
        }

        // Wrap around horizontally
        if (positions[i3] > 40) positions[i3] = -40;
        if (positions[i3] < -40) positions[i3] = 40;
        if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
        if (positions[i3 + 2] < -40) positions[i3 + 2] = 40;
      }

      steamRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate dust - slow floating drift
    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < dustConfig.count; i++) {
        const i3 = i * 3;

        // Slow random drift
        const driftX = Math.sin(timeRef.current * 0.1 + dustData.driftOffsets[i]) * dustData.driftAmplitudes[i] * delta;
        const driftY = Math.sin(timeRef.current * 0.08 + dustData.driftOffsets[i] * 1.5) * dustData.driftAmplitudes[i] * 0.5 * delta;
        const driftZ = Math.cos(timeRef.current * 0.12 + dustData.driftOffsets[i] * 0.8) * dustData.driftAmplitudes[i] * delta;

        positions[i3] += driftX;
        positions[i3 + 1] += driftY;
        positions[i3 + 2] += driftZ;

        // Keep in bounds
        if (positions[i3 + 1] > 18) positions[i3 + 1] = 18;
        if (positions[i3 + 1] < 0.5) positions[i3 + 1] = 0.5;

        // Wrap around horizontally
        if (positions[i3] > 40) positions[i3] = -40;
        if (positions[i3] < -40) positions[i3] = 40;
        if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
        if (positions[i3 + 2] < -40) positions[i3 + 2] = 40;
      }

      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Steam/vapor particles */}
      <points ref={steamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[steamData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[steamData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={steamConfig.size}
          vertexColors
          transparent
          opacity={steamConfig.opacity}
          sizeAttenuation
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>

      {/* Metallic dust particles */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[dustData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={dustConfig.size}
          vertexColors
          transparent
          opacity={dustConfig.opacity}
          sizeAttenuation
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}
