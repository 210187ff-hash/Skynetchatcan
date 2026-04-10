import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { FileSearch, Upload, ShieldAlert, CheckCircle, Info, Layers, Binary, RefreshCw } from 'lucide-react';
import EXIF from 'exif-js';

const SteganoLab: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [lsbPlane, setLsbPlane] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{ label: string, status: 'clean' | 'suspicious', val: string }[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setLsbPlane(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setResults(null);
      };
      reader.readAsDataURL(uploadedFile);
    }
  };

  const generateLSBPlane = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Extract LSB of each channel and amplify it (0 -> 0, 1 -> 255)
      const r = (data[i] & 1) * 255;
      const g = (data[i + 1] & 1) * 255;
      const b = (data[i + 2] & 1) * 255;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255; // Alpha
    }
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      return tempCanvas.toDataURL();
    }
    return null;
  };

  const analyzeImage = async () => {
    if (!file || !image) return;
    setIsAnalyzing(true);
    
    const analysisResults: { label: string, status: 'clean' | 'suspicious', val: string }[] = [];

    try {
      // 1. Metadata Audit (Real EXIF)
      const exifData = await new Promise<any>((resolve) => {
        EXIF.getData(file as any, function(this: any) {
          resolve(EXIF.getAllTags(this));
        });
      });

      const hasGPS = exifData && (exifData.GPSLatitude || exifData.GPSLongitude);
      analysisResults.push({
        label: 'Metadata Audit',
        status: hasGPS ? 'suspicious' : 'clean',
        val: hasGPS 
          ? `Coordenadas GPS encontradas: ${exifData.GPSLatitudeRef} ${exifData.GPSLatitude}, ${exifData.GPSLongitudeRef} ${exifData.GPSLongitude}.`
          : 'Nenhum dado de localização sensível encontrado nos metadados EXIF.'
      });

      // 2. Binary Strings Scan (Real)
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let suspiciousStrings = 0;
      const keywords = ['password', 'secret', 'hidden', 'key', 'flag', 'stego'];
      
      const text = new TextDecoder().decode(bytes.slice(0, 10000)); // Scan first 10KB
      keywords.forEach(word => {
        if (text.toLowerCase().includes(word)) suspiciousStrings++;
      });

      analysisResults.push({
        label: 'Binary Scan',
        status: suspiciousStrings > 0 ? 'suspicious' : 'clean',
        val: suspiciousStrings > 0 
          ? `Detectadas ${suspiciousStrings} palavras-chave suspeitas no cabeçalho binário.`
          : 'Nenhum padrão de texto suspeito encontrado nos primeiros 10KB do arquivo.'
      });

      // 3. LSB Analysis (Enhanced Pixel Check)
      const img = new Image();
      img.src = image;
      await new Promise(resolve => img.onload = resolve);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Generate Visual LSB Plane
        const plane = generateLSBPlane(ctx, canvas.width, canvas.height);
        setLsbPlane(plane);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        let rLsb = 0, gLsb = 0, bLsb = 0;
        const totalPixels = pixels.length / 4;
        
        for (let i = 0; i < pixels.length; i += 4) {
          rLsb += (pixels[i] & 1);
          gLsb += (pixels[i+1] & 1);
          bLsb += (pixels[i+2] & 1);
        }
        
        const rProb = rLsb / totalPixels;
        const gProb = gLsb / totalPixels;
        const bProb = bLsb / totalPixels;
        
        // Variance of Bernoulli is p(1-p). Max is 0.25 at p=0.5 (perfect randomness)
        const rVar = rProb * (1 - rProb);
        const gVar = gProb * (1 - gProb);
        const bVar = bProb * (1 - bProb);
        const avgVar = (rVar + gVar + bVar) / 3;
        
        // Natural images usually have LSBs that correlate with higher bits, 
        // leading to a bias (p != 0.5). Hidden data (encrypted/compressed) looks like noise (p=0.5).
        const isSuspicious = avgVar > 0.248; // Extremely high variance/entropy

        analysisResults.push({
          label: 'LSB Variance',
          status: isSuspicious ? 'suspicious' : 'clean',
          val: isSuspicious 
            ? `Variância LSB crítica detectada (${(avgVar * 100).toFixed(2)}%). O ruído nos bits inferiores é indistinguível de dados criptografados.`
            : `Variância LSB normal (${(avgVar * 100).toFixed(2)}%). A distribuição de bits segue padrões naturais de imagem.`
        });
      }

      // 4. File Structure (Real)
      const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      
      let structureVal = 'Estrutura de arquivo padrão detectada.';
      let structureStatus: 'clean' | 'suspicious' = 'clean';

      if (isJpeg) {
        // Check for data after EOI (0xFF 0xD9)
        let eoiIndex = -1;
        for (let i = bytes.length - 2; i > 0; i--) {
          if (bytes[i] === 0xFF && bytes[i+1] === 0xD9) {
            eoiIndex = i;
            break;
          }
        }
        if (eoiIndex !== -1 && eoiIndex < bytes.length - 10) {
          structureStatus = 'suspicious';
          structureVal = `Detectados ${bytes.length - eoiIndex - 2} bytes de dados após o marcador de fim de imagem (EOF).`;
        }
      }

      analysisResults.push({
        label: 'EOF Integrity',
        status: structureStatus,
        val: structureVal
      });

    } catch (err) {
      console.error('Analysis error:', err);
      analysisResults.push({
        label: 'System Error',
        status: 'critical' as any,
        val: 'Falha ao processar arquivo para análise forense.'
      });
    }
    
    setResults(analysisResults);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Stegano Lab</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Digital Steganography & Forensic Image Analysis</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-widest text-xs rounded-xl border border-gray-700 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </button>
          {image && (
            <button 
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              {isAnalyzing ? 'Analyzing...' : 'Run Forensic Scan'}
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="relative bg-black rounded-3xl border border-gray-800 overflow-hidden aspect-square shadow-2xl flex items-center justify-center group">
            {image ? (
              <>
                <img src={lsbPlane || image} alt="Target" className="w-full h-full object-contain transition-all duration-500" />
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 border-[20px] border-blue-500/20"></div>
                  <div className="w-full h-1 bg-blue-500/40 absolute top-1/2 animate-scan"></div>
                </div>
                {lsbPlane && (
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">LSB Bit Plane View</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4 p-12">
                <div className="w-20 h-20 bg-gray-900 rounded-3xl border border-gray-800 flex items-center justify-center mx-auto">
                  <Layers className="w-10 h-10 text-gray-700" />
                </div>
                <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">No Image Loaded for Analysis</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex gap-4">
            <Info className="w-6 h-6 text-blue-400 shrink-0" />
            <div className="space-y-2">
              <p className="text-[10px] text-blue-300 leading-relaxed">
                <strong>O que é Esteganografia?</strong> É a técnica de esconder informações dentro de outros arquivos (como imagens ou áudios) de forma que não sejam percebidas a olho nu.
              </p>
              <p className="text-[10px] text-blue-300/60 leading-relaxed italic">
                A análise LSB foca nos bits menos significativos. Se esses bits forem aleatórios (alta variância), há uma forte probabilidade de dados criptografados estarem ocultos ali.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAnalyzing ? (
            <div className="bg-gray-900 rounded-3xl border border-gray-800 p-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs">Deep Binary Scan</p>
                <p className="text-[10px] text-gray-500 font-mono">Analyzing bit-level variance...</p>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Binary className="w-4 h-4 text-blue-400" />
                Forensic Report
              </h3>
              <div className="space-y-3">
                {results.map((res, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-2xl border ${
                      res.status === 'clean' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-white uppercase">{res.label}</span>
                      {res.status === 'clean' ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{res.val}</p>
                  </motion.div>
                ))}
              </div>
              <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
                <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Conclusion</p>
                <p className="text-xs text-white font-bold">
                  {results.some(r => r.status === 'suspicious') 
                    ? '⚠️ Possível ocultação de dados detectada. Recomenda-se análise manual do binário.' 
                    : '✅ Nenhuma evidência óbvia de esteganografia encontrada.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-12 text-center">
              <p className="text-gray-600 text-xs italic">Aguardando upload de imagem para iniciar auditoria forense...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SteganoLab;
