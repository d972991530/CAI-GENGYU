
// 仅在服务端运行：Gemini Key 只从服务器环境变量读取，绝不下发到前端
import { GoogleGenAI, Type } from "@google/genai";
import type { ComicPanel, PrevisConfig } from "../shared/types.ts";

const apiKey = () => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) throw new Error("服务端未配置 GEMINI_API_KEY");
  return key;
};
// 可选 GEMINI_BASE_URL：走自建中转 / 代理时使用
const getAI = () => new GoogleGenAI({
  apiKey: apiKey(),
  httpOptions: process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : undefined,
});

/**
 * 剧本深度分析
 */
export async function analyzeScript(script: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `你是一名顶级韩国电影监制 (Executive Producer)。请基于以下剧本/梗概，进行严苛的工业评估。
    分析维度：
    1. 全球 market 潜力 (Global OTT Appeal)
    2. 情感冲击力 (K-Shinpa Factor)
    3. 类型片创新度 (Genre Subversion)
    4. 制作成本预估 (Budget Level)
    请务必使用中文提供专业、犀利且具有建设性的反馈。
    
    剧本内容：${script}`,
    config: {
      temperature: 0.7,
      systemInstruction: "你语气专业、果断，熟知忠武路及好莱坞工业标准。"
    }
  });
  return response.text ?? '';
}

/**
 * 获取行业动态提示
 */
export async function generateProductionTip(stage: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `针对影视制作的“${stage}”阶段，分享一个来自韩国影视工业（如 CJ ENM 或 Showbox）的真实制作技巧或标准操作规程 (SOP)。要求简短有力。`,
  });
  return response.text ?? '';
}

/**
 * 分镜台本转化与优化
 */
export async function generateStoryboardDescription(prompt: string, mode: 'create' | 'optimize' = 'create') {
  const ai = getAI();
  const instruction = mode === 'create' 
    ? `将以下文学描述转化为导演和摄影指导(DP)可直接使用的分镜台本。
       包含：镜头号、景别(CU/POV/OTS等)、运镜(Dolly In/Handheld等)、光效(High-key/Noir等)、视觉隐喻说明。`
    : `你现在是资深分镜修改师。请审查以下分镜内容，识别视觉叙事中的逻辑漏洞、轴线错误或平庸的镜头。
       根据韩国惊悚/类型片的视觉风格进行优化，增强视听张力。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${instruction}\n\n内容详情：${prompt}`,
    config: {
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  return response.text ?? '';
}

/**
 * 剧本拆解为漫画分镜格 - 结构化输出场景描述与对白
 */
export async function breakdownScriptToComicPanels(script: string, panelCount: number = 6): Promise<ComicPanel[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `你是一名资深漫画编剧兼分镜师。请将以下剧本改编为约 ${panelCount} 格漫画分镜。
    要求：
    1. 挑选最具戏剧张力和视觉表现力的关键时刻，保持叙事连贯。
    2. 每一格给出足够具体的画面描述（人物、动作、表情、场景、构图），以便画师直接绘制。
    3. 提取角色对白（如有），保持精炼、口语化，适合放入漫画对话气泡。
    4. 如某格没有对白，可仅提供旁白/场景说明性的 caption。

    剧本内容：${script}`,
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            panelNumber: { type: Type.INTEGER },
            sceneDescription: { type: Type.STRING },
            caption: { type: Type.STRING },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character: { type: Type.STRING },
                  line: { type: Type.STRING }
                },
                required: ['character', 'line']
              }
            }
          },
          required: ['panelNumber', 'sceneDescription']
        }
      }
    }
  });
  return JSON.parse(response.text ?? '[]');
}

/**
 * 单格漫画图像生成 - 手绘风格
 */
export async function generateComicPanelImage(panel: ComicPanel, style: string = '日式漫画 (Manga B&W)'): Promise<string | null> {
  const ai = getAI();
  const dialogueText = panel.dialogue?.length
    ? panel.dialogue.map(d => `${d.character}: "${d.line}"`).join('; ')
    : '';

  const prompt = `Hand-drawn comic book panel illustration, ${style}.
    Traditional hand-drawn look: visible ink/pencil linework, crosshatching or screentone shading, textured paper background, imperfect organic lines. Absolutely NOT smooth vector or 3D render.
    Scene: ${panel.sceneDescription}.
    ${dialogueText ? `Include hand-lettered speech bubbles with the exact text: ${dialogueText}.` : ''}
    ${panel.caption ? `Include a narration caption box with text: "${panel.caption}".` : ''}
    Strong panel border, dynamic comic composition.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "4:3" }
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}` : null;
}

/**
 * 关键帧生成 - 支持细化控制参数
 */
export async function generateKeyframeImage(prompt: string, style: string = 'Cinematic') {
  const ai = getAI();
  const stylePrompt = `Visual Style: ${style}. `;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `${stylePrompt} High-end cinematic concept art, storyboard keyframe: ${prompt}. Cinematic lighting, anamorphic lens flares, high contrast, movie production quality, 8k.` }]
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}` : null;
}

/**
 * 动态预演生成 - 支持细化控制参数
 */
export async function generateMotionPrevis(
  prompt: string, 
  imageBase64?: string, 
  config: PrevisConfig = { style: 'Cinematic', pace: 'Moderate', transition: 'Standard' }
) {
  const ai = getAI();
  
  const instruction = `Cinematic previs motion study. 
    Prompt: ${prompt}. 
    Style: ${config.style}. 
    Editing Pace: ${config.pace}. 
    Transition Rhythm: ${config.transition}. 
    Professional camera movement, high production quality.`;

  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: instruction,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  };

  if (imageBase64) {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    payload.image = {
      imageBytes: base64Data,
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(payload);
  const deadline = Date.now() + 15 * 60_000;
  while (!operation.done) {
    if (Date.now() > deadline) throw new Error('视频生成超时');
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error('视频生成失败：未返回结果');
  // Key 放在请求头里，而不是拼进 URL
  const videoResponse = await fetch(downloadLink, { headers: { 'x-goog-api-key': apiKey() } });
  if (!videoResponse.ok) throw new Error(`视频下载失败 ${videoResponse.status}`);
  return { data: Buffer.from(await videoResponse.arrayBuffer()), mimeType: videoResponse.headers.get('content-type') ?? 'video/mp4' };
}
