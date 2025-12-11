'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import DragDropUploadBig from './dragdropuploadbig';

// Helper types for resizing options
type ResizeMode = 'percentage' | 'dimensions' | 'preset';
type PresetSize = {
  name: string;
  width: number;
  height: number;
};

export default function TextureResizer() {
  const [originalTexture, setOriginalTexture] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [resizedTexture, setResizedTexture] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Original texture dimensions
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  // Resize settings
  const [resizeMode, setResizeMode] = useState<ResizeMode>('percentage');
  const [percentage, setPercentage] = useState<number>(100);
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Texture quality for JPEG
  const [quality, setQuality] = useState<number>(90);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>(
    'png'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset sizes
  const presetSizes: PresetSize[] = [
    // Power of Two Resolutions
    { name: '32x32', width: 32, height: 32 },
    { name: '64x64', width: 64, height: 64 },
    { name: '128x128', width: 128, height: 128 },
    { name: '256x256', width: 256, height: 256 },
    { name: '512x512', width: 512, height: 512 },
    { name: '1024x1024', width: 1024, height: 1024 },
    { name: '2048x2048', width: 2048, height: 2048 },
    { name: '4096x4096', width: 4096, height: 4096 },
  ];

  // Handle drag and drop
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
      loadTextureDimensions(result);
      setResizedTexture(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Load original texture dimensions
  const loadTextureDimensions = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      setOriginalDimensions(dimensions);

      // Set default target dimensions to original size
      setTargetWidth(dimensions.width);
      setTargetHeight(dimensions.height);
    };
    img.onerror = () => {
      setError('Failed to load texture dimensions');
    };
    img.src = src;
  };

  // Calculate dimensions based on resize mode
  const calculateTargetDimensions = (): { width: number; height: number } => {
    if (resizeMode === 'percentage') {
      return {
        width: Math.round(originalDimensions.width * (percentage / 100)),
        height: Math.round(originalDimensions.height * (percentage / 100)),
      };
    }

    if (resizeMode === 'preset' && selectedPreset) {
      const preset = presetSizes.find(p => p.name === selectedPreset);
      if (preset) {
        return { width: preset.width, height: preset.height };
      }
    }

    // dimensions mode
    return { width: targetWidth, height: targetHeight };
  };

  // Handle aspect ratio maintenance
  const handleWidthChange = (newWidth: number) => {
    setTargetWidth(newWidth);
    if (maintainAspectRatio && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.height / originalDimensions.width;
      setTargetHeight(Math.round(newWidth * aspectRatio));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setTargetHeight(newHeight);
    if (maintainAspectRatio && originalDimensions.height > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setTargetWidth(Math.round(newHeight * aspectRatio));
    }
  };

  // Resize the texture
  const resizeTexture = () => {
    if (!originalTexture) return;

    setIsProcessing(true);
    setError(null);

    try {
      const targetDimensions = calculateTargetDimensions();

      if (targetDimensions.width <= 0 || targetDimensions.height <= 0) {
        setError('Target dimensions must be positive numbers');
        setIsProcessing(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Create canvas with target dimensions
          const canvas = document.createElement('canvas');
          canvas.width = targetDimensions.width;
          canvas.height = targetDimensions.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setError('Failed to create canvas context');
            setIsProcessing(false);
            return;
          }

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw resized image
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            0,
            0,
            targetDimensions.width,
            targetDimensions.height
          );

          // Convert to desired format
          const mimeType =
            outputFormat === 'jpeg'
              ? 'image/jpeg'
              : outputFormat === 'webp'
                ? 'image/webp'
                : 'image/png';

          const qualityValue =
            outputFormat === 'png' ? undefined : quality / 100;

          const resizedDataUrl = canvas.toDataURL(mimeType, qualityValue);
          setResizedTexture(resizedDataUrl);
          setIsProcessing(false);
        } catch (err) {
          setError(
            `Failed to resize image: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setError('Failed to load original texture for resizing');
        setIsProcessing(false);
      };

      img.src = originalTexture;
    } catch (err) {
      setError(
        `Resize failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setIsProcessing(false);
    }
  };

  // Download resized texture
  const downloadTexture = () => {
    if (!resizedTexture) return;

    const targetDimensions = calculateTargetDimensions();
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const filename = `resized-${targetDimensions.width}x${targetDimensions.height}.${extension}`;

    const link = document.createElement('a');
    link.href = resizedTexture;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all
  const clearAll = () => {
    setOriginalTexture(null);
    setResizedTexture(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setError(null);
    setPercentage(100);
    setSelectedPreset('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const targetDimensions = originalTexture ? calculateTargetDimensions() : null;

  return (
    <div className='p-4 space-y-6'>
      <h2 className='text-xl font-bold'>Texture Resizer</h2>

      <p className='text-gray-600 text-sm'>
        Upload a texture and resize it using percentage scaling, specific
        dimensions, or preset sizes for social media and web use.
      </p>

      {/* File Upload */}
      <div className='space-y-4'>
        {!originalTexture && (
          <DragDropUploadBig
            onFileSelect={processFile}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        )}
      </div>

      {/* Original Image Info */}
      {originalTexture && (
        <div className='bg-black p-4 rounded border border-gray-300'>
          <h3 className='font-semibold mb-2 text-white'>Original Texture</h3>
          <p className='text-sm text-gray-300 mb-2'>
            Dimensions: {originalDimensions.width}×{originalDimensions.height}
          </p>
          <img
            src={originalTexture}
            alt='Original'
            className='max-w-full h-auto border rounded shadow-sm'
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Resize Controls */}
      {originalTexture && (
        <div className='space-y-4 border p-4 rounded'>
          <h3 className='font-semibold'>Resize Settings</h3>

          {/* Resize Mode Selection */}
          <div className='space-y-2'>
            <label className='block font-medium text-sm'>Resize Method:</label>
            <div className='flex gap-4'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='percentage'
                  checked={resizeMode === 'percentage'}
                  onChange={e => setResizeMode(e.target.value as ResizeMode)}
                  className='mr-2'
                />
                Percentage
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='dimensions'
                  checked={resizeMode === 'dimensions'}
                  onChange={e => setResizeMode(e.target.value as ResizeMode)}
                  className='mr-2'
                />
                Custom Dimensions
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='preset'
                  checked={resizeMode === 'preset'}
                  onChange={e => setResizeMode(e.target.value as ResizeMode)}
                  className='mr-2'
                />
                Preset Sizes
              </label>
            </div>
          </div>

          {/* Percentage Mode */}
          {resizeMode === 'percentage' && (
            <div className='space-y-2'>
              <label className='block font-medium text-sm'>
                Scale Percentage:
              </label>
              <div className='flex items-center gap-4'>
                <input
                  type='range'
                  min='10'
                  max='500'
                  value={percentage}
                  onChange={e => setPercentage(Number(e.target.value))}
                  className='flex-1'
                />
                <input
                  type='number'
                  value={percentage}
                  onChange={e => setPercentage(Number(e.target.value))}
                  min='10'
                  max='500'
                  className='w-20 border rounded px-2 py-1 text-sm'
                />
                <span className='text-sm'>%</span>
              </div>
            </div>
          )}

          {/* Custom Dimensions Mode */}
          {resizeMode === 'dimensions' && (
            <div className='space-y-2'>
              <div className='flex items-center gap-4'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={maintainAspectRatio}
                    onChange={e => setMaintainAspectRatio(e.target.checked)}
                    className='mr-2'
                  />
                  Maintain aspect ratio
                </label>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block font-medium text-sm mb-1'>
                    Width:
                  </label>
                  <input
                    type='number'
                    value={targetWidth}
                    onChange={e => handleWidthChange(Number(e.target.value))}
                    min='1'
                    className='w-full border rounded px-2 py-1'
                  />
                </div>
                <div>
                  <label className='block font-medium text-sm mb-1'>
                    Height:
                  </label>
                  <input
                    type='number'
                    value={targetHeight}
                    onChange={e => handleHeightChange(Number(e.target.value))}
                    min='1'
                    className='w-full border rounded px-2 py-1'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preset Mode */}
          {resizeMode === 'preset' && (
            <div className='space-y-2'>
              <label className='block font-medium text-sm'>
                Choose Preset Size:
              </label>
              <select
                value={selectedPreset}
                onChange={e => setSelectedPreset(e.target.value)}
                className='w-full border rounded px-2 py-1 bg-black text-white border-gray-300'
              >
                <option value=''>Select a preset size...</option>
                {presetSizes.map(preset => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Output Format & Quality */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block font-medium text-sm mb-1'>
                Output Format:
              </label>
              <select
                value={outputFormat}
                onChange={e =>
                  setOutputFormat(e.target.value as 'png' | 'jpeg' | 'webp')
                }
                className='w-full border rounded px-2 py-1 bg-black text-white border-gray-300'
              >
                <option value='png'>PNG (Lossless)</option>
                <option value='jpeg'>JPEG (Smaller file)</option>
                <option value='webp'>WebP (Modern)</option>
              </select>
            </div>
            {(outputFormat === 'jpeg' || outputFormat === 'webp') && (
              <div>
                <label className='block font-medium text-sm mb-1'>
                  Quality: {quality}%
                </label>
                <input
                  type='range'
                  min='10'
                  max='100'
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className='w-full'
                />
              </div>
            )}
          </div>

          {/* Target Dimensions Preview */}
          {targetDimensions && (
            <div className='bg-black p-3 rounded border border-gray-300'>
              <p className='text-sm text-white'>
                <strong>Target size:</strong> {targetDimensions.width}×
                {targetDimensions.height}
                {originalDimensions.width > 0 && (
                  <span className='ml-2 text-gray-300'>
                    (
                    {Math.round(
                      (targetDimensions.width / originalDimensions.width) * 100
                    )}
                    % of original)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-4'>
            <button
              onClick={resizeTexture}
              disabled={isProcessing || !targetDimensions}
              className={`px-4 py-2 rounded font-medium ${!isProcessing && targetDimensions
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isProcessing ? 'Resizing...' : 'Resize Image'}
            </button>

            <button
              onClick={clearAll}
              className='px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600'
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {/* Resized Image Result */}
      {resizedTexture && (
        <div className='space-y-4 border p-4 rounded'>
          <div className='flex justify-between items-center'>
            <h3 className='font-semibold'>Resized Result</h3>
            <button
              onClick={downloadTexture}
              className='px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600'
            >
              Download Resized Image
            </button>
          </div>
          <img
            src={resizedTexture}
            alt='Resized'
            className='max-w-full h-auto border rounded shadow-sm'
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}
    </div>
  );
}
