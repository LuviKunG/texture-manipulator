'use client';

import { DragEvent } from 'react';
import { useDragDropUpload } from '../hooks/useDragDropUpload';

interface DragDropUploadBigProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  isDragOver?: boolean;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  className?: string;
  placeholder?: string;
}

export default function DragDropUploadBig({
  onFileSelect,
  accept = 'image/*',
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  className = '',
  placeholder,
}: DragDropUploadBigProps) {
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
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
      <div className='space-y-2'>
        <div className='text-gray-600'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400'
            stroke='currentColor'
            fill='none'
            viewBox='0 0 48 48'
          >
            <path
              d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <div className='text-sm text-gray-600'>
          <span className='font-medium text-blue-600 hover:text-blue-500'>
            Click to upload
          </span>{' '}
          or drag and drop
        </div>
        <div className='text-xs text-gray-500'>
          {placeholder || 'PNG, JPG, GIF up to 10MB'}
        </div>
      </div>
    </div>
  );
}
