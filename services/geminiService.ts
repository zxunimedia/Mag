
import { GoogleGenAI, Type } from "@google/genai";
import { Project, Report } from "../types";

// 延遲初始化 AI，避免在沒有 API key 時報錯
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const analyzeProjectStatus = async (project: Project, reports: Report[]) => {
  const aiInstance = getAI();
  if (!aiInstance) {
    return "AI 分析功能需要設定 API Key。";
  }
  
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    請以專業考評委員的角度，分析以下原住民村落文化發展計畫的執行現況：
    計畫名稱：${project.name}
    部落：${project.village}
    預算執行率：${(project.spent / project.budget * 100).toFixed(1)}%
    目前進度：${project.progress}%
    最新執行日誌：${reports.map(r => r.content).join('\n')}
    
    請提供：
    1. 執行成效評估 (重點摘要)
    2. 可能面臨的風險
    3. 具體改善建議
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "無法生成 AI 分析報告，請稍後再試。";
  }
};

export const generateExecutiveSummary = async (projects: Project[]) => {
  const aiInstance = getAI();
  if (!aiInstance) {
    return "AI 摘要功能需要設定 API Key。";
  }
  
  const model = 'gemini-3-flash-preview';
  const dataString = projects.map(p => `${p.name}(${p.status}, 進度${p.progress}%)`).join(', ');
  
  const prompt = `
    你現在是文化部計畫督導主管。請根據以下多個原村計畫的狀態數據，生成一份簡短的高階管理摘要：
    數據：${dataString}
    請分析整體執行趨勢，並點出需要特別關注的環節。
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "摘要生成失敗。";
  }
};
