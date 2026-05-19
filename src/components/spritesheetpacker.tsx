/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import DragDropUploadBig from './dragdropuploadbig';

interface FrameEntry {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export default function SpriteSheetPacker() {
  const [frames, setFrames] = useState<FrameEntry[]>([]);
  const [rows, setRows] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [framePreviewIndex, setFramePreviewIndex] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const allSameSize =
    frames.length <= 1 ||
    frames.every(
      f => f.width === frames[0].width && f.height === frames[0].height
    );

  const cols = frames.length > 0 ? Math.ceil(frames.length / rows) : 0;

  const loadFile = (file: File): Promise<FrameEntry> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () =>
          resolve({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        img.onerror = reject;
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/')
    );
    if (imageFiles.length === 0) return;

    try {
      const newFrames = await Promise.all(imageFiles.map(loadFile));
      setFrames(prev => {
        const updated = [...prev, ...newFrames];
        if (updated.length > 1) {
          const { width: fw, height: fh } = updated[0];
          const mismatch = updated.find(f => f.width !== fw || f.height !== fh);
          if (mismatch) {
            setError(
              `Size mismatch: all frames must be ${fw}×${fh}px. "${mismatch.name}" is ${mismatch.width}×${mismatch.height}px.`
            );
          } else {
            setError(null);
          }
        } else {
          setError(null);
        }
        return updated;
      });
    } catch {
      setError('Failed to load one or more images.');
    }
  };

  const isFileDrag = (e: DragEvent) =>
    Array.from(e.dataTransfer.types).includes('Files');

  const handleDropZoneDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isFileDrag(e)) setIsDragOver(true);
  };

  const handleDropZoneDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDropZoneDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFrame = (id: string) => {
    setFrames(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (updated.length <= 1) setError(null);
      else {
        const { width: fw, height: fh } = updated[0];
        const mismatch = updated.find(f => f.width !== fw || f.height !== fh);
        if (!mismatch) setError(null);
      }
      return updated;
    });
  };

  const handleFrameDragStart = (
    e: DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleFrameDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isFileDrag(e)) setDragOverIndex(index);
  };

  const handleFrameDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setFrames(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleFrameDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      if (frames.length === 0 || !allSameSize) {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }
      const fw = frames[0].width;
      const fh = frames[0].height;
      canvas.width = cols * fw;
      canvas.height = rows * fh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < frames.length; i++) {
        if (cancelled) return;
        const img = new Image();
        await new Promise<void>(resolve => {
          img.onload = () => resolve();
          img.src = frames[i].dataUrl;
        });
        if (cancelled) return;
        ctx.drawImage(img, (i % cols) * fw, Math.floor(i / cols) * fh);
      }
    };

    draw();
    return () => {
      cancelled = true;
    };
  }, [frames, rows, cols, allSameSize]);

  useEffect(() => {
    if (frames.length === 0) setFramePreviewIndex(0);
    else setFramePreviewIndex(i => Math.min(i, frames.length - 1));
  }, [frames.length]);

  const exportSpriteSheet = async () => {
    if (frames.length === 0 || !allSameSize) return;
    const fw = frames[0].width;
    const fh = frames[0].height;

    const canvas = document.createElement('canvas');
    canvas.width = cols * fw;
    canvas.height = rows * fh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i < frames.length; i++) {
      const img = new Image();
      await new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.src = frames[i].dataUrl;
      });
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.drawImage(img, col * fw, row * fh);
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'spritesheet.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='p-4 space-y-6'>
      <h2 className='text-xl font-bold'>Sprite Sheet Packer</h2>

      <p className='text-gray-600 dark:text-gray-400 text-sm'>
        Upload multiple sprite frames, reorder by dragging, set the row count,
        then export as a single sprite sheet PNG.
      </p>

      {/* Drop Zone */}
      <DragDropUploadBig
        multiple
        onFilesSelect={addFiles}
        isDragOver={isDragOver}
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDropZoneDragLeave}
        onDrop={handleDropZoneDrop}
        placeholder='PNG, JPG, GIF — multiple files supported'
      />

      {/* Error Banner */}
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded dark:bg-red-950 dark:border-red-800 dark:text-red-300'>
          {error}
        </div>
      )}

      {frames.length > 0 && (
        <>
          {/* Settings */}
          <div className='border rounded p-4 space-y-3 dark:border-gray-700'>
            <h3 className='font-semibold'>Settings</h3>
            <div className='flex flex-wrap gap-6 items-center'>
              <label className='flex items-center gap-2 text-sm'>
                <span className='font-medium text-gray-700 dark:text-gray-300'>
                  Rows:
                </span>
                <input
                  type='number'
                  value={rows}
                  min={1}
                  max={frames.length}
                  onChange={e =>
                    setRows(
                      Math.max(
                        1,
                        Math.min(frames.length, Number(e.target.value))
                      )
                    )
                  }
                  className='w-20 border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                />
              </label>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Columns: {cols}
              </span>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Total frames: {frames.length}
              </span>
              {allSameSize && frames.length > 0 && (
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Output: {cols * frames[0].width}×{rows * frames[0].height}px
                </span>
              )}
            </div>
          </div>

          {/* Frame Grid */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <h3 className='font-semibold text-lg'>
                Frames ({frames.length})
              </h3>
              <button
                onClick={() => {
                  setFrames([]);
                  setError(null);
                }}
                className='text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              >
                Clear All
              </button>
            </div>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Drag frames to reorder. Red border indicates a size mismatch.
            </p>
            <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'>
              {frames.map((frame, i) => {
                const isMismatch =
                  !allSameSize &&
                  (frame.width !== frames[0].width ||
                    frame.height !== frames[0].height);
                return (
                  <div
                    key={frame.id}
                    draggable
                    onDragStart={e => handleFrameDragStart(e, i)}
                    onDragOver={e => handleFrameDragOver(e, i)}
                    onDrop={e => handleFrameDrop(e, i)}
                    onDragEnd={handleFrameDragEnd}
                    className={`border-2 rounded p-2 cursor-grab active:cursor-grabbing select-none transition-all ${
                      dragIndex === i
                        ? 'opacity-40 scale-95 border-blue-400'
                        : dragOverIndex === i && dragIndex !== null
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-105'
                          : isMismatch
                            ? 'border-red-400 dark:border-red-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className='relative'>
                      <img
                        src={frame.dataUrl}
                        alt={frame.name}
                        className='w-full h-16 object-contain rounded bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]'
                        draggable={false}
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeFrame(frame.id);
                        }}
                        className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 leading-none'
                      >
                        ×
                      </button>
                    </div>
                    <div className='mt-1 flex items-center gap-1'>
                      <span className='text-xs font-mono font-bold text-gray-500 dark:text-gray-400'>
                        #{i}
                      </span>
                    </div>
                    <div
                      className='text-xs text-gray-400 dark:text-gray-500 truncate'
                      title={frame.name}
                    >
                      {frame.name}
                    </div>
                    <div
                      className={`text-xs ${isMismatch ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      {frame.width}×{frame.height}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {allSameSize && (
            <div className='space-y-4'>
              <h3 className='font-semibold text-lg'>Preview</h3>

              {/* Sprite sheet */}
              <div className='border rounded overflow-auto dark:border-gray-700'>
                <canvas
                  ref={previewCanvasRef}
                  className='max-w-full h-auto'
                  style={{
                    background:
                      'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 16px 16px',
                  }}
                />
              </div>

              {/* Frame scrubber */}
              {frames.length > 1 && (
                <div className='border rounded p-4 space-y-3 dark:border-gray-700'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Frame scrubber
                    </span>
                    <span className='text-sm text-gray-500 dark:text-gray-400 font-mono'>
                      #{framePreviewIndex} / {frames.length - 1}
                    </span>
                  </div>

                  <div className='flex items-center gap-3'>
                    <button
                      onClick={() =>
                        setFramePreviewIndex(i => Math.max(0, i - 1))
                      }
                      disabled={framePreviewIndex === 0}
                      className='px-2 py-1 text-sm rounded border dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      ‹
                    </button>
                    <input
                      type='range'
                      min={0}
                      max={frames.length - 1}
                      value={framePreviewIndex}
                      onChange={e =>
                        setFramePreviewIndex(Number(e.target.value))
                      }
                      className='flex-1'
                    />
                    <button
                      onClick={() =>
                        setFramePreviewIndex(i =>
                          Math.min(frames.length - 1, i + 1)
                        )
                      }
                      disabled={framePreviewIndex === frames.length - 1}
                      className='px-2 py-1 text-sm rounded border dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      ›
                    </button>
                  </div>

                  <div className='flex items-start gap-4'>
                    <img
                      src={frames[framePreviewIndex].dataUrl}
                      alt={frames[framePreviewIndex].name}
                      className='h-32 w-auto rounded border dark:border-gray-600 object-contain'
                      style={{
                        background:
                          'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 8px 8px',
                      }}
                    />
                    <div className='text-sm space-y-1 text-gray-600 dark:text-gray-400'>
                      <p className='font-medium text-gray-800 dark:text-gray-200 break-all'>
                        {frames[framePreviewIndex].name}
                      </p>
                      <p>
                        {frames[framePreviewIndex].width}×
                        {frames[framePreviewIndex].height}px
                      </p>
                      <p>
                        Row {Math.floor(framePreviewIndex / cols)}, Col{' '}
                        {framePreviewIndex % cols}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export */}
          <div className='flex flex-wrap gap-4 items-center'>
            <button
              onClick={exportSpriteSheet}
              disabled={!allSameSize || frames.length === 0}
              className={`px-4 py-2 rounded font-medium ${
                allSameSize && frames.length > 0
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              Export Sprite Sheet
            </button>
            {!allSameSize && (
              <p className='text-sm text-red-600 dark:text-red-400'>
                Resolve size mismatches before exporting.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
