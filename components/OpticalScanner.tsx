import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Zap, Target, RefreshCw, AlertCircle, ShieldCheck, Maximize2 } from 'lucide-react';

const OpticalScanner: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [detections, setDetections] = useState<{ x: number, y: number, size: number, id: number }[]>([]);
  const [scanMode, setScanMode] = useState<'glint' | 'intensity' | 'night'>('glint');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      } catch (initialErr) {
        console.warn('Environment camera failed, trying fallback:', initialErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (err: any) {
      console.error('Camera access denied:', err);
      let errorMsg = 'Acesso à câmera negado. Esta função requer permissão de câmera para detectar reflexos de lentes.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Acesso à câmera bloqueado pelo navegador ou sistema. Verifique as permissões de privacidade ou tente abrir o app em uma nova aba.';
      }
      alert(errorMsg);
    }
  };

  const stopCamera = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsActive(false);
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const newDetections: { x: number, y: number, size: number, id: number }[] = [];

    if (scanMode === 'glint') {
      // Glint Detection: Look for very bright pixels (reflections)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (brightness > 240) { // Threshold for glint
          const x = (i / 4) % canvas.width;
          const y = Math.floor((i / 4) / canvas.width);
          
          // Simple clustering: if too close to existing detection, skip
          if (!newDetections.some(d => Math.abs(d.x - x) < 20 && Math.abs(d.y - y) < 20)) {
            newDetections.push({ x, y, size: 30, id: Date.now() + Math.random() + i });
          }
        }

        // Visual Filter: High contrast / Red tint
        data[i] = brightness * 1.5;
        data[i+1] = brightness * 0.5;
        data[i+2] = brightness * 0.5;
      }
    } else if (scanMode === 'intensity') {
      // Intensity Mapping: Map brightness to heat colors (Visual Proxy)
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        if (brightness > 200) { // Hot spots
          data[i] = 255; data[i+1] = 0; data[i+2] = 0;
        } else if (brightness > 120) { // Warm
          data[i] = 255; data[i+1] = 255; data[i+2] = 0;
        } else { // Cold
          data[i] = 0; data[i+1] = 0; data[i+2] = brightness;
        }
      }
    } else if (scanMode === 'night') {
      // Night Vision: Green tint + Gain
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        data[i] = 0;
        data[i+1] = Math.min(255, brightness * 2);
        data[i+2] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setDetections(newDetections.slice(0, 5)); // Limit to 5 detections
    animationRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (isActive) {
      processFrame();
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, scanMode]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Optical Lens Scanner</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">AI-Powered Glint Detection & Thermal Analysis</p>
        </div>
        <div className="flex gap-2">
          {(['glint', 'intensity', 'night'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
                scanMode === mode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-black rounded-3xl border border-gray-800 overflow-hidden aspect-video shadow-2xl group">
          <video ref={videoRef} autoPlay playsInline className="hidden" />
          <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover" />
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-[40px] border-black/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-white/40"></div>
            
            {/* Corner Brackets */}
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
          </div>

          {/* Detections */}
          <AnimatePresence>
            {detections.map(d => (
              <motion.div
                key={d.id}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute border-2 border-red-500 rounded-full flex items-center justify-center"
                style={{ 
                  left: `${(d.x / 1280) * 100}%`, 
                  top: `${(d.y / 720) * 100}%`, 
                  width: d.size, 
                  height: d.size,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-1 h-1 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black text-white px-1 rounded">LENS?</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
              <Camera className="w-16 h-16 text-gray-700 mb-6 animate-pulse" />
              <button 
                onClick={startCamera}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-2xl shadow-blue-600/40"
              >
                Initialize Optical Core
              </button>
            </div>
          )}

          <div className="absolute bottom-6 left-6 flex gap-4">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-mono text-white uppercase">{isActive ? 'Live Feed' : 'Offline'}</span>
            </div>
            <div className="bg-black/60 px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-blue-400 uppercase">
              FPS: 60 | Mode: {scanMode}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Detection Logic</h3>
                <p className="text-[10px] text-blue-400 font-mono uppercase">Optical Feedback Loop</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-gray-800">
                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">How it works</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Lentes de câmeras refletem luz de forma única. O modo <span className="text-blue-400 font-bold">Glint</span> busca por picos de brilho concentrados. O modo <span className="text-red-400 font-bold">Intensity</span> mapeia variações de luz que podem indicar eletrônicos ativos.
                </p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setIsFlashOn(!isFlashOn)}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                    isFlashOn ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {isFlashOn ? 'Strobe Flash ON' : 'Enable Strobe'}
                </button>
                <button 
                  onClick={stopCamera}
                  className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-3xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[10px] text-blue-300 leading-relaxed">
                <strong>Dica Tática:</strong> Use o modo Strobe em ambientes escuros. O reflexo da lente (glint) será muito mais evidente quando a luz pisca rapidamente. Mantenha o celular estável para evitar falsos positivos de superfícies metálicas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpticalScanner;
