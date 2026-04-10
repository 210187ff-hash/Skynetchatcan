import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, Activity, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const UltrasonicDetector: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [peakDb, setPeakDb] = useState<number>(-100);
  const [isAnomalyDetected, setIsAnomalyDetected] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      setError(null);
      draw();
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

  const draw = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      let maxVal = 0;
      let maxIdx = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        if (barHeight > maxVal) {
          maxVal = barHeight;
          maxIdx = i;
        }

        const r = barHeight + (25 * (i / bufferLength));
        const g = 250 * (i / bufferLength);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }

      // Calculate frequency
      const nyquist = audioContextRef.current!.sampleRate / 2;
      const freq = Math.round(maxIdx * nyquist / bufferLength);
      setPeakFreq(freq);
      setPeakDb(Math.round((maxVal / 255) * 100) - 100);

      // Detect anomaly (High frequency peaks > 15kHz)
      if (freq > 15000 && maxVal > 150) {
        setIsAnomalyDetected(true);
      } else {
        setIsAnomalyDetected(false);
      }
    };

    renderFrame();
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Ultrasonic Detector</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Acoustic Surveillance & High-Frequency Analysis</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isAnomalyDetected ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          {isAnomalyDetected ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isAnomalyDetected ? 'text-red-400' : 'text-green-400'}`}>
            {isAnomalyDetected ? 'Anomaly Detected' : 'Environment Secure'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative bg-black rounded-3xl border border-gray-800 overflow-hidden aspect-video shadow-2xl">
            <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
            
            {!isListening && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Mic className="w-12 h-12 text-gray-600 mb-4" />
                <button 
                  onClick={startListening}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-full transition-all shadow-lg shadow-blue-600/20"
                >
                  Start Acoustic Scan
                </button>
              </div>
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              <div className="px-2 py-1 bg-black/80 border border-gray-700 rounded text-[8px] font-mono text-green-500 uppercase">Live Spectrum</div>
              <div className="px-2 py-1 bg-black/80 border border-gray-700 rounded text-[8px] font-mono text-blue-500 uppercase">FFT Size: 2048</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Peak Frequency</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">{peakFreq.toLocaleString()}</span>
                <span className="text-xs text-gray-500 font-bold uppercase">Hz</span>
              </div>
            </div>
            <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2 tracking-widest">Signal Power</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black font-mono ${peakDb > -40 ? 'text-red-400' : 'text-blue-400'}`}>{peakDb}</span>
                <span className="text-xs text-gray-500 font-bold uppercase">dB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-500 rounded-2xl text-white">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Acoustic Analysis</h2>
                <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Sub-Sonic & Ultrasonic</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 rounded-2xl border border-gray-700">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Detection Logic</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Muitos dispositivos de espionagem utilizam frequências ultrassônicas (acima de 20kHz) para comunicação silenciosa ou detecção de presença. Este módulo analisa o espectro em busca de picos anômalos nessas faixas.
                </p>
              </div>

              <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Human Range (20Hz-20kHz)</span>
                  <div className="h-1 w-20 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Ultrasonic Range (&gt;20kHz)</span>
                  <div className="h-1 w-20 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: isAnomalyDetected ? '90%' : '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {isListening && (
              <button 
                onClick={stopListening}
                className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Stop Scanning
              </button>
            )}
          </div>

          <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4">
            <Info className="w-6 h-6 text-blue-400 shrink-0" />
            <p className="text-[10px] text-blue-300 leading-relaxed">
              <strong>Dica Tática:</strong> Fique em silêncio absoluto durante a varredura. Picos constantes acima de 18kHz em ambientes silenciosos podem indicar a presença de transmissores ativos ou sensores de movimento ultrassônicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltrasonicDetector;
