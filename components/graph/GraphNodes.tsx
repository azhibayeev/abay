'use client'

import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Person } from '@/lib/graph-types'
import { CONNECTION_COLORS } from '@/lib/graph-types'

// Drag: raycast onto sphere of same radius to keep node on sphere surface.
// Tracks didMove so we can avoid opening the panel on click after a drag.
function useNodeDrag(
  person: Person,
  onDragEnd: (id: string, x: number, y: number, z: number) => void
) {
  const { gl, camera } = useThree()
  const [dragPos, setDragPos] = useState<THREE.Vector3 | null>(null)
  const dragPosRef = useRef({ x: person.pos_x, y: person.pos_y, z: person.pos_z })
  const draggingRef = useRef(false)
  const didMoveRef = useRef(false)
  const justDraggedRef = useRef(false)

  const startDrag = useCallback(
    (e: THREE.Event) => {
      e.stopPropagation()
      if (draggingRef.current) return
      draggingRef.current = true
      didMoveRef.current = false
      const radius =
        Math.sqrt(
          person.pos_x * person.pos_x +
            person.pos_y * person.pos_y +
            person.pos_z * person.pos_z
        ) || 5
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius)
      const target = new THREE.Vector3()
      const canvas = gl.domElement
      const controls = useThree.getState().controls as { enabled: boolean } | null

      if (controls) controls.enabled = false
      dragPosRef.current = { x: person.pos_x, y: person.pos_y, z: person.pos_z }
      setDragPos(new THREE.Vector3(person.pos_x, person.pos_y, person.pos_z))

      const onMove = (ev: PointerEvent) => {
        didMoveRef.current = true
        const rect = canvas.getBoundingClientRect()
        const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
        if (raycaster.ray.intersectSphere(sphere, target)) {
          dragPosRef.current = { x: target.x, y: target.y, z: target.z }
          setDragPos(target.clone())
        }
      }

      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.removeEventListener('pointercancel', onUp)
        draggingRef.current = false
        if (controls) controls.enabled = true
        justDraggedRef.current = didMoveRef.current
        const cur = dragPosRef.current
        onDragEnd(person.id, cur.x, cur.y, cur.z)
        setDragPos(null)
        setTimeout(() => {
          justDraggedRef.current = false
        }, 90)
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.addEventListener('pointercancel', onUp)
    },
    [person.id, person.pos_x, person.pos_y, person.pos_z, camera, gl, onDragEnd]
  )

  const position: [number, number, number] = dragPos
    ? [dragPos.x, dragPos.y, dragPos.z]
    : [person.pos_x, person.pos_y, person.pos_z]

  return { position, isDragging: dragPos !== null, onPointerDown: startDrag, justDraggedRef }
}

const INSTANCED_THRESHOLD = 100
const CORE_NODE_NAME = 'Абай'
const CORE_NODE_RADIUS = 0.85

interface GraphNodesProps {
  people: Person[]
  selectedPersonId: string | null
  hoveredPersonId: string | null
  onSelect: (person: Person) => void
  onHover: (id: string | null) => void
  onDragEnd: (id: string, x: number, y: number, z: number) => void
}

// ── Core node (Абай) — large central sphere, fixed at center, no drag ─────────

function CoreNode({
  person,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  person: Person
  isSelected: boolean
  isHovered: boolean
  onSelect: (p: Person) => void
  onHover: (id: string | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const colorHex = CONNECTION_COLORS[person.connection_type]
  const baseScale = isSelected ? 1.2 : isHovered ? 1.1 : 1.0

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.scale.lerp(
      new THREE.Vector3(baseScale, baseScale, baseScale),
      0.12
    )
    if (isSelected || isHovered) {
      meshRef.current.rotation.y += 0.008
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(person)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(person.id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[CORE_NODE_RADIUS, 24, 24]} />
      <meshStandardMaterial
        color={colorHex}
        emissive={colorHex}
        emissiveIntensity={isSelected ? 0.9 : isHovered ? 0.6 : 0.4}
        roughness={0.25}
        metalness={0.5}
      />
      {(isHovered || isSelected) && (
        <Html
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            color: '#f1f5f9',
            fontSize: '12px',
            fontFamily: 'system-ui, sans-serif',
            background: 'rgba(15,23,42,0.9)',
            padding: '3px 8px',
            borderRadius: '4px',
            transform: 'translate(-50%, -130%)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {person.name}
        </Html>
      )}
    </mesh>
  )
}

// ── Single node (< threshold) ───────────────────────────────────────────────

function SingleNode({
  person,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onDragEnd,
}: {
  person: Person
  isSelected: boolean
  isHovered: boolean
  onSelect: (p: Person) => void
  onHover: (id: string | null) => void
  onDragEnd: (id: string, x: number, y: number, z: number) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { position, onPointerDown, justDraggedRef } = useNodeDrag(person, onDragEnd)
  const colorHex = CONNECTION_COLORS[person.connection_type]
  const baseScale = isSelected ? 1.4 : isHovered ? 1.2 : 1.0

  useFrame(() => {
    if (!meshRef.current) return
    const target = baseScale
    meshRef.current.scale.lerp(
      new THREE.Vector3(target, target, target),
      0.12
    )
    if (isSelected || isHovered) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        if (justDraggedRef.current) return
        onSelect(person)
      }}
      onPointerDown={onPointerDown}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(person.id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshStandardMaterial
        color={colorHex}
        emissive={colorHex}
        emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.2}
        roughness={0.3}
        metalness={0.4}
      />
      {(isHovered || isSelected) && (
        <Html
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            color: '#f1f5f9',
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif',
            background: 'rgba(15,23,42,0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
            transform: 'translate(-50%, -130%)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {person.name}
        </Html>
      )}
    </mesh>
  )
}

// ── Instanced nodes (≥ threshold) ───────────────────────────────────────────

function InstancedNodes({
  people,
  selectedPersonId,
  hoveredPersonId,
  onSelect,
  onHover,
}: Omit<GraphNodesProps, 'onDragEnd'>) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { raycaster, camera, pointer } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!meshRef.current) return
    people.forEach((person, i) => {
      dummy.position.set(person.pos_x, person.pos_y, person.pos_z)
      const scale =
        person.id === selectedPersonId ? 1.4 : person.id === hoveredPersonId ? 1.2 : 1.0
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)

      const color = new THREE.Color(CONNECTION_COLORS[person.connection_type])
      meshRef.current!.setColorAt(i, color)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [people, selectedPersonId, hoveredPersonId, dummy])

  const handleClick = useCallback(
    (e: THREE.Intersection) => {
      if (e.instanceId === undefined) return
      const person = people[e.instanceId]
      if (person) onSelect(person)
    },
    [people, onSelect]
  )

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, people.length]}
      onClick={(e) => {
        e.stopPropagation()
        handleClick(e)
      }}
      onPointerMove={(e) => {
        if (e.instanceId !== undefined) {
          onHover(people[e.instanceId]?.id ?? null)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = 'default'
      }}
    >
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshStandardMaterial roughness={0.3} metalness={0.4} />
    </instancedMesh>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export function GraphNodes({
  people,
  selectedPersonId,
  hoveredPersonId,
  onSelect,
  onHover,
  onDragEnd,
}: GraphNodesProps) {
  if (people.length === 0) return null

  if (people.length >= INSTANCED_THRESHOLD) {
    return (
      <InstancedNodes
        people={people}
        selectedPersonId={selectedPersonId}
        hoveredPersonId={hoveredPersonId}
        onSelect={onSelect}
        onHover={onHover}
        onDragEnd={onDragEnd}
      />
    )
  }

  const corePerson = people.find((p) => p.name === CORE_NODE_NAME)
  const restPeople = corePerson ? people.filter((p) => p.id !== corePerson.id) : people

  return (
    <>
      {corePerson && (
        <CoreNode
          key={corePerson.id}
          person={corePerson}
          isSelected={selectedPersonId === corePerson.id}
          isHovered={hoveredPersonId === corePerson.id}
          onSelect={onSelect}
          onHover={onHover}
        />
      )}
      {restPeople.map((person) => (
        <SingleNode
          key={person.id}
          person={person}
          isSelected={selectedPersonId === person.id}
          isHovered={hoveredPersonId === person.id}
          onSelect={onSelect}
          onHover={onHover}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  )
}
