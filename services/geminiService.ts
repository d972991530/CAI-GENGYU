
import { GoogleGenAI, Type } from "@google/genai";

// 统一 AI 助手逻辑
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  return response.text;
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
  return response.text;
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
  return response.text;
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

  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
}

/**
 * 动态预演生成 - 支持细化控制参数
 */
export async function generateMotionPrevis(
  prompt: string, 
  imageBase64?: string, 
  config: { style: string; pace: string; transition: string } = { style: 'Cinematic', pace: 'Moderate', transition: 'Standard' }
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
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
}
