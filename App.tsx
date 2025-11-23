import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
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
  Zap
} from 'lucide-react';
import { CollageGrid } from './components/CollageGrid';
import { CollageItem, LayoutType } from './types';

// Placeholder images from Picsum
const DEFAULT_IMAGES = [
  'https://picsum.photos/id/10/800/800',
  'https://picsum.photos/id/14/800/800',
  'https://picsum.photos/id/28/800/800',
  'https://picsum.photos/id/43/800/800',
  'https://picsum.photos/id/55/800/800',
  'https://picsum.photos/id/65/800/800',
  'https://picsum.photos/id/88/800/800',
  'https://picsum.photos/id/103/800/800',
  'https://picsum.photos/id/106/800/800',
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

const App: React.FC = () => {
  const [layout, setLayout] = useState<LayoutType>(LayoutType.GRID_3X3);
  const [items, setItems] = useState<CollageItem[]>([]);
  
  // Style State
  const [gap, setGap] = useState<number>(3);
  const [outerPadding, setOuterPadding] = useState<number>(3);
  const [borderRadius, setBorderRadius] = useState<number>(6);
  const [aspectRatio, setAspectRatio] = useState<string>("1 / 1");
  const [backgroundClass, setBackgroundClass] = useState<string>("bg-white");
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const collageRef = useRef<HTMLDivElement>(null);

  // Initialize items based on layout
  useEffect(() => {
    const count = layout === LayoutType.GRID_2X2 ? 4 : 9;
    
    setItems((prev) => {
      // If we are shrinking, slice the array
      if (prev.length >= count) {
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

  const handleDownload = async () => {
    if (!collageRef.current) return;
    setIsExporting(true);
    
    try {
      // Small delay to ensure render states are clean
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(collageRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        // We don't set backgroundColor here so transparent backgrounds work if selected
      });
      
      const link = document.createElement('a');
      link.download = `collage-${layout}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
      alert("生成图片失败，请重试。");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;

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
                nextItems[idx] = {
                    id: `upload-${Date.now()}-${idx}`,
                    url: URL.createObjectURL(file)
                };
            }
        });
        
        return nextItems;
    });
  };

  const handleGlobalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleFiles(Array.from(e.target.files));
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  };

  // Feature: Shuffle Images
  const shuffleItems = () => {
    setItems(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  // Feature: Seamless Mode
  const setSeamlessMode = () => {
    setGap(0);
    setOuterPadding(0);
    setBorderRadius(0);
  };

  const ratioOptions = [
    { label: '1:1', value: '1 / 1', icon: Square },
    { label: '4:3', value: '4 / 3', icon: RectangleHorizontal },
    { label: '3:4', value: '3 / 4', icon: RectangleVertical },
    { label: '16:9', value: '16 / 9', icon: Monitor },
    { label: '9:16', value: '9 / 16', icon: Smartphone },
  ];

  return (
    <div 
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-indigo-500/10 backdrop-blur-sm z-50 flex items-center justify-center p-8 pointer-events-none">
            <div className="border-4 border-indigo-500 border-dashed rounded-3xl w-full h-full flex flex-col items-center justify-center bg-white/50 animate-pulse">
                <CloudUpload size={64} className="text-indigo-600 mb-4" />
                <h2 className="text-3xl font-bold text-slate-800">释放图片</h2>
                <p className="text-lg text-slate-600 mt-2">自动排列 4 张或 9 张照片</p>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              InstaGrid
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Pro Collage Maker</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1"><Zap size={12} className="text-amber-500"/> 拖拽图片可直接上传</span>
            <span className="w-px h-3 bg-slate-200"></span>
            <span className="flex items-center gap-1"><Zap size={12} className="text-amber-500"/> 拖动方块交换位置</span>
        </div>

        <a 
          href="#" 
          className="text-slate-400 hover:text-slate-800 transition-colors"
          title="Github"
        >
          <Github size={20} />
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 items-start justify-center overflow-hidden">
        
        {/* Settings Panel - Scrollable on mobile */}
        <aside className="w-full md:w-80 flex-shrink-0 space-y-5 h-full md:overflow-y-auto pb-10 pr-1">
          
          {/* Layout & Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setLayout(LayoutType.GRID_2X2)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  layout === LayoutType.GRID_2X2
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                }`}
              >
                <Grid2X2 size={20} className="mb-1" />
                <span className="text-xs font-bold">2 x 2</span>
              </button>
              <button
                onClick={() => setLayout(LayoutType.GRID_3X3)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  layout === LayoutType.GRID_3X3
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                }`}
              >
                <Grid3X3 size={20} className="mb-1" />
                <span className="text-xs font-bold">3 x 3</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={shuffleItems}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-xs border border-slate-200"
                >
                    <Shuffle size={14} />
                    <span>随机位置</span>
                </button>
                <button
                    onClick={() => setItems(prev => prev.map((item, idx) => ({ ...item, url: DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length] + `?r=${Date.now()}` })))}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-xs border border-slate-200"
                >
                    <RotateCcw size={14} />
                    <span>重置图片</span>
                </button>
            </div>
          </div>

          {/* Dimensions & Ratio */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <Maximize size={12} /> 尺寸与比例
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
                {ratioOptions.map((option) => (
                    <button
                        key={option.label}
                        onClick={() => setAspectRatio(option.value)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                            aspectRatio === option.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-slate-100 hover:border-slate-300 text-slate-400'
                        }`}
                        title={option.label}
                    >
                        <option.icon size={16} className="mb-1" />
                        <span className="text-[10px] font-bold">{option.label}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Styles (Gaps, Padding, Radius) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Palette size={12} /> 样式微调
                </h3>
                <button 
                    onClick={setSeamlessMode}
                    className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                >
                    一键无缝
                </button>
            </div>
            
            {/* Sliders */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Scaling size={12}/> 画布外边距</label>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{outerPadding}px</span>
                    </div>
                    <input
                    type="range" min="0" max="60" value={outerPadding}
                    onChange={(e) => setOuterPadding(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><LayoutGrid size={12}/> 图片间距</label>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{gap}px</span>
                    </div>
                    <input
                    type="range" min="0" max="40" value={gap}
                    onChange={(e) => setGap(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5"><Circle size={12}/> 圆角半径</label>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{borderRadius}px</span>
                    </div>
                    <input
                    type="range" min="0" max="60" value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
            </div>
          </div>

          {/* Background Color */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <PaintBucket size={12} /> 背景风格
            </h3>
            <div className="grid grid-cols-7 gap-2">
                {BACKGROUND_OPTIONS.map((bg) => (
                    <button
                        key={bg.name}
                        onClick={() => setBackgroundClass(bg.value)}
                        className={`w-8 h-8 rounded-full shadow-sm border transition-transform hover:scale-110 ${bg.value} ${
                            backgroundClass === bg.value ? 'ring-2 ring-offset-2 ring-indigo-500 border-transparent' : 'border-slate-200'
                        }`}
                        title={bg.name}
                    />
                ))}
            </div>
          </div>

          {/* Download / Upload */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
             <div 
              onClick={() => document.getElementById('bulk-upload')?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl p-3 cursor-pointer transition-all group flex items-center justify-center gap-3 text-center"
            >
                <CloudUpload size={20} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">添加本地图片</span>
                <input id="bulk-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleGlobalUpload} />
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 p-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-300 hover:shadow-xl hover:-translate-y-0.5 font-bold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? '正在渲染...' : '下载高清大图'}
              {!isExporting && <Download size={16} />}
            </button>
          </div>
        </aside>

        {/* Collage Display Area */}
        <div className="flex-1 flex items-start justify-center w-full h-full min-h-[500px] bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200 p-4 md:p-8 overflow-auto">
            {/* The Canvas */}
            <div 
                className={`relative shadow-2xl transition-all duration-300 ease-in-out ${backgroundClass}`} 
                style={{ 
                    aspectRatio: aspectRatio,
                    padding: `${outerPadding}px`,
                    width: '100%',
                    maxWidth: '800px' 
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
      </main>
    </div>
  );
};

export default App;