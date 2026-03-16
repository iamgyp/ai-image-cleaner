'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { compressImage, formatFileSize, CompressionResult } from '../utils/imageCompression';

interface UploadZoneProps {
  onImageUpload: (file: File, compressionInfo?: CompressionResult) => void;
}

export default function UploadZone({ onImageUpload }: UploadZoneProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsCompressing(true);
    setCompressionProgress('正在检查图片...');
    setCompressionResult(null);

    try {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件');
      }

      // 检查文件大小
      const maxSizeMB = 4;
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > maxSizeMB) {
        setCompressionProgress(`图片较大 (${formatFileSize(file.size)})，正在压缩...`);
      } else {
        setCompressionProgress('正在优化图片...');
      }

      // 压缩图片
      const result = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.88,
        maxFileSizeMB: maxSizeMB,
      });

      setCompressionResult(result);

      // 短暂显示压缩结果
      setTimeout(() => {
        onImageUpload(result.file, result);
        setIsCompressing(false);
        setCompressionProgress('');
        setCompressionResult(null);
      }, 500);
    } catch (error) {
      console.error('图片处理失败:', error);
      setCompressionProgress('处理失败，请重试');
      setIsCompressing(false);
    }
  }, [onImageUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: isCompressing,
  });

  // 显示文件拒绝错误
  const fileRejectionErrors = fileRejections.map(({ file, errors }) => (
    <div key={file.name} className="text-red-400 text-sm">
      {errors.map(e => <span key={e.code}>{e.message}</span>)}
    </div>
  ));

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isCompressing
            ? 'border-blue-400 bg-blue-500/5 cursor-not-allowed'
            : isDragActive
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
            : isDragReject
            ? 'border-red-500 bg-red-500/10'
            : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/50'
          }
        `}
      >
        <input {...getInputProps()} disabled={isCompressing} />

        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full transition-all duration-300
            ${isDragActive ? 'bg-blue-500/20' : isCompressing ? 'bg-blue-500/20' : 'bg-gray-700/50'}
          `}>
            {isCompressing ? (
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            ) : isDragActive ? (
              <ImageIcon className="w-10 h-10 text-blue-400" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-200">
              {isCompressing
                ? compressionProgress
                : isDragActive
                ? '释放以上传图片'
                : '拖拽图片到此处'}
            </p>
            {!isCompressing && (
              <>
                <p className="text-sm text-gray-500">
                  或点击选择文件
                </p>
                <p className="text-xs text-gray-600">
                  支持 PNG, JPG, WebP, GIF（自动压缩至 4MB 以下）
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 压缩结果显示 */}
      {compressionResult && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">图片已优化</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>原始大小:</span>
              <span>{formatFileSize(compressionResult.originalSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>压缩后:</span>
              <span className="text-green-400">{formatFileSize(compressionResult.compressedSize)}</span>
            </div>
            {compressionResult.compressionRatio < 1 && (
              <div className="flex justify-between">
                <span>压缩率:</span>
                <span className="text-green-400">
                  {((1 - compressionResult.compressionRatio) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 文件拒绝错误 */}
      {fileRejectionErrors.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          {fileRejectionErrors}
        </div>
      )}
    </div>
  );
}
