/**
 * ============================================
 * CHECK-IN PAGE WITH CAMERA
 * ============================================
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkIn } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function CheckInPage() {
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

  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      navigate('/attendance/dashboard');
    },
  });

  const handleCheckIn = () => {
    if (!photo) {
      alert('Please capture your photo first');
      return;
    }

    checkInMutation.mutate({
      checkInPhoto: photo,
      checkInLat: location?.lat,
      checkInLng: location?.lng,
      checkInDevice: navigator.userAgent,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In</h1>
          <p className="text-gray-600">Capture your photo to check in</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {checkInMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {(checkInMutation.error as any)?.response?.data?.error?.message || 'Check-in failed'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera</h3>
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <Button
                onClick={capturePhoto}
                variant="primary"
                size="lg"
                className="w-full mt-4"
                iconLeft={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              >
                Capture Photo
              </Button>
            </div>

            {/* Photo Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Captured Photo</h3>
              <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-gray-400">No photo captured yet</p>
                )}
              </div>

              {/* Location Info */}
              {location && (
                <div className="mt-4 p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-700">
                    📍 Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Check-in Button */}
              <Button
                onClick={handleCheckIn}
                variant="success"
                size="lg"
                className="w-full mt-4"
                disabled={!photo}
                isLoading={checkInMutation.isPending}
                iconLeft={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                }
              >
                Check In Now
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
