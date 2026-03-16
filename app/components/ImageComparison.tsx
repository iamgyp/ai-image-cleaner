'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageComparisonProps {
  originalImage: string;
  processedImage: string;
  isProcessing: boolean;
  onReset: () => void;
}

export default function ImageComparison({
  originalImage,
  processedImage,
  isProcessing,
  onReset,
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `cleaned_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-200">处理结果</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-700 cursor-ew-resize select-none"
        style={{ height: '400px' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-400">处理中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Original Image (Background) */}
            <img
              src={originalImage}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain bg-gray-950"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
            
            {/* Processed Image (Foreground with clip) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={processedImage}
                alt="Processed"
                className="absolute inset-0 w-full h-full object-contain bg-gray-950"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize z-10"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-white/70"></div>
                  <div className="w-0.5 h-3 bg-white/70"></div>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg text-xs font-medium text-gray-300">
              原始图片
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-500/80 rounded-lg text-xs font-medium text-white">
              处理后
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 
                     disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl
                     transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          <Download className="w-5 h-5" />
          下载处理后的图片
        </button>
        <button
          onClick={onReset}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 
                     disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 font-medium rounded-xl
                     transition-all duration-200"
        >
          <RefreshCw className="w-5 h-5" />
          重置
        </button>
      </div>
    </div>
  );
}
