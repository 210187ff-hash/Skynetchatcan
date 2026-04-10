import React, { useState, useEffect } from 'react';
import { Palette, ShieldAlert, ShieldCheck, RefreshCw, Info, Zap, Image as ImageIcon } from 'lucide-react';

const CanvasNoiseTest: React.FC = () => {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasNoise, setHasNoise] = useState(false);

  const generateFingerprint = () => {
    setIsScanning(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 50;

    // Text with shadowing
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("SKYNETchat Spy Detector", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("SKYNETchat Spy Detector", 4, 17);

    const dataUrl = canvas.toDataURL();
    setFingerprint(dataUrl);

    // To detect noise, we would ideally compare with a known clean render,
    // but a simple check is to see if the data changes on multiple renders
    // or if the browser is known to inject noise (like Brave or Firefox with protection)
    
    const canvas2 = document.createElement('canvas');
    const ctx2 = canvas2.getContext('2d');
    if (ctx2) {
      canvas2.width = 200;
      canvas2.height = 50;
      ctx2.textBaseline = "top";
      ctx2.font = "14px 'Arial'";
      ctx2.textBaseline = "alphabetic";
      ctx2.fillStyle = "#f60";
      ctx2.fillRect(125, 1, 62, 20);
      ctx2.fillStyle = "#069";
      ctx2.fillText("SKYNETchat Spy Detector", 2, 15);
      ctx2.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx2.fillText("SKYNETchat Spy Detector", 4, 17);
      
      const dataUrl2 = canvas2.toDataURL();
      if (dataUrl !== dataUrl2) {
        setHasNoise(true);
      }
    }

    setIsScanning(false);
  };

  useEffect(() => {
    generateFingerprint();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/10 rounded-2xl">
              <Palette className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Canvas Noise Injection Test</h2>
              <p className="text-xs text-gray-400 font-mono">Verificação de proteção contra Canvas Fingerprinting</p>
            </div>
          </div>
          <button 
            onClick={generateFingerprint}
            disabled={isScanning}
            className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            Gerar Assinatura
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Renderização de Teste</h3>
            <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
              {fingerprint && <img src={fingerprint} alt="Canvas Fingerprint" className="max-w-full h-auto" />}
            </div>
            <p className="text-[10px] text-gray-500 font-mono break-all line-clamp-2">
              Hash: {fingerprint ? btoa(fingerprint).substring(0, 64) : 'N/A'}...
            </p>
          </div>

          <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center transition-all ${hasNoise ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
            {hasNoise ? (
              <>
                <ShieldCheck className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-lg font-black text-green-400 uppercase tracking-tight">Ruído Detectado</h3>
                <p className="text-xs text-green-500/80 font-mono mt-2">Seu navegador está injetando ruído aleatório no Canvas para proteger sua identidade.</p>
              </>
            ) : (
              <>
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
                <h3 className="text-lg font-black text-red-400 uppercase tracking-tight">Assinatura Estática</h3>
                <p className="text-xs text-red-500/80 font-mono mt-2">Nenhuma proteção detectada. Sua GPU gera uma assinatura única e rastreável.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">O que é Canvas Fingerprinting?</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Cada placa de vídeo (GPU) renderiza imagens e textos de forma ligeiramente diferente devido a variações no hardware e drivers. Sites usam o elemento <code>&lt;canvas&gt;</code> para desenhar formas complexas e ler os pixels resultantes, criando um identificador único do seu computador. Navegadores focados em privacidade injetam "ruído" (pequenas variações aleatórias) para que cada site veja uma assinatura diferente, invalidando o rastreamento.
        </p>
      </div>
    </div>
  );
};

export default CanvasNoiseTest;
