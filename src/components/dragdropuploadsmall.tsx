'use client';

import { DragEvent } from 'react';
import { useDragDropUpload } from '../hooks/useDragDropUpload';

interface DragDropUploadSmallProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  isDragOver?: boolean;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  className?: string;
  placeholder?: string;
}

export default function DragDropUploadSmall({
  onFileSelect,
  accept = 'image/*',
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  className = '',
  placeholder,
}: DragDropUploadSmallProps) {
  const {
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    accept: acceptFromHook,
  } = useDragDropUpload({
    onFileSelect,
    accept,
    onDragOver,
    onDragLeave,
    onDrop,
  });

  return (
    <div
      className={`relative border-2 border-dashed rounded p-4 text-center transition-colors ${
        isDragOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type='file'
        accept={acceptFromHook}
        onChange={handleFileSelect}
        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
      />
      <div className='text-xs text-gray-600'>
        {placeholder || 'Click or drag texture'}
      </div>
    </div>
  );
}
