'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'

function PhoneModel({ isShaking }: { isShaking: boolean }) {
  const groupRef = useRef<THREE.Group | null>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const t = clock.getElapsedTime()
    if (isShaking) {
      // Fast, short displacement reads like vibration instead of swing.
      groupRef.current.position.x = Math.sin(t * 68) * 0.03
      groupRef.current.position.y = Math.sin(t * 74) * 0.02
      groupRef.current.rotation.z = Math.sin(t * 56) * 0.03
      groupRef.current.rotation.y = Math.sin(t * 44) * 0.02
    } else {
      // swing wider
      groupRef.current.position.x = 0
      groupRef.current.position.y = Math.sin(t * 2.4) * 0.03
      groupRef.current.rotation.z = Math.sin(t * 2.6) * 0.02
      groupRef.current.rotation.y = Math.sin(t * 2) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh>
        <boxGeometry args={[1.2, 2.2, 0.12]} />
        <meshStandardMaterial color="#2a0a10" metalness={0.55} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[1.02, 1.9]} />
        <meshStandardMaterial color={isShaking ? '#d50032' : '#8e001f'} emissive="#d50032" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.95, 0.07]}>
        <circleGeometry args={[0.045, 20]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  )
}

export function ShakePhoneScene({ isShaking, compact = false }: { isShaking: boolean; compact?: boolean }) {
  const sizePx = compact ? 72 : 128

  return (
    <div className="mx-auto" style={{ width: `${sizePx}px`, height: `${sizePx}px` }}>
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true }} camera={{ fov: 34, position: [0, 0.1, 3.8] }}>
        <ambientLight intensity={1} />
        <directionalLight position={[3, 3, 5]} intensity={1.1} />
        <pointLight position={[-2, -2, 3]} intensity={1.2} color="#d50032" />
        <PhoneModel isShaking={isShaking} />
      </Canvas>
    </div>
  )
}
