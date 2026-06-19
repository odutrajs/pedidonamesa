import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { cn } from '../../lib/cn';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE_MB = 5;

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
  disabled?: boolean;
  className?: string;
  label?: string;
}

function isAcceptedImage(file: File) {
  return /^image\/(jpeg|png|webp|gif)$/.test(file.type);
}

export function ImageUpload({
  value,
  onChange,
  previewUrl,
  disabled = false,
  className,
  label = 'Imagem do produto',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (previewUrl) {
      setLocalPreview(null);
      return;
    }
    if (!value) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value, previewUrl]);

  const displayPreview = previewUrl ?? localPreview;

  const validateAndSet = useCallback(
    (file: File | null) => {
      if (!file) {
        setError(null);
        onChange(null);
        return;
      }

      if (!isAcceptedImage(file)) {
        setError('Use JPG, PNG, WebP ou GIF.');
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`A imagem deve ter até ${MAX_SIZE_MB} MB.`);
        return;
      }

      setError(null);
      onChange(file);
    },
    [onChange],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  }

  function handleRemove() {
    validateAndSet(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={className}>
      <p className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>

      {displayPreview ? (
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={displayPreview}
              alt="Prévia da imagem"
              className="h-28 w-28 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white shadow-md transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                aria-label="Remover imagem"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {value?.name ?? 'Imagem selecionada'}
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
            >
              Trocar imagem
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled) inputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
            dragOver
              ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-zinc-800'
              : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 transition-colors group-hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-600 dark:group-hover:bg-zinc-700">
            {dragOver ? (
              <Upload className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            ) : (
              <ImagePlus className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
            )}
          </div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Arraste uma imagem ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            JPG, PNG, WebP ou GIF · até {MAX_SIZE_MB} MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          validateAndSet(file);
          e.target.value = '';
        }}
      />

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
