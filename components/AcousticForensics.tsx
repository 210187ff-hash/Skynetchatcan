import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, Activity, Volume2, ShieldAlert, Info, Maximize2 } from 'lucide-react';

const AcousticForensics: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbLevel, setDbLevel] = useState<number>(-100);
  const [peakFreq, setPeakFreq] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      setError(null);
      processAudio();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Acesso ao microfone negado ou não suportado.');
    }
  };

  const stopListening = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  const processAudio = () => {
    if (!analyserRef.current || !canvasRef.current || !waterfallRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const wCanvas = waterfallRef.current;
    const wCtx = wCanvas.getContext('2d');
    if (!ctx || !wCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Waterfall setup: shift existing content down
    const waterfallData = wCtx.getImageData(0, 0, wCanvas.width, wCanvas.height);

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // 1. Draw Spectrum (Top)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      let maxVal = 0;
      let maxIdx = 0;

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#1e3a8a'); // Blue-900
      gradient.addColorStop(0.5, '#3b82f6'); // Blue-500
      gradient.addColorStop(1, '#60a5fa'); // Blue-400

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        if (val > maxVal) { maxVal = val; maxIdx = i; }

        const h = (val / 255) * canvas.height;
        
        // Draw individual bars with glow effect
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - h, barWidth, h);
        
        // Add a small cap to the bar
        if (val > 0) {
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(x, canvas.height - h, barWidth, 2);
        }

        x += barWidth + 1;
      }

      // Highlight peak frequency
      if (maxVal > 50) {
        const peakX = (maxIdx / bufferLength) * canvas.width * 0.5; // Adjusted for 2x barWidth
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(peakX, 0);
        ctx.lineTo(peakX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px monospace';
        ctx.fillText(`PEAK: ${Math.round(maxIdx * (audioContextRef.current?.sampleRate || 44100) / (2 * bufferLength))}Hz`, peakX + 5, 20);
      }

      // 2. Draw Waterfall (Bottom)
      // Shift image down
      wCtx.drawImage(wCanvas, 0, 0, wCanvas.width, wCanvas.height - 1, 0, 1, wCanvas.width, wCanvas.height - 1);
      
      // Draw new line at top
      const lineImg = wCtx.createImageData(wCanvas.width, 1);
      const step = bufferLength / wCanvas.width;
      for (let i = 0; i < wCanvas.width; i++) {
        const val = dataArray[Math.floor(i * step)];
        const idx = i * 4;
        lineImg.data[idx] = val; // R
        lineImg.data[idx + 1] = val / 2; // G
        lineImg.data[idx + 2] = 255 - val; // B
        lineImg.data[idx + 3] = 255; // A
      }
      wCtx.putImageData(lineImg, 0, 0);

      // Stats
      const nyquist = audioContextRef.current!.sampleRate / 2;
      setPeakFreq(Math.round(maxIdx * nyquist / bufferLength));
      setDbLevel(Math.round((maxVal / 255) * 100) - 100);
    };

    renderFrame();
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Acoustic Forensics</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Real-Time Spectrogram & Waterfall Analysis</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-white">{dbLevel} dB</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono text-white">{peakFreq} Hz</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Spectrum Visualizer */}
          <div className="bg-black rounded-3xl border border-gray-800 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black/60 px-2 py-1 rounded">Frequency Spectrum</span>
            </div>
            <canvas ref={canvasRef} width={1000} height={200} className="w-full h-[200px]" />
          </div>

          {/* Waterfall Visualizer */}
          <div className="bg-black rounded-3xl border border-gray-800 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-black/60 px-2 py-1 rounded">Waterfall History (Time vs Freq)</span>
            </div>
            <canvas ref={waterfallRef} width={1000} height={400} className="w-full h-[400px] image-pixelated" />
            
            {!isListening && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                <Mic className="w-16 h-16 text-gray-700 mb-6 animate-pulse" />
                <button 
                  onClick={startListening}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-2xl shadow-blue-600/40"
                >
                  Initialize Acoustic Core
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Signal Intel</h3>
                <p className="text-[10px] text-blue-400 font-mono uppercase">Acoustic Signature</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-gray-800">
                <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Technical Insight</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  O espectrograma em cascata (Waterfall) permite visualizar a persistência de sinais sonoros ao longo do tempo. Busque por linhas verticais constantes em frequências específicas, o que pode indicar interferência eletrônica ou dispositivos de transmissão ativos.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                  <span>Sensitivity</span>
                  <span>High</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '85%' }}></div>
                </div>
              </div>

              <button 
                onClick={stopListening}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Terminate Session
              </button>
            </div>
          </div>

          <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-3xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[10px] text-blue-300 leading-relaxed">
                <strong>Análise Forense:</strong> Sinais de espionagem acústica muitas vezes operam em frequências muito baixas (infrasom) ou muito altas (ultrassom). Observe o topo e a base do espectro para anomalias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcousticForensics;
