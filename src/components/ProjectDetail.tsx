
import React, { useState, useEffect } from 'react';
import { Project, Report } from '../types';
import { analyzeProjectStatus } from '../services/geminiService';
import { ChevronLeft, Calendar, User, Sparkles, MessageSquare, Loader2 } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  reports: Report[];
  onBack: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, reports, onBack }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunAnalysis = async () => {
    setLoading(true);
    const result = await analyzeProjectStatus(project, reports);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{project.name}</h2>
          <p className="text-gray-500">{project.village} | {project.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="text-blue-500" size={20} />
              計畫摘要與進度日誌
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {project.description}
            </p>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 border-b pb-2">執行日誌</h4>
              {reports.filter(r => r.projectId === project.id).map(report => (
                <div key={report.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-gray-700">{report.title}</h5>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} /> {report.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{report.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              AI 智能管考建議
            </h3>
            {!analysis ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">使用 Gemini AI 分析本計畫的執行成效與潛在風險</p>
                <button 
                  onClick={handleRunAnalysis}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
                  開始智能分析
                </button>
              </div>
            ) : (
              <div className="prose prose-sm text-gray-700 max-h-[500px] overflow-y-auto">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="whitespace-pre-wrap">{analysis}</div>
                  <button 
                    onClick={() => setAnalysis(null)}
                    className="mt-4 text-xs text-amber-600 font-bold hover:underline"
                  >
                    重新分析
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-4">核心數據</h3>
            <div className="space-y-4">
              <DetailStat label="預算執行率" value={`${((project.spent / project.budget) * 100).toFixed(1)}%`} />
              <DetailStat label="目前總進度" value={`${project.progress}%`} />
              <DetailStat label="開始日期" value={project.startDate} />
              <DetailStat label="預計結案" value={project.endDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailStat = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50">
    <span className="text-gray-500 text-sm">{label}</span>
    <span className="text-gray-800 font-bold">{value}</span>
  </div>
);

export default ProjectDetail;
