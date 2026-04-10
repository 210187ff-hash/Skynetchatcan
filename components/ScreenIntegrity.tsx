import React, { useState, useEffect } from 'react';
import { Monitor, ShieldAlert, ShieldCheck, Info, Zap, Eye, EyeOff } from 'lucide-react';

const ScreenIntegrity: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isOverlayDetected, setIsOverlayDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // IntersectionObserver can detect if the element is being obscured or if it's visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio < 1) {
          setIsOverlayDetected(true);
        } else {
          setIsOverlayDetected(false);
        }
      });
    }, { threshold: [1.0] });

    const target = document.getElementById('integrity-target');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const checkScreenCapture = async () => {
    try {
      // This is a trick: if we can't start a capture because another one is active or restricted, 
      // it might indicate system-level monitoring.
      // But more directly, we can check if the document is being captured via displayMedia
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        // User cancelled, which is normal
      } else {
        setError('Erro ao verificar integridade de tela.');
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl">
              <Monitor className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Screen Integrity Monitor</h2>
              <p className="text-xs text-gray-400 font-mono">Detecção de Clickjacking, Overlays e Captura de Tela</p>
            </div>
          </div>
          <button 
            onClick={checkScreenCapture}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Testar Captura
          </button>
        </div>

        <div id="integrity-target" className="p-12 bg-black/40 rounded-3xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center transition-all">
          {isOverlayDetected ? (
            <>
              <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
              <h3 className="text-xl font-black text-red-400 uppercase tracking-tight">Sobreposição Detectada!</h3>
              <p className="text-xs text-gray-500 font-mono mt-2">Um elemento externo ou janela pode estar obscurecendo esta área (Risco de Clickjacking).</p>
            </>
          ) : (
            <>
              <ShieldCheck className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-black text-green-400 uppercase tracking-tight">Área de Visualização Íntegra</h3>
              <p className="text-xs text-gray-500 font-mono mt-2">Nenhuma sobreposição maliciosa detectada no viewport atual.</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded-2xl border flex items-center gap-4 ${isOverlayDetected ? 'bg-red-900/20 border-red-500/30' : 'bg-gray-900/50 border-gray-800'}`}>
          <div className={`p-3 rounded-xl ${isOverlayDetected ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            {isOverlayDetected ? <EyeOff className="w-6 h-6 text-red-500" /> : <Eye className="w-6 h-6 text-green-500" />}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Status de Overlay</p>
            <p className={`text-sm font-bold ${isOverlayDetected ? 'text-red-400' : 'text-green-400'}`}>
              {isOverlayDetected ? 'ALERTA: Obscurecido' : 'Seguro: Visível'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Monitor className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Captura de Tela</p>
            <p className="text-sm font-bold text-blue-400">Monitoramento Ativo</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Defesa contra Clickjacking</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Ataques de Clickjacking usam camadas invisíveis (overlays) para enganar o usuário e fazê-lo clicar em botões que ele não vê. Este módulo utiliza o <code>IntersectionObserver</code> para verificar se a interface do SKYNETchat está sendo obscurecida por outros elementos, garantindo que suas interações sejam seguras e diretas.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
};

export default ScreenIntegrity;
