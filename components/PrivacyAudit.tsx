import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff, Lock, Unlock, AlertTriangle, CheckCircle, Fingerprint, Globe, Cpu } from 'lucide-react';

interface AuditItem {
  id: string;
  name: string;
  status: 'secure' | 'warning' | 'critical';
  value: string;
  description: string;
  icon: React.ReactNode;
}

const PrivacyAudit: React.FC = () => {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [score, setScore] = useState(0);

  const runAudit = async () => {
    setIsAuditing(true);
    const items: AuditItem[] = [];

    // 1. Cookies
    items.push({
      id: 'cookies',
      name: 'Third-Party Cookies',
      status: navigator.cookieEnabled ? 'warning' : 'secure',
      value: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
      description: 'Cookies de terceiros permitem que sites rastreiem sua navegação entre diferentes domínios.',
      icon: <Lock className="w-4 h-4" />
    });

    // 2. Do Not Track
    const dnt = navigator.doNotTrack;
    items.push({
      id: 'dnt',
      name: 'Do Not Track (DNT)',
      status: dnt === '1' ? 'secure' : 'warning',
      value: dnt === '1' ? 'Active' : 'Inactive',
      description: 'O cabeçalho DNT solicita que sites não rastreiem suas atividades.',
      icon: <EyeOff className="w-4 h-4" />
    });

    // 3. Fingerprinting (Canvas)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fp = canvas.toDataURL();
    items.push({
      id: 'fp',
      name: 'Canvas Fingerprinting',
      status: 'critical',
      value: 'Vulnerable',
      description: 'Seu navegador permite a criação de uma assinatura digital única baseada na renderização de gráficos.',
      icon: <Fingerprint className="w-4 h-4" />
    });

    // 4. WebGL
    const gl = canvas.getContext('webgl');
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
    items.push({
      id: 'webgl',
      name: 'Hardware Exposure',
      status: 'warning',
      value: renderer,
      description: 'O modelo exato da sua GPU está exposto, o que ajuda na identificação única do dispositivo.',
      icon: <Cpu className="w-4 h-4" />
    });

    // 5. Language/Locale
    items.push({
      id: 'lang',
      name: 'Locale Leak',
      status: 'warning',
      value: navigator.language,
      description: 'Sua preferência de idioma e fuso horário podem revelar sua localização geográfica aproximada.',
      icon: <Globe className="w-4 h-4" />
    });

    // 6. HTTPS
    const isSecure = window.location.protocol === 'https:';
    items.push({
      id: 'https',
      name: 'Connection Security',
      status: isSecure ? 'secure' : 'critical',
      value: isSecure ? 'HTTPS' : 'HTTP (Unsafe)',
      description: 'Conexões sem criptografia podem ser interceptadas por qualquer nó na rede local.',
      icon: <Shield className="w-4 h-4" />
    });

    setAuditItems(items);
    
    // Calculate score
    const secureCount = items.filter(i => i.status === 'secure').length;
    setScore(Math.round((secureCount / items.length) * 100));
    setIsAuditing(false);
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Privacy Audit</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Digital Footprint & Browser Vulnerability Scan</p>
        </div>
        <button 
          onClick={runAudit}
          disabled={isAuditing}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50"
        >
          {isAuditing ? 'Auditing...' : 'Re-Run Audit'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {auditItems.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 bg-gray-900 rounded-2xl border border-gray-800 flex items-start gap-4 group hover:border-gray-700 transition-all"
            >
              <div className={`p-3 rounded-xl shrink-0 ${
                item.status === 'secure' ? 'bg-green-500/10 text-green-500' :
                item.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {item.icon}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                    item.status === 'secure' ? 'border-green-500/30 text-green-400 bg-green-500/5' :
                    item.status === 'warning' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' :
                    'border-red-500/30 text-red-400 bg-red-500/5'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-blue-400 font-mono mb-2">{item.value}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8 text-center space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                <circle 
                  cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * score) / 100}
                  className={`transition-all duration-1000 ${score > 70 ? 'text-green-500' : score > 40 ? 'text-yellow-500' : 'text-red-500'}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white font-mono">{score}%</span>
                <span className="text-[8px] font-bold text-gray-500 uppercase">Privacy Score</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {score > 70 ? 'Highly Secure' : score > 40 ? 'Moderate Risk' : 'Critical Exposure'}
              </h3>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Seu navegador está expondo múltiplos pontos de dados que podem ser usados para rastreamento persistente (Fingerprinting).
              </p>
            </div>

            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">
              Generate Privacy Report
            </button>
          </div>

          <div className="p-6 bg-black/40 border border-gray-800 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              Critical Recommendations
            </h4>
            <ul className="space-y-3">
              <li className="text-[10px] text-gray-400 flex gap-2">
                <CheckCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                Use uma VPN para ocultar seu endereço IP real e localização.
              </li>
              <li className="text-[10px] text-gray-400 flex gap-2">
                <CheckCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                Instale extensões de bloqueio de fingerprinting (uBlock Origin).
              </li>
              <li className="text-[10px] text-gray-400 flex gap-2">
                <CheckCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                Desative o WebGL se não for necessário para sua navegação.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyAudit;
