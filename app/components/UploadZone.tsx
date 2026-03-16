'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onImageUpload: (file: File) => void;
}

export default function UploadZone({ onImageUpload }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300 ease-in-out
        ${isDragActive 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
          : isDragReject
          ? 'border-red-500 bg-red-500/10'
          : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/50'
        }
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-4">
        <div className={`
          p-4 rounded-full transition-all duration-300
          ${isDragActive ? 'bg-blue-500/20' : 'bg-gray-700/50'}
        `}>
          {isDragActive ? (
            <ImageIcon className="w-10 h-10 text-blue-400" />
          ) : (
            <Upload className="w-10 h-10 text-gray-400" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-200">
            {isDragActive ? '释放以上传图片' : '拖拽图片到此处'}
          </p>
          <p className="text-sm text-gray-500">
            或点击选择文件
          </p>
          <p className="text-xs text-gray-600">
            支持 PNG, JPG, WebP, GIF
          </p>
        </div>
      </div>
    </div>
  );
}
