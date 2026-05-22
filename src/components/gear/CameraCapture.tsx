
import React, { useRef, useState } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamStopRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  React.useEffect(() => {
    startCamera();
    return () => {
      streamStopRef.current?.getTracks().forEach((t) => t.stop());
      streamStopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only lifecycle
  }, []);

  const startCamera = async () => {
    try {
      setBlockedReason(null);
      streamStopRef.current?.getTracks().forEach((t) => t.stop());
      streamStopRef.current = null;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamStopRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let hint =
        'Could not start the camera. Use “Upload photo / file picker” instead if camera access stays blocked.';
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          hint =
            'Camera permission denied. Open your browser/site settings → allow Camera for this site, then tap Retake—or choose a photo with the upload option instead.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          hint =
            'No camera found on this device. Use the upload / file-picker option instead of live capture.';
        }
      }
      setBlockedReason(hint);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        cleanupTracks();
        onClose();
      }
    }, 'image/jpeg', 0.8);
  };

  const cleanupTracks = () => {
    streamStopRef.current?.getTracks().forEach((track) => track.stop());
    streamStopRef.current = null;
  };

  const cleanup = () => {
    cleanupTracks();
    setStream(null);
    onClose();
  };

  const retakePhoto = () => {
    startCamera();
  };

  void stream;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full rounded-lg ${blockedReason ? 'opacity-60' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {blockedReason ? (
            <p className="text-sm text-muted-foreground bg-destructive/10 border border-destructive/30 rounded-lg p-3 mt-3" role="status">
              {blockedReason}
            </p>
          ) : null}

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={cleanup} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="button"
              onClick={capturePhoto}
              disabled={!!blockedReason}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              Capture
            </Button>

            <Button type="button" variant="outline" onClick={retakePhoto} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
