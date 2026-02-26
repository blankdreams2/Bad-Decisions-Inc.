'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Center, Bounds } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

function PhoneModel({ isShaking }: { isShaking: boolean }) {
  const { scene } = useGLTF('/phone.glb')
  const cloned = useMemo(() => scene.clone(true), [scene])
  const rootRef = useRef<THREE.Group | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!rootRef.current || !modelRef.current) return
    const box = new THREE.Box3().setFromObject(modelRef.current)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    rootRef.current.scale.setScalar(1.8 / maxDim)
    modelRef.current.position.set(-center.x, -center.y, -center.z)
  }, [cloned])

  useFrame(({ clock }) => {
    if (!rootRef.current) return
    const t = clock.getElapsedTime()
    if (isShaking) {
      rootRef.current.position.x = Math.sin(t * 68) * 0.03
      rootRef.current.position.y = Math.sin(t * 74) * 0.02
      rootRef.current.rotation.z = Math.sin(t * 56) * 0.04
      rootRef.current.rotation.y = Math.sin(t * 44) * 0.03
    } else {
      rootRef.current.position.x = 0
      rootRef.current.position.y = Math.sin(t * 2.4) * 0.04
      rootRef.current.rotation.z = Math.sin(t * 2.6) * 0.03
      rootRef.current.rotation.y = Math.sin(t * 1.8) * 0.08
    }
  })

  return (
    <group ref={rootRef}>
      <group ref={modelRef}>
        <primitive object={cloned} />
      </group>
    </group>
  )
}

export function ShakePhoneScene({ isShaking, compact = false }: { isShaking: boolean; compact?: boolean }) {
  return (
    <div className="mx-auto h-56 w-full max-w-xs">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }} camera={{ fov: 34, position: [0, 0.2, 4.2] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={0.9} />
        <pointLight position={[-2, 1, 3]} intensity={0.5} color="#ffffff" />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <PhoneModel isShaking={isShaking} />
            </Center>
          </Bounds>
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload('/phone.glb')
