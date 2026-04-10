import React from 'react';
import { AppView, ModeDetails } from '../types';
import { MODES } from '../constants';
import { nativeBridge } from '../services/nativeBridge';
import { Smartphone, Globe } from 'lucide-react';

interface DashboardProps {
  onSelectView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectView }) => {
  const commonLinks = [
    { id: AppView.Introduction, name: 'Introdução', icon: '📝', color: 'bg-blue-600' },
    { id: AppView.Flowchart, name: 'Fluxograma', icon: '📊', color: 'bg-green-600' },
    { id: AppView.HistoryLog, name: 'Histórico', icon: '📜', color: 'bg-yellow-600' },
    { id: AppView.WiFiAnalyzer, name: 'Wi-Fi Analyzer', icon: '📶', color: 'bg-blue-500' },
    { id: AppView.BluetoothSniffer, name: 'BT Sniffer', icon: '📱', color: 'bg-indigo-600' },
    { id: AppView.SensorManager, name: 'Sensores', icon: '🛠️', color: 'bg-purple-600' },
    { id: AppView.UltrasonicDetector, name: 'Ultrasonic', icon: '🔊', color: 'bg-red-600' },
    { id: AppView.MagneticMapper, name: 'EMF Map', icon: '🗺️', color: 'bg-green-600' },
    { id: AppView.PrivacyAudit, name: 'Privacidade', icon: '🛡️', color: 'bg-blue-600' },
    { id: AppView.OpticalScanner, name: 'Optical', icon: '👁️', color: 'bg-orange-600' },
    { id: AppView.SigintWarRoom, name: 'War Room', icon: '🚨', color: 'bg-red-700' },
    { id: AppView.SteganoLab, name: 'Stegano', icon: '📂', color: 'bg-teal-600' },
    { id: AppView.AcousticForensics, name: 'Acoustic', icon: '📉', color: 'bg-indigo-700' },
    { id: AppView.MetadataScrubber, name: 'Scrubber', icon: '🧹', color: 'bg-green-700' },
    { id: AppView.SubnetScanner, name: 'Subnet', icon: '🌐', color: 'bg-blue-700' },
    { id: AppView.SignalInterference, name: 'Interference', icon: '⚡', color: 'bg-yellow-700' },
    { id: AppView.USBHardwareAudit, name: 'USB Audit', icon: '🔌', color: 'bg-blue-800' },
    { id: AppView.BatteryForensics, name: 'Battery', icon: '🔋', color: 'bg-green-800' },
    { id: AppView.GeoIntegrity, name: 'Geo Check', icon: '🌍', color: 'bg-blue-900' },
    { id: AppView.SeismicMonitor, name: 'Seismic', icon: '📉', color: 'bg-red-800' },
    { id: AppView.LightPulseDetector, name: 'Light Pulse', icon: '💡', color: 'bg-yellow-600' },
    { id: AppView.NetworkJitter, name: 'Jitter', icon: '📶', color: 'bg-indigo-800' },
    { id: AppView.ClipboardSanitizer, name: 'Clipboard', icon: '📋', color: 'bg-green-600' },
    { id: AppView.KeystrokeDynamics, name: 'Keystroke', icon: '⌨️', color: 'bg-indigo-600' },
    { id: AppView.WebRTCLeakAudit, name: 'WebRTC Leak', icon: '🌐', color: 'bg-red-600' },
    { id: AppView.ScreenIntegrity, name: 'Screen Integrity', icon: '🖥️', color: 'bg-orange-600' },
    { id: AppView.StoragePressure, name: 'Storage', icon: '🗄️', color: 'bg-blue-600' },
    { id: AppView.FontFingerprint, name: 'Font Finger', icon: '🔤', color: 'bg-purple-600' },
    { id: AppView.CanvasNoiseTest, name: 'Canvas Noise', icon: '🎨', color: 'bg-pink-600' },
    { id: AppView.PowerUserSettings, name: 'Configurações', icon: '⚙️', color: 'bg-gray-600' },
  ];

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-10">
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

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-blue-400 font-display tracking-tight">PAINEL DE CONTROLE SKYNET</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">Acesso rápido a todos os módulos de detecção e ferramentas de análise tática.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MODES.map((mode: ModeDetails) => (
          <button
            key={mode.id}
            onClick={() => onSelectView(mode.id)}
            className="group relative bg-gray-800 border border-gray-700 p-6 rounded-2xl hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] text-left flex flex-col items-start space-y-4"
          >
            <div className="text-4xl p-3 bg-gray-900 rounded-xl group-hover:scale-110 transition-transform duration-300">
              {mode.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors">{mode.name}</h3>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{mode.description}</p>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-10 border-t border-gray-800">
        <h3 className="text-2xl font-bold text-gray-100 mb-6 font-display">AÇÕES RÁPIDAS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onSelectView(AppView.BlueScan)}
            className="flex items-center p-6 bg-blue-600/10 border border-blue-500/30 rounded-2xl hover:bg-blue-600/20 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-blue-400">Varredura Rápida</h4>
              <p className="text-xs text-gray-400">Iniciar análise BlueScan imediata</p>
            </div>
          </button>

          <button
            onClick={() => onSelectView(AppView.HistoryLog)}
            className="flex items-center p-6 bg-yellow-600/10 border border-yellow-500/30 rounded-2xl hover:bg-yellow-600/20 transition-all group"
          >
            <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📜</span>
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-yellow-400">Ver Histórico</h4>
              <p className="text-xs text-gray-400">Acessar logs de detecção passados</p>
            </div>
          </button>

          <button
            onClick={() => onSelectView(AppView.PowerUserSettings)}
            className="flex items-center p-6 bg-gray-600/10 border border-gray-500/30 rounded-2xl hover:bg-gray-600/20 transition-all group"
          >
            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">⚙️</span>
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-gray-400">Configurações</h4>
              <p className="text-xs text-gray-400">Ajustar parâmetros do sistema</p>
            </div>
          </button>

          <button
            onClick={() => onSelectView(AppView.SensorManager)}
            className="flex items-center p-6 bg-purple-600/10 border border-purple-500/30 rounded-2xl hover:bg-purple-600/20 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🛠️</span>
            </div>
            <div className="text-left">
              <h4 className="text-lg font-bold text-purple-400">Gerenciar Sensores</h4>
              <p className="text-xs text-gray-400">Status real de todo o hardware</p>
            </div>
          </button>
        </div>
      </div>

      <div className="pt-10 border-t border-gray-800">
        <h3 className="text-2xl font-bold text-gray-100 mb-6 font-display">FERRAMENTAS DO SISTEMA</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {commonLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSelectView(link.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl ${link.color} bg-opacity-20 border border-transparent hover:border-white/20 transition-all duration-200 hover:-translate-y-1`}
            >
              <span className="text-3xl mb-2">{link.icon}</span>
              <span className="text-sm font-semibold text-gray-200">{link.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-blue-400">STATUS DO SISTEMA: OPERACIONAL</h4>
            <p className="text-sm text-gray-400">Todos os sensores estão calibrados e prontos para varredura.</p>
          </div>
        </div>
        <button 
          onClick={() => onSelectView(AppView.BlueScan)}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-lg shadow-blue-900/40"
        >
          INICIAR VARREDURA RÁPIDA
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
