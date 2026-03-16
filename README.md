# AI Image Cleaner

一个帮助用户去除图片 AI 生成痕迹的 Web 应用，通过多种技术手段让 AI 生成的图片看起来更像真实拍摄的照片。

## 核心功能

### 1. 上传 AI 生成的图片
- 支持拖拽上传
- 支持 PNG, JPG, WebP, GIF 格式

### 2. 自动处理流程

#### 清除 EXIF 元数据
- 移除所有 AI 生成工具留下的元数据痕迹

#### 添加伪造相机数据
- 模拟真实相机拍摄信息
- 支持 8+ 种相机预设：
  - iPhone 15 Pro / 14 Pro
  - Sony A7 IV / A7 III
  - Canon EOS R5 / R6
  - Nikon Z8
  - Fujifilm X-T5

#### 添加胶片颗粒感
- 添加 3-5% 随机噪点
- 模拟胶片摄影效果

#### 轻微重采样
- 随机缩放 0.9-1.1 倍
- 使用 Lanczos3 算法保持质量

#### 轻微旋转
- 随机旋转 -1° 到 1°
- 模拟手持拍摄的自然倾斜

#### 色彩空间转换（可选）
- sRGB → Adobe RGB → sRGB
- 改变色彩特征

### 3. 下载处理后的图片
- 处理前后对比预览
- 支持缩放查看细节
- 一键下载

## 技术栈

- **框架**: Next.js 16 + React 19 + TypeScript
- **样式**: Tailwind CSS
- **图片处理**: Sharp
- **UI 组件**: Lucide React
- **文件上传**: React Dropzone

## 项目结构

```
ai-image-cleaner/
├── app/
│   ├── api/
│   │   └── process/
│   │       └── route.ts      # 图片处理 API
│   ├── components/
│   │   ├── UploadZone.tsx    # 拖拽上传组件
│   │   ├── ProcessOptions.tsx # 处理选项面板
│   │   └── ImageComparison.tsx # 图片对比组件
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面
├── next.config.ts            # Next.js 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 运行方式

### 开发模式
```bash
npm install
npm run dev
```

### 生产构建
```bash
npm run build
npm start
```

## 注意事项

1. **本地处理**: 所有图片处理都在服务器本地完成，不会上传到第三方服务
2. **隐私保护**: 处理后的图片不会保留在服务器上
3. **效果说明**: 处理效果因原图质量而异，建议多次尝试不同组合

## 免责声明

本工具仅供学习和研究使用，请勿用于非法目的。用户应遵守各平台的使用条款和相关法律法规。
