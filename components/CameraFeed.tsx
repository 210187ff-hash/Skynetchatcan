import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CameraFeedProps {
  isActive: boolean;
  onStreamReady?: (stream: MediaStream) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ isActive, onStreamReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [selectedDeviceId]);

  const startCamera = useCallback(async () => {
    if (!isActive) return;

    // Stop existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setError(null);

    try {
      let constraints: MediaStreamConstraints = {
        video: selectedDeviceId ? { deviceId: selectedDeviceId } : { facingMode: 'environment' },
      };
      
      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (innerErr) {
        console.warn('Failed with preferred constraints, trying fallback:', innerErr);
        // Fallback to any video device
        newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      if (onStreamReady) {
        onStreamReady(newStream);
      }
      // Refresh devices list after permission is granted to get labels
      getDevices();
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permissão de câmera negada. Por favor, autorize o acesso nas configurações do navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.');
      } else {
        setError('Erro ao acessar a câmera. Tente novamente.');
      }
    }
  }, [isActive, selectedDeviceId, onStreamReady, stream, getDevices]);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, selectedDeviceId]);

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center">
      {error ? (
        <div className="p-6 text-center bg-gray-900 border border-red-500/50 rounded-xl max-w-xs mx-auto">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={startCamera}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black bg-opacity-50 p-2 rounded-md">
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Câmera ${devices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-blue-300 font-mono uppercase tracking-widest">Live Feed</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraFeed;
