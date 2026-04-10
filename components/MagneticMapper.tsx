import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, Map as MapIcon, Trash2, Save, AlertCircle, Zap, Smartphone, Globe } from 'lucide-react';
import { nativeBridge, Platform } from '../services/nativeBridge';

interface DataPoint {
  x: number;
  y: number;
  value: number;
  timestamp: number;
}

const MagneticMapper: React.FC = () => {
  const [points, setPoints] = useState<DataPoint[]>([]);
  const [currentEMF, setCurrentEMF] = useState<number>(0);
  const [peakEMF, setPeakEMF] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const [threshold, setThreshold] = useState(80);
  const [isGeigerEnabled, setIsGeigerEnabled] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [vectors, setVectors] = useState<{ x: number, y: number, vx: number, vy: number }[]>([]);
  
  const [isMagnetometerSupported, setIsMagnetometerSupported] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sensorRef = useRef<any>(null);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const currentEMFRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextClickTimeRef = useRef<number>(0);

  const calibrate = () => {
    setIsCalibrating(true);
    setPos({ x: 200, y: 200 });
    velocityRef.current = { x: 0, y: 0 };
    setTimeout(() => setIsCalibrating(false), 1000);
  };

  const exportMap = () => {
    const data = JSON.stringify({
      points,
      exportedAt: new Date().toISOString(),
      device: navigator.userAgent
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magnetic-map-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isRecording) return;

    const acc = event.acceleration;
    if (!acc || acc.x === null || acc.y === null) return;

    const now = performance.now();
    const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = now;

    // Simple double integration (very noisy, but real)
    velocityRef.current.x += acc.x * dt * 200; // Increased scale
    velocityRef.current.y += acc.y * dt * 200;

    // Friction to prevent drifting forever
    velocityRef.current.x *= 0.92;
    velocityRef.current.y *= 0.92;

    setPos(prev => {
      const newX = Math.max(0, Math.min(400, prev.x + velocityRef.current.x * dt));
      const newY = Math.max(0, Math.min(400, prev.y - velocityRef.current.y * dt));
      
      // Auto-add point if recording and moved enough
      if (isRecording && (Math.abs(newX - prev.x) > 2 || Math.abs(newY - prev.y) > 2)) {
        setPoints(p => [...p, {
          x: newX,
          y: newY,
          value: currentEMFRef.current,
          timestamp: Date.now()
        }].slice(-1000));

        if (showVectors) {
          setVectors(v => [...v, {
            x: newX,
            y: newY,
            vx: velocityRef.current.x,
            vy: velocityRef.current.y
          }].slice(-50));
        }
      }
      
      return { x: newX, y: newY };
    });
  }, [isRecording, showVectors]);

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('devicemotion', handleMotion);
      lastTimeRef.current = performance.now();
    } else {
      window.removeEventListener('devicemotion', handleMotion);
      velocityRef.current = { x: 0, y: 0 };
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isRecording, handleMotion]);

  useEffect(() => {
    let sensor: any = null;
    let fallbackInterval: number | null = null;

    const startSensor = async () => {
      if ('Magnetometer' in window) {
        try {
          const Magnetometer = (window as any).Magnetometer;
          sensor = new Magnetometer({ frequency: 10 });
          sensorRef.current = sensor;
          
          sensor.addEventListener('reading', () => {
            const emf = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2);
            const roundedEMF = Math.round(emf);
            setCurrentEMF(roundedEMF);
            currentEMFRef.current = roundedEMF;
            setPeakEMF(prev => Math.max(prev, roundedEMF));
          });
          
          sensor.start();
          setIsMagnetometerSupported(true);
        } catch (e) {
          console.error('Magnetometer error:', e);
          setupFallback();
        }
      } else {
        setupFallback();
      }
    };

    const setupFallback = () => {
      setIsMagnetometerSupported(false);
      fallbackInterval = window.setInterval(() => {
        const base = 42;
        const jitter = (Math.random() - 0.5) * 10;
        const val = Math.round(base + jitter);
        setCurrentEMF(val);
        currentEMFRef.current = val;
      }, 500);
    };

    startSensor();

    return () => {
      if (sensor) sensor.stop();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Geiger Counter Audio Logic
  useEffect(() => {
    if (!isGeigerEnabled) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioCtxRef.current;
    let isActive = true;

    const playClick = () => {
      if (!isActive || ctx.state === 'closed') return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.01);

      // Schedule next click based on EMF intensity
      // Higher EMF = shorter delay between clicks
      const delay = Math.max(30, 1000 - (currentEMFRef.current * 10));
      setTimeout(playClick, delay);
    };

    playClick();

    return () => {
      isActive = false;
    };
  }, [isGeigerEnabled]);

  const getColorForValue = (val: number) => {
    if (val < threshold * 0.5) return 'rgba(59, 130, 246, 0.5)'; // Blue
    if (val < threshold) return 'rgba(234, 179, 8, 0.6)'; // Yellow
    return 'rgba(239, 68, 68, 0.8)'; // Red
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Platform Status Badge */}
      <div className="flex justify-end">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
          nativeBridge.isNative() 
            ? 'bg-green-600/10 border-green-500/50 text-green-400' 
            : 'bg-blue-600/10 border-blue-500/50 text-blue-400'
        }`}>
          {nativeBridge.isNative() ? (
            <Smartphone className="w-3 h-3" />
          ) : (
            <Globe className="w-3 h-3" />
          )}
          {nativeBridge.isNative() ? `NATIVE MODE: ${nativeBridge.getPlatform().toUpperCase()}` : 'WEB SIMULATION MODE'}
        </div>
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <MapIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Magnetic Mapper</h1>
            <p className="text-gray-400 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">Spatial EMF Anomaly Mapping & Heatmap</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${isMagnetometerSupported ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isMagnetometerSupported ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            {isMagnetometerSupported ? 'Sensor Active' : 'Simulated Mode'}
          </div>
          <button 
            onClick={calibrate}
            className="p-2.5 bg-gray-900 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all hover:border-gray-700"
            title="Calibrate Position"
          >
            <Compass className={`w-5 h-5 ${isCalibrating ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={exportMap}
            disabled={points.length === 0}
            className="p-2.5 bg-gray-900 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition-all hover:border-gray-700 disabled:opacity-30"
            title="Export Data"
          >
            <Save className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setPoints([])}
            className="p-2.5 bg-red-900/10 text-red-400 hover:bg-red-900/20 rounded-xl border border-red-900/30 transition-all"
            title="Clear Map"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${
              isRecording ? 'bg-red-600 text-white animate-pulse shadow-red-600/20' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {isRecording ? 'Terminate' : 'Initialize'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div 
            ref={containerRef}
            className="relative bg-black rounded-[2.5rem] border border-gray-800 overflow-hidden aspect-square shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-crosshair group"
          >
            {/* Hardware Frame Overlay */}
            <div className="absolute inset-0 border-[12px] border-gray-900/50 pointer-events-none z-20 rounded-[2.5rem]"></div>
            <div className="absolute inset-0 border border-gray-800 pointer-events-none z-30 rounded-[2.5rem]"></div>

            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ 
              backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
              backgroundSize: `${gridSize}px ${gridSize}px` 
            }}></div>

            {/* Heatmap Points */}
            <svg className="absolute inset-0 w-full h-full filter blur-md opacity-80">
              {points.map((p, i) => (
                <circle 
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={15 + (p.value / 8)}
                  fill={getColorForValue(p.value)}
                  className="transition-all duration-1000"
                />
              ))}
            </svg>

            {/* Sharp Points */}
            <svg className="absolute inset-0 w-full h-full">
              {points.filter((_, i) => i % 5 === 0).map((p, i) => (
                <circle 
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={2}
                  fill="white"
                  fillOpacity={0.2}
                />
              ))}
            </svg>

            {/* Vector Field */}
            {showVectors && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {vectors.map((v, i) => {
                  const angle = Math.atan2(v.vy, v.vx);
                  const length = Math.sqrt(v.vx**2 + v.vy**2) * 0.5;
                  return (
                    <g key={i} transform={`translate(${v.x}, ${v.y}) rotate(${angle * 180 / Math.PI})`}>
                      <line x1="0" y1="0" x2={Math.min(20, length)} y2="0" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" />
                      <circle cx="0" cy="0" r="1" fill="rgba(59, 130, 246, 0.6)" />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Current Position Indicator */}
            <motion.div 
              animate={{ x: pos.x - 12, y: pos.y - 12 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="absolute w-6 h-6 z-40"
            >
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-1 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,1)] border-2 border-blue-500"></div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-gray-700 px-2 py-0.5 rounded text-[8px] font-mono text-white whitespace-nowrap">
                POS: {Math.round(pos.x)}, {Math.round(pos.y)}
              </div>
            </motion.div>

            <div className="absolute bottom-6 left-6 z-40 flex gap-3">
              <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-gray-800 rounded-lg text-[9px] font-mono text-blue-400 uppercase tracking-tighter">
                <span className="text-gray-600 mr-2">POINTS:</span> {points.length}
              </div>
              <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-gray-800 rounded-lg text-[9px] font-mono text-yellow-500 uppercase tracking-tighter">
                <span className="text-gray-600 mr-2">RES:</span> {gridSize}px
              </div>
            </div>

            {isCalibrating && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Compass className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                  <p className="text-xs font-black text-white uppercase tracking-widest">Recalibrating Spatial Matrix...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-8 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            
            <div className="inline-flex p-5 bg-blue-500/10 rounded-[1.5rem] relative">
              <Zap className={`w-10 h-10 ${currentEMF > 80 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
              {currentEMF > 80 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-gray-900"></div>
              )}
            </div>
            
            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">EMF Intensity Matrix</span>
              <div className="flex items-baseline justify-center gap-2">
                <h2 className="text-7xl font-black text-white font-mono tracking-tighter tabular-nums">
                  {currentEMF}
                </h2>
                <span className="text-xl text-gray-600 font-bold uppercase">µT</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-black/40 p-3 rounded-xl border border-gray-800">
                <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Peak Detected</p>
                <p className="text-xl font-mono font-black text-red-500">{peakEMF} µT</p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-gray-800">
                <p className="text-[8px] text-gray-500 uppercase font-black mb-1">Threshold</p>
                <p className="text-xl font-mono font-black text-blue-400">{threshold} µT</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <span>Signal Power</span>
                <span className={currentEMF > threshold ? 'text-red-500' : 'text-blue-400'}>
                  {currentEMF > threshold ? 'Critical' : currentEMF > threshold * 0.6 ? 'Warning' : 'Nominal'}
                </span>
              </div>
              <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentEMF > threshold ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                    currentEMF > threshold * 0.6 ? 'bg-yellow-500' : 
                    'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  }`}
                  style={{ width: `${Math.min(100, (currentEMF / (threshold * 1.5)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Advanced Controls</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Detection Threshold</label>
                  <span className="text-[10px] font-mono text-blue-400">{threshold} µT</span>
                </div>
                <input 
                  type="range" min="20" max="200" value={threshold} 
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Grid Resolution</label>
                  <span className="text-[10px] font-mono text-yellow-500">{gridSize}px</span>
                </div>
                <input 
                  type="range" min="10" max="50" value={gridSize} 
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setIsGeigerEnabled(!isGeigerEnabled)}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    isGeigerEnabled ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}
                >
                  Geiger Mode: {isGeigerEnabled ? 'ON' : 'OFF'}
                </button>
                <button 
                  onClick={() => setShowVectors(!showVectors)}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    showVectors ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-800 border-gray-700 text-gray-500'
                  }`}
                >
                  Vectors: {showVectors ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-[2rem] p-6 space-y-5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <MapIcon className="w-4 h-4 text-blue-400" />
              </div>
              Mapping Protocols
            </h3>
            <div className="space-y-4">
              {[
                { step: 1, text: "Mova o dispositivo lentamente em um padrão de grade sobre a área de interesse." },
                { step: 2, text: "Áreas vermelhas indicam picos de EMF, sugerindo componentes eletrônicos ocultos." },
                { step: 3, text: "Mantenha distância de objetos metálicos grandes conhecidos para evitar falsos positivos." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="w-6 h-6 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 group-hover:border-blue-500/50 transition-colors">
                    {item.step}
                  </span>
                  <p className="text-[11px] text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-[1.5rem] flex gap-4">
            <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-300 leading-relaxed">
              <strong>Spatial Sync:</strong> A precisão do mapeamento depende da calibração inicial. Se o cursor "derivar" muito, pare a gravação e use o botão de calibração para resetar a matriz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagneticMapper;
