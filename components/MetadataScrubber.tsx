import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Trash2, Download, FileImage, AlertCircle, Info, Eye } from 'lucide-react';
import EXIF from 'exif-js';

interface ImageMetadata {
  [key: string]: any;
}

const MetadataScrubber: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbedImage, setScrubbedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImage(dataUrl);
        setScrubbedImage(null);
        
        // Extract Metadata
        const img = new Image();
        img.onload = () => {
          EXIF.getData(img as any, function(this: any) {
            const allMetadata = EXIF.getAllTags(this);
            setMetadata(Object.keys(allMetadata).length > 0 ? allMetadata : null);
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const scrubMetadata = () => {
    if (!image) return;
    setIsScrubbing(true);

    // To scrub metadata in the browser, we draw the image to a canvas and export it back.
    // The canvas export (toDataURL/toBlob) does not include EXIF/metadata from the original image.
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setScrubbedImage(cleanDataUrl);
      }
      setIsScrubbing(false);
    };
    img.src = image;
  };

  const downloadImage = () => {
    if (!scrubbedImage) return;
    const link = document.createElement('a');
    link.href = scrubbedImage;
    link.download = 'scrubbed_image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white font-display tracking-tight uppercase italic">Metadata Scrubber</h1>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">Privacy-First Image Sanitization & EXIF Removal</p>
        </div>
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Local Processing Only</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-square bg-gray-900 rounded-3xl border-2 border-dashed border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group"
          >
            {image ? (
              <img src={image} alt="Source" className="w-full h-full object-contain" />
            ) : (
              <>
                <FileImage className="w-16 h-16 text-gray-700 mb-4 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Upload Image to Analyze</p>
                <p className="text-[10px] text-gray-600 mt-2 font-mono">JPG, PNG, WEBP Supported</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <div className="flex gap-4">
            <button 
              onClick={scrubMetadata}
              disabled={!image || isScrubbing}
              className="flex-grow py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isScrubbing ? 'Sanitizing...' : 'Scrub Metadata'}
            </button>
            {scrubbedImage && (
              <button 
                onClick={downloadImage}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 space-y-6 h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-2xl text-white">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">EXIF Data Audit</h3>
                <p className="text-[10px] text-purple-400 font-mono uppercase">Hidden Information Leakage</p>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
              {metadata ? (
                Object.entries(metadata).map(([key, val], i) => (
                  <div key={i} className="p-3 bg-black/40 rounded-xl border border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{key}</span>
                    <span className="text-[10px] font-mono text-blue-400 truncate max-w-[200px]">{String(val)}</span>
                  </div>
                ))
              ) : image ? (
                <div className="p-12 text-center bg-black/20 rounded-2xl border border-dashed border-gray-800">
                  <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-4" />
                  <p className="text-xs text-gray-500 uppercase font-bold">No Metadata Detected</p>
                  <p className="text-[10px] text-gray-600 mt-2">Esta imagem parece estar limpa ou os metadados já foram removidos.</p>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-700 italic text-sm">
                  Upload an image to start the audit
                </div>
              )}
            </div>

            <div className="p-5 bg-red-900/10 border border-red-500/20 rounded-3xl flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
              <p className="text-[10px] text-red-300 leading-relaxed">
                <strong>Aviso de Segurança:</strong> Imagens capturadas por smartphones geralmente contêm coordenadas GPS exatas, modelo do dispositivo e data/hora. O "Scrubbing" remove permanentemente essas informações recriando a imagem bit-a-bit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataScrubber;
