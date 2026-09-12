import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

type SceneNode = {
  label: string
  meta: string
  position: [number, number, number]
  size: [number, number]
  color: number
}

const sceneNodes: SceneNode[] = [
  {
    label: 'IDEA',
    meta: 'START HERE',
    position: [-2.8, 1.65, 0.3],
    size: [2.1, 1.06],
    color: 0xd8ff4f,
  },
  {
    label: 'SHAPE',
    meta: 'MAKE IT CLEAR',
    position: [0.15, 0.35, 0.7],
    size: [2.45, 1.24],
    color: 0xf4f0e7,
  },
  {
    label: 'SHIP',
    meta: 'MOVE FORWARD',
    position: [3.1, 1.75, 0.05],
    size: [2.1, 1.06],
    color: 0xff745c,
  },
  {
    label: 'SIGNAL',
    meta: 'ONE SOURCE',
    position: [-1.8, -2.05, -0.2],
    size: [2.25, 1.06],
    color: 0x8cd7ff,
  },
  {
    label: 'SYSTEM',
    meta: 'ALWAYS ALIGNED',
    position: [2.2, -1.75, 0.15],
    size: [2.4, 1.1],
    color: 0xe7c8ff,
  },
]

function makeTextSprite(label: string, meta: string, darkText: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 320
  const context = canvas.getContext('2d')

  if (!context) return null
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.textAlign = 'center'
  context.fillStyle = darkText ? '#101310' : '#f6f4ed'
  context.font = '700 80px Avenir Next, sans-serif'
  context.fillText(label, canvas.width / 2, 154)
  context.globalAlpha = 0.58
  context.font = '600 27px Avenir Next, sans-serif'
  context.letterSpacing = '6px'
  context.fillText(meta, canvas.width / 2, 215)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2.7, 1.12, 1)
  sprite.position.z = 0.19
  return sprite
}

function makeConnector(
  root: THREE.Group,
  from: THREE.Vector3,
  to: THREE.Vector3,
  bend: number,
) {
  const center = from.clone().lerp(to, 0.5)
  center.y += bend
  center.z -= 0.35
  const curve = new THREE.CatmullRomCurve3([from, center, to])
  const geometry = new THREE.TubeGeometry(curve, 42, 0.026, 8, false)
  const material = new THREE.MeshBasicMaterial({
    color: 0xc9ff46,
    transparent: true,
    opacity: 0.42,
  })
  root.add(new THREE.Mesh(geometry, material))

  const packet = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xe6ff8b }),
  )
  root.add(packet)
  return { curve, packet }
}

export function LandingThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.15, 11.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.rotation.x = -0.08
    scene.add(root)

    scene.add(new THREE.AmbientLight(0xffffff, 2.2))
    const keyLight = new THREE.PointLight(0xd9ff55, 28, 24)
    keyLight.position.set(-4, 4, 7)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0xff745c, 22, 20)
    rimLight.position.set(5, -3, 5)
    scene.add(rimLight)

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(4.85, 0.018, 8, 160),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.14,
      }),
    )
    orbit.rotation.set(1.18, 0.16, -0.34)
    root.add(orbit)

    const innerOrbit = new THREE.Mesh(
      new THREE.TorusGeometry(3.55, 0.012, 8, 150),
      new THREE.MeshBasicMaterial({
        color: 0xd8ff4f,
        transparent: true,
        opacity: 0.22,
      }),
    )
    innerOrbit.rotation.set(1.35, -0.2, 0.46)
    root.add(innerOrbit)

    const floatingNodes: THREE.Group[] = []
    sceneNodes.forEach((node, index) => {
      const group = new THREE.Group()
      group.position.set(...node.position)
      group.userData.baseY = node.position[1]
      group.userData.phase = index * 0.9

      const geometry = new RoundedBoxGeometry(
        node.size[0],
        node.size[1],
        0.28,
        5,
        0.16,
      )
      const material = new THREE.MeshPhysicalMaterial({
        color: node.color,
        roughness: 0.28,
        metalness: 0.04,
        clearcoat: 0.8,
        clearcoatRoughness: 0.22,
        transparent: true,
        opacity: index === 1 ? 1 : 0.9,
      })
      group.add(new THREE.Mesh(geometry, material))

      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 24),
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.28,
        }),
      )
      group.add(outline)

      const label = makeTextSprite(node.label, node.meta, true)
      if (label) {
        label.scale.set(node.size[0] * 1.2, node.size[1] * 1.2, 1)
        group.add(label)
      }

      const portMaterial = new THREE.MeshBasicMaterial({ color: 0xefffba })
      const portGeometry = new THREE.SphereGeometry(0.06, 12, 12)
      const leftPort = new THREE.Mesh(portGeometry, portMaterial)
      leftPort.position.set(-node.size[0] / 2 - 0.05, 0, 0.05)
      const rightPort = leftPort.clone()
      rightPort.position.x *= -1
      group.add(leftPort, rightPort)

      floatingNodes.push(group)
      root.add(group)
    })

    const points = sceneNodes.map(
      (node) => new THREE.Vector3(...node.position).setZ(node.position[2] - 0.12),
    )
    const connectors = [
      makeConnector(root, points[0], points[1], 0.18),
      makeConnector(root, points[1], points[2], 0.2),
      makeConnector(root, points[0], points[3], -0.08),
      makeConnector(root, points[3], points[4], -0.24),
      makeConnector(root, points[4], points[2], 0.06),
    ]

    const particleCount = 420
    const particlePositions = new Float32Array(particleCount * 3)
    for (let index = 0; index < particleCount; index += 1) {
      const radius = 4.5 + Math.random() * 4.8
      const angle = Math.random() * Math.PI * 2
      particlePositions[index * 3] = Math.cos(angle) * radius
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 9
      particlePositions[index * 3 + 2] = -2 - Math.random() * 5
    }
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3),
    )
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xeefbc3,
        size: 0.025,
        transparent: true,
        opacity: 0.55,
      }),
    )
    root.add(particles)

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frameId = 0
    const render = (time = 0) => {
      const elapsed = time * 0.001
      root.rotation.y += (pointer.x * 0.09 - root.rotation.y) * 0.025
      root.rotation.x += (-pointer.y * 0.055 - 0.08 - root.rotation.x) * 0.025

      floatingNodes.forEach((node) => {
        node.position.y =
          node.userData.baseY + Math.sin(elapsed * 0.8 + node.userData.phase) * 0.09
        node.rotation.z = Math.sin(elapsed * 0.55 + node.userData.phase) * 0.018
      })
      connectors.forEach(({ curve, packet }, index) => {
        const progress = (elapsed * 0.16 + index * 0.19) % 1
        packet.position.copy(curve.getPointAt(progress))
      })
      orbit.rotation.z = -0.34 + elapsed * 0.025
      innerOrbit.rotation.z = 0.46 - elapsed * 0.035
      particles.rotation.z = elapsed * 0.008
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(render)
    }

    if (reduceMotion) {
      renderer.render(scene, camera)
    } else {
      frameId = window.requestAnimationFrame(render)
    }

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onPointerMove)
      resizeObserver.disconnect()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((material) => material.dispose())
        }
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose()
          object.material.dispose()
        }
        if (object instanceof THREE.LineSegments) {
          object.geometry.dispose()
          object.material.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="landing-scene" ref={mountRef} aria-hidden="true" />
}
