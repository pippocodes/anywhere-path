import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

type Geometry = 'icosahedron' | 'torus' | 'octahedron'

interface ShapeConfig {
  position: [number, number, number]
  color: string
  speed: number
  geometry: Geometry
  scale: number
}

// A small, deliberately low-poly cluster — this is a decorative flourish,
// not a scene, so it stays cheap: a handful of meshes, no textures, no
// post-processing.
const SHAPES: ShapeConfig[] = [
  { position: [-2.4, 0.9, 0], color: '#ff8fa3', speed: 0.4, geometry: 'icosahedron', scale: 0.95 },
  { position: [2.6, -0.7, -1], color: '#ffccd5', speed: 0.3, geometry: 'torus', scale: 0.75 },
  { position: [0.6, 1.5, -0.6], color: '#ff4d6d', speed: 0.5, geometry: 'octahedron', scale: 0.6 },
  { position: [-1.5, -1.3, -1.5], color: '#fff0f3', speed: 0.25, geometry: 'icosahedron', scale: 0.5 },
]

function FloatingShape({ position, color, speed, geometry, scale }: ShapeConfig) {
  const ref = useRef<Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.x = t * speed
    ref.current.rotation.y = t * speed * 0.7
    ref.current.position.y = position[1] + Math.sin(t * speed + position[0]) * 0.2
  })

  return (
    <mesh ref={ref} position={position} scale={scale}>
      {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
      {geometry === 'torus' && <torusGeometry args={[0.8, 0.3, 8, 24]} />}
      {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
    </mesh>
  )
}

/**
 * One of the "one or two hero moments" the brief allows for react-three-fiber —
 * everywhere else in the app's 3D touches (card tilt) stay CSS-only. Lazy-loaded
 * from Home.tsx, and never rendered at all when the user prefers reduced motion.
 */
function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 3, 5]} intensity={1.3} color="#fff0f3" />
      <Suspense fallback={null}>
        {SHAPES.map((shape, i) => (
          <FloatingShape key={i} {...shape} />
        ))}
      </Suspense>
    </Canvas>
  )
}

export default Hero3D
