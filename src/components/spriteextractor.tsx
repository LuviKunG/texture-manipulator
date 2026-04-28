'use client';

import { useState, useRef, useEffect, useCallback, DragEvent } from 'react';
import DragDropUploadBig from './dragdropuploadbig';

interface SpriteRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Mode = 'select' | 'create';

export default function SpriteExtractor() {
  const [originalTexture, setOriginalTexture] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const [spriteRects, setSpriteRects] = useState<SpriteRect[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('create');

  // Creation drag state
  const [isCreating, setIsCreating] = useState(false);
  const [createStart, setCreateStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [createCurrent, setCreateCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Resize drag state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [resizeStartRect, setResizeStartRect] = useState<SpriteRect | null>(
    null
  );

  // Move drag state
  const [isMoving, setIsMoving] = useState(false);
  const [moveStartPos, setMoveStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [moveStartRect, setMoveStartRect] = useState<SpriteRect | null>(null);

  // Extracted sprites
  const [extractedSprites, setExtractedSprites] = useState<string[]>([]);

  // Grid tool state
  const [showGridTool, setShowGridTool] = useState(false);
  const [gridCellWidth, setGridCellWidth] = useState(32);
  const [gridCellHeight, setGridCellHeight] = useState(32);
  const [gridOffsetX, setGridOffsetX] = useState(0);
  const [gridOffsetY, setGridOffsetY] = useState(0);
  const [gridSkipTransparent, setGridSkipTransparent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Drag and drop handlers
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
      loadImage(result);
      setSpriteRects([]);
      setSelectedIndex(null);
      setExtractedSprites([]);
    };
    reader.readAsDataURL(file);
  };

  const loadImage = (src: string) => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = src;
  };

  // Get mouse position relative to the canvas in image coordinates
  const getCanvasPos = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  // Check if a point is inside a rect
  const pointInRect = (px: number, py: number, r: SpriteRect): boolean => {
    return (
      px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height
    );
  };

  // Check if point is near a resize handle (corners), returns handle name
  const getResizeHandleAt = (
    px: number,
    py: number,
    r: SpriteRect
  ): string | null => {
    const handleSize = 8;
    const corners: Record<string, { x: number; y: number }> = {
      'top-left': { x: r.x, y: r.y },
      'top-right': { x: r.x + r.width, y: r.y },
      'bottom-left': { x: r.x, y: r.y + r.height },
      'bottom-right': { x: r.x + r.width, y: r.y + r.height },
    };
    for (const [name, corner] of Object.entries(corners)) {
      if (
        Math.abs(px - corner.x) <= handleSize &&
        Math.abs(py - corner.y) <= handleSize
      ) {
        return name;
      }
    }
    return null;
  };

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (mode === 'select') {
      // Check resize handles on selected rect first
      if (selectedIndex !== null) {
        const handle = getResizeHandleAt(
          pos.x,
          pos.y,
          spriteRects[selectedIndex]
        );
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setResizeStartPos(pos);
          setResizeStartRect({ ...spriteRects[selectedIndex] });
          return;
        }
      }

      // Check if clicking inside the already-selected rect to start moving
      if (
        selectedIndex !== null &&
        pointInRect(pos.x, pos.y, spriteRects[selectedIndex])
      ) {
        setIsMoving(true);
        setMoveStartPos(pos);
        setMoveStartRect({ ...spriteRects[selectedIndex] });
        return;
      }

      // Check if clicking on any rect
      for (let i = spriteRects.length - 1; i >= 0; i--) {
        if (pointInRect(pos.x, pos.y, spriteRects[i])) {
          setSelectedIndex(i);
          return;
        }
      }
      setSelectedIndex(null);
    } else {
      // Create mode
      setIsCreating(true);
      setCreateStart(pos);
      setCreateCurrent(pos);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (mode === 'create' && isCreating && createStart) {
      setCreateCurrent(pos);
    }

    if (
      mode === 'select' &&
      isMoving &&
      moveStartPos &&
      moveStartRect &&
      selectedIndex !== null
    ) {
      const dx = pos.x - moveStartPos.x;
      const dy = pos.y - moveStartPos.y;
      const newX = Math.max(
        0,
        Math.min(
          moveStartRect.x + dx,
          imageDimensions.width - moveStartRect.width
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          moveStartRect.y + dy,
          imageDimensions.height - moveStartRect.height
        )
      );
      const r = {
        ...moveStartRect,
        x: newX,
        y: newY,
      };

      setSpriteRects(prev => {
        const updated = [...prev];
        updated[selectedIndex] = r;
        return updated;
      });
    }

    if (
      mode === 'select' &&
      isResizing &&
      resizeStartPos &&
      resizeStartRect &&
      selectedIndex !== null
    ) {
      const dx = pos.x - resizeStartPos.x;
      const dy = pos.y - resizeStartPos.y;
      const r = { ...resizeStartRect };

      switch (resizeHandle) {
        case 'top-left':
          r.x = Math.max(0, resizeStartRect.x + dx);
          r.y = Math.max(0, resizeStartRect.y + dy);
          r.width = Math.max(1, resizeStartRect.width - dx);
          r.height = Math.max(1, resizeStartRect.height - dy);
          break;
        case 'top-right':
          r.y = Math.max(0, resizeStartRect.y + dy);
          r.width = Math.max(1, resizeStartRect.width + dx);
          r.height = Math.max(1, resizeStartRect.height - dy);
          break;
        case 'bottom-left':
          r.x = Math.max(0, resizeStartRect.x + dx);
          r.width = Math.max(1, resizeStartRect.width - dx);
          r.height = Math.max(1, resizeStartRect.height + dy);
          break;
        case 'bottom-right':
          r.width = Math.max(1, resizeStartRect.width + dx);
          r.height = Math.max(1, resizeStartRect.height + dy);
          break;
      }

      setSpriteRects(prev => {
        const updated = [...prev];
        updated[selectedIndex] = r;
        return updated;
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (mode === 'create' && isCreating && createStart && createCurrent) {
      const x = Math.max(0, Math.min(createStart.x, createCurrent.x));
      const y = Math.max(0, Math.min(createStart.y, createCurrent.y));
      const width = Math.abs(createCurrent.x - createStart.x);
      const height = Math.abs(createCurrent.y - createStart.y);

      if (width > 0 && height > 0) {
        setSpriteRects(prev => [...prev, { x, y, width, height }]);
        setSelectedIndex(spriteRects.length);
      }

      setIsCreating(false);
      setCreateStart(null);
      setCreateCurrent(null);
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartPos(null);
      setResizeStartRect(null);
    }

    if (isMoving) {
      setIsMoving(false);
      setMoveStartPos(null);
      setMoveStartRect(null);
    }
  };

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !originalTexture) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw all rects
    spriteRects.forEach((rect, i) => {
      const isSelected = i === selectedIndex;

      // Fill
      ctx.fillStyle = isSelected
        ? 'rgba(59, 130, 246, 0.2)'
        : 'rgba(234, 179, 8, 0.15)';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

      // Border
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      // Label
      ctx.fillStyle = isSelected ? '#3b82f6' : '#eab308';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`#${i}`, rect.x + 4, rect.y + 16);

      // Resize handles for selected rect
      if (isSelected && mode === 'select') {
        const handleSize = 6;
        ctx.fillStyle = '#3b82f6';
        const corners = [
          { x: rect.x, y: rect.y },
          { x: rect.x + rect.width, y: rect.y },
          { x: rect.x, y: rect.y + rect.height },
          { x: rect.x + rect.width, y: rect.y + rect.height },
        ];
        corners.forEach(c => {
          ctx.fillRect(
            c.x - handleSize / 2,
            c.y - handleSize / 2,
            handleSize,
            handleSize
          );
        });
      }
    });

    // Draw creation preview
    if (isCreating && createStart && createCurrent) {
      const x = Math.min(createStart.x, createCurrent.x);
      const y = Math.min(createStart.y, createCurrent.y);
      const w = Math.abs(createCurrent.x - createStart.x);
      const h = Math.abs(createCurrent.y - createStart.y);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }, [
    originalTexture,
    spriteRects,
    selectedIndex,
    mode,
    isCreating,
    createStart,
    createCurrent,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Keyboard handler for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedIndex !== null) {
        deleteRect(selectedIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const deleteRect = (index: number) => {
    setSpriteRects(prev => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  // Update a specific rect field with validation
  const updateRect = (
    index: number,
    field: keyof SpriteRect,
    value: number
  ) => {
    setSpriteRects(prev => {
      const updated = [...prev];
      const rect = { ...updated[index] };

      if (field === 'x' || field === 'y') {
        rect[field] = Math.max(0, value);
      } else {
        // width, height: must be >= 1
        rect[field] = Math.max(1, value);
      }

      updated[index] = rect;
      return updated;
    });
  };

  // Export all sprite rects as individual images
  const exportSprites = () => {
    const img = imageRef.current;
    if (!img || spriteRects.length === 0) return;

    const results: string[] = [];

    spriteRects.forEach(rect => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        img,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      results.push(canvas.toDataURL('image/png'));
    });

    setExtractedSprites(results);
  };

  const downloadSprite = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `sprite-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAll = () => {
    setOriginalTexture(null);
    setSpriteRects([]);
    setSelectedIndex(null);
    setExtractedSprites([]);
    imageRef.current = null;
    setImageDimensions({ width: 0, height: 0 });
  };

  // Check if a cell region has any non-transparent pixels
  const isCellNonTransparent = (
    pixels: Uint8ClampedArray,
    imgWidth: number,
    cellX: number,
    cellY: number,
    cellW: number,
    cellH: number
  ): boolean => {
    for (let py = cellY; py < cellY + cellH; py++) {
      for (let px = cellX; px < cellX + cellW; px++) {
        const idx = (py * imgWidth + px) * 4;
        if (pixels[idx + 3] > 0) {
          return true;
        }
      }
    }
    return false;
  };

  // Generate grid of rectangles
  const generateGrid = () => {
    if (gridCellWidth < 1 || gridCellHeight < 1) return;

    // Get pixel data if transparency detection is enabled
    let pixels: Uint8ClampedArray | null = null;
    if (gridSkipTransparent && imageRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageRef.current, 0, 0);
        pixels = ctx.getImageData(
          0,
          0,
          imageDimensions.width,
          imageDimensions.height
        ).data;
      }
    }

    const rects: SpriteRect[] = [];
    const startX = Math.max(0, gridOffsetX);
    const startY = Math.max(0, gridOffsetY);
    for (
      let y = startY;
      y + gridCellHeight <= imageDimensions.height;
      y += gridCellHeight
    ) {
      for (
        let x = startX;
        x + gridCellWidth <= imageDimensions.width;
        x += gridCellWidth
      ) {
        if (
          gridSkipTransparent &&
          pixels &&
          !isCellNonTransparent(
            pixels,
            imageDimensions.width,
            x,
            y,
            gridCellWidth,
            gridCellHeight
          )
        ) {
          continue;
        }
        rects.push({ x, y, width: gridCellWidth, height: gridCellHeight });
      }
    }
    setSpriteRects(prev => [...prev, ...rects]);
    setSelectedIndex(null);
    setExtractedSprites([]);
  };

  return (
    <div className='p-4 space-y-6'>
      <h2 className='text-xl font-bold'>Sprite Extractor</h2>

      <p className='text-gray-600 text-sm'>
        Upload a sprite sheet, define rectangular regions, and export each
        sprite as an individual image.
      </p>

      {/* Upload */}
      {!originalTexture && (
        <DragDropUploadBig
          onFileSelect={processFile}
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}

      {originalTexture && (
        <>
          {/* Mode Toggle & Actions */}
          <div className='flex gap-4 items-center flex-wrap'>
            {/* Mode buttons */}
            <div className='flex gap-1 border rounded p-1 dark:border-gray-700'>
              <button
                onClick={() => setMode('create')}
                title='Create Mode'
                className={`p-2 rounded transition-colors ${
                  mode === 'create'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='w-5 h-5'
                >
                  <rect x='3' y='3' width='18' height='18' rx='2' />
                  <line x1='12' y1='8' x2='12' y2='16' />
                  <line x1='8' y1='12' x2='16' y2='12' />
                </svg>
              </button>
              <button
                onClick={() => setMode('select')}
                title='Select Mode'
                className={`p-2 rounded transition-colors ${
                  mode === 'select'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='w-5 h-5'
                >
                  <path d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z' />
                  <path d='M13 13l6 6' />
                </svg>
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={exportSprites}
              disabled={spriteRects.length === 0}
              className={`px-4 py-2 rounded font-medium ${
                spriteRects.length > 0
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Export Sprites ({spriteRects.length})
            </button>

            <button
              onClick={() => {
                setSpriteRects([]);
                setSelectedIndex(null);
                setExtractedSprites([]);
              }}
              disabled={spriteRects.length === 0}
              className={`px-4 py-2 rounded font-medium ${
                spriteRects.length > 0
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Clear All Rects
            </button>

            <button
              onClick={clearAll}
              className='px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600'
            >
              Clear All
            </button>
          </div>

          {/* Grid Tool */}
          <div className='space-y-2'>
            <button
              onClick={() => setShowGridTool(!showGridTool)}
              className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
                className='w-4 h-4'
              >
                <rect x='3' y='3' width='7' height='7' />
                <rect x='14' y='3' width='7' height='7' />
                <rect x='3' y='14' width='7' height='7' />
                <rect x='14' y='14' width='7' height='7' />
              </svg>
              Grid Tool
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
                className={`w-4 h-4 transition-transform ${showGridTool ? 'rotate-180' : ''}`}
              >
                <polyline points='6 9 12 15 18 9' />
              </svg>
            </button>

            {showGridTool && (
              <div className='border rounded p-4 space-y-3 dark:border-gray-700'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  Auto-generate a grid of rectangles across the image based on
                  cell size and optional offset.
                </p>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <label className='space-y-1'>
                    <span className='block text-xs font-medium text-gray-600 dark:text-gray-400'>
                      Cell Width
                    </span>
                    <input
                      type='number'
                      value={gridCellWidth}
                      min={1}
                      onChange={e =>
                        setGridCellWidth(Math.max(1, Number(e.target.value)))
                      }
                      className='w-full border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </label>
                  <label className='space-y-1'>
                    <span className='block text-xs font-medium text-gray-600 dark:text-gray-400'>
                      Cell Height
                    </span>
                    <input
                      type='number'
                      value={gridCellHeight}
                      min={1}
                      onChange={e =>
                        setGridCellHeight(Math.max(1, Number(e.target.value)))
                      }
                      className='w-full border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </label>
                  <label className='space-y-1'>
                    <span className='block text-xs font-medium text-gray-600 dark:text-gray-400'>
                      Offset X
                    </span>
                    <input
                      type='number'
                      value={gridOffsetX}
                      min={0}
                      onChange={e =>
                        setGridOffsetX(Math.max(0, Number(e.target.value)))
                      }
                      className='w-full border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </label>
                  <label className='space-y-1'>
                    <span className='block text-xs font-medium text-gray-600 dark:text-gray-400'>
                      Offset Y
                    </span>
                    <input
                      type='number'
                      value={gridOffsetY}
                      min={0}
                      onChange={e =>
                        setGridOffsetY(Math.max(0, Number(e.target.value)))
                      }
                      className='w-full border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                    />
                  </label>
                </div>
                <label className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                  <input
                    type='checkbox'
                    checked={gridSkipTransparent}
                    onChange={e => setGridSkipTransparent(e.target.checked)}
                    className='rounded'
                  />
                  Skip fully transparent cells
                </label>
                <div className='flex items-center gap-3'>
                  <button
                    onClick={generateGrid}
                    className='px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 text-sm'
                  >
                    Generate Grid
                  </button>
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    ≈{' '}
                    {Math.floor(
                      (imageDimensions.width - gridOffsetX) / gridCellWidth
                    ) *
                      Math.floor(
                        (imageDimensions.height - gridOffsetY) / gridCellHeight
                      )}{' '}
                    cells
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className='text-sm text-gray-600'>
            Image: {imageDimensions.width}×{imageDimensions.height} | Regions:{' '}
            {spriteRects.length}
            {selectedIndex !== null && ` | Selected: #${selectedIndex}`}
          </div>

          {/* Canvas */}
          <div className='border rounded overflow-auto'>
            <canvas
              ref={canvasRef}
              className='max-w-full h-auto cursor-crosshair'
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Sprite Rect Property List */}
          {spriteRects.length > 0 && (
            <div className='space-y-2'>
              <h3 className='font-semibold text-lg'>Sprite Regions</h3>
              <div className='space-y-2 max-h-80 overflow-y-auto'>
                {spriteRects.map((rect, i) => (
                  <div
                    key={i}
                    className={`border rounded p-3 flex flex-wrap gap-3 items-center text-sm cursor-pointer transition-colors ${
                      i === selectedIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <span className='font-mono font-bold w-8'>#{i}</span>
                    <label className='flex items-center gap-1'>
                      X:
                      <input
                        type='number'
                        value={rect.x}
                        min={0}
                        onChange={e =>
                          updateRect(i, 'x', Number(e.target.value))
                        }
                        onClick={e => e.stopPropagation()}
                        className='w-20 border rounded px-2 py-1'
                      />
                    </label>
                    <label className='flex items-center gap-1'>
                      Y:
                      <input
                        type='number'
                        value={rect.y}
                        min={0}
                        onChange={e =>
                          updateRect(i, 'y', Number(e.target.value))
                        }
                        onClick={e => e.stopPropagation()}
                        className='w-20 border rounded px-2 py-1'
                      />
                    </label>
                    <label className='flex items-center gap-1'>
                      W:
                      <input
                        type='number'
                        value={rect.width}
                        min={1}
                        onChange={e =>
                          updateRect(i, 'width', Number(e.target.value))
                        }
                        onClick={e => e.stopPropagation()}
                        className='w-20 border rounded px-2 py-1'
                      />
                    </label>
                    <label className='flex items-center gap-1'>
                      H:
                      <input
                        type='number'
                        value={rect.height}
                        min={1}
                        onChange={e =>
                          updateRect(i, 'height', Number(e.target.value))
                        }
                        onClick={e => e.stopPropagation()}
                        className='w-20 border rounded px-2 py-1'
                      />
                    </label>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteRect(i);
                      }}
                      className='px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 ml-auto'
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Sprites */}
          {extractedSprites.length > 0 && (
            <div className='space-y-2'>
              <h3 className='font-semibold text-lg'>Extracted Sprites</h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {extractedSprites.map((sprite, i) => (
                  <div key={i} className='border rounded p-3 space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='font-mono text-sm font-bold'>#{i}</span>
                      <button
                        onClick={() => downloadSprite(sprite, i)}
                        className='px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600'
                      >
                        Download
                      </button>
                    </div>
                    <img
                      src={sprite}
                      alt={`Sprite ${i}`}
                      className='w-full h-auto border rounded bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-size-[16px_16px]'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
