"use client";

import { useState, useRef, ChangeEvent } from "react";

// Helper type for our channel data
type ChannelData = {
  imageData: string | null;
  pixels: Uint8ClampedArray | null;
  dimensions: { w: number; h: number };
};

type ChannelType = "red" | "green" | "blue" | "alpha";

export default function ImageChannelCombiner() {
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

  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const reader = new FileReader();
    reader.onload = (event) => {
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
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Update the specific channel
      setChannels((prev) => ({
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
      (ch) => ch.pixels !== null
    );

    if (loadedChannels.length === 0) {
      return { isValid: false };
    }

    const firstDims = loadedChannels[0].dimensions;
    const allSameDimensions = loadedChannels.every(
      (ch) => ch.dimensions.w === firstDims.w && ch.dimensions.h === firstDims.h
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
        setError("All loaded channels must have the same dimensions");
        setIsProcessing(false);
        return;
      }

      const { w, h } = validation.dimensions;

      // Create output canvas
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Failed to create canvas context");
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
          : 0;
        const greenValue = channels.green.pixels
          ? getChannelIntensity(channels.green.pixels, i)
          : 0;
        const blueValue = channels.blue.pixels
          ? getChannelIntensity(channels.blue.pixels, i)
          : 0;
        const alphaValue = channels.alpha.pixels
          ? getChannelIntensity(channels.alpha.pixels, i)
          : 255;

        // Set output pixel
        outputPixels[i] = redValue; // Red
        outputPixels[i + 1] = greenValue; // Green
        outputPixels[i + 2] = blueValue; // Blue
        outputPixels[i + 3] = alphaValue; // Alpha
      }

      ctx.putImageData(outputImageData, 0, 0);
      setCombinedImage(canvas.toDataURL());
    } catch (err) {
      setError(
        `Failed to combine channels: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
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

  // Download the combined image
  const downloadImage = () => {
    if (!combinedImage) return;

    const link = document.createElement("a");
    link.href = combinedImage;
    link.download = "combined-channels.png";
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
    setCombinedImage(null);
    setError(null);
    // Reset file inputs
    if (redInputRef.current) redInputRef.current.value = "";
    if (greenInputRef.current) greenInputRef.current.value = "";
    if (blueInputRef.current) blueInputRef.current.value = "";
    if (alphaInputRef.current) alphaInputRef.current.value = "";
  };

  const loadedChannelsCount = Object.values(channels).filter(
    (ch) => ch.pixels !== null
  ).length;
  const canCombine = loadedChannelsCount > 0;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Image Channel Combiner</h2>

      <p className="text-gray-600 text-sm">
        Upload separate channel images to combine them into a single image. At
        least one channel is required. Missing channels will default to their
        neutral values.
      </p>

      {/* Channel Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Red Channel */}
        <div className="border rounded p-4">
          <label className="block font-semibold text-red-600 mb-2">
            Red Channel
          </label>
          <input
            ref={redInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleChannelUpload("red", e)}
            className="block w-full text-sm border rounded p-2 mb-2"
          />
          {channels.red.imageData && (
            <img
              src={channels.red.imageData}
              alt="Red channel preview"
              className="w-full h-auto border rounded"
            />
          )}
        </div>

        {/* Green Channel */}
        <div className="border rounded p-4">
          <label className="block font-semibold text-green-600 mb-2">
            Green Channel
          </label>
          <input
            ref={greenInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleChannelUpload("green", e)}
            className="block w-full text-sm border rounded p-2 mb-2"
          />
          {channels.green.imageData && (
            <img
              src={channels.green.imageData}
              alt="Green channel preview"
              className="w-full h-auto border rounded"
            />
          )}
        </div>

        {/* Blue Channel */}
        <div className="border rounded p-4">
          <label className="block font-semibold text-blue-600 mb-2">
            Blue Channel
          </label>
          <input
            ref={blueInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleChannelUpload("blue", e)}
            className="block w-full text-sm border rounded p-2 mb-2"
          />
          {channels.blue.imageData && (
            <img
              src={channels.blue.imageData}
              alt="Blue channel preview"
              className="w-full h-auto border rounded"
            />
          )}
        </div>

        {/* Alpha Channel */}
        <div className="border rounded p-4">
          <label className="block font-semibold text-gray-600 mb-2">
            Alpha Channel (Optional)
          </label>
          <input
            ref={alphaInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleChannelUpload("alpha", e)}
            className="block w-full text-sm border rounded p-2 mb-2"
          />
          {channels.alpha.imageData && (
            <img
              src={channels.alpha.imageData}
              alt="Alpha channel preview"
              className="w-full h-auto border rounded"
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 items-center">
        <button
          onClick={combineChannels}
          disabled={!canCombine || isProcessing}
          className={`px-4 py-2 rounded font-medium ${
            canCombine && !isProcessing
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isProcessing ? "Combining..." : "Combine Channels"}
        </button>

        <button
          onClick={clearAll}
          className="px-4 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50"
        >
          Clear All
        </button>

        {combinedImage && (
          <button
            onClick={downloadImage}
            className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600"
          >
            Download Combined Image
          </button>
        )}
      </div>

      {/* Status Info */}
      <div className="text-sm text-gray-600">
        Loaded channels: {loadedChannelsCount}/4
        {loadedChannelsCount > 0 && (
          <span className="ml-4">
            Dimensions:{" "}
            {Object.values(channels).find((ch) => ch.pixels)?.dimensions.w || 0}
            ×
            {Object.values(channels).find((ch) => ch.pixels)?.dimensions.h || 0}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Combined Result */}
      {combinedImage && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Combined Result</h3>
          <img
            src={combinedImage}
            alt="Combined channels result"
            className="border rounded shadow-sm max-w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
