import React, { useState, useEffect } from 'react';
import { Type, ShieldAlert, ShieldCheck, RefreshCw, Info, Zap, Search } from 'lucide-react';

const FontFingerprint: React.FC = () => {
  const [detectedFonts, setDetectedFonts] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [uniquenessScore, setUniquenessScore] = useState(0);

  const fontList = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Impact',
    'Helvetica', 'Calibri', 'Cambria', 'Consolas', 'Segoe UI', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'JetBrains Mono', 'Fira Code', 'Ubuntu', 'Droid Sans', 'Apple Color Emoji', 'Segoe UI Emoji'
  ];

  const scanFonts = async () => {
    setIsScanning(true);
    const detected: string[] = [];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
      context.font = '72px monospace';
      const baselineWidth = context.measureText(text).width;

      fontList.forEach(font => {
        context.font = `72px "${font}", monospace`;
        const width = context.measureText(text).width;
        if (width !== baselineWidth) {
          detected.push(font);
        }
      });
    }

    setDetectedFonts(detected);
    // Rough score: more fonts = more unique
    setUniquenessScore(Math.min(100, (detected.length / fontList.length) * 100));
    setIsScanning(false);
  };

  useEffect(() => {
    scanFonts();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <Type className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Font Fingerprint Audit</h2>
              <p className="text-xs text-gray-400 font-mono">Mapeamento de fontes instaladas e assinatura de anonimato</p>
            </div>
          </div>
          <button 
            onClick={scanFonts}
            disabled={isScanning}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Re-Scan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase mb-4 tracking-widest">Fontes Detectadas</h3>
            <div className="flex flex-wrap gap-2">
              {detectedFonts.map((font, i) => (
                <span key={i} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[10px] text-purple-400 font-mono">
                  {font}
                </span>
              ))}
              {detectedFonts.length === 0 && <p className="text-xs text-gray-600 italic">Nenhuma fonte adicional detectada.</p>}
            </div>
          </div>

          <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Índice de Rastreabilidade</p>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-800"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * uniquenessScore) / 100}
                  className="text-purple-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{uniquenessScore.toFixed(0)}%</span>
                <span className="text-[8px] text-gray-500 uppercase">Único</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border transition-all ${uniquenessScore > 70 ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
        <div className="flex items-start gap-4">
          {uniquenessScore > 70 ? <ShieldAlert className="w-6 h-6 text-red-400" /> : <ShieldCheck className="w-6 h-6 text-green-400" />}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-tight">
              {uniquenessScore > 70 ? 'Alta Rastreabilidade Detectada' : 'Anonimato Preservado'}
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              {uniquenessScore > 70 
                ? 'Sua configuração de fontes é muito específica. Isso permite que sites te identifiquem de forma única através de "Font Fingerprinting", mesmo se você usar o modo anônimo ou limpar seus cookies.'
                : 'Sua lista de fontes é comum e genérica. Você se mistura bem na multidão de usuários, dificultando o rastreamento individual.'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">O que é Font Fingerprinting?</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Cada sistema operacional e usuário tem um conjunto diferente de fontes instaladas. Ao medir o tamanho exato de strings de texto renderizadas com diferentes fontes, um site pode criar um identificador único (fingerprint) do seu dispositivo. O SKYNETchat mapeia essas fontes para te mostrar quão exposto você está.
        </p>
      </div>
    </div>
  );
};

export default FontFingerprint;
