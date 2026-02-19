'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Person, Connection } from '@/lib/graph-types'

interface GraphEdgesProps {
  people: Person[]
  connections: Connection[]
  selectedPersonId?: string | null
}

export function GraphEdges({ people, connections, selectedPersonId }: GraphEdgesProps) {
  const lineRef = useRef<THREE.LineSegments>(null)

  const { positions, colors } = useMemo(() => {
    const personMap = new Map(people.map((p) => [p.id, p]))
    const posArr: number[] = []
    const colArr: number[] = []

    const defaultColor = new THREE.Color('#475569')
    const highlightColor = new THREE.Color('#94a3b8')

    const getPos = (p: Person) =>
      p.name === 'Абай' ? { x: 0, y: 0, z: 0 } : { x: p.pos_x, y: p.pos_y, z: p.pos_z }

    for (const conn of connections) {
      const from = personMap.get(conn.from_person_id)
      const to = personMap.get(conn.to_person_id)
      if (!from || !to) continue

      const fp = getPos(from)
      const tp = getPos(to)
      posArr.push(fp.x, fp.y, fp.z)
      posArr.push(tp.x, tp.y, tp.z)

      const isHighlighted =
        selectedPersonId &&
        (conn.from_person_id === selectedPersonId || conn.to_person_id === selectedPersonId)

      const c = isHighlighted ? highlightColor : defaultColor
      colArr.push(c.r, c.g, c.b)
      colArr.push(c.r, c.g, c.b)
    }

    return {
      positions: new Float32Array(posArr),
      colors: new Float32Array(colArr),
    }
  }, [people, connections, selectedPersonId])

  // Pulse animation on highlighted edges
  useFrame(({ clock }) => {
    if (lineRef.current && selectedPersonId) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 2) * 0.25
    }
  })

  if (positions.length === 0) return null

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={selectedPersonId ? 0.85 : 0.85}
        depthWrite={false}
      />
    </lineSegments>
  )
}
