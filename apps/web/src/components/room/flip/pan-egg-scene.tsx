'use client'

import { useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import type { JSX } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

function NormalizedAsset({
  url,
  targetSize,
  ...props
}: JSX.IntrinsicElements['group'] & {
  url: string
  targetSize: number
}) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
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
    const scale = targetSize / maxDim
    rootRef.current.scale.setScalar(scale)
    modelRef.current.position.set(-center.x, -center.y, -center.z)
  }, [scene, targetSize])

  return (
    <group ref={rootRef} {...props} dispose={null}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function PanModel(props: JSX.IntrinsicElements['group']) {
  return <NormalizedAsset url="/pan.glb" targetSize={3.5} {...props} />
}

function EggModel(props: JSX.IntrinsicElements['group']) {
  return <NormalizedAsset url="/egg.glb" targetSize={0.85} {...props} />
}

function PanEggRig({ isActive, flipCount }: { isActive: boolean; flipCount: number }) {
  const panRef = useRef<THREE.Group | null>(null)
  const eggRef = useRef<THREE.Group | null>(null)
  const eggVelRef = useRef(0)
  const eggSpinRef = useRef(0)
  const isAirborneRef = useRef(false)
  const lastFlipCountRef = useRef(flipCount)

  useEffect(() => {
    if (flipCount <= lastFlipCountRef.current) return
    lastFlipCountRef.current = flipCount
    if (isAirborneRef.current) return
    eggVelRef.current = 0.11
    eggSpinRef.current = 0.2
    isAirborneRef.current = true
  }, [flipCount])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (panRef.current) {
      // Keep pan bowl facing the player in portrait mode.
      const wobble = isActive ? 0.08 : 0.03
      panRef.current.rotation.x = 0.72 + Math.sin(t * 2.1) * wobble
      panRef.current.rotation.y = Math.PI + Math.sin(t * 1.3) * 0.03
      panRef.current.rotation.z = Math.sin(t * 2.6) * wobble
      panRef.current.position.y = -0.68 + Math.sin(t * 1.7) * 0.02
    }

    if (eggRef.current) {
      // Local position above pan center so egg stays on pan rig.
      const baseY = 0.28
      eggVelRef.current -= 0.01
      eggRef.current.position.y += eggVelRef.current

      if (eggRef.current.position.y < baseY) {
        eggRef.current.position.y = baseY
        eggVelRef.current = Math.max(0, eggVelRef.current * -0.12)
        if (eggVelRef.current < 0.02) {
          eggVelRef.current = 0
          isAirborneRef.current = false
        }
      }

      eggRef.current.rotation.x += eggSpinRef.current
      eggSpinRef.current *= 0.92
    }
  })

  return (
    <group ref={panRef} position={[0, -0.68, 0]}>
      <PanModel />
      <group ref={eggRef} position={[0, 0.28, 0.42]}>
        <EggModel />
      </group>
    </group>
  )
}

export function PanEggScene({ isActive, flipCount }: { isActive: boolean; flipCount: number }) {
  return (
    <div className="mx-auto h-52 w-full max-w-xs">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true }} camera={{ fov: 36, position: [0, 0.48, 2.85] }}>
        <ambientLight intensity={1.35} />
        <directionalLight position={[2, 4, 3]} intensity={1.05} color="#ffdca8" />
        <pointLight position={[-2, 1, 2]} intensity={0.6} color="#ff3b30" />
        <PanEggRig isActive={isActive} flipCount={flipCount} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/pan.glb')
useGLTF.preload('/egg.glb')
