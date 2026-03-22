import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Grid2X2,
  Grid3X3,
  Palette,
  RotateCcw,
  Github,
  LayoutGrid,
  Upload,
  CloudUpload,
  Circle,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Monitor,
  Smartphone,
  Maximize,
  Scaling,
  PaintBucket,
  Shuffle,
  Zap,
  Settings,
  FileImage,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CollageGrid } from './components/CollageGrid';
import { CollageItem, LayoutType } from './types';
import { compressImage } from './utils/imageCompressor';

// Placeholder images from Picsum - Downscaled to 400px to fix massive lagging out on slow networks and low-end GPUs during dragging and loading
const DEFAULT_IMAGES = [
  'https://picsum.photos/id/10/400/400',
  'https://picsum.photos/id/14/400/400',
  'https://picsum.photos/id/28/400/400',
  'https://picsum.photos/id/43/400/400',
  'https://picsum.photos/id/55/400/400',
  'https://picsum.photos/id/65/400/400',
  'https://picsum.photos/id/88/400/400',
  'https://picsum.photos/id/103/400/400',
  'https://picsum.photos/id/106/400/400',
];

const BACKGROUND_OPTIONS = [
  { name: '纯白', value: 'bg-white' },
  { name: '纯黑', value: 'bg-slate-900' },
  { name: '米色', value: 'bg-orange-50' },
  { name: '淡紫', value: 'bg-purple-50' },
  { name: '极光', value: 'bg-gradient-to-br from-emerald-400 to-cyan-400' },
  { name: '落日', value: 'bg-gradient-to-br from-orange-400 to-rose-400' },
  { name: '深海', value: 'bg-gradient-to-br from-blue-800 to-indigo-900' },
];

// Extracted Toolbar component from the sidebar to limit re-renders
const SettingsSidebar = React.memo(({ 
  layout, setLayout, 
  gap, setGap, 
  outerPadding, setOuterPadding, 
  borderRadius, setBorderRadius,
  aspectRatio, setAspectRatio,
  backgroundClass, setBackgroundClass,
  exportFormat, setExportFormat,
  exportQuality, setExportQuality,
  handleDownload, isExporting, 
  handleGlobalUpload, shuffleItems, setItems 
}: any) => {
  // UI State (Collapsible Sections)
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(true); // Open by default
  const [isRatioOpen, setIsRatioOpen] = useState(true);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);

  // Feature: Seamless Mode
  const setSeamlessMode = useCallback(() => {
    setGap(0);
    setOuterPadding(0);
    setBorderRadius(0);
  }, [setGap, setOuterPadding, setBorderRadius]);

  const ratioOptions = [
    { label: '3:4', value: '3 / 4', icon: RectangleVertical },
    { label: '2:3', value: '2 / 3', icon: RectangleVertical },
    { label: '1:1', value: '1 / 1', icon: Square },
    { label: '4:3', value: '4 / 3', icon: RectangleHorizontal },
    { label: '16:9', value: '16 / 9', icon: Monitor },
    { label: '9:16', value: '9 / 16', icon: Smartphone },
  ];

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-5 order-2 pb-24 z-10 relative">
      <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-xl shadow-indigo-100/50 border border-white/50 space-y-4">
        <label
          htmlFor="bulk-upload"
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl p-4 cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center gap-2 text-center shadow-inner hover:shadow-indigo-100"
        >
          <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
             <CloudUpload size={24} className="text-indigo-500 group-hover:text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700 font-display">批量添加图片</span>
          <span className="text-[10px] text-slate-400">支持拖拽或点击上传</span>
          <input id="bulk-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleGlobalUpload} />
        </label>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="relative w-full overflow-hidden flex items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-indigo-500/30 hover:-translate-y-1 font-display font-semibold text-base disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          {isExporting ? '正在极速渲染...' : '下载高清大图'}
          {!isExporting && <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
        </button>
      </div>

      {/* 1. Export Settings */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/40 border border-white/50 overflow-hidden text-sm">
        <button
          onClick={() => setIsExportOpen(!isExportOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <h3 className="font-display font-semibold text-slate-700 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><Settings size={14} /></div> 导出设置
          </h3>
          <div className={`transition-transform duration-300 ${isExportOpen ? 'rotate-180' : ''}`}>
             <ChevronDown size={16} className="text-slate-400" />
          </div>
        </button>

        {isExportOpen && (
          <div className="px-4 pb-5 space-y-4 animate-fade-in border-t border-slate-100/50 pt-4">
            <div>
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 mb-2"><FileImage size={12} /> 图片格式</label>
              <div className="relative">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="jpeg">JPG (通用)</option>
                  <option value="png">PNG (无损 - 极大)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {exportFormat !== 'png' && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-medium text-slate-600 flex items-center gap-1.5"><Sliders size={14} /> 压缩质量</label>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${exportQuality > 0.9 ? 'bg-green-100 text-green-700' :
                    exportQuality > 0.7 ? 'bg-indigo-100 text-indigo-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                    {Math.round(exportQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range" min="0.1" max="1.0" step="0.01"
                  value={exportQuality}
                  onChange={(e) => setExportQuality(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Layout & Actions */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/40 border border-white/50 overflow-hidden text-sm">
        <button
          onClick={() => setIsLayoutOpen(!isLayoutOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <h3 className="font-display font-semibold text-slate-700 flex items-center gap-2">
             <div className="p-1.5 bg-fuchsia-100 text-fuchsia-600 rounded-md"><Grid2X2 size={14} /></div> 布局与操作
          </h3>
          <div className={`transition-transform duration-300 ${isLayoutOpen ? 'rotate-180' : ''}`}>
             <ChevronDown size={16} className="text-slate-400" />
          </div>
        </button>

        {isLayoutOpen && (
          <div className="px-4 pb-5 space-y-4 animate-fade-in border-t border-slate-100/50 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLayout(LayoutType.GRID_2X2)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${layout === LayoutType.GRID_2X2
                  ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-md shadow-indigo-100'
                  : 'border-transparent bg-slate-100 hover:bg-slate-200/70 text-slate-500'
                  }`}
              >
                <Grid2X2 size={24} className="mb-2" />
                <span className="text-xs font-bold font-display tracking-wider">2 x 2</span>
              </button>
              <button
                onClick={() => setLayout(LayoutType.GRID_3X3)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${layout === LayoutType.GRID_3X3
                  ? 'border-fuchsia-500 bg-fuchsia-50/80 text-fuchsia-700 shadow-md shadow-fuchsia-100'
                  : 'border-transparent bg-slate-100 hover:bg-slate-200/70 text-slate-500'
                  }`}
              >
                <Grid3X3 size={24} className="mb-2" />
                <span className="text-xs font-bold font-display tracking-wider">3 x 3</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shuffleItems}
                className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md transition-all font-medium text-xs"
              >
                <Shuffle size={14} />
                <span>随机位置</span>
              </button>
              <button
                onClick={() => setItems((prev: any[]) => {
                  prev.forEach(item => {
                    if (item.url.startsWith('blob:')) {
                      URL.revokeObjectURL(item.url);
                    }
                  });
                  return prev.map((item, idx) => ({ ...item, url: DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length] + `?r=${Date.now()}` }));
                })}
                className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-xl hover:border-rose-300 hover:text-rose-600 hover:shadow-md transition-all font-medium text-xs"
              >
                <RotateCcw size={14} />
                <span>重置图片</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Dimensions */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/40 border border-white/50 overflow-hidden text-sm">
        <button
          onClick={() => setIsRatioOpen(!isRatioOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <h3 className="font-display font-semibold text-slate-700 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><Maximize size={14} /></div> 尺寸与比例
          </h3>
          <div className={`transition-transform duration-300 ${isRatioOpen ? 'rotate-180' : ''}`}>
             <ChevronDown size={16} className="text-slate-400" />
          </div>
        </button>

        {isRatioOpen && (
          <div className="px-4 pb-5 animate-fade-in border-t border-slate-100/50 pt-4">
            <div className="grid grid-cols-3 gap-2">
                {ratioOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button 
                      key={option.label} 
                      onClick={() => setAspectRatio(option.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        aspectRatio === option.value 
                        ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm' 
                        : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200/70'
                      }`}
                    >
                      <Icon size={18} className="mb-1" />
                      <span className="text-[10px] font-bold font-display tracking-widest">{option.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Styles */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/40 border border-white/50 overflow-hidden text-sm">
        <button
          onClick={() => setIsStyleOpen(!isStyleOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <h3 className="font-display font-semibold text-slate-700 flex items-center gap-2">
            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-md"><Palette size={14} /></div> 样式微调
          </h3>
          <div className={`transition-transform duration-300 ${isStyleOpen ? 'rotate-180' : ''}`}>
             <ChevronDown size={16} className="text-slate-400" />
          </div>
        </button>

        {isStyleOpen && (
          <div className="px-4 pb-5 space-y-5 animate-fade-in border-t border-slate-100/50 pt-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">快速预设</span>
              <button
                onClick={setSeamlessMode}
                className="text-xs bg-gradient-to-r from-rose-400 to-orange-400 text-white px-3 py-1.5 rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                ✨ 一键无缝
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-slate-600 flex items-center gap-1.5"><Scaling size={14} /> 画布外边距</label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono shadow-inner">{outerPadding}px</span>
                </div>
                <input
                  type="range" min="0" max="80" value={outerPadding}
                  onChange={(e) => setOuterPadding(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-slate-600 flex items-center gap-1.5"><LayoutGrid size={14} /> 图片间距</label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono shadow-inner">{gap}px</span>
                </div>
                <input
                  type="range" min="0" max="60" value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium text-slate-600 flex items-center gap-1.5"><Circle size={14} /> 圆角半径</label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono shadow-inner">{borderRadius}px</span>
                </div>
                <input
                  type="range" min="0" max="80" value={borderRadius}
                  onChange={(e) => setBorderRadius(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Background Color */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/40 border border-white/50 overflow-hidden text-sm">
        <button
          onClick={() => setIsBackgroundOpen(!isBackgroundOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <h3 className="font-display font-semibold text-slate-700 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md"><PaintBucket size={14} /></div> 背景风格
          </h3>
          <div className={`transition-transform duration-300 ${isBackgroundOpen ? 'rotate-180' : ''}`}>
             <ChevronDown size={16} className="text-slate-400" />
          </div>
        </button>

        {isBackgroundOpen && (
          <div className="px-4 pb-5 animate-fade-in border-t border-slate-100/50 pt-4">
            <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_OPTIONS.map((bg) => (
                  <button 
                    key={bg.name}
                    onClick={() => setBackgroundClass(bg.value)}
                    className={`h-10 rounded-xl font-medium text-xs border-2 transition-all overflow-hidden relative shadow-sm hover:shadow-md ${
                      backgroundClass === bg.value ? 'border-emerald-500 ring-2 ring-emerald-200 outline-none text-slate-800' : 'border-transparent text-slate-600'
                    }`}
                  >
                    <div className={`absolute inset-0 ${bg.value} opacity-20`}></div>
                    <span className="relative z-10 mix-blend-hard-light font-display">{bg.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
});

const App: React.FC = () => {
  const [layout, setLayout] = useState<LayoutType>(LayoutType.GRID_3X3);
  const [items, setItems] = useState<CollageItem[]>([]);

  // Style State
  const [gap, setGap] = useState<number>(3);
  const [outerPadding, setOuterPadding] = useState<number>(3);
  const [borderRadius, setBorderRadius] = useState<number>(6);
  const [aspectRatio, setAspectRatio] = useState<string>("3 / 4");
  const [backgroundClass, setBackgroundClass] = useState<string>("bg-white");

  // Export Settings
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.85);

  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const collageRef = useRef<HTMLDivElement>(null);

  // Initialize items based on layout
  useEffect(() => {
    const count = layout === LayoutType.GRID_2X2 ? 4 : 9;

    setItems((prev) => {
      // If we are shrinking, slice the array
      if (prev.length >= count) {
        // Free up memory for items being removed automatically
        prev.slice(count).forEach(item => {
          if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
          }
        });
        return prev.slice(0, count);
      }
      // If growing, add new items
      const newItems = [...prev];
      for (let i = prev.length; i < count; i++) {
        newItems.push({
          id: `item-${Date.now()}-${i}`,
          url: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length],
        });
      }
      return newItems;
    });
  }, [layout]);

  const handleDownload = React.useCallback(async () => {
    if (!collageRef.current) return;
    setIsExporting(true);

    const generateImage = async (width: number, format: 'png' | 'jpeg', quality: number): Promise<string | Blob | null> => {
      const currentWidth = collageRef.current!.offsetWidth;
      const ratio = width / currentWidth;
      const options = { quality, pixelRatio: ratio };

      if (format === 'png') {
        return await toPng(collageRef.current!, { ...options, quality: 1.0 });
      } else {
        return await toBlob(collageRef.current!, { ...options, type: 'image/jpeg' });
      }
    };

    try {
      // Small delay to ensure render states are clean
      await new Promise(resolve => setTimeout(resolve, 100));

      let result: string | Blob | null = null;
      let finalFormat = exportFormat;

      try {
        // Attempt 1: Desired settings (2448px width)
        result = await generateImage(2448, exportFormat, exportQuality);
      } catch (err: any) {
        console.warn("Attempt 1 failed:", err);

        // Attempt 2: Fallback to lower resolution (1920px)
        const confirmLowRes = window.confirm(`高清导出失败 (${err.message})。\n是否尝试降低分辨率 (1920px) 导出？`);
        if (!confirmLowRes) throw err;

        result = await generateImage(1920, exportFormat, exportQuality);
      }

      if (result) {
        const url = typeof result === 'string' ? result : URL.createObjectURL(result);
        const link = document.createElement('a');
        link.download = `collage-${layout}-${Date.now()}.${finalFormat === 'jpeg' ? 'jpg' : 'png'}`;
        link.href = url;
        link.click();

        if (typeof result !== 'string') {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      } else {
        throw new Error("生成结果为空");
      }

    } catch (err: any) {
      console.error('Failed to download image', err);
      alert(`生成图片最终失败: ${err.message || "未知错误"}\n\n建议：\n1. 尝试使用电脑浏览器\n2. 尝试选择 JPG 格式\n3. 减少图片数量`);
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, exportQuality, layout]);

  const handleFiles = async (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;

    // Compress all files in parallel before processing layout
    // We wrap this so the UI doesn't block entirely, though it might take a moment.
    const files = await Promise.all(rawFiles.map(f => compressImage(f)));

    let newLayout = layout;

    // Auto-switch layout based on file count
    if (files.length === 4) {
      newLayout = LayoutType.GRID_2X2;
    } else if (files.length >= 9) {
      newLayout = LayoutType.GRID_3X3;
    } else if (layout === LayoutType.GRID_2X2 && files.length > 4) {
      newLayout = LayoutType.GRID_3X3;
    }

    setLayout(newLayout);

    setItems(prev => {
      const targetCount = newLayout === LayoutType.GRID_2X2 ? 4 : 9;
      let nextItems = [...prev];

      if (nextItems.length > targetCount) {
        // Clean memory for items that are completely removed
        nextItems.slice(targetCount).forEach(item => {
          if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
          }
        });
        nextItems = nextItems.slice(0, targetCount);
      }
      while (nextItems.length < targetCount) {
        nextItems.push({
          id: `auto-${Date.now()}-${nextItems.length}`,
          url: DEFAULT_IMAGES[nextItems.length % DEFAULT_IMAGES.length]
        });
      }

      files.forEach((file, idx) => {
        if (idx < targetCount) {
          // Clean memory for old blob image being replaced
          if (nextItems[idx].url.startsWith('blob:')) {
            URL.revokeObjectURL(nextItems[idx].url);
          }
          nextItems[idx] = {
            id: `upload-${Date.now()}-${idx}`,
            url: URL.createObjectURL(file as File)
          };
        }
      });

      return nextItems;
    });
  };

  const handleGlobalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await handleFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  // Global Drag Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = React.useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
    try {
      await handleFiles(files);
    } catch (err) {
      console.error("Upload failed", err);
    }
  }, [layout]);

  // Feature: Shuffle Images
  const shuffleItems = React.useCallback(() => {
    setItems(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);



  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Drag Overlay global - with smooth backdrop */}
      {isDragOver && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-[100] flex items-center justify-center p-8 pointer-events-none transition-all duration-500">
          <div className="border-4 border-indigo-500 border-dashed rounded-[3rem] w-full max-w-4xl h-full max-h-[80vh] flex flex-col items-center justify-center bg-white/60 animate-pulse shadow-2xl">
            <div className="bg-indigo-100 p-6 rounded-full mb-6 text-indigo-600 shadow-inner">
               <CloudUpload size={80} strokeWidth={1.5} />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800 font-display tracking-tight">释放图片立即生成</h2>
            <p className="text-xl text-slate-500 mt-4 font-medium">支持极速拖入替换，自动适应 2x2 或 3x3 布局</p>
          </div>
        </div>
      )}

      {/* Premium Header */}
      <header className="w-full bg-white/60 backdrop-blur-2xl border-b border-white/50 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-primary p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <LayoutGrid size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              InstaGrid
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] font-display">Pro Collage Maker</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 px-6 py-2 bg-white/50 rounded-full border border-white/60 shadow-inner backdrop-blur-xl">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Zap size={14} className="text-amber-500" /> 直接拖入图片极速编辑</span>
          <span className="w-px h-4 bg-slate-300"></span>
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Zap size={14} className="text-amber-500" /> 任意拖动卡片交换顺序</span>
        </div>

        <a
          href="#"
          className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-800 hover:shadow-md transition-all duration-300"
          title="Github"
        >
          <Github size={20} />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center relative z-10 w-full max-w-7xl">
        
        {/* Collage Display Area - Centered and Elevated */}
        <div className="w-full lg:flex-1 flex items-center justify-center min-h-[500px] md:min-h-[700px] bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-4 md:p-12 shadow-xl shadow-slate-200/50 overflow-hidden order-1 group">
          {/* The Canvas wrapper with beautiful shadow propagation */}
          {/* Removed: group-hover:scale-[1.01] transition-transform ease-out because it breaks dnd-kit DragOverlay viewport boundary calculations! */}
          <div className="relative w-full flex justify-center items-center">
            {/* Minimal Ambient Glow to boost GPU frame rates over massive blurs */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full -z-10 blur-xl"></div>
            
            <div
              className={`relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] transition-colors duration-500 ease-in-out ${backgroundClass} ring-1 ring-black/5 rounded-sm`}
              style={{
                aspectRatio: aspectRatio,
                padding: `${outerPadding}px`,
                width: '100%',
                maxWidth: '850px'
              }}
              ref={collageRef}
            >
              <CollageGrid
                items={items}
                layout={layout}
                setItems={setItems}
                gap={gap}
                borderRadius={borderRadius}
              />
            </div>
          </div>
        </div>

        {/* Settings Panel - NOW BELOW (Order 2) */}
        <SettingsSidebar 
          layout={layout} setLayout={setLayout}
          gap={gap} setGap={setGap}
          outerPadding={outerPadding} setOuterPadding={setOuterPadding}
          borderRadius={borderRadius} setBorderRadius={setBorderRadius}
          aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
          backgroundClass={backgroundClass} setBackgroundClass={setBackgroundClass}
          exportFormat={exportFormat} setExportFormat={setExportFormat}
          exportQuality={exportQuality} setExportQuality={setExportQuality}
          handleDownload={handleDownload} isExporting={isExporting}
          handleGlobalUpload={handleGlobalUpload} shuffleItems={shuffleItems} setItems={setItems}
        />
      </main>
    </div>
  );
};

export default App;