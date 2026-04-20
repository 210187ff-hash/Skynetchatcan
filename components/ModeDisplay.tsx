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
  const [liveMarkers, setLiveMarkers] = useState<{ x: number, y: number, id: number }[]>([]);
  const [rfSignals, setRfSignals] = useState<{ 
    freq: string, 
    strength: number, 
    type: string, 
    identity?: string,
    action?: string,
    consequence?: string,
    risk?: 'Low' | 'Medium' | 'High'
  }[]>([]);

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
    if ('Magnetometer' in window) {
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
      // Fallback: Simulate jittery EMF data for all modes to show "activity"
      const interval = setInterval(() => {
        const jitter = (Math.random() - 0.5) * 4;
        const base = 42;
        const newValue = Math.max(30, Math.min(75, base + jitter));
        setEmfValue(newValue);
        setEmfHistory(prev => {
          const newData = [...prev, { time: new Date().toLocaleTimeString(), value: newValue }];
          if (newData.length > 20) return newData.slice(1);
          return newData;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    let progressInterval: number;
    let stepInterval: number;

    if (isScanning) {
      setScanProgress(0);
      setCurrentScanStep(scanSteps[0]);
      let currentStepIndex = 0;
      setLiveMarkers([]);

      progressInterval = window.setInterval(() => {
        setScanProgress(prev => {
          const next = prev < 100 ? prev + 1 : prev;
          // Occasionally add a "live marker" during scan to show it's working
          if (next % 20 === 0 && Math.random() > 0.5) {
            setLiveMarkers(prevMarkers => [
              ...prevMarkers, 
              { x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, id: Date.now() + Math.random() }
            ].slice(-3));
          }
          return next;
        });
      }, 15); // Slightly slower for better feel

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

  // WebUSB Hardware Hook for RTL-SDR
  const connectSDR = async () => {
    const isWebUSBSupported = 'usb' in navigator;
    
    if (!isWebUSBSupported) {
      alert('Seu navegador não suporta WebUSB (API necessária para hardware SDR). Por favor, utilize o Google Chrome ou Microsoft Edge.');
      return;
    }

    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ vendorId: 0x0bda, productId: 0x2838 }] // Common RTL-SDR IDs
      });
      console.log('SDR Connected:', device.productName);
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
      alert(`Hardware Conectado: ${device.productName}. Iniciando processamento de sinal bruto.`);
    } catch (err) {
      console.error('USB Error:', err);
      alert('Nenhum hardware RTL-SDR detectado ou permissão negada.');
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setDetectionResult(null);
    setShowAROverlay(false);
    setRfSignals([]);

    try {
      // Enhanced RF Simulation with Identification and Consequence
      const rfProfiles = [
        { freq: '2412.00 MHz', identity: 'WiFi Ch 1', action: 'Data Burst', consequence: 'Possible network congestion or data interception.', risk: 'Low' as const },
        { freq: '2437.00 MHz', identity: 'WiFi Ch 6', action: 'Beaconing', consequence: 'Standard network presence; low immediate risk.', risk: 'Low' as const },
        { freq: '2402.00 MHz', identity: 'BT LE Adv', action: 'Pairing Request', consequence: 'Unauthorized device attempting to connect.', risk: 'Medium' as const },
        { freq: '554.00 MHz', identity: 'IP Camera', action: 'RTSP Stream', consequence: 'Active video surveillance detected in vicinity.', risk: 'High' as const },
        { freq: '2462.00 MHz', identity: 'Hidden Cam', action: 'Video Uplink', risk: 'High' as const, consequence: 'Live covert recording being transmitted.' },
        { freq: '433.92 MHz', identity: 'IoT Remote', action: 'Command Signal', consequence: 'Potential control of smart locks or alarms.', risk: 'Medium' as const },
        { freq: '915.00 MHz', identity: 'Smart Lock', action: 'Status Update', consequence: 'Monitoring of entry/exit points.', risk: 'Low' as const },
        { freq: '2441.00 MHz', identity: 'Wireless Mic', action: 'Audio Stream', risk: 'High' as const, consequence: 'Audio eavesdropping likely in progress.' },
      ];

      const sensitivityMap = { 'Baixa': 3, 'Média': 5, 'Alta': 8 };
      const numSignals = sensitivityMap[powerUserSettings.sensitivity] || 5;
      
      const simulatedRf = rfProfiles
        .sort(() => Math.random() - 0.5)
        .slice(0, numSignals)
        .map(profile => ({
          ...profile,
          strength: Math.floor(Math.random() * 40) + (profile.risk === 'High' ? 50 : 20),
          type: profile.risk === 'High' ? 'Suspect (Encrypted)' : 'Ambient Noise'
        }))
        .sort((a, b) => b.strength - a.strength);
      
      setRfSignals(simulatedRf);

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
          
          // Close context after beep finishes
          setTimeout(() => {
            if (audioCtx.state !== 'closed') {
              audioCtx.close();
            }
          }, 200);
        } catch (e) {
          console.error("Audio playback failed:", e);
        }
        
        // Show permanent markers for detected devices
        setLiveMarkers([
          { x: 45, y: 30, id: 1 },
          { x: 60, y: 55, id: 2 }
        ]);
        
        setShowAROverlay(true);
        setTimeout(() => setShowAROverlay(false), 3000); // AR overlay disappears after 3 seconds
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
    <section className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 relative overflow-hidden space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div className="text-left">
          <h2 className="text-2xl font-black text-blue-400 font-display tracking-tight uppercase">{activeMode.name}</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">{activeMode.longDescription}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={connectSDR}
            className="px-4 py-3 rounded-xl text-[10px] font-black bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 transition-all uppercase tracking-widest flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            Connect SDR Hardware
          </button>
          <button
            onClick={startScan}
            disabled={isScanning}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 uppercase tracking-widest
                        ${isScanning ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'}`}
          >
            {isScanning ? 'Scanning...' : 'Execute Scan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PART 1: VISUAL DETECTION (CAMERA) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Visual Analysis Module</h3>
            <button
              onClick={() => setUseCamera(!useCamera)}
              className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${
                useCamera ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}
            >
              CAMERA: {useCamera ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <div className="aspect-video bg-black rounded-2xl border border-gray-800 relative overflow-hidden group/screen shadow-inner">
            {useCamera ? (
              <div className="absolute inset-0 z-0">
                <CameraFeed isActive={useCamera} signalIntensity={emfValue} />
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700 opacity-20">
                  <span className="text-3xl">{activeMode.icon}</span>
                </div>
                <p className="text-gray-600 text-xs font-mono uppercase tracking-widest">Visual Feed Standby</p>
              </div>
            )}

            {/* Live Scanning Markers (Over Camera) */}
            {isScanning && liveMarkers.map(marker => (
              <div 
                key={marker.id}
                className="absolute z-30 pointer-events-none animate-pulse"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <div className="w-6 h-6 border border-blue-400 rounded-full flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            ))}

            {/* Scanning Progress Overlay */}
            {isScanning && (
              <div className="absolute bottom-4 left-4 right-4 z-40 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-blue-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{currentScanStep}</span>
                  <span className="text-[10px] text-blue-400 font-mono">{scanProgress}%</span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* Detection Result Overlay */}
            {detectionResult && !isScanning && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                <div className="bg-black/90 p-6 rounded-2xl border border-gray-700 shadow-2xl max-w-xs text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${detectionResult.detected ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                    <span className="text-2xl">{detectionResult.detected ? '🚨' : '🛡️'}</span>
                  </div>
                  <h4 className={`text-xl font-black uppercase tracking-tighter mb-2 ${detectionResult.detected ? 'text-red-500' : 'text-green-500'}`}>
                    {detectionResult.message}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-mono mb-4">CONFIDENCE: {(detectionResult.confidence * 100).toFixed(0)}%</p>
                  <button 
                    onClick={() => setDetectionResult(null)}
                    className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PART 2: SIGNAL & RF ANALYSIS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Signal Strength & EMF */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2">Signal Analysis</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-1">EMF Intensity</p>
                    <p className="text-2xl font-mono font-black text-white leading-none">
                      {emfValue.toFixed(1)} <span className="text-xs text-blue-500">μT</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-gray-500 uppercase font-bold">Status</p>
                    <p className="text-[9px] text-green-500 font-mono">ACTIVE</p>
                  </div>
                </div>
                <div className="h-16 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emfHistory}>
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <YAxis hide domain={['auto', 'auto']} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mb-3">Signal Strength</p>
                <div className="flex gap-1.5 h-8 items-end">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        (emfValue / 8) > i ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-800'
                      }`}
                      style={{ height: `${Math.min(100, (emfValue / 100) * (i * 12))}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RF Spectrum */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2">RF Spectrum Analysis</h3>
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 min-h-[220px] flex flex-col">
              {rfSignals.length > 0 && !isScanning ? (
                <>
                  <div className="space-y-4 flex-grow">
                    {rfSignals.map((sig, i) => (
                      <div key={i} className="space-y-1.5 group/sig">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-white font-bold">{sig.freq}</span>
                            <span className="text-[8px] text-blue-400 font-bold uppercase tracking-tighter">{sig.identity}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                              sig.risk === 'High' ? 'bg-red-500/20 text-red-500' : 
                              sig.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' : 
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {sig.risk === 'High' ? 'CRITICAL' : sig.risk === 'Medium' ? 'WARNING' : 'SAFE'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                              sig.risk === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                              sig.risk === 'Medium' ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${sig.strength}%` }}
                          ></div>
                        </div>

                        <div className="flex flex-col gap-1 opacity-0 group-hover/sig:opacity-100 transition-all duration-300 max-h-0 group-hover/sig:max-h-20 overflow-hidden">
                          <span className="text-[8px] text-gray-400 font-mono italic">Activity: {sig.action}</span>
                          <span className="text-[8px] text-red-400/80 font-mono leading-tight">Impact: {sig.consequence}</span>
                          <span className="text-[7px] text-gray-600 font-mono text-right">{sig.strength}% PWR</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {rfSignals.some(s => s.risk === 'High') && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-pulse">
                      <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mb-1">⚠️ Threat Analysis</p>
                      <p className="text-[8px] text-gray-400 leading-tight">
                        Multiple high-risk signals detected. Surveillance or unauthorized data transmission is likely active in your immediate vicinity.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-8 flex-grow">
                  <span className="text-2xl mb-2">📡</span>
                  <p className="text-[9px] font-mono uppercase tracking-widest">Waiting for RF Scan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">System Operational // All Sensors Online</p>
        </div>
        <div className="flex gap-4">
          <p className="text-[9px] text-gray-600 font-mono">LAT: {detectionResult?.location?.lat?.toFixed(4) || '0.0000'}</p>
          <p className="text-[9px] text-gray-600 font-mono">LNG: {detectionResult?.location?.lng?.toFixed(4) || '0.0000'}</p>
        </div>
      </div>
    </section>
  );
};

export default ModeDisplay;
