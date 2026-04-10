import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CameraFeedProps {
  isActive: boolean;
  onStreamReady?: (stream: MediaStream) => void;
  signalIntensity?: number;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ isActive, onStreamReady, signalIntensity = 0 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [gridData, setGridData] = useState<number[]>(new Array(64).fill(0));

  // Update grid data based on signal intensity
  useEffect(() => {
    const interval = setInterval(() => {
      setGridData(prev => prev.map(() => {
        // Base intensity from signal + some random noise
        const base = Math.min(1, signalIntensity / 100);
        const noise = Math.random() * 0.3;
        return Math.max(0, Math.min(1, base + noise - 0.15));
      }));
    }, 150);
    return () => clearInterval(interval);
  }, [signalIntensity]);

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

  const [retryCount, setRetryCount] = useState(0);

  // Consolidate camera initialization
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    const initCamera = async () => {
      if (!isActive) return;

      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId ? { deviceId: selectedDeviceId } : { facingMode: 'environment' },
        };
        
        try {
          activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (initialErr: any) {
          // If environment camera fails or is blocked, try any video device
          if (!selectedDeviceId) {
            console.warn('Initial camera request failed, trying fallback:', initialErr);
            activeStream = await navigator.mediaDevices.getUserMedia({ video: true });
          } else {
            throw initialErr;
          }
        }
        
        if (isMounted) {
          setStream(activeStream);
          setError(null);
          if (onStreamReady) onStreamReady(activeStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            // Handle play promise to avoid unhandled rejections or abort errors
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(e => {
                if (e.name !== 'AbortError') {
                  console.error("Error playing video:", e);
                }
              });
            }
          }
        } else {
          activeStream.getTracks().forEach(track => track.stop());
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error accessing camera:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Acesso à câmera bloqueado pelo navegador ou sistema. Verifique as permissões de privacidade ou tente abrir o app em uma nova aba.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('Nenhuma câmera encontrada neste dispositivo.');
        } else {
          setError(`Erro ao acessar a câmera: ${err.message || 'Verifique as conexões.'}`);
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isActive, selectedDeviceId, onStreamReady, retryCount]);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center">
      {error ? (
        <div className="p-6 text-center bg-gray-900 border border-red-500/50 rounded-xl max-w-xs mx-auto">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Detection Grid Overlay */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none opacity-40">
            {gridData.map((intensity, i) => (
              <div 
                key={i}
                className="border-[0.5px] border-blue-500/10 transition-all duration-300 flex items-center justify-center"
                style={{ 
                  backgroundColor: intensity > 0.6 ? `rgba(59, 130, 246, ${intensity * 0.3})` : 'transparent',
                  borderColor: intensity > 0.8 ? `rgba(59, 130, 246, 0.4)` : `rgba(59, 130, 246, 0.1)`
                }}
              >
                {intensity > 0.85 && (
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                )}
              </div>
            ))}
          </div>

          {/* HUD Elements */}
          <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-red-500 font-mono font-bold uppercase tracking-widest">Signal Tracking</span>
            </div>
            <div className="text-[8px] text-blue-400 font-mono uppercase">
              Sensitivity: {(signalIntensity).toFixed(1)}%
            </div>
          </div>

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
