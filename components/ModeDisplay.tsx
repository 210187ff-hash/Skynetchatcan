import React, { useState, useEffect } from 'react';
import { AppView, DetectionResult, ModeDetails, PowerUserSettings } from '../types';
import { MODES } from '../constants';
import { detectionService } from '../services/detectionService';
import CameraFeed from './CameraFeed';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

interface ModeDisplayProps {
  activeModeId: AppView;
  powerUserSettings: PowerUserSettings;
  onDetectionComplete?: (result: DetectionResult) => void;
}

const ModeDisplay: React.FC<ModeDisplayProps> = ({ activeModeId, powerUserSettings, onDetectionComplete }) => {
  const activeMode: ModeDetails | undefined = MODES.find(mode => mode.id === activeModeId);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [currentScanStep, setCurrentScanStep] = useState<string>('');
  const [showAROverlay, setShowAROverlay] = useState<boolean>(false);
  const [useCamera, setUseCamera] = useState<boolean>(false);

  const [emfValue, setEmfValue] = useState<number>(0);
  const [emfHistory, setEmfHistory] = useState<{ time: string, value: number }[]>([]);
  const [isMagnetometerSupported, setIsMagnetometerSupported] = useState<boolean>(false);

  const scanSteps = [
    'Calibrando Magnetômetro...',
    'Analisando Ruído de Fundo...',
    'Filtrando Interferências RF...',
    'Processando Assinatura Magnética...',
    'Verificando Picos de Radiação...',
    'Finalizando Diagnóstico...',
  ];

  useEffect(() => {
    // Check for Magnetometer support
    if (activeModeId === AppView.BlueScan && 'Magnetometer' in window) {
      setIsMagnetometerSupported(true);
      try {
        // @ts-ignore
        const sensor = new Magnetometer({ frequency: 10 });
        const handleReading = () => {
          const magnitude = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2);
          setEmfValue(magnitude);
          setEmfHistory(prev => {
            const newData = [...prev, { time: new Date().toLocaleTimeString(), value: magnitude }];
            if (newData.length > 20) return newData.slice(1);
            return newData;
          });
        };
        sensor.addEventListener('reading', handleReading);
        sensor.start();
        return () => {
          sensor.removeEventListener('reading', handleReading);
          sensor.stop();
        };
      } catch (e) {
        console.error("Magnetometer error:", e);
        setIsMagnetometerSupported(false);
      }
    } else {
      setIsMagnetometerSupported(false);
    }
  }, [activeModeId]);

  useEffect(() => {
    let progressInterval: number;
    let stepInterval: number;

    if (isScanning) {
      setScanProgress(0);
      setCurrentScanStep(scanSteps[0]);
      let currentStepIndex = 0;

      progressInterval = window.setInterval(() => {
        setScanProgress(prev => (prev < 100 ? prev + 1 : prev));
      }, 10); // Increment progress every 10ms

      stepInterval = window.setInterval(() => {
        currentStepIndex++;
        if (currentStepIndex < scanSteps.length) {
          setCurrentScanStep(scanSteps[currentStepIndex]);
        }
      }, 200); // Change step every 200ms
    } else {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isScanning]);

  const startScan = async () => {
    setIsScanning(true);
    setDetectionResult(null);
    setShowAROverlay(false);

    try {
      const result = await detectionService.simulateDetection(activeModeId, powerUserSettings, { emf: emfValue });
      const resultWithTimestamp = {
        ...result,
        timestamp: new Date().toISOString(),
      };
      setDetectionResult(resultWithTimestamp);
      if (onDetectionComplete) {
        onDetectionComplete(resultWithTimestamp);
      }
      if (result.detected) {
        // Generate a short beep using Web Audio API
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
          
          const volumeMap = {
            'Baixo': 0.1,
            'Médio': 0.3,
            'Alto': 0.6
          };
          const volume = volumeMap[powerUserSettings.alertVolume] || 0.3;
          
          gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
          console.error("Audio playback failed:", e);
        }
        
        setShowAROverlay(true);
        setTimeout(() => setShowAROverlay(false), 2000); // AR overlay disappears after 2 seconds
      }
    } catch (error) {
      console.error("Erro durante a simulação de detecção:", error);
      const errorResult = {
        confidence: 0,
        message: 'Erro na simulação de detecção.',
        detected: false,
        timestamp: new Date().toISOString(),
      };
      setDetectionResult(errorResult);
      if (onDetectionComplete) {
        onDetectionComplete(errorResult);
      }
    } finally {
      setIsScanning(false);
      setScanProgress(100); // Ensure progress bar completes
      setCurrentScanStep('Scan concluído.');
    }
  };

  if (!activeMode) {
    return (
      <section className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">Modo de Detecção</h2>
        <p className="text-gray-300 text-center">Selecione um modo no menu lateral para começar.</p>
      </section>
    );
  }

  return (
    <section className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700 relative overflow-hidden">
      <h2 className="text-3xl font-bold text-blue-400 mb-4 text-center font-display">{activeMode.name}</h2>
      <p className="text-gray-300 text-center mb-6">{activeMode.longDescription}</p>

      {activeMode.isPixelExclusive && (
        <div className="bg-yellow-800 bg-opacity-30 border border-yellow-700 text-yellow-300 p-3 rounded-md mb-6 flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          Este modo é otimizado para Pixel 8 Pro devido ao sensor NIR raw.
        </div>
      )}

      <div className="flex flex-col items-center mb-6">
        <button
          onClick={() => setUseCamera(!useCamera)}
          className={`group flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-500 ${
            useCamera 
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          <div className={`p-2 rounded-lg transition-colors duration-300 ${useCamera ? 'bg-blue-500' : 'bg-gray-700'}`}>
            <span className="text-xl">📷</span>
          </div>
          <div className="text-left">
            <p className="leading-none">{useCamera ? 'Câmera Ativa' : 'Ativar Câmera'}</p>
            <p className={`text-[10px] mt-1 font-mono uppercase tracking-wider ${useCamera ? 'text-blue-200' : 'text-gray-500'}`}>
              {useCamera ? 'Live Feed: ON' : 'Live Feed: OFF'}
            </p>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ml-2 ${useCamera ? 'bg-blue-400' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${useCamera ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </div>
        </button>
        {!useCamera && (
          <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest animate-pulse">
            Recomendado para detecção realista
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center p-0 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 min-h-[350px] relative overflow-hidden group/screen">
        {useCamera ? (
          <div className="absolute inset-0 z-0 transition-opacity duration-700">
            <CameraFeed isActive={useCamera} />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        )}
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 min-h-[350px]">
          {activeModeId === AppView.BlueScan && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 text-right z-20">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">EMF Intensity</p>
              <p className="text-2xl font-mono font-bold text-white leading-none">
                {isMagnetometerSupported ? emfValue.toFixed(1) : (Math.random() * 50 + 30).toFixed(1)} <span className="text-xs text-blue-500">μT</span>
              </p>
              
              <div className="h-16 w-32 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emfHistory}>
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <YAxis hide domain={['auto', 'auto']} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {isScanning ? (
            <div className="flex flex-col items-center bg-black/60 p-8 rounded-3xl backdrop-blur-xl border border-blue-500/40 shadow-2xl animate-in zoom-in-95 duration-300">

              <div className="relative w-28 h-28 mb-6">
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping-slow opacity-50"></div>
                <div className="absolute inset-0 border-4 border-blue-600/50 rounded-full flex items-center justify-center bg-blue-500/10">
                  <span className="text-5xl animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">{activeMode.icon}</span>
                </div>
                {/* Scanning line effect */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-scan-line"></div>
              </div>
              <p className="text-xl text-blue-300 mb-4 font-mono font-bold tracking-tight">{currentScanStep}</p>
              <div className="w-72 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
              <p className="mt-3 text-[10px] font-mono text-blue-500/70 uppercase tracking-[0.2em]">Processing Signal...</p>
            </div>
          ) : detectionResult ? (
            <div className="text-center bg-black/70 p-8 rounded-3xl backdrop-blur-2xl border border-gray-700/50 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`inline-block p-3 rounded-2xl mb-4 ${detectionResult.detected ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <span className="text-3xl">{detectionResult.detected ? '🚨' : '🛡️'}</span>
              </div>
              <p className={`text-3xl font-black ${detectionResult.detected ? 'text-red-500' : 'text-green-500'} mb-4 uppercase tracking-tighter drop-shadow-sm`}>
                {detectionResult.message}
              </p>
              {detectionResult.detected && (
                <div className="space-y-2 mb-6">
                  <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">
                    Coordenadas GPS
                  </p>
                  <p className="font-mono text-blue-400 text-lg bg-blue-950/30 py-2 px-4 rounded-xl border border-blue-500/20">
                    {detectionResult.location?.lat?.toFixed(5)}N, {detectionResult.location?.lng?.toFixed(5)}W
                  </p>
                </div>
              )}
              {detectionResult.logCsvData && (
                <div className="mt-4 p-4 bg-gray-900/90 rounded-xl text-[10px] text-gray-500 font-mono text-left max-w-xs mx-auto overflow-auto border border-gray-800">
                  <p className="text-blue-500/70 mb-2 border-b border-gray-800 pb-1 flex justify-between">
                    <span>ENCRYPTED_LOG_STREAM</span>
                    <span className="animate-pulse">● LIVE</span>
                  </p>
                  <code className="break-all leading-relaxed">{detectionResult.logCsvData}</code>
                </div>
              )}
              <button 
                onClick={() => setDetectionResult(null)}
                className="mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest font-bold"
              >
                Limpar Resultados
              </button>
            </div>
          ) : (
            <div className="text-center bg-black/20 p-10 rounded-3xl backdrop-blur-sm border border-white/5 group-hover/screen:border-white/10 transition-colors duration-500">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
                <span className="text-4xl opacity-50 group-hover/screen:opacity-100 transition-opacity duration-500">{activeMode.icon}</span>
              </div>
              <p className="text-xl text-gray-400 font-medium">Pronto para Varredura</p>
              <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Posicione o dispositivo e inicie a análise de sinais.</p>
              {useCamera && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em]">Vision System Active</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={startScan}
        disabled={isScanning}
        className={`mt-8 w-full py-4 rounded-lg text-xl font-bold transition duration-300 ease-in-out
                    ${isScanning ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}
      >
        {isScanning ? 'Varrendo...' : 'Iniciar Varredura'}
      </button>

      {showAROverlay && detectionResult?.detected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in z-10">
          <div className="relative animate-bounce-custom">
            <div className="absolute -inset-2 bg-red-500 rounded-full opacity-75 animate-pulse-slow"></div>
            <div className="relative bg-red-600 text-white rounded-full p-4 text-4xl">
              🚨
            </div>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-700 text-white text-sm font-bold px-2 py-1 rounded-full whitespace-nowrap">
              {detectionResult.confidence * 100}% Confiança
            </span>
          </div>
          <style jsx>{`
            @keyframes bounce-custom {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes ping-slow {
              0% { transform: scale(0.8); opacity: 0; }
              50% { opacity: 0.75; }
              100% { transform: scale(1.5); opacity: 0; }
            }
            @keyframes pulse-slow {
              0%, 100% { opacity: 0.75; }
              50% { opacity: 1; }
            }
            @keyframes voice-bar {
              0%, 100% { height: 20%; }
              50% { height: 100%; }
            }
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </section>
  );
};

export default ModeDisplay;
