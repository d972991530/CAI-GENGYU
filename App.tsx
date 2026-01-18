
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProductionStage, ProjectState, WorkflowStep } from './types';
import { WORKFLOW_STEPS } from './constants';
import { 
  analyzeScript, 
  generateProductionTip, 
  generateStoryboardDescription,
  generateKeyframeImage,
  generateMotionPrevis
} from './services/geminiService';
import { 
  Film, 
  CheckCircle2, 
  Sparkles, 
  Layout, 
  PenTool, 
  Camera, 
  Scissors, 
  Globe,
  Loader2,
  TrendingUp,
  MessageSquareCode,
  Image as ImageIcon,
  Upload,
  FileText,
  AlertCircle,
  Zap,
  Play,
  Download,
  ChevronRight,
  Terminal,
  Activity,
  Cpu,
  MonitorPlay,
  SlidersHorizontal,
  Palette,
  Timer,
  ZapOff
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { time: 'T-12', budget: 10, quality: 20 },
  { time: 'T-8', budget: 25, quality: 45 },
  { time: 'T-4', budget: 50, quality: 70 },
  { time: 'Production', budget: 85, quality: 90 },
  { time: 'Release', budget: 100, quality: 98 },
];

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>({
    currentStage: ProductionStage.PLANNING,
    stepsCompleted: [],
    scriptDraft: '',
    logs: ['[SYSTEM] 系统初始化完成...', '[SYSTEM] 已载入忠武路工业标准...']
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [storyboardOutput, setStoryboardOutput] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [dailyTip, setDailyTip] = useState<string>('载入中...');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [storyboardMode, setStoryboardMode] = useState<'create' | 'optimize'>('create');
  
  // 可视化中心与控制台状态
  const [visPrompt, setVisPrompt] = useState('');
  const [visualStyle, setVisualStyle] = useState('Cinematic (忠武路风格)');
  const [editingPace, setEditingPace] = useState(50); // 0-100
  const [transitionPace, setTransitionPace] = useState(50); // 0-100
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewVid, setPreviewVid] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const tip = await generateProductionTip(project.currentStage);
      setDailyTip(tip);
    };
    fetchInitialData();
  }, [project.currentStage]);

  const addLog = (msg: string) => {
    setProject(prev => ({
      ...prev,
      logs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.logs.slice(0, 9)]
    }));
  };

  const handleToggleStep = (id: string) => {
    setProject(prev => {
      const isDone = prev.stepsCompleted.includes(id);
      const newSteps = isDone ? prev.stepsCompleted.filter(s => s !== id) : [...prev.stepsCompleted, id];
      if (!isDone) addLog(`里程碑已达成: ${WORKFLOW_STEPS.find(s => s.id === id)?.title}`);
      return { ...prev, stepsCompleted: newSteps };
    });
  };

  const onScriptAnalyze = async () => {
    if (!project.scriptDraft) return;
    setIsAnalyzing(true);
    addLog("正在启动全方位工业评估...");
    try {
      const res = await analyzeScript(project.scriptDraft);
      setAiAnalysis(res);
      addLog("评估报告生成完毕。");
    } catch (e) {
      addLog("评估失败，请检查连接。");
    } finally { setIsAnalyzing(false); }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setStoryboardMode('optimize');
      addLog(`检测到现有分镜文件: ${file.name}`);
    }
  };

  const onProcessStoryboard = async () => {
    setIsGeneratingStoryboard(true);
    addLog(storyboardMode === 'create' ? "正在转化文字至视觉描述..." : "正在优化现有镜头逻辑...");
    try {
      const input = uploadedFile ? `FILE: ${uploadedFile.name}. NOTE: ${project.scriptDraft}` : project.scriptDraft;
      const res = await generateStoryboardDescription(input, storyboardMode);
      setStoryboardOutput(res);
      setVisPrompt(res.split('\n')[0].substring(0, 200)); 
      addLog("分镜处理成功。");
    } catch (e) {
      addLog("处理过程中出现异常。");
    } finally { setIsGeneratingStoryboard(false); }
  };

  const onRenderImage = async () => {
    setIsGeneratingImage(true);
    addLog(`关键帧渲染引擎启动... [风格: ${visualStyle}]`);
    try {
      const img = await generateKeyframeImage(visPrompt, visualStyle);
      setPreviewImg(img);
      addLog("关键帧渲染成功。");
    } catch (e) {
      addLog("渲染失败。");
    } finally { setIsGeneratingImage(false); }
  };

  const onRenderVideo = async () => {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
    setIsGeneratingVideo(true);
    addLog(`启动动态预演 (Veo Engine)... 节奏: ${editingPace}, 转场: ${transitionPace}`);
    try {
      const paceText = editingPace > 70 ? 'Fast/Aggressive' : editingPace < 30 ? 'Slow/Melancholic' : 'Balanced';
      const transText = transitionPace > 70 ? 'Dynamic Whip/Cut' : transitionPace < 30 ? 'Soft Fade/Long Take' : 'Standard';
      
      const vid = await generateMotionPrevis(visPrompt, previewImg || undefined, {
        style: visualStyle,
        pace: paceText,
        transition: transText
      });
      setPreviewVid(vid);
      addLog("动态预演合成完成。");
    } catch (e) {
      addLog("视频引擎报错，请确保使用付费 API Key。");
    } finally { setIsGeneratingVideo(false); }
  };

  const progress = useMemo(() => 
    Math.round((project.stepsCompleted.length / WORKFLOW_STEPS.length) * 100), 
  [project.stepsCompleted]);

  return (
    <div className="h-screen flex flex-col bg-[#08080a] text-slate-200 select-none">
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 glass-panel z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <Film className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase flex items-center gap-2">
            K-Cinema Master <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">PRO OPS</span>
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
              Engine Online
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Latency: 42ms
            </div>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Project Completion</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-mono text-indigo-400">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-6 glass-panel shrink-0">
          {Object.values(ProductionStage).map(stage => (
            <button
              key={stage}
              onClick={() => setProject(prev => ({ ...prev, currentStage: stage }))}
              title={stage}
              className={`p-3 rounded-xl transition-all duration-300 group relative ${
                project.currentStage === stage 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-slate-500 hover:bg-white/5'
              }`}
            >
              {stage === ProductionStage.PLANNING && <PenTool className="w-6 h-6" />}
              {stage === ProductionStage.PRE_PRODUCTION && <Layout className="w-6 h-6" />}
              {stage === ProductionStage.PRODUCTION && <Camera className="w-6 h-6" />}
              {stage === ProductionStage.POST_PRODUCTION && <Scissors className="w-6 h-6" />}
              {stage === ProductionStage.DISTRIBUTION && <Globe className="w-6 h-6" />}
              <div className="absolute left-full ml-4 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100]">
                {stage}
              </div>
            </button>
          ))}
        </nav>

        <aside className="w-80 border-r border-white/5 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <ChevronRight className="w-3 h-3" /> Workflow Track
            </h3>
            <span className="text-[10px] font-mono text-indigo-400">STAGE {Object.keys(ProductionStage).indexOf(Object.keys(ProductionStage).find(k => (ProductionStage as any)[k] === project.currentStage)!) + 1}</span>
          </div>
          <div className="flex-1 overflow-y-auto workflow-scroll p-4 space-y-3">
            {WORKFLOW_STEPS.filter(s => s.stage === project.currentStage).map(step => (
              <div 
                key={step.id}
                onClick={() => handleToggleStep(step.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  project.stepsCompleted.includes(step.id)
                  ? 'bg-indigo-600/10 border-indigo-500/50'
                  : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="max-w-[80%]">
                    <p className="text-[9px] font-bold text-indigo-400 mono mb-0.5">{step.titleKr}</p>
                    <h4 className="text-sm font-bold leading-tight">{step.title}</h4>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 transition-colors ${project.stepsCompleted.includes(step.id) ? 'text-indigo-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="h-48 border-t border-white/5 bg-black/50 p-4 font-mono text-[10px] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 text-indigo-400 mb-2 opacity-70">
              <Terminal className="w-3 h-3" />
              <span>LOG_OUTPUT v3.1</span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-1 opacity-60">
              {project.logs.map((log, i) => (
                <div key={i} className="whitespace-nowrap overflow-hidden text-ellipsis">{log}</div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <header className="flex items-end justify-between border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">{project.currentStage.split('(')[0]}</h2>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Cpu className="w-4 h-4" />
                  K-CONTENT PRODUCTION MASTER SYSTEM
                </div>
              </div>
              <div className="max-w-sm p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Producer Intelligence
                </p>
                <p className="text-[11px] italic text-slate-300 leading-relaxed font-medium">"{dailyTip}"</p>
              </div>
            </header>

            {project.currentStage === ProductionStage.PLANNING && (
              <div className="grid grid-cols-1 gap-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquareCode className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-lg">剧本与创意开发</h3>
                      </div>
                      <button 
                        onClick={onScriptAnalyze}
                        disabled={isAnalyzing || !project.scriptDraft}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                        深度工业评估
                      </button>
                    </div>
                    <textarea 
                      className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-mono focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="在此处粘贴剧本大纲或核心梗概..."
                      value={project.scriptDraft}
                      onChange={(e) => setProject(prev => ({ ...prev, scriptDraft: e.target.value }))}
                    />
                  </div>
                  <div className="glass-panel p-6 rounded-3xl space-y-4 bg-indigo-600/[0.02]">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">监制反馈报告 (AI)</div>
                    <div className="h-[188px] overflow-y-auto text-sm leading-relaxed text-slate-400 whitespace-pre-wrap pr-2 workflow-scroll">
                      {aiAnalysis || <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3"><Terminal className="w-8 h-8" /><p className="text-xs">等待数据评估...</p></div>}
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-3xl overflow-hidden border-purple-500/20">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-purple-600/5">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold">分镜台本工程 (Visual SOP)</h3>
                    </div>
                    <button onClick={onProcessStoryboard} disabled={isGeneratingStoryboard || !project.scriptDraft} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 disabled:opacity-50">
                      {isGeneratingStoryboard ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      执行工业转化
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">文件导入</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${uploadedFile ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                      >
                        <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" accept=".xlsx,.xls,.pdf,.docx,.doc" />
                        {uploadedFile ? (<><FileText className="w-10 h-10 text-purple-400" /><div className="text-center font-bold text-xs text-purple-400">{uploadedFile.name}</div></>) : (<Upload className="w-10 h-10 text-slate-700" />)}
                      </div>
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                      <textarea className="w-full h-[220px] bg-black/40 border border-white/5 rounded-2xl p-6 text-xs font-mono text-slate-400 leading-relaxed outline-none workflow-scroll" value={storyboardOutput || ""} placeholder="等待渲染结果..." readOnly />
                    </div>
                  </div>
                </div>

                {/* 可视化预演中心 (升级版) */}
                <div className="glass-panel rounded-3xl overflow-hidden border-indigo-500/30">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-indigo-600/5">
                    <div className="flex items-center gap-3">
                      <MonitorPlay className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-bold">可视化预演中心 (Pre-vis Rendering)</h3>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={onRenderImage} disabled={isGeneratingImage || !visPrompt} className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2">
                        {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                        渲染关键帧
                      </button>
                      <button onClick={onRenderVideo} disabled={isGeneratingVideo || !visPrompt} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                        {isGeneratingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        动态视频预演
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 左侧：输入与控制台 */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <MessageSquareCode className="w-3 h-3" /> 视觉意图细化 (VFX Prompt)
                        </label>
                        <textarea 
                          className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                          value={visPrompt}
                          onChange={(e) => setVisPrompt(e.target.value)}
                          placeholder="描述场景的视觉风格、色调、动作逻辑..."
                        />
                      </div>

                      {/* 导演控制台 Console */}
                      <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl space-y-5">
                        <div className="flex items-center gap-2 text-indigo-400 mb-2">
                          <SlidersHorizontal className="w-4 h-4" />
                          <span className="text-[11px] font-bold uppercase tracking-widest">导演控制台 (Director Console)</span>
                        </div>
                        
                        {/* 视觉风格选择 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5"><Palette className="w-3 h-3" /> 视觉风格</label>
                            <span className="text-[10px] text-indigo-400 font-mono">{visualStyle.split(' ')[0]}</span>
                          </div>
                          <select 
                            value={visualStyle}
                            onChange={(e) => setVisualStyle(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-[11px] outline-none focus:border-indigo-500 transition-all text-slate-300"
                          >
                            <option>Cinematic (忠武路风格)</option>
                            <option>Noir (黑色电影/惊悚)</option>
                            <option>Cyberpunk (近未来科幻)</option>
                            <option>Documentary (写实纪实)</option>
                            <option>Dreamy (梦幻/唯美)</option>
                            <option>High-Contrast (极简高反差)</option>
                          </select>
                        </div>

                        {/* 剪辑节奏控制 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5"><Timer className="w-3 h-3" /> 剪辑节奏 (Editing Pace)</label>
                            <span className="text-[10px] text-indigo-400 font-mono">{editingPace}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={editingPace} 
                            onChange={(e) => setEditingPace(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[8px] text-slate-600 uppercase font-bold px-1">
                            <span>慢速/情绪</span>
                            <span>标准</span>
                            <span>快速/动作</span>
                          </div>
                        </div>

                        {/* 转场节奏控制 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5"><Zap className="w-3 h-3" /> 转场能量 (Transition)</label>
                            <span className="text-[10px] text-indigo-400 font-mono">{transitionPace}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={transitionPace} 
                            onChange={(e) => setTransitionPace(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          />
                          <div className="flex justify-between text-[8px] text-slate-600 uppercase font-bold px-1">
                            <span>柔和淡入</span>
                            <span>标准剪辑</span>
                            <span>动态转场</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：渲染视口 */}
                    <div className="lg:col-span-7 space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <MonitorPlay className="w-3 h-3" /> 渲染视口 (16:9 Pre-vis Preview)
                      </label>
                      <div className="aspect-video w-full bg-black rounded-3xl border border-white/5 relative overflow-hidden group shadow-2xl flex items-center justify-center">
                        {isGeneratingVideo ? (
                          <div className="text-center space-y-4">
                            <div className="relative">
                              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
                              <Activity className="w-4 h-4 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-[10px] mono text-indigo-400 animate-pulse tracking-widest">SYNTHESIZING PREVIS MOTION...</p>
                          </div>
                        ) : previewVid ? (
                          <video src={previewVid} controls className="w-full h-full object-contain" autoPlay loop />
                        ) : previewImg ? (
                          <img src={previewImg} className="w-full h-full object-cover shadow-inner" alt="Keyframe" />
                        ) : (
                          <div className="flex flex-col items-center gap-4 text-slate-800">
                            <MonitorPlay className="w-16 h-16 opacity-30" />
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-30">Rendering Engine Idle</span>
                          </div>
                        )}
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                          <div className="bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10 text-[8px] font-mono text-indigo-400 uppercase tracking-widest">
                            Live Render
                          </div>
                          {previewVid && (
                             <div className="bg-green-500/20 backdrop-blur px-2 py-1 rounded border border-green-500/30 text-[8px] font-mono text-green-400 uppercase tracking-widest">
                               VFX Optimized
                             </div>
                          )}
                        </div>

                        {(previewImg || previewVid) && (
                          <button className="absolute bottom-4 right-4 p-2 bg-black/60 hover:bg-indigo-600 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                         <p className="text-[10px] text-indigo-300/70 leading-relaxed font-medium">
                           系统提示：控制台设置将实时影响 AI 的 Prompt 权重，建议先“渲染关键帧”确认风格，再“生成动态预演”。
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-panel rounded-3xl p-8">
              <h3 className="text-xl font-bold tracking-tight mb-8">制作指标分析 (Production KPIs)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorQual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f0f12', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="budget" stroke="#6366f1" fillOpacity={1} fill="url(#colorBudget)" strokeWidth={3} />
                    <Area type="monotone" dataKey="quality" stroke="#a855f7" fillOpacity={1} fill="url(#colorQual)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <footer className="h-8 border-t border-white/5 bg-black flex items-center justify-between px-6 text-[9px] mono text-slate-600 font-bold uppercase tracking-widest shrink-0">
        <div className="flex gap-6">
          <span>Region: KR-SEL-01</span>
          <span>Core: T3-PRO-ACCELERATOR</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Systems Operational</span>
          <span>© 2024 CJ-STYLE CINEMA OPS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
