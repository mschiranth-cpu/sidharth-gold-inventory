import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface CADFilePreviewProps {
  fileUrl: string;
  fileName: string;
}

// Component to load and display 3D models
function Model({ url }: { url: string }) {
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (error) {
    console.error('Error loading 3D model:', error);
    throw error;
  }
}

// Error fallback component
function ErrorFallback({ error }: { error?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center p-6">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load 3D Model</h3>
        <p className="text-sm text-gray-600">
          {error || 'The 3D file format may not be supported or the file is corrupted.'}
        </p>
        <p className="text-xs text-gray-500 mt-2">Supported formats: .stl, .obj, .gltf, .glb</p>
      </div>
    </div>
  );
}

export function CADFilePreview({ fileUrl, fileName }: CADFilePreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Determine file type from extension
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const supportedFormats = ['stl', 'obj', 'gltf', 'glb'];

  if (!fileExt || !supportedFormats.includes(fileExt)) {
    return (
      <ErrorFallback
        error={`Unsupported file format: .${fileExt}. Only ${supportedFormats.join(
          ', '
        )} files are supported.`}
      />
    );
  }

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return (
    <div className="w-full h-full bg-gray-100 relative">
      {/* Canvas for 3D rendering */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        onError={(err) => {
          console.error('Canvas error:', err);
          setError('Failed to initialize 3D viewer');
        }}
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Stage provides automatic lighting and shadows */}
          <Stage environment="city" intensity={0.6}>
            <Model url={fileUrl} />
          </Stage>

          {/* Controls for rotating, zooming, panning - Mobile optimized */}
          <OrbitControls
            makeDefault
            autoRotate={false}
            enableZoom={true}
            enablePan={true}
            minDistance={1}
            maxDistance={20}
            touches={{
              ONE: 2, // One finger = rotate
              TWO: 1, // Two fingers = zoom/pan
            }}
          />
        </Suspense>
      </Canvas>

      {/* Instructions overlay - Responsive */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-xs max-w-xs">
        {isMobile ? (
          <div className="space-y-0.5">
            <div className="flex gap-1 text-xs">
              <span>👆 One finger: Rotate</span>
            </div>
            <div className="flex gap-1 text-xs">
              <span>👌 Two fingers: Zoom</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 sm:gap-4">
            <span>🖱️ Left + drag: Rotate</span>
            <span>🖱️ Right + drag: Pan</span>
            <span>🖱️ Scroll: Zoom</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Preload utility to cache models
export function preloadCADModel(url: string) {
  useGLTF.preload(url);
}
