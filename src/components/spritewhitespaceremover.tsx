'use client';

import { useState, DragEvent } from 'react';
import DragDropUploadBig from './dragdropuploadbig';

export default function SpriteWhiteSpaceRemover() {
  const [originalTexture, setOriginalTexture] = useState<string | null>(null);
  const [trimmedTexture, setTrimmedTexture] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [trimmedDimensions, setTrimmedDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  // Tolerance for considering a pixel as "white" or "transparent"
  const [tolerance, setTolerance] = useState<number>(0);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      setOriginalTexture(result);
      setTrimmedTexture(null);
      setError(null);
      loadAndTrim(result);
    };
    reader.readAsDataURL(file);
  };

  const loadAndTrim = (src: string) => {
    setIsProcessing(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setOriginalDimensions({ width: w, height: h });

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to create canvas context');
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      // Find bounding box of non-whitespace/non-transparent pixels
      const bounds = findContentBounds(pixels, w, h, tolerance);

      if (!bounds) {
        setError('Image appears to be entirely blank or white');
        setIsProcessing(false);
        return;
      }

      const trimW = bounds.right - bounds.left + 1;
      const trimH = bounds.bottom - bounds.top + 1;
      setTrimmedDimensions({ width: trimW, height: trimH });

      // Create trimmed canvas
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = trimW;
      trimmedCanvas.height = trimH;
      const trimCtx = trimmedCanvas.getContext('2d');
      if (!trimCtx) {
        setError('Failed to create trimmed canvas context');
        setIsProcessing(false);
        return;
      }

      trimCtx.drawImage(
        img,
        bounds.left,
        bounds.top,
        trimW,
        trimH,
        0,
        0,
        trimW,
        trimH
      );

      setTrimmedTexture(trimmedCanvas.toDataURL('image/png'));
      setIsProcessing(false);
    };

    img.onerror = () => {
      setError('Failed to load image');
      setIsProcessing(false);
    };

    img.src = src;
  };

  const findContentBounds = (
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    tol: number
  ): { top: number; left: number; bottom: number; right: number } | null => {
    let top = height;
    let left = width;
    let bottom = 0;
    let right = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // A pixel is considered "content" if it's not transparent
        // and not white (within tolerance)
        const isTransparent = a <= tol;
        const isWhite =
          r >= 255 - tol && g >= 255 - tol && b >= 255 - tol && a >= 255 - tol;

        if (!isTransparent && !isWhite) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }

    if (top > bottom || left > right) return null;
    return { top, left, bottom, right };
  };

  const reprocess = () => {
    if (originalTexture) {
      loadAndTrim(originalTexture);
    }
  };

  const downloadTexture = () => {
    if (!trimmedTexture) return;

    const link = document.createElement('a');
    link.href = trimmedTexture;
    link.download = 'trimmed-sprite.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setOriginalTexture(null);
    setTrimmedTexture(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setTrimmedDimensions({ width: 0, height: 0 });
    setError(null);
  };

  return (
    <div className='p-4 space-y-6'>
      <h2 className='text-xl font-bold'>Sprite White Space Remover</h2>

      <p className='text-gray-600 text-sm'>
        Upload a sprite image to automatically trim surrounding white space and
        transparent pixels. Adjust the tolerance to control how aggressively
        near-white pixels are removed.
      </p>

      {/* Upload Section */}
      {!originalTexture && (
        <DragDropUploadBig
          onFileSelect={processFile}
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}

      {/* Controls */}
      {originalTexture && (
        <div className='space-y-4 border p-4 rounded'>
          <h3 className='font-semibold'>Settings</h3>

          <div className='space-y-2'>
            <label className='block font-medium text-sm'>
              Tolerance (0-255):
            </label>
            <div className='flex items-center gap-4'>
              <input
                type='range'
                min='0'
                max='255'
                value={tolerance}
                onChange={e => setTolerance(Number(e.target.value))}
                className='flex-1'
              />
              <input
                type='number'
                value={tolerance}
                onChange={e => setTolerance(Number(e.target.value))}
                min='0'
                max='255'
                className='w-20 border rounded px-2 py-1 text-sm'
              />
            </div>
            <p className='text-xs text-gray-500'>
              Higher tolerance trims more near-white or near-transparent pixels.
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4'>
            <button
              onClick={reprocess}
              disabled={isProcessing}
              className={`px-4 py-2 rounded font-medium ${
                !isProcessing
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Reprocess'}
            </button>

            <button
              onClick={clearAll}
              className='px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600'
            >
              Clear All
            </button>

            {trimmedTexture && (
              <button
                onClick={downloadTexture}
                className='px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600'
              >
                Export
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {/* Original Image */}
      {originalTexture && (
        <div className='space-y-2'>
          <h3 className='font-semibold text-lg'>Original</h3>
          <p className='text-sm text-gray-600'>
            Dimensions: {originalDimensions.width}×{originalDimensions.height}
          </p>
          <img
            src={originalTexture}
            alt='Original sprite'
            className='border rounded shadow-sm max-w-full h-auto'
          />
        </div>
      )}

      {/* Trimmed Result */}
      {trimmedTexture && (
        <div className='space-y-2'>
          <h3 className='font-semibold text-lg'>Trimmed Result</h3>
          <p className='text-sm text-gray-600'>
            Dimensions: {trimmedDimensions.width}×{trimmedDimensions.height}
            {' — '}
            Saved{' '}
            {Math.round(
              (1 -
                (trimmedDimensions.width * trimmedDimensions.height) /
                  (originalDimensions.width * originalDimensions.height)) *
                100
            )}
            % area
          </p>
          <img
            src={trimmedTexture}
            alt='Trimmed sprite'
            className='border rounded shadow-sm max-w-full h-auto'
          />
          <button
            onClick={downloadTexture}
            className='px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600'
          >
            Download Trimmed Image
          </button>
        </div>
      )}
    </div>
  );
}
