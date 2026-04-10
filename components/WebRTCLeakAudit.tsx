import React, { useState, useEffect } from 'react';
import { ShieldAlert, Globe, ShieldCheck, RefreshCw, Info, Zap, Lock } from 'lucide-react';

interface IPInfo {
  ip: string;
  type: 'Local' | 'Public' | 'VPN/Proxy';
}

const WebRTCLeakAudit: React.FC = () => {
  const [ips, setIps] = useState<IPInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanForLeaks = async () => {
    setIsScanning(true);
    setError(null);
    setIps([]);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          if (ips.length === 0) {
            // If no candidates found, might be blocked by extension
          }
          return;
        }

        const candidate = ice.candidate.candidate;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}))/g;
        const foundIps = candidate.match(ipRegex);

        if (foundIps) {
          foundIps.forEach(ip => {
            setIps(prev => {
              if (prev.find(item => item.ip === ip)) return prev;
              const type = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') ? 'Local' : 'Public';
              return [...prev, { ip, type }];
            });
          });
        }
      };

      // Timeout to stop scanning
      setTimeout(() => {
        pc.close();
        setIsScanning(false);
      }, 5000);

    } catch (err) {
      setError('WebRTC não suportado ou bloqueado pelo navegador.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanForLeaks();
  }, []);

  const hasPublicLeak = ips.some(item => item.type === 'Public');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Globe className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">WebRTC Leak Audit</h2>
              <p className="text-xs text-gray-400 font-mono">Detecção de vazamento de IP real através de STUN/ICE</p>
            </div>
          </div>
          <button 
            onClick={scanForLeaks}
            disabled={isScanning}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Leaks
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {ips.length === 0 && !isScanning ? (
            <div className="p-8 bg-green-900/20 border border-green-500/30 rounded-2xl flex items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-green-500" />
              <div>
                <h4 className="font-bold text-green-400 uppercase text-sm tracking-tight">Nenhum vazamento detectado</h4>
                <p className="text-xs text-green-500/80 font-mono">Seu navegador está bloqueando solicitações WebRTC STUN com sucesso.</p>
              </div>
            </div>
          ) : (
            ips.map((item, i) => (
              <div key={i} className="p-5 bg-black/40 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-red-500/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'Public' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                    {item.type === 'Public' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <Lock className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-white text-lg">{item.ip}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${item.type === 'Public' ? 'text-red-400' : 'text-blue-400'}`}>
                      Endereço {item.type} Detectado
                    </p>
                  </div>
                </div>
                {item.type === 'Public' && (
                  <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] text-red-400 font-bold uppercase animate-pulse">
                    Vazamento Crítico
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`p-6 rounded-3xl border transition-all ${hasPublicLeak ? 'bg-red-900/20 border-red-500/50' : 'bg-blue-900/10 border-blue-500/20'}`}>
        <div className="flex items-start gap-4">
          <Zap className={`w-6 h-6 shrink-0 ${hasPublicLeak ? 'text-red-400' : 'text-blue-400'}`} />
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Análise de Privacidade WebRTC</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              O protocolo WebRTC é usado para comunicações em tempo real, mas pode ser explorado por sites para descobrir seu endereço IP real, mesmo que você esteja usando uma VPN. Se o seu IP público aparecer na lista acima enquanto você usa uma VPN, sua identidade está exposta.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-3xl flex gap-4">
        <Info className="w-6 h-6 text-gray-500 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed font-mono">
          <strong>Nota Técnica:</strong> Este teste utiliza servidores STUN do Google para forçar o navegador a gerar candidatos ICE. Se nenhum IP aparecer, seu navegador possui proteções nativas ou extensões (como uBlock Origin) ativas.
        </p>
      </div>
    </div>
  );
};

export default WebRTCLeakAudit;
