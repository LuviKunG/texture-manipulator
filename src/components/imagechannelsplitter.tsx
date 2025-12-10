"use client";

import React, { useState, useRef, ChangeEvent } from "react";

// Helper type for our channel processing
type ChannelType = "red" | "green" | "blue" | "alpha";

export default function ImageChannelSplitter() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [channels, setChannels] = useState<{
    r: string;
    g: string;
    b: string;
    a: string;
  }>({
    r: "",
    g: "",
    b: "",
    a: "",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourcePixelsRef = useRef<Uint8ClampedArray | null>(null);
  const dimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // 1. Handle File Upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
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
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
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

    const redUrl = extractChannel(pixels, w, h, "red", grayscaleMode);
    const greenUrl = extractChannel(pixels, w, h, "green", grayscaleMode);
    const blueUrl = extractChannel(pixels, w, h, "blue", grayscaleMode);
    const alphaUrl = extractChannel(pixels, w, h, "alpha", grayscaleMode);

    setChannels({ r: redUrl, g: greenUrl, b: blueUrl, a: alphaUrl });
  };

  const extractChannel = (
    originalPixels: Uint8ClampedArray,
    width: number,
    height: number,
    channel: ChannelType,
    grayscale: boolean
  ): string => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return "";

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
        if (channel === "red") intensity = r;
        if (channel === "green") intensity = g;
        if (channel === "blue") intensity = b;
        if (channel === "alpha") intensity = a;

        newPixels[i] = intensity; // R
        newPixels[i + 1] = intensity; // G
        newPixels[i + 2] = intensity; // B
        newPixels[i + 3] = intensity; // A
      } else {
        // COLOR MODE: Keep only the specific color
        newPixels[i] = channel === "red" ? r : 0;
        newPixels[i + 1] = channel === "green" ? g : 0;
        newPixels[i + 2] = channel === "blue" ? b : 0;
        newPixels[i + 3] = channel === "alpha" ? a : 255;
      }
    }

    ctx.putImageData(newImageData, 0, 0);
    return tempCanvas.toDataURL();
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Image Channel Separator</h2>

      {/* Input Section */}
      <div className="flex gap-4 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="border p-2 rounded"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isGrayscale}
            onChange={(e) => {
              setIsGrayscale(e.target.checked);
              updateChannelImages(e.target.checked);
            }}
            className="w-5 h-5"
          />
          <span className="font-medium">
            Show as Grayscale Mask (easier to see)
          </span>
        </label>
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Display Results */}
      {originalImage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="font-semibold mb-2">Original</p>
            <img
              src={originalImage}
              alt="Original"
              className="border rounded shadow-sm"
            />
          </div>

          {channels.r && (
            <>
              <div>
                <p className="font-semibold text-red-600 mb-2">Red Channel</p>
                <img
                  src={channels.r}
                  alt="Red Channel"
                  className="border rounded shadow-sm"
                />
              </div>
              <div>
                <p className="font-semibold text-green-600 mb-2">
                  Green Channel
                </p>
                <img
                  src={channels.g}
                  alt="Green Channel"
                  className="border rounded shadow-sm"
                />
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">Blue Channel</p>
                <img
                  src={channels.b}
                  alt="Blue Channel"
                  className="border rounded shadow-sm"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-600 mb-2">
                  Alpha Channel
                </p>
                <img
                  src={channels.a}
                  alt="Alpha Channel"
                  className="border rounded shadow-sm"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
