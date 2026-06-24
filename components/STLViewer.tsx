import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { electronStorage } from '../services/electronStorage';

interface STLViewerProps {
  directoryId: string;
  filePath: string;
}

const STLViewer: React.FC<STLViewerProps> = ({ directoryId, filePath }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

      const initScene = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        requestAnimationFrame(initScene);
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1e293b);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 100);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-10, -10, -10);
      scene.add(directionalLight2);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      let mounted = true;

      const loadSTL = async () => {
        try {
          setLoading(true);
          setError(null);

          const buffer = await electronStorage.readFile(directoryId, filePath);
          
          if (!buffer) {
            setError('Failed to read file');
            return;
          }

          const loader = new STLLoader();
          let geometry: THREE.BufferGeometry;

          try {
            geometry = loader.parse(buffer);
          } catch (parseErr) {
            console.error('STL parse error:', parseErr);
            setError('Failed to parse STL file');
            setLoading(false);
            return;
          }

          if (!mounted) return;

          geometry.computeBoundingBox();
          const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
          geometry.translate(-center.x, -center.y, -center.z);

          geometry.computeBoundingBox();
          const size = geometry.boundingBox!.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          let scale = 1;
          if (maxDim > 0 && size.x > 0 && size.y > 0) {
            const scaleX = (container.clientWidth * 0.5) / size.x;
            const scaleY = (container.clientHeight * 0.5) / size.y;
            scale = Math.min(scaleX, scaleY, 1);
          }

          const material = new THREE.MeshPhongMaterial({
            color: 0x6366f1,
            specular: 0x444444,
            shininess: 30,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.setScalar(scale);
          scene.add(mesh);

          const box = new THREE.Box3().setFromObject(mesh);
          const boxSize = box.getSize(new THREE.Vector3());
          const boxCenter = box.getCenter(new THREE.Vector3());

          camera.position.set(boxCenter.x, boxCenter.y, Math.max(...[boxSize.x, boxSize.y, boxSize.z]) * 2);
          camera.lookAt(boxCenter);
          controls.target.copy(boxCenter);

          setLoading(false);
        } catch (err) {
          console.error('Error loading STL:', err);
          setError('Failed to load STL file');
          setLoading(false);
        }
      };

      loadSTL();

      return () => {
        mounted = false;
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        controls.dispose();
        renderer.dispose();

        if (sceneRef.current) {
          sceneRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              if (Array.isArray(object.material)) {
                object.material.forEach((m) => m.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        }

        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    };

    const cleanup = initScene();
    return cleanup;
  }, [directoryId, filePath]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px] relative rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading 3D model...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
};

export default STLViewer;
