'use client';

import React from 'react';
import { ProcessOptions as ProcessOptionsType, CameraType, CAMERA_PRESETS } from '../types';
import { Check, Camera, Shuffle, RotateCw, Palette, Eraser } from 'lucide-react';

interface ProcessOptionsProps {
  options: ProcessOptionsType;
  onOptionsChange: (options: ProcessOptionsType) => void;
  selectedCamera: string;
  onCameraChange: (cameraId: string) => void;
}

interface OptionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function OptionCard({ title, description, icon, checked, onChange, disabled }: OptionCardProps) {
  return (
    <div
      onClick={() => !disabled && onChange()}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${disabled 
          ? 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed' 
          : checked 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg transition-colors
          ${checked ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-400'}
        `}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-200 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className={`
          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
          ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}
        `}>
          {checked && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
    </div>
  );
}

export default function ProcessOptionsPanel({
  options,
  onOptionsChange,
  selectedCamera,
  onCameraChange,
}: ProcessOptionsProps) {
  const toggleOption = (key: keyof ProcessOptionsType) => {
    onOptionsChange({ ...options, [key]: !options[key] });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-200">处理选项</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <OptionCard
          title="清除 EXIF 元数据"
          description="移除所有元数据信息"
          icon={<Eraser className="w-5 h-5" />}
          checked={options.clearExif}
          onChange={() => toggleOption('clearExif')}
        />
        
        <OptionCard
          title="添加伪造相机数据"
          description="模拟真实相机拍摄信息"
          icon={<Camera className="w-5 h-5" />}
          checked={options.addFakeCameraData}
          onChange={() => toggleOption('addFakeCameraData')}
          disabled={!options.clearExif}
        />
        
        <OptionCard
          title="添加胶片颗粒感"
          description="添加 3-5% 噪点模拟胶片效果"
          icon={<Shuffle className="w-5 h-5" />}
          checked={options.addFilmGrain}
          onChange={() => toggleOption('addFilmGrain')}
        />
        
        <OptionCard
          title="轻微重采样"
          description="随机缩放 0.9-1.1 倍"
          icon={<Palette className="w-5 h-5" />}
          checked={options.resample}
          onChange={() => toggleOption('resample')}
        />
        
        <OptionCard
          title="轻微旋转"
          description="随机旋转 -1° 到 1°"
          icon={<RotateCw className="w-5 h-5" />}
          checked={options.rotate}
          onChange={() => toggleOption('rotate')}
        />
        
        <OptionCard
          title="色彩空间转换"
          description="sRGB → Adobe RGB → sRGB"
          icon={<Palette className="w-5 h-5" />}
          checked={options.colorSpaceConversion}
          onChange={() => toggleOption('colorSpaceConversion')}
        />
      </div>

      {options.addFakeCameraData && options.clearExif && (
        <div className="pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            选择相机型号
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => onCameraChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
          >
            {CAMERA_PRESETS.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
