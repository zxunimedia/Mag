
import React, { useState } from 'react';
import { Project, ProjectStatus, UserRole } from '../types';
import { Search, Filter, Plus, MoreVertical, Building2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onAddNew?: () => void;
  userRole?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onAddNew, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = userRole === UserRole.ADMIN;

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.executingUnit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ONGOING: return 'bg-emerald-100 text-emerald-700';
      case ProjectStatus.STALLED: return 'bg-red-100 text-red-700';
      case ProjectStatus.PLANNING: return 'bg-blue-100 text-blue-700';
      case ProjectStatus.COMPLETED: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-gray-800 tracking-tight">年度計畫管考清單</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="搜尋計畫、單位或地點..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-72 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && onAddNew && (
            <button 
              onClick={onAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 shadow-md transition-all"
            >
              <Plus size={16} /> 新增計畫案
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-gray-400 text-[11px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">計畫案名稱 / 執行單位</th>
              <th className="px-6 py-4">計畫類別</th>
              <th className="px-6 py-4">累積執行進度</th>
              <th className="px-6 py-4 text-right">預算執行率</th>
              <th className="px-6 py-4">當前狀態</th>
              <th className="px-6 py-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProjects.map((project) => (
              <tr 
                key={project.id} 
                className="hover:bg-amber-50/20 cursor-pointer transition-colors group" 
                onClick={() => onSelectProject(project)}
              >
                <td className="px-6 py-5">
                  <div className="font-bold text-gray-800 group-hover:text-amber-700 transition-colors">{project.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-medium">
                    <Building2 size={12} /> {project.executingUnit}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                    {project.category}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-gray-700 w-8">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="text-xs font-black text-gray-800">${(project.spent/1000).toFixed(0)}k</div>
                  <div className="text-[10px] text-gray-400">執行率 {project.budget > 0 ? ((project.spent / project.budget) * 100).toFixed(1) : '0'}%</div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <button className="p-2 text-gray-300 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProjects.length === 0 && (
          <div className="p-12 text-center text-gray-400 font-medium">
            找不到符合條件的計畫案
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
