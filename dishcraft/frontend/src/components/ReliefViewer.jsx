import { useRef, useMemo, Suspense, Component } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

class ViewerError extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#888',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      }}>
        3D viewer unavailable
      </div>
    )
    return this.props.children
  }
}

function GLBModel({ url, autoRotate }) {
  const groupRef = useRef()
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])

  const { offset, scale } = useMemo(() => {
    const box    = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    const size   = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return { offset: center.negate(), scale: 3 / maxDim }
  }, [cloned])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.45
    }
  })

  return (
    <group ref={groupRef}>
      <group scale={scale} position={[offset.x, offset.y, offset.z]}>
        <primitive object={cloned} />
      </group>
    </group>
  )
}

// Props: modelUrl, autoRotate (default true), height (default 460)
export default function ReliefViewer({ modelUrl, autoRotate = true, height = 460 }) {
  if (!modelUrl) return null

  return (
    <div style={{ width: '100%', height }}>
      <ViewerError>
        <Canvas
          shadows
          camera={{ position: [0, 0.3, 4.5], fov: 40 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => gl.setClearColor('#111827', 1)}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 6, 5]}  intensity={1.5} castShadow
            shadow-mapSize={[2048, 2048]} color="#fff9f0" />
          <directionalLight position={[-5, 3, 2]} intensity={0.6} color="#d0e8ff" />
          <directionalLight position={[0, -3, -4]} intensity={0.3} color="#ffd580" />

          <Suspense fallback={null}>
            <GLBModel url={modelUrl} autoRotate={autoRotate} />
          </Suspense>

          <ContactShadows position={[0, -2.2, 0]} opacity={0.45} scale={9} blur={3} far={6} />
          <Environment preset="studio" />

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={2.5}
            enablePan={false}
            minDistance={2}
            maxDistance={10}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI * 0.72}
          />
        </Canvas>
      </ViewerError>
    </div>
  )
}
