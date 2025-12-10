'use client';

import { useState, useRef, ChangeEvent } from 'react';

// Helper type for our channel processing
type ChannelType = 'red' | 'green' | 'blue' | 'alpha';

export default function ImageChannelSplitter() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [channels, setChannels] = useState<{
    r: string;
    g: string;
    b: string;
    a: string;
  }>({
    r: '',
    g: '',
    b: '',
    a: '',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourcePixelsRef = useRef<Uint8ClampedArray | null>(null);
  const dimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle File Upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      setOriginalImage(result);
      loadImageAndProcess(result);
    };
    reader.readAsDataURL(file);
  };
  const loadImageAndProcess = (src: string) => {
    const img = new Image();
    img.onload = () => {
      // 1. SAFEGUARD: Use natural dimensions
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      dimensionsRef.current = { w, h };

      // 2. Draw to hidden canvas to extract raw data
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      sourcePixelsRef.current = imageData.data;

      // 3. Generate the channel images
      updateChannelImages(isGrayscale);
    };
    img.src = src;
  };

  const updateChannelImages = (grayscaleMode: boolean) => {
    if (!sourcePixelsRef.current || dimensionsRef.current.w === 0) return;

    const { w, h } = dimensionsRef.current;
    const pixels = sourcePixelsRef.current;

    const redUrl = extractChannel(pixels, w, h, 'red', grayscaleMode);
    const greenUrl = extractChannel(pixels, w, h, 'green', grayscaleMode);
    const blueUrl = extractChannel(pixels, w, h, 'blue', grayscaleMode);
    const alphaUrl = extractChannel(pixels, w, h, 'alpha', grayscaleMode);

    setChannels({ r: redUrl, g: greenUrl, b: blueUrl, a: alphaUrl });
  };

  const extractChannel = (
    originalPixels: Uint8ClampedArray,
    width: number,
    height: number,
    channel: ChannelType,
    grayscale: boolean
  ): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    const newImageData = ctx.createImageData(width, height);
    const newPixels = newImageData.data;

    for (let i = 0; i < originalPixels.length; i += 4) {
      const r = originalPixels[i];
      const g = originalPixels[i + 1];
      const b = originalPixels[i + 2];
      const a = originalPixels[i + 3];

      if (grayscale) {
        // GRAYSCALE MODE: Show intensity as white (like Photoshop channels)
        // If we want Red channel, we take the R value and make it the pixel's brightness
        let intensity = 0;
        if (channel === 'red') intensity = r;
        if (channel === 'green') intensity = g;
        if (channel === 'blue') intensity = b;
        if (channel === 'alpha') intensity = a;

        newPixels[i] = intensity; // R
        newPixels[i + 1] = intensity; // G
        newPixels[i + 2] = intensity; // B
        newPixels[i + 3] = intensity; // A
      } else {
        // COLOR MODE: Keep only the specific color
        newPixels[i] = channel === 'red' ? r : 0;
        newPixels[i + 1] = channel === 'green' ? g : 0;
        newPixels[i + 2] = channel === 'blue' ? b : 0;
        newPixels[i + 3] = channel === 'alpha' ? a : 255;
      }
    }

    ctx.putImageData(newImageData, 0, 0);
    return tempCanvas.toDataURL();
  };

  // Download a specific channel image
  const downloadChannel = (imageData: string, channelName: string) => {
    if (!imageData) return;

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${channelName}-channel.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all images and reset state
  const clearAll = () => {
    setOriginalImage(null);
    setChannels({ r: '', g: '', b: '', a: '' });
    sourcePixelsRef.current = null;
    dimensionsRef.current = { w: 0, h: 0 };
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className='p-4 space-y-6'>
      <h2 className='text-xl font-bold'>Image Channel Splitter</h2>

      <p className='text-gray-600 text-sm'>
        Upload an image to split it into separate RGBA channels. Each channel
        can be downloaded individually for editing or analysis.
      </p>

      {/* Input Section */}
      <div className='space-y-4'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleImageUpload}
          className='border p-2 rounded'
        />

        {/* Action Buttons */}
        {originalImage && (
          <div className='flex gap-4 items-center'>
            <button
              onClick={() => {
                setIsGrayscale(!isGrayscale);
                updateChannelImages(!isGrayscale);
              }}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                isGrayscale
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Grayscale
            </button>

            <button
              onClick={clearAll}
              className='px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600'
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Display Results */}
      {originalImage && (
        <div className='flex flex-col gap-6'>
          <div>
            <p className='font-semibold mb-2'>Original</p>
            <img
              src={originalImage}
              alt='Original'
              className='border rounded shadow-sm max-w-full h-auto'
            />
          </div>

          {channels.r && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Red Channel */}
              <div className='border rounded p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <p className='font-semibold text-red-600'>Red Channel</p>
                  <button
                    onClick={() => downloadChannel(channels.r, 'red')}
                    className='px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600'
                  >
                    Download
                  </button>
                </div>
                <img
                  src={channels.r}
                  alt='Red Channel'
                  className='w-full border rounded shadow-sm'
                />
              </div>

              {/* Green Channel */}
              <div className='border rounded p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <p className='font-semibold text-green-600'>Green Channel</p>
                  <button
                    onClick={() => downloadChannel(channels.g, 'green')}
                    className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
                  >
                    Download
                  </button>
                </div>
                <img
                  src={channels.g}
                  alt='Green Channel'
                  className='w-full border rounded shadow-sm'
                />
              </div>

              {/* Blue Channel */}
              <div className='border rounded p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <p className='font-semibold text-blue-600'>Blue Channel</p>
                  <button
                    onClick={() => downloadChannel(channels.b, 'blue')}
                    className='px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600'
                  >
                    Download
                  </button>
                </div>
                <img
                  src={channels.b}
                  alt='Blue Channel'
                  className='w-full border rounded shadow-sm'
                />
              </div>

              {/* Alpha Channel */}
              <div className='border rounded p-4'>
                <div className='flex justify-between items-center mb-2'>
                  <p className='font-semibold text-gray-600'>Alpha Channel</p>
                  <button
                    onClick={() => downloadChannel(channels.a, 'alpha')}
                    className='px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600'
                  >
                    Download
                  </button>
                </div>
                <img
                  src={channels.a}
                  alt='Alpha Channel'
                  className='w-full border rounded shadow-sm'
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
