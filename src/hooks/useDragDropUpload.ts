'use client';

import { useRef, ChangeEvent, DragEvent } from 'react';

interface UseDragDropUploadProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
}

export function useDragDropUpload({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  accept = 'image/*',
  onDragOver,
  onDragLeave,
  onDrop,
}: UseDragDropUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (multiple && onFilesSelect) {
      onFilesSelect(Array.from(e.target.files));
    } else {
      const file = e.target.files[0];
      if (file) onFileSelect?.(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragLeave?.(e);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop?.(e);
    if (multiple && onFilesSelect) {
      const files = Array.from(e.dataTransfer.files).filter(f =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) onFilesSelect(files);
    } else {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) onFileSelect?.(file);
    }
  };

  return {
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    accept,
  };
}
