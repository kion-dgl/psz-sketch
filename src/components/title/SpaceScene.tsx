import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Moon() {
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (moonRef.current) {
      const time = clock.getElapsedTime();
      // Moon orbits around earth
      const radius = 3;
      moonRef.current.position.x = Math.cos(time * 0.5) * radius;
      moonRef.current.position.z = Math.sin(time * 0.5) * radius;
      // Moon also rotates on its own axis
      moonRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <mesh ref={moonRef} position={[3, 0, 0]}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial color="#888888" roughness={0.8} />
    </mesh>
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#2233ff" roughness={0.7} />
    </mesh>
  );
}

function Stars() {
  const starsRef = useRef<THREE.Points>(null);

  const starPositions = new Float32Array(1000 * 3);
  for (let i = 0; i < 1000; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 50;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starPositions.length / 3}
          array={starPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" />
    </points>
  );
}

export default function SpaceScene() {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [5, 3, 5], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars />
        <Earth />
        <Moon />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
