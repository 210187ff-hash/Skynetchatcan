import React, { useState, useEffect } from 'react';
import { Clipboard, ShieldCheck, ShieldAlert, Trash2, Info, Zap, Lock } from 'lucide-react';

const ClipboardSanitizer: React.FC = () => {
  const [clipboardContent, setClipboardContent] = useState<string>('');
  const [isSanitized, setIsSanitized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardContent(text);
      setIsSanitized(false);
      setError(null);
    } catch (err) {
      setError('Permissão para ler área de transferência negada.');
    }
  };

  const sanitizeClipboard = async () => {
    try {
      await navigator.clipboard.writeText('');
      setClipboardContent('');
      setIsSanitized(true);
      setError(null);
    } catch (err) {
      setError('Erro ao limpar área de transferência.');
    }
  };

  useEffect(() => {
    // Initial read
    readClipboard();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <Clipboard className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Clipboard Sanitizer</h2>
              <p className="text-xs text-gray-400 font-mono">Monitoramento e limpeza de dados sensíveis na memória temporária</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={readClipboard}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
            >
              Ler Atual
            </button>
            <button 
              onClick={sanitizeClipboard}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Scrub Clipboard
            </button>
          </div>
        </div>

        <div className="p-6 bg-black/40 rounded-2xl border border-gray-800 min-h-[150px] flex flex-col">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-3 tracking-widest">Conteúdo Detectado</p>
          {clipboardContent ? (
            <div className="flex-1 font-mono text-sm text-blue-400 break-all bg-black/20 p-4 rounded-xl border border-gray-800/50">
              {clipboardContent.length > 500 ? `${clipboardContent.substring(0, 500)}... [TRUNCATED]` : clipboardContent}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Lock className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-xs text-gray-600 font-mono">Área de transferência vazia ou protegida.</p>
            </div>
          )}
        </div>
      </div>

      {isSanitized && (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-2xl flex items-center gap-3 text-green-400 text-sm animate-in slide-in-from-top-2">
          <ShieldCheck className="w-5 h-5" />
          Memória temporária limpa com sucesso. Nenhum dado sensível remanescente.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Protocolo de Higiene de Dados</h3>
        </div>
        <p className="text-xs text-blue-300 leading-relaxed">
          Muitos spywares e aplicativos maliciosos monitoram silenciosamente a área de transferência para capturar senhas, chaves privadas de criptomoedas e informações pessoais. O Clipboard Sanitizer permite que você visualize o que está exposto e limpe a memória do sistema com um único clique, garantindo que nenhum dado sensível seja deixado para trás.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-blue-400/80 italic">
          <Info className="w-3 h-3" />
          Dica: Use o "Scrub Clipboard" sempre que terminar de copiar uma senha ou dado crítico.
        </div>
      </div>
    </div>
  );
};

export default ClipboardSanitizer;
