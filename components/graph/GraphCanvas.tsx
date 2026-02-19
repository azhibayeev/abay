'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { GraphNodes } from './GraphNodes'
import { GraphEdges } from './GraphEdges'
import type { Person, Connection } from '@/lib/graph-types'

// Ambient + directional lights
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
      <pointLight position={[10, -5, 10]} intensity={0.4} color="#3B82F6" />
    </>
  )
}

// Subtle slow-rotating outer sphere wireframe
function SphereFrame() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0005
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[14, 32, 32]} />
      <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.15} />
    </mesh>
  )
}

interface GraphSceneProps {
  people: Person[]
  connections: Connection[]
  selectedPersonId: string | null
  hoveredPersonId: string | null
  onSelect: (person: Person) => void
  onHover: (id: string | null) => void
  onDragEnd: (id: string, x: number, y: number, z: number) => void
}

function GraphScene({
  people,
  connections,
  selectedPersonId,
  hoveredPersonId,
  onSelect,
  onHover,
  onDragEnd,
}: GraphSceneProps) {
  return (
    <>
      <SceneLights />
      <Stars radius={80} depth={60} count={3000} factor={3} fade speed={0.5} />
      <SphereFrame />
      <GraphEdges
        people={people}
        connections={connections}
        selectedPersonId={selectedPersonId}
      />
      <GraphNodes
        people={people}
        selectedPersonId={selectedPersonId}
        hoveredPersonId={hoveredPersonId}
        onSelect={onSelect}
        onHover={onHover}
        onDragEnd={onDragEnd}
      />
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.3}
        makeDefault
      />
    </>
  )
}

interface GraphCanvasProps extends GraphSceneProps {
  loading?: boolean
}

export function GraphCanvas({
  loading,
  people,
  connections,
  selectedPersonId,
  hoveredPersonId,
  onSelect,
  onHover,
  onDragEnd,
}: GraphCanvasProps) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 22], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#080c14' }}
        onPointerMissed={() => onSelect(null as unknown as Person)}
      >
        <Suspense fallback={null}>
          <GraphScene
            people={people}
            connections={connections}
            selectedPersonId={selectedPersonId}
            hoveredPersonId={hoveredPersonId}
            onSelect={onSelect}
            onHover={onHover}
            onDragEnd={onDragEnd}
          />
        </Suspense>
      </Canvas>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080c14]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Загрузка графа…</p>
          </div>
        </div>
      )}

      {!loading && people.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-slate-500 text-lg mb-2">Граф пуст</p>
            <p className="text-slate-600 text-sm">Добавьте первого человека, чтобы начать</p>
          </div>
        </div>
      )}
    </div>
  )
}
