'use client';

import React, { useState, useCallback } from 'react';
import UploadZone from './components/UploadZone';
import ProcessOptionsPanel from './components/ProcessOptions';
import ImageComparison from './components/ImageComparison';
import { ProcessOptions, DEFAULT_OPTIONS } from './types';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<ProcessOptions>(DEFAULT_OPTIONS);
  const [selectedCamera, setSelectedCamera] = useState('iphone15');
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setUploadedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleProcess = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedFile);
      formData.append('options', JSON.stringify(options));
      formData.append('cameraId', selectedCamera);

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setUploadedFile(null);
    setError(null);
    setOptions(DEFAULT_OPTIONS);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">AI Image Cleaner</h1>
                <p className="text-xs text-gray-500">去除 AI 生成痕迹 · 绕过检测</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>智能处理</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!originalImage ? (
          // Upload State
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-100 mb-3">
                去除图片的 AI 生成痕迹
              </h2>
              <p className="text-gray-400 max-w-md mx-auto">
                通过清除元数据、添加胶片颗粒感、轻微变换等方式，
                让你的图片看起来更像真实拍摄的照片
              </p>
            </div>
            
            <UploadZone onImageUpload={handleImageUpload} />
            
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="text-2xl font-bold text-blue-400 mb-1">8+</div>
                <div className="text-xs text-gray-500">相机预设</div>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="text-2xl font-bold text-green-400 mb-1">100%</div>
                <div className="text-xs text-gray-500">本地处理</div>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="text-2xl font-bold text-purple-400 mb-1">6</div>
                <div className="text-xs text-gray-500">处理步骤</div>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <div className="text-2xl font-bold text-orange-400 mb-1">0</div>
                <div className="text-xs text-gray-500">数据上传</div>
              </div>
            </div>
          </div>
        ) : (
          // Processing State
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Options */}
            <div className="space-y-6">
              <ProcessOptionsPanel
                options={options}
                onOptionsChange={setOptions}
                selectedCamera={selectedCamera}
                onCameraChange={setSelectedCamera}
              />
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
              
              {!processedImage && (
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 
                           disabled:cursor-not-allowed text-white font-semibold rounded-xl
                           transition-all duration-200 shadow-lg shadow-blue-500/20
                           flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      开始处理
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Column - Preview */}
            <div>
              {processedImage ? (
                <ImageComparison
                  originalImage={originalImage}
                  processedImage={processedImage}
                  isProcessing={isProcessing}
                  onReset={handleReset}
                />
              ) : (
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">预览</h3>
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <img
                      src={originalImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    点击"开始处理"应用选定的效果
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
