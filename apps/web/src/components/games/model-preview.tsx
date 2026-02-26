'use client'

import { Canvas } from '@react-three/fiber'
import { useGLTF, Float, Environment, Center, Bounds } from '@react-three/drei'
import { Suspense } from 'react'

interface ModelPreviewProps {
  modelPath: string
  accentColor: string
}

function Model({ path }: { path: string; scale?: number }) {
  const { scene } = useGLTF(path)
  return <primitive object={scene} />
}

export default function ModelPreview({ modelPath, accentColor }: ModelPreviewProps) {
  return (
    <Canvas
      camera={{ position: [0, 1, 4], fov: 35 }}
      style={{ pointerEvents: 'none' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, 2, 0]} intensity={0.6} color={accentColor} />
      <Environment preset="city" />

      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.1}>
          <Float speed={2} rotationIntensity={1} floatIntensity={0.6} floatingRange={[-0.05, 0.05]}>
            <Center>
              <Model path={modelPath} />
            </Center>
          </Float>
        </Bounds>
      </Suspense>
    </Canvas>
  )
}
