import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Loader2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ImageUploaderProps {
  currentUrl?: string;
  bucket: string;
  customName?: string;
  label?: string;
  description?: string;
  onUploadSuccess: (newUrl: string) => void;
  onDeleteSuccess?: () => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

export default function ImageUploader({
  currentUrl,
  bucket,
  customName,
  label = 'Upload de Imagem',
  description = 'Formatos aceitos: PNG, JPG, JPEG, WEBP (Máx. 10MB)',
  onUploadSuccess,
  onDeleteSuccess,
  maxSizeMB = 10,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  className = ''
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal preview if currentUrl changes externally
  React.useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  // Convert File to WebP via Canvas if possible for optimization
  const convertToWebp = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimension 1200px for high quality + low size
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const webpData = canvas.toDataURL('image/webp', 0.88);
            resolve(webpData);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Erro ao processar imagem.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation 1: Size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setErrorMsg(`O arquivo excede o tamanho máximo de ${maxSizeMB} MB. (Tamanho do arquivo: ${fileSizeMB.toFixed(2)} MB)`);
      return;
    }

    // Validation 2: Format
    if (file.type && !acceptedFormats.includes(file.type.toLowerCase())) {
      setErrorMsg('Formato inválido. Por favor envie apenas PNG, JPG, JPEG ou WEBP.');
      return;
    }

    setUploading(true);
    setProgress(15);

    try {
      // 1. Process / Optimize
      const base64Data = await convertToWebp(file);
      setPreview(base64Data); // Instant preview!
      setProgress(60);

      let finalUrl = base64Data;

      // 2. Upload to Supabase Storage if available
      if (isSupabaseConfigured && supabase) {
        try {
          const rootBucket = bucket.split('/')[0] || 'stickers';
          const subFolder = bucket.includes('/') ? bucket.substring(bucket.indexOf('/') + 1) : '';
          const nameClean = (customName || file.name.split('.')[0]).replace(/[^a-zA-Z0-9_-]/g, '_');
          const fileName = `${nameClean}_${Date.now()}.webp`;
          const filePath = subFolder ? `${subFolder}/${fileName}` : fileName;

          // Convert base64 data to Blob
          const resBlob = await fetch(base64Data);
          const blob = await resBlob.blob();

          let uploadRes = await supabase.storage
            .from(rootBucket)
            .upload(filePath, blob, {
              contentType: 'image/webp',
              upsert: true
            });

          // Fallback to 'stickers' bucket if custom bucket fails or is missing
          if (uploadRes.error && rootBucket !== 'stickers') {
            console.warn(`Bucket '${rootBucket}' upload warning: ${uploadRes.error.message}. Retrying with 'stickers' bucket fallback...`);
            uploadRes = await supabase.storage
              .from('stickers')
              .upload(filePath, blob, {
                contentType: 'image/webp',
                upsert: true
              });

            if (!uploadRes.error && uploadRes.data) {
              const { data: publicUrlData } = supabase.storage
                .from('stickers')
                .getPublicUrl(filePath);

              if (publicUrlData && publicUrlData.publicUrl) {
                finalUrl = publicUrlData.publicUrl;
              }
            }
          } else if (!uploadRes.error && uploadRes.data) {
            const { data: publicUrlData } = supabase.storage
              .from(rootBucket)
              .getPublicUrl(filePath);

            if (publicUrlData && publicUrlData.publicUrl) {
              finalUrl = publicUrlData.publicUrl;
            }
          } else if (uploadRes.error) {
            console.warn('Supabase storage upload fallback to optimized Base64 data:', uploadRes.error.message);
          }
        } catch (stgErr) {
          console.warn('Supabase storage exception fallback:', stgErr);
        }
      }

      setProgress(100);
      setPreview(finalUrl);
      setSuccessMsg('Imagem pronta e salva com sucesso!');
      onUploadSuccess(finalUrl);
    } catch (err: any) {
      setErrorMsg('Erro no envio da imagem: ' + err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    setPreview(null);
    setSuccessMsg('Imagem removida.');
    if (onDeleteSuccess) onDeleteSuccess();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
          {label}
        </label>
      )}

      {/* DRAG & DROP CONTAINER */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all text-center cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-brand-blue bg-brand-blue/10 scale-[1.01]'
            : preview
            ? 'border-white/20 bg-brand-dark/80 hover:border-brand-blue/50'
            : 'border-white/10 bg-brand-dark/40 hover:bg-brand-dark hover:border-white/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          /* PREVIEW MODE */
          <div className="relative group flex flex-col items-center justify-center space-y-3">
            <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-2 shadow-inner">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-white text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-blue-glow mb-1" />
                  <span>Enviando...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-brand-blue/20 hover:bg-brand-blue text-brand-blue-glow hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider border border-brand-blue/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Substituir
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-mono uppercase tracking-wider border border-red-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </div>
        ) : (
          /* EMPTY UPLOAD PLACEHOLDER */
          <div className="py-6 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-brand-blue-glow">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-brand-blue-glow" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-white">
                <span className="text-brand-blue-glow hover:underline">Clique para selecionar</span> ou arraste o arquivo aqui
              </p>
              <p className="text-[11px] text-gray-400">{description}</p>
            </div>
          </div>
        )}

        {/* PROGRESS BAR */}
        {uploading && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-brand-blue to-brand-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* MESSAGES */}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
