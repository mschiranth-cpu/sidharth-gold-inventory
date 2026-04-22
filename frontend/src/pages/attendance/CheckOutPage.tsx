/**
 * ============================================
 * CHECK-OUT PAGE WITH CAMERA
 * ============================================
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkOut } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function CheckOutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    startCamera();
    getLocation();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access denied', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location access denied', error);
        }
      );
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setPhoto(photoData);
      }
    }
  };

  const checkOutMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      navigate('/attendance/dashboard');
    },
  });

  const handleCheckOut = () => {
    if (!photo) {
      alert('Please capture your photo first');
      return;
    }

    checkOutMutation.mutate({
      checkOutPhoto: photo,
      checkOutLat: location?.lat,
      checkOutLng: location?.lng,
      checkOutDevice: navigator.userAgent,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-Out</h1>
          <p className="text-gray-600">Capture your photo to check out</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {checkOutMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {(checkOutMutation.error as any)?.response?.data?.error?.message ||
                'Check-out failed'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera</h3>
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <Button onClick={capturePhoto} variant="primary" size="lg" className="w-full mt-4">
                Capture Photo
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Captured Photo</h3>
              <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-gray-400">No photo captured yet</p>
                )}
              </div>

              {location && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-700">📍 Location captured</p>
                </div>
              )}

              <Button
                onClick={handleCheckOut}
                variant="danger"
                size="lg"
                className="w-full mt-4"
                disabled={!photo}
                isLoading={checkOutMutation.isPending}
              >
                Check Out Now
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Current time: {new Date().toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
