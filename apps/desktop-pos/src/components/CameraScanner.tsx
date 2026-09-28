import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('reader');

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Forzar cámara trasera siempre
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(console.error);
            }
          },
          () => {} // Ignorar advertencias por frame
        );
      } catch (err) {
        console.error(err);
        setError('No se pudo iniciar la cámara. Revisa los permisos o asegúrate de que otra app no la esté usando.');
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Escanear Código</h2>
            <p className="text-xs text-slate-400">Centra el código de barras en la cámara</p>
          </div>
        </div>

        <div className="bg-black rounded-xl overflow-hidden min-h-[300px] border border-slate-800 relative flex items-center justify-center">
          {error ? (
            <div className="p-4 text-center text-red-400 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div id="reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full border-none"></div>
          )}
        </div>
      </div>
    </div>
  );
}
