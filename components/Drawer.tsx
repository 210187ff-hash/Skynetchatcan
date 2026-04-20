import React from 'react';
import { AppView, ModeDetails } from '../types';
import { MODES } from '../constants';
import { 
  Home, Info, Activity, Settings, History, Wifi, Bluetooth, 
  Cpu, Volume2, Map, Shield, Eye, ShieldAlert, FolderSearch, 
  Mic2, Eraser, Globe, Zap, Usb, Battery, Globe2, Waves, 
  Lightbulb, Network, ClipboardCheck, Keyboard, GlobeLock, 
  Monitor, HardDrive, Type, Palette, LayoutDashboard,
  ChevronRight, X
} from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: AppView) => void;
  activeView: AppView;
}

interface NavItemProps {
  id: AppView;
  name: string;
  icon: any;
  color?: string;
  tooltip?: string;
  activeView: AppView;
  onSelect: (view: AppView) => void;
}

const NavItem: React.FC<NavItemProps> = ({ id, name, icon: Icon, color, tooltip, activeView, onSelect }) => (
  <button
    onClick={() => onSelect(id)}
    title={tooltip}
    className={`group flex items-center justify-between p-3 w-full text-left rounded-xl transition-all duration-300 
                ${activeView === id 
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                  : 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-100'}`}
  >
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg transition-colors ${activeView === id ? 'bg-white/20' : 'bg-gray-900 group-hover:bg-gray-800'}`}>
        <Icon className={`w-5 h-5 ${activeView === id ? 'text-white' : (color || 'text-blue-400')}`} />
      </div>
      <span className="font-bold text-xs uppercase tracking-widest">{name}</span>
    </div>
    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${activeView === id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
  </button>
);

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, onSelectView, activeView }) => {
  const navigationLinks = [
    { id: AppView.Dashboard, name: 'Painel de Controle', icon: LayoutDashboard, color: 'text-blue-400', tooltip: 'Visualizar resumo global do sistema e status dos sensores' },
    { id: AppView.Introduction, name: 'Introdução', icon: Info, color: 'text-gray-400', tooltip: 'Aprender como utilizar as ferramentas do SPYNET OS' },
    { id: AppView.Flowchart, name: 'Fluxograma SPYNET', icon: Activity, color: 'text-green-400', tooltip: 'Ver o algoritmo de decisão e fluxo de detecção' },
    { id: AppView.HistoryLog, name: 'Histórico', icon: History, color: 'text-yellow-400', tooltip: 'Acessar registros de varreduras e alertas anteriores' },
    { id: AppView.PowerUserSettings, name: 'Configurações', icon: Settings, color: 'text-purple-400', tooltip: 'Ajustar parâmetros avançados e sensibilidade dos sensores' },
  ];

  const detectionTools = [
    { id: AppView.WiFiAnalyzer, name: 'Wi-Fi Analyzer', icon: Wifi, tooltip: 'Analisar redes sem fio, canais e tráfego de pacotes' },
    { id: AppView.BluetoothSniffer, name: 'Bluetooth Sniffer', icon: Bluetooth, tooltip: 'Detectar e identificar dispositivos Bluetooth próximos' },
    { id: AppView.MagneticMapper, name: 'Magnetic Mapper', icon: Map, tooltip: 'Mapear campos eletromagnéticos e anomalias de hardware' },
    { id: AppView.UltrasonicDetector, name: 'Ultrasonic Detector', icon: Volume2, tooltip: 'Detectar frequências ultrassônicas usadas por beacons' },
    { id: AppView.OpticalScanner, name: 'Optical Scanner', icon: Eye, tooltip: 'Scanner visual para detecção de lentes de câmeras ocultas' },
    { id: AppView.SigintWarRoom, name: 'SIGINT War Room', icon: ShieldAlert, tooltip: 'Monitoramento de sinais de inteligência em tempo real' },
  ];

  const forensicTools = [
    { id: AppView.SteganoLab, name: 'Stegano Lab', icon: FolderSearch, tooltip: 'Analisar imagens em busca de dados ocultos via LSB' },
    { id: AppView.AcousticForensics, name: 'Acoustic Forensics', icon: Mic2, tooltip: 'Análise espectral de áudio para detecção de escutas' },
    { id: AppView.MetadataScrubber, name: 'Metadata Scrubber', icon: Eraser, tooltip: 'Remover metadados sensíveis e rastros de arquivos' },
    { id: AppView.PrivacyAudit, name: 'Privacy Audit', icon: Shield, tooltip: 'Auditoria de permissões e vazamentos de dados do sistema' },
    { id: AppView.SubnetScanner, name: 'Subnet Scanner', icon: Globe, tooltip: 'Varredura exaustiva de dispositivos na rede local' },
  ];

  const hardwareIntegrity = [
    { id: AppView.USBHardwareAudit, name: 'USB Hardware Audit', icon: Usb, tooltip: 'Detectar hardware USB malicioso e ataques BadUSB' },
    { id: AppView.BatteryForensics, name: 'Battery Forensics', icon: Battery, tooltip: 'Analisar consumo anômalo e integridade da bateria' },
    { id: AppView.GeoIntegrity, name: 'Geo Integrity', icon: Globe2, tooltip: 'Verificar spoofing de GPS e integridade de localização' },
    { id: AppView.SeismicMonitor, name: 'Seismic Monitor', icon: Waves, tooltip: 'Detectar vibrações e movimentos mecânicos suspeitos' },
    { id: AppView.LightPulseDetector, name: 'Light Pulse Detector', icon: Lightbulb, tooltip: 'Detectar pulsos de luz infravermelha de câmeras' },
    { id: AppView.SensorManager, name: 'Sensor Management', icon: Cpu, tooltip: 'Gerenciar e calibrar sensores de hardware do dispositivo' },
  ];

  const systemAudit = [
    { id: AppView.NetworkJitter, name: 'Network Jitter', icon: Network, tooltip: 'Analisar estabilidade e jitter da conexão de rede' },
    { id: AppView.ClipboardSanitizer, name: 'Clipboard Sanitizer', icon: ClipboardCheck, tooltip: 'Limpar dados sensíveis da área de transferência' },
    { id: AppView.KeystrokeDynamics, name: 'Keystroke Dynamics', icon: Keyboard, tooltip: 'Auditoria de padrões de digitação e biometria' },
    { id: AppView.WebRTCLeakAudit, name: 'WebRTC Leak Audit', icon: GlobeLock, tooltip: 'Verificar vazamentos de endereço IP via WebRTC' },
    { id: AppView.ScreenIntegrity, name: 'Screen Integrity', icon: Monitor, tooltip: 'Detectar captura de tela ou gravação não autorizada' },
    { id: AppView.StoragePressure, name: 'Storage Pressure', icon: HardDrive, tooltip: 'Monitorar integridade e pressão do armazenamento' },
    { id: AppView.FontFingerprint, name: 'Font Fingerprint', icon: Type, tooltip: 'Analisar rastreamento via fontes instaladas no sistema' },
    { id: AppView.CanvasNoiseTest, name: 'Canvas Noise Test', icon: Palette, tooltip: 'Testar ruído de renderização e fingerprinting de canvas' },
  ];

  const handleSelect = (view: AppView) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-500 ${isOpen ? 'visible' : 'invisible'}`}
    >
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>
      
      <nav className={`relative flex flex-col w-80 bg-gray-950 h-full border-r border-gray-800 shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tighter italic uppercase">SPYNET<span className="text-blue-500">OS</span></span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-white"
            title="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
          {/* Navigation Section */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-3">Navegação Principal</h3>
            <div className="space-y-1">
              {navigationLinks.map(link => (
                <NavItem key={link.id} id={link.id} name={link.name} icon={link.icon} color={link.color} tooltip={link.tooltip} activeView={activeView} onSelect={handleSelect} />
              ))}
            </div>
          </section>

          {/* Detection Modes Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Modos de Detecção</h3>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            </div>
            <div className="space-y-1">
              {MODES.map((mode: ModeDetails) => (
                <button
                  key={mode.id}
                  onClick={() => handleSelect(mode.id)}
                  title={mode.description}
                  className={`group flex items-center justify-between p-4 w-full text-left rounded-2xl transition-all duration-300 border
                              ${activeView === mode.id 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' 
                                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-100'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{mode.icon}</span>
                    <div>
                      <span className="font-black text-xs uppercase tracking-widest block">{mode.name}</span>
                      <span className={`text-[9px] block mt-0.5 ${activeView === mode.id ? 'text-blue-100' : 'text-gray-600'}`}>
                        Sensor Ativo
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${activeView === mode.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </button>
              ))}
              {detectionTools.map(tool => (
                <NavItem key={tool.id} id={tool.id} name={tool.name} icon={tool.icon} tooltip={tool.tooltip} activeView={activeView} onSelect={handleSelect} />
              ))}
            </div>
          </section>

          {/* Forensic Section */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-3">Análise Forense</h3>
            <div className="space-y-1">
              {forensicTools.map(tool => (
                <NavItem key={tool.id} id={tool.id} name={tool.name} icon={tool.icon} tooltip={tool.tooltip} activeView={activeView} onSelect={handleSelect} />
              ))}
            </div>
          </section>

          {/* Hardware Section */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-3">Integridade de Hardware</h3>
            <div className="space-y-1">
              {hardwareIntegrity.map(tool => (
                <NavItem key={tool.id} id={tool.id} name={tool.name} icon={tool.icon} tooltip={tool.tooltip} activeView={activeView} onSelect={handleSelect} />
              ))}
            </div>
          </section>

          {/* System Audit Section */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-3">Auditoria de Sistema</h3>
            <div className="space-y-1">
              {systemAudit.map(tool => (
                <NavItem key={tool.id} id={tool.id} name={tool.name} icon={tool.icon} tooltip={tool.tooltip} activeView={activeView} onSelect={handleSelect} />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">SKYNETchat</span>
              <span className="text-[8px] text-gray-600 uppercase font-mono">Build v2.4.0-STABLE</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>
          <p className="text-[8px] text-gray-700 uppercase tracking-tighter text-center">
            &copy; 2026 SKYNETchat. All rights reserved.
          </p>
        </div>
      </nav>
    </div>
  );
};

export default Drawer;
