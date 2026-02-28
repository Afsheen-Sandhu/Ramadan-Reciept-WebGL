import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContactShadows } from '@react-three/drei';

const ReceiptCloth = () => {
  const meshRef = useRef();
  const geometryRef = useRef();

  // Create cloth grid dimensions
  const width = 3;
  const height = 6;
  const segmentsW = 25;
  const segmentsH = 50;

  // Interaction State
  const [grabbedPoint, setGrabbedPoint] = useState(null);
  const grabbedPosRef = useRef(new THREE.Vector3());
  const dragZRef = useRef(0);

  // Physics Data
  const clothData = useMemo(() => {
    const numParticles = (segmentsW + 1) * (segmentsH + 1);
    const particles = [];
    const constraints = [];
    const restDistanceW = width / segmentsW;
    const restDistanceH = height / segmentsH;

    for (let i = 0; i <= segmentsH; i++) {
      for (let j = 0; j <= segmentsW; j++) {
        particles.push({
          position: new THREE.Vector3((j / segmentsW) * width - width / 2, (i / segmentsH) * -height, 0),
          previous: new THREE.Vector3((j / segmentsW) * width - width / 2, (i / segmentsH) * -height, 0),
          original: new THREE.Vector3((j / segmentsW) * width - width / 2, (i / segmentsH) * -height, 0),
          mass: i === 0 ? 0 : 1 // Pin top row
        });
      }
    }

    // Structural constraints
    for (let i = 0; i <= segmentsH; i++) {
      for (let j = 0; j <= segmentsW; j++) {
        const idx = i * (segmentsW + 1) + j;
        // right neighbor
        if (j < segmentsW) constraints.push([idx, idx + 1, restDistanceW]);
        // bottom neighbor
        if (i < segmentsH) constraints.push([idx, idx + (segmentsW + 1), restDistanceH]);
      }
    }

    // Shear constraints
    for (let i = 0; i < segmentsH; i++) {
      for (let j = 0; j < segmentsW; j++) {
        const idx = i * (segmentsW + 1) + j;
        const dist = Math.sqrt(restDistanceW ** 2 + restDistanceH ** 2);
        constraints.push([idx, idx + 1 + (segmentsW + 1), dist]);
        constraints.push([idx + 1, idx + (segmentsW + 1), dist]);
      }
    }

    // Bend constraints
    for (let i = 0; i <= segmentsH; i++) {
      for (let j = 0; j <= segmentsW; j++) {
        const idx = i * (segmentsW + 1) + j;
        if (j < segmentsW - 1) constraints.push([idx, idx + 2, restDistanceW * 2]);
        if (i < segmentsH - 1) constraints.push([idx, idx + 2 * (segmentsW + 1), restDistanceH * 2]);
      }
    }

    return { particles, constraints };
  }, [width, height, segmentsW, segmentsH]);

  // Texture Generation
  const canvasTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fbfbf9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RAMADAN BAZAAR', 512, 120);

    ctx.font = '40px monospace';
    ctx.fillText('1447 Hijri, Crescent Moon St.', 512, 190);
    ctx.fillText('Tel: (555) RAM-ADAN', 512, 240);

    ctx.textAlign = 'left';
    ctx.fillText('Date: 29 Shaban 1447', 80, 360);
    ctx.fillText('Order: #IFTAR-01', 80, 420);

    const drawDashedLine = (y) => {
      ctx.beginPath();
      ctx.setLineDash([15, 15]);
      ctx.moveTo(80, y);
      ctx.lineTo(944, y);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.setLineDash([]);
    };
    drawDashedLine(480);

    const items = [
      { name: 'Dates (Ajwa) 1kg', price: '$12.00' },
      { name: 'Rooh Afza Bottle', price: '$4.50' },
      { name: 'Samosas (Dozen)', price: '$8.00' },
      { name: 'Fruit Chaat Pack', price: '$6.50' },
      { name: 'Special Biryani', price: '$15.00' },
    ];

    let y = 570;
    ctx.font = '40px monospace';
    items.forEach((item) => {
      ctx.textAlign = 'left';
      ctx.fillText(item.name, 80, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.price, 944, y);
      y += 70;
    });

    drawDashedLine(y + 30);

    y += 130;
    ctx.textAlign = 'left';
    ctx.fillText('Subtotal', 80, y);
    ctx.textAlign = 'right';
    ctx.fillText('$46.00', 944, y);

    y += 70;
    ctx.textAlign = 'left';
    ctx.fillText('Zakat Fund (Donation)', 80, y);
    ctx.textAlign = 'right';
    ctx.fillText('$5.00', 944, y);

    y += 60;
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(944, y);
    ctx.lineWidth = 8;
    ctx.stroke();

    y += 100;
    ctx.font = 'bold 50px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL', 80, y);
    ctx.textAlign = 'right';
    ctx.fillText('$51.00', 944, y);

    ctx.font = '40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Ramadan Kareem!', 512, 1920);
    ctx.font = '30px monospace';
    ctx.fillText('May your fasts be accepted.', 512, 1980);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  // Set initial geometry attributes
  useEffect(() => {
    if (!geometryRef.current) return;
    const positions = geometryRef.current.attributes.position;
    for (let i = 0; i < clothData.particles.length; i++) {
      positions.setXYZ(i, clothData.particles[i].position.x, clothData.particles[i].position.y, clothData.particles[i].position.z);
    }
    positions.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, [clothData]);

  // Verlet Integration Loop
  useFrame((state, delta) => {
    const timeStep = Math.min(delta, 0.05); // Cap to prevent large jumps
    const { particles, constraints } = clothData;

    // Wind / Gravity forces
    const tsSq = timeStep * timeStep;
    const gravY = -9.8 * 2; // extra heavy gravity for realism
    const windX = Math.sin(state.clock.elapsedTime) * 3;
    const windZ = Math.cos(state.clock.elapsedTime * 1.5) * 3;

    // Integrate
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.mass === 0) continue;

      // Grab override
      if (grabbedPoint !== null && i === grabbedPoint) {
        p.previous.copy(p.position);
        p.position.copy(grabbedPosRef.current);
        continue;
      }

      const vx = (p.position.x - p.previous.x) * 0.98;
      const vy = (p.position.y - p.previous.y) * 0.98;
      const vz = (p.position.z - p.previous.z) * 0.98;

      p.previous.copy(p.position);

      p.position.x += vx + windX * tsSq;
      p.position.y += vy + gravY * tsSq;
      p.position.z += vz + windZ * tsSq;
    }

    // Constraints Solver
    const iterate = 10;
    for (let it = 0; it < iterate; it++) {
      for (let i = 0; i < constraints.length; i++) {
        const [p1Idx, p2Idx, restDist] = constraints[i];
        const p1 = particles[p1Idx];
        const p2 = particles[p2Idx];

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dz = p2.position.z - p1.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist === 0) continue;

        const correctionHalf = (1 - restDist / dist) * 0.5;
        const cx = dx * correctionHalf;
        const cy = dy * correctionHalf;
        const cz = dz * correctionHalf;

        if (p1.mass !== 0 && grabbedPoint !== p1Idx) {
          p1.position.x += cx;
          p1.position.y += cy;
          p1.position.z += cz;
        }
        if (p2.mass !== 0 && grabbedPoint !== p2Idx) {
          p2.position.x -= cx;
          p2.position.y -= cy;
          p2.position.z -= cz;
        }
      }
    }

    // Update Geometry
    if (geometryRef.current) {
      const positions = geometryRef.current.attributes.position;
      for (let i = 0; i < particles.length; i++) {
        positions.setXYZ(i, particles[i].position.x, particles[i].position.y, particles[i].position.z);
      }
      positions.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }
  });

  // Pointer Events
  const onPointerOver = (e) => {
    e.stopPropagation();
    document.body.style.cursor = grabbedPoint !== null ? 'grabbing' : 'grab';
  };

  const onPointerOut = (e) => {
    e.stopPropagation();
    if (grabbedPoint === null) {
      document.body.style.cursor = 'auto';
    }
  };

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'grabbing';

    // To prevent jumping, convert world coordinate hit to mesh local coordinates
    const localPoint = meshRef.current.worldToLocal(e.point.clone());

    // Find the actual closest grid particle visually to prevent index mismatch drift
    let closestIdx = -1;
    let minDist = Infinity;

    for (let i = 0; i < clothData.particles.length; i++) {
      const p = clothData.particles[i];
      const dist = p.position.distanceToSquared(localPoint);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    setGrabbedPoint(closestIdx);
    // Lock it directly onto the current physical particle position
    grabbedPosRef.current.copy(clothData.particles[closestIdx].position);

    // Add the satisfying upward "jump" from the original version when initially clicked
    grabbedPosRef.current.y += 2.0;
    grabbedPosRef.current.z += 0.5;

    // Shift the drag plane slightly towards the camera to accommodate the Z thrust
    dragZRef.current = e.point.z + 0.5;
  };

  const onPointerMove = (e) => {
    e.stopPropagation();
    if (grabbedPoint !== null) {
      // Find ray intersection point on a plane at origin to drag sensibly
      const raycaster = e.raycaster;
      // Fixed drag plane facing forward relative to the initial click depth
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -dragZRef.current);
      const targetPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, targetPoint);

      if (targetPoint) {
        // The solver wants local transformations, so translate world to local
        const localPoint = meshRef.current.worldToLocal(targetPoint.clone());
        grabbedPosRef.current.copy(localPoint);
      }
    }
  };

  const onPointerUp = (e) => {
    e.stopPropagation();
    setGrabbedPoint(null);
    e.target.releasePointerCapture(e.pointerId);
    document.body.style.cursor = 'grab';
  };

  return (
    <group position={[0, height / 2, 0]}>
      <mesh
        ref={meshRef}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <planeGeometry ref={geometryRef} args={[width, height, segmentsW, segmentsH]} />
        <meshStandardMaterial
          map={canvasTexture}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
      {grabbedPoint !== null && (
        <mesh position={grabbedPosRef.current}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'url(https://png.pngtree.com/thumb_back/fh260/background/20240125/pngtree-black-and-gold-ramadan-kareem-or-eid-mubarak-arabic-with-islamic-image_15568499.png) center/cover no-repeat',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Main 3D Canvas */}
      <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.5} />
          {/* Tint the directional light slightly gold/warm for the moon vibe */}
          <directionalLight position={[5, 10, 5]} intensity={1.5} color="#fffcf2" castShadow />
          <ReceiptCloth />
          <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={10} blur={2} far={4} color="#000000" />
        </Canvas>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#e8d89a', // Ramadan gold accent color
        fontFamily: 'sans-serif',
        pointerEvents: 'none',
        zIndex: 20,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}>
        <h2>Grab and drag the receipt</h2>
      </div>
    </div>
  );
}
