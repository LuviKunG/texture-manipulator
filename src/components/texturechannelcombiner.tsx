'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import DragDropUploadSmall from './dragdropuploadsmall';

// Helper type for our channel data
type ChannelData = {
  imageData: string | null;
  pixels: Uint8ClampedArray | null;
  dimensions: { w: number; h: number };
};

type ChannelType = 'red' | 'green' | 'blue' | 'alpha';

export default function TextureChannelCombiner() {
  const [dragOverChannel, setDragOverChannel] = useState<ChannelType | null>(
    null
  );
  const [channels, setChannels] = useState<{
    red: ChannelData;
    green: ChannelData;
    blue: ChannelData;
    alpha: ChannelData;
  }>({
    red: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
    green: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
    blue: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
    alpha: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
  });

  const [combinedTexture, setCombinedTexture] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default values for channels when no file is loaded
  const [defaultValues, setDefaultValues] = useState<{
    red: number;
    green: number;
    blue: number;
    alpha: number;
  }>({
    red: 255, // White
    green: 255, // White
    blue: 255, // White
    alpha: 255, // Opaque
  });

  // Refs for file inputs
  const redInputRef = useRef<HTMLInputElement>(null);
  const greenInputRef = useRef<HTMLInputElement>(null);
  const blueInputRef = useRef<HTMLInputElement>(null);
  const alphaInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload for a specific channel
  const handleChannelUpload = (
    channel: ChannelType,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processChannelFile(channel, file);
  };

  // Handle drag and drop for channels
  const handleChannelDragOver = (
    channel: ChannelType,
    e: DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    setDragOverChannel(channel);
  };

  const handleChannelDragLeave = (
    channel: ChannelType,
    e: DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    setDragOverChannel(null);
  };

  const handleChannelDrop = (
    channel: ChannelType,
    e: DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    setDragOverChannel(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processChannelFile(channel, file);
    }
  };

  const processChannelFile = (channel: ChannelType, file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      loadChannelImage(channel, result);
    };
    reader.readAsDataURL(file);
  };

  // Load and process a channel image
  const loadChannelImage = (channel: ChannelType, src: string) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Create canvas to extract pixel data
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Update the specific channel
      setChannels(prev => ({
        ...prev,
        [channel]: {
          imageData: src,
          pixels: imageData.data,
          dimensions: { w, h },
        },
      }));

      setError(null);
    };
    img.onerror = () => {
      setError(`Failed to load ${channel} channel image`);
    };
    img.src = src;
  };

  // Check if all channels have the same dimensions
  const validateDimensions = (): {
    isValid: boolean;
    dimensions?: { w: number; h: number };
  } => {
    const loadedChannels = Object.values(channels).filter(
      ch => ch.pixels !== null
    );

    if (loadedChannels.length === 0) {
      return { isValid: false };
    }

    const firstDims = loadedChannels[0].dimensions;
    const allSameDimensions = loadedChannels.every(
      ch => ch.dimensions.w === firstDims.w && ch.dimensions.h === firstDims.h
    );

    return {
      isValid: allSameDimensions,
      dimensions: allSameDimensions ? firstDims : undefined,
    };
  };

  // Combine channels into final image
  const combineChannels = () => {
    setIsProcessing(true);
    setError(null);

    try {
      const validation = validateDimensions();
      if (!validation.isValid || !validation.dimensions) {
        setError('All loaded channels must have the same dimensions');
        setIsProcessing(false);
        return;
      }

      const { w, h } = validation.dimensions;

      // Create output canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to create canvas context');
        setIsProcessing(false);
        return;
      }

      const outputImageData = ctx.createImageData(w, h);
      const outputPixels = outputImageData.data;

      // Process each pixel
      for (let i = 0; i < outputPixels.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % w;
        const y = Math.floor(pixelIndex / w);

        // Extract channel values (using first channel of each image as intensity)
        const redValue = channels.red.pixels
          ? getChannelIntensity(channels.red.pixels, i)
          : defaultValues.red;
        const greenValue = channels.green.pixels
          ? getChannelIntensity(channels.green.pixels, i)
          : defaultValues.green;
        const blueValue = channels.blue.pixels
          ? getChannelIntensity(channels.blue.pixels, i)
          : defaultValues.blue;
        const alphaValue = channels.alpha.pixels
          ? getChannelIntensity(channels.alpha.pixels, i)
          : defaultValues.alpha;

        // Set output pixel
        outputPixels[i] = redValue; // Red
        outputPixels[i + 1] = greenValue; // Green
        outputPixels[i + 2] = blueValue; // Blue
        outputPixels[i + 3] = alphaValue; // Alpha
      }

      ctx.putImageData(outputImageData, 0, 0);
      setCombinedTexture(canvas.toDataURL());
    } catch (err) {
      setError(
        `Failed to combine channels: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    setIsProcessing(false);
  };

  // Extract intensity from a channel (handles both grayscale and color channel images)
  const getChannelIntensity = (
    pixels: Uint8ClampedArray,
    index: number
  ): number => {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];

    // If it's grayscale (R=G=B), use any channel
    if (r === g && g === b) {
      return r;
    }

    // Otherwise, use the brightest channel or convert to grayscale
    return Math.max(r, g, b);
  };

  // Download the combined texture
  const downloadTexture = () => {
    if (!combinedTexture) return;

    const link = document.createElement('a');
    link.href = combinedTexture;
    link.download = 'combined-channels.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all channels
  const clearAll = () => {
    setChannels({
      red: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
      green: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
      blue: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
      alpha: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
    });
    setCombinedTexture(null);
    setError(null);
    // Reset file inputs
    if (redInputRef.current) redInputRef.current.value = '';
    if (greenInputRef.current) greenInputRef.current.value = '';
    if (blueInputRef.current) blueInputRef.current.value = '';
    if (alphaInputRef.current) alphaInputRef.current.value = '';
  };

  // Clear a specific channel
  const clearChannel = (channel: ChannelType) => {
    setChannels(prev => ({
      ...prev,
      [channel]: { imageData: null, pixels: null, dimensions: { w: 0, h: 0 } },
    }));

    // Reset specific file input
    const inputRef =
      channel === 'red'
        ? redInputRef
        : channel === 'green'
          ? greenInputRef
          : channel === 'blue'
            ? blueInputRef
            : alphaInputRef;

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const loadedChannelsCount = Object.values(channels).filter(
    ch => ch.pixels !== null
  ).length;
  const canCombine = loadedChannelsCount > 0;

  return (
    <div className='p-4 space-y-6'>
      <h2 className='text-xl font-bold'>Texture Channel Combiner</h2>

      <p className='text-gray-600 text-sm'>
        Upload separate channel textures to combine them into a single texture. For
        channels without files, you can select default values (Black, Gray, or
        White).
      </p>

      {/* Channel Upload Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Red Channel */}
        <div className='border rounded p-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='font-semibold text-red-600'>Red Channel</label>
            {channels.red.imageData && (
              <button
                onClick={() => clearChannel('red')}
                className='px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200'
              >
                Clear
              </button>
            )}
          </div>
          {!channels.red.imageData && (
            <DragDropUploadSmall
              onFileSelect={file => processChannelFile('red', file)}
              isDragOver={dragOverChannel === 'red'}
              onDragOver={e => handleChannelDragOver('red', e)}
              onDragLeave={e => handleChannelDragLeave('red', e)}
              onDrop={e => handleChannelDrop('red', e)}
              placeholder='Click or drag red channel image'
            />
          )}
          {!channels.red.imageData && (
            <div className='mb-2'>
              <label className='block text-xs text-gray-600 mb-1'>
                Default value:
              </label>
              <select
                value={defaultValues.red}
                onChange={e =>
                  setDefaultValues(prev => ({
                    ...prev,
                    red: Number(e.target.value),
                  }))
                }
                className='w-full text-sm border rounded p-1 bg-black text-white border-gray-300'
              >
                <option value={0}>Black (0)</option>
                <option value={128}>Gray (128)</option>
                <option value={255}>White (255)</option>
              </select>
            </div>
          )}
          {channels.red.imageData && (
            <img
              src={channels.red.imageData}
              alt='Red channel preview'
              className='w-full h-auto border rounded'
            />
          )}
        </div>

        {/* Green Channel */}
        <div className='border rounded p-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='font-semibold text-green-600'>
              Green Channel
            </label>
            {channels.green.imageData && (
              <button
                onClick={() => clearChannel('green')}
                className='px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200'
              >
                Clear
              </button>
            )}
          </div>
          {!channels.green.imageData && (
            <DragDropUploadSmall
              onFileSelect={file => processChannelFile('green', file)}
              isDragOver={dragOverChannel === 'green'}
              onDragOver={e => handleChannelDragOver('green', e)}
              onDragLeave={e => handleChannelDragLeave('green', e)}
              onDrop={e => handleChannelDrop('green', e)}
              placeholder='Click or drag green channel image'
            />
          )}
          {!channels.green.imageData && (
            <div className='mb-2'>
              <label className='block text-xs text-gray-600 mb-1'>
                Default value:
              </label>
              <select
                value={defaultValues.green}
                onChange={e =>
                  setDefaultValues(prev => ({
                    ...prev,
                    green: Number(e.target.value),
                  }))
                }
                className='w-full text-sm border rounded p-1 bg-black text-white border-gray-300'
              >
                <option value={0}>Black (0)</option>
                <option value={128}>Gray (128)</option>
                <option value={255}>White (255)</option>
              </select>
            </div>
          )}
          {channels.green.imageData && (
            <img
              src={channels.green.imageData}
              alt='Green channel preview'
              className='w-full h-auto border rounded'
            />
          )}
        </div>

        {/* Blue Channel */}
        <div className='border rounded p-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='font-semibold text-blue-600'>Blue Channel</label>
            {channels.blue.imageData && (
              <button
                onClick={() => clearChannel('blue')}
                className='px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200'
              >
                Clear
              </button>
            )}
          </div>
          {!channels.blue.imageData && (
            <DragDropUploadSmall
              onFileSelect={file => processChannelFile('blue', file)}
              isDragOver={dragOverChannel === 'blue'}
              onDragOver={e => handleChannelDragOver('blue', e)}
              onDragLeave={e => handleChannelDragLeave('blue', e)}
              onDrop={e => handleChannelDrop('blue', e)}
              placeholder='Click or drag blue channel image'
            />
          )}
          {!channels.blue.imageData && (
            <div className='mb-2'>
              <label className='block text-xs text-gray-600 mb-1'>
                Default value:
              </label>
              <select
                value={defaultValues.blue}
                onChange={e =>
                  setDefaultValues(prev => ({
                    ...prev,
                    blue: Number(e.target.value),
                  }))
                }
                className='w-full text-sm border rounded p-1 bg-black text-white border-gray-300'
              >
                <option value={0}>Black (0)</option>
                <option value={128}>Gray (128)</option>
                <option value={255}>White (255)</option>
              </select>
            </div>
          )}
          {channels.blue.imageData && (
            <img
              src={channels.blue.imageData}
              alt='Blue channel preview'
              className='w-full h-auto border rounded'
            />
          )}
        </div>

        {/* Alpha Channel */}
        <div className='border rounded p-4'>
          <div className='flex justify-between items-center mb-2'>
            <label className='font-semibold text-gray-600'>
              Alpha Channel (Optional)
            </label>
            {channels.alpha.imageData && (
              <button
                onClick={() => clearChannel('alpha')}
                className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200'
              >
                Clear
              </button>
            )}
          </div>
          {!channels.alpha.imageData && (
            <DragDropUploadSmall
              onFileSelect={file => processChannelFile('alpha', file)}
              isDragOver={dragOverChannel === 'alpha'}
              onDragOver={e => handleChannelDragOver('alpha', e)}
              onDragLeave={e => handleChannelDragLeave('alpha', e)}
              onDrop={e => handleChannelDrop('alpha', e)}
              placeholder='Click or drag alpha channel image'
            />
          )}
          {!channels.alpha.imageData && (
            <div className='mb-2'>
              <label className='block text-xs text-gray-600 mb-1'>
                Default value:
              </label>
              <select
                value={defaultValues.alpha}
                onChange={e =>
                  setDefaultValues(prev => ({
                    ...prev,
                    alpha: Number(e.target.value),
                  }))
                }
                className='w-full text-sm border rounded p-1 bg-black text-white border-gray-300'
              >
                <option value={0}>Transparent (0)</option>
                <option value={128}>Semi-transparent (128)</option>
                <option value={255}>Opaque (255)</option>
              </select>
            </div>
          )}
          {channels.alpha.imageData && (
            <img
              src={channels.alpha.imageData}
              alt='Alpha channel preview'
              className='w-full h-auto border rounded'
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex gap-4 items-center'>
        <button
          onClick={combineChannels}
          disabled={!canCombine || isProcessing}
          className={`px-4 py-2 rounded font-medium ${canCombine && !isProcessing
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {isProcessing ? 'Combining...' : 'Combine Channels'}
        </button>

        <button
          onClick={clearAll}
          className='px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600'
        >
          Clear All
        </button>

        {combinedTexture && (
          <button
            onClick={downloadTexture}
            className='px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600'
          >
            Download Combined Image
          </button>
        )}
      </div>

      {/* Status Info */}
      <div className='text-sm text-gray-600'>
        Loaded channels: {loadedChannelsCount}/4
        {loadedChannelsCount > 0 && (
          <span className='ml-4'>
            Dimensions:{' '}
            {Object.values(channels).find(ch => ch.pixels)?.dimensions.w || 0}×
            {Object.values(channels).find(ch => ch.pixels)?.dimensions.h || 0}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}

      {/* Combined Result */}
      {combinedTexture && (
        <div className='space-y-2'>
          <h3 className='font-semibold text-lg'>Combined Result</h3>
          <img
            src={combinedTexture}
            alt='Combined channels result'
            className='border rounded shadow-sm max-w-full h-auto'
          />
        </div>
      )}
    </div>
  );
}
