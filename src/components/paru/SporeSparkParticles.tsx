import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SporeSparkParticlesProps {
  intensity?: 'light' | 'normal' | 'heavy';
}

export default function SporeSparkParticles({ intensity = 'light' }: SporeSparkParticlesProps) {
  const sporesRef = useRef<THREE.Points>(null);
  const sparksRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const sporeConfig = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 600, speed: 0.15, opacity: 0.6, size: 0.08 };
      case 'heavy':
        return { count: 1800, speed: 0.25, opacity: 0.75, size: 0.1 };
      default:
        return { count: 1000, speed: 0.2, opacity: 0.7, size: 0.09 };
    }
  }, [intensity]);

  const sparkConfig = useMemo(() => {
    switch (intensity) {
      case 'light':
        return { count: 80, size: 0.12 };
      case 'heavy':
        return { count: 200, size: 0.15 };
      default:
        return { count: 120, size: 0.13 };
    }
  }, [intensity]);

  // Spore particle data - organic floating pollen/spores
  const sporeData = useMemo(() => {
    const count = sporeConfig.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const driftOffsets = new Float32Array(count);
    const driftAmplitudes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random positions in a large area
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Color variation - yellow-green organic spores
      const colorVariant = Math.random();
      if (colorVariant < 0.4) {
        // Pale yellow-green (pollen)
        colors[i3] = 0.7 + Math.random() * 0.2;
        colors[i3 + 1] = 0.75 + Math.random() * 0.2;
        colors[i3 + 2] = 0.3 + Math.random() * 0.2;
      } else if (colorVariant < 0.7) {
        // Soft green (moss spores)
        colors[i3] = 0.4 + Math.random() * 0.2;
        colors[i3 + 1] = 0.6 + Math.random() * 0.2;
        colors[i3 + 2] = 0.3 + Math.random() * 0.15;
      } else {
        // Pale white-green (dandelion-like)
        colors[i3] = 0.8 + Math.random() * 0.15;
        colors[i3 + 1] = 0.85 + Math.random() * 0.1;
        colors[i3 + 2] = 0.7 + Math.random() * 0.2;
      }

      driftOffsets[i] = Math.random() * Math.PI * 2;
      driftAmplitudes[i] = 0.1 + Math.random() * 0.3;
      speeds[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions, colors, driftOffsets, driftAmplitudes, speeds };
  }, [sporeConfig.count]);

  // Spark particle data - electrical sparks from broken tech
  const sparkData = useMemo(() => {
    const count = sparkConfig.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const flickerPhases = new Float32Array(count);
    const flickerSpeeds = new Float32Array(count);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random positions - tend to be near ground level (broken machinery)
      positions[i3] = (Math.random() - 0.5) * 80;
      positions[i3 + 1] = Math.random() * 8; // Lower, near broken tech
      positions[i3 + 2] = (Math.random() - 0.5) * 80;

      // Color variation - cyan/blue electrical sparks
      const colorVariant = Math.random();
      if (colorVariant < 0.6) {
        // Cyan spark
        colors[i3] = 0.3 + Math.random() * 0.2;
        colors[i3 + 1] = 0.8 + Math.random() * 0.2;
        colors[i3 + 2] = 0.95 + Math.random() * 0.05;
      } else if (colorVariant < 0.85) {
        // Blue-white spark
        colors[i3] = 0.6 + Math.random() * 0.3;
        colors[i3 + 1] = 0.7 + Math.random() * 0.25;
        colors[i3 + 2] = 0.95 + Math.random() * 0.05;
      } else {
        // Occasional orange spark (short circuit)
        colors[i3] = 0.95 + Math.random() * 0.05;
        colors[i3 + 1] = 0.5 + Math.random() * 0.3;
        colors[i3 + 2] = 0.1 + Math.random() * 0.2;
      }

      flickerPhases[i] = Math.random() * Math.PI * 2;
      flickerSpeeds[i] = 3 + Math.random() * 8; // Fast flickering
      lifetimes[i] = Math.random(); // Stagger lifetimes
    }

    return { positions, colors, flickerPhases, flickerSpeeds, lifetimes };
  }, [sparkConfig.count]);

  useFrame((state, delta) => {
    timeRef.current += delta;

    // Animate spores - gentle floating drift
    if (sporesRef.current) {
      const positions = sporesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < sporeConfig.count; i++) {
        const i3 = i * 3;

        // Slow upward drift with gentle swaying
        positions[i3 + 1] += sporeConfig.speed * sporeData.speeds[i] * delta;

        const driftX = Math.sin(timeRef.current * 0.2 + sporeData.driftOffsets[i]) * sporeData.driftAmplitudes[i] * delta;
        const driftZ = Math.cos(timeRef.current * 0.15 + sporeData.driftOffsets[i] * 1.3) * sporeData.driftAmplitudes[i] * 0.8 * delta;

        positions[i3] += driftX;
        positions[i3 + 2] += driftZ;

        // Reset if too high
        if (positions[i3 + 1] > 25) {
          positions[i3 + 1] = -1 + Math.random() * 2;
          positions[i3] = (Math.random() - 0.5) * 80;
          positions[i3 + 2] = (Math.random() - 0.5) * 80;
        }

        // Wrap around horizontally
        if (positions[i3] > 40) positions[i3] = -40;
        if (positions[i3] < -40) positions[i3] = 40;
        if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
        if (positions[i3 + 2] < -40) positions[i3 + 2] = 40;
      }

      sporesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate sparks - erratic flickering with occasional bursts
    if (sparksRef.current) {
      const positions = sparksRef.current.geometry.attributes.position.array as Float32Array;
      const colors = sparksRef.current.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < sparkConfig.count; i++) {
        const i3 = i * 3;

        // Update lifetime
        sparkData.lifetimes[i] += delta * 0.5;

        // Flicker effect - sparks appear and disappear
        const flickerValue = Math.sin(timeRef.current * sparkData.flickerSpeeds[i] + sparkData.flickerPhases[i]);
        const isVisible = flickerValue > 0.3; // Only visible part of the time

        if (isVisible) {
          // Small upward drift when visible
          positions[i3 + 1] += delta * 2;

          // Slight horizontal jitter
          positions[i3] += (Math.random() - 0.5) * delta * 0.5;
          positions[i3 + 2] += (Math.random() - 0.5) * delta * 0.5;
        }

        // Apply flicker to color brightness
        const brightness = isVisible ? (0.5 + Math.random() * 0.5) : 0;
        colors[i3] = sparkData.colors[i3] * brightness;
        colors[i3 + 1] = sparkData.colors[i3 + 1] * brightness;
        colors[i3 + 2] = sparkData.colors[i3 + 2] * brightness;

        // Reset spark after lifetime expires or drifts too high
        if (sparkData.lifetimes[i] > 2 + Math.random() * 3 || positions[i3 + 1] > 12) {
          sparkData.lifetimes[i] = 0;
          positions[i3] = (Math.random() - 0.5) * 80;
          positions[i3 + 1] = Math.random() * 4;
          positions[i3 + 2] = (Math.random() - 0.5) * 80;
          sparkData.flickerPhases[i] = Math.random() * Math.PI * 2;
        }
      }

      sparksRef.current.geometry.attributes.position.needsUpdate = true;
      sparksRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Organic spores - gentle floating particles */}
      <points ref={sporesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sporeData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[sporeData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={sporeConfig.size}
          vertexColors
          transparent
          opacity={sporeConfig.opacity}
          sizeAttenuation
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>

      {/* Electrical sparks - flickering tech debris */}
      <points ref={sparksRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[sparkData.colors.slice(), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={sparkConfig.size}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}
