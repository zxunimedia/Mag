
import React from 'react';
import { Project, ProjectStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, DollarSign } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === ProjectStatus.ONGOING).length,
    stalled: projects.filter(p => p.status === ProjectStatus.STALLED).length,
    budget: projects.reduce((acc, p) => acc + p.budget, 0),
    spent: projects.reduce((acc, p) => acc + p.spent, 0),
  };

  const statusData = [
    { name: '執行中', value: stats.active, color: '#059669' },
    { name: '進度落後', value: stats.stalled, color: '#DC2626' },
    { name: '規劃中', value: projects.filter(p => p.status === ProjectStatus.PLANNING).length, color: '#2563EB' },
    { name: '已完成', value: projects.filter(p => p.status === ProjectStatus.COMPLETED).length, color: '#9CA3AF' },
  ];

  const budgetData = projects.slice(0, 5).map(p => ({
    name: p.name.substring(0, 10) + '...',
    已執行: p.spent,
    未執行: p.budget - p.spent
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="總計畫數量" 
          value={stats.total.toString()} 
          icon={<Clock className="text-blue-500" />} 
          sub="年度累計"
        />
        <StatCard 
          title="執行中計畫" 
          value={stats.active.toString()} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          sub="進度正常"
        />
        <StatCard 
          title="需特別關注" 
          value={stats.stalled.toString()} 
          icon={<AlertCircle className="text-red-500" />} 
          sub="進度落後"
          highlight={stats.stalled > 0}
        />
        <StatCard 
          title="預算執行率" 
          value={`${stats.budget > 0 ? ((stats.spent / stats.budget) * 100).toFixed(1) : 0}%`} 
          icon={<DollarSign className="text-amber-500" />} 
          sub={`總額 ${ (stats.budget/1000000).toFixed(1) }M`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">單位執行概況 (前五大計畫)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="已執行" stackId="a" fill="#059669" />
                <Bar dataKey="未執行" stackId="a" fill="#E5E7EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">計畫狀態比例</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, sub, highlight = false }: any) => (
  <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${highlight ? 'border-l-red-500' : 'border-l-amber-500'} border border-gray-100 flex items-start justify-between`}>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h4 className="text-2xl font-bold mt-1 text-gray-800">{value}</h4>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
    <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
  </div>
);

export default Dashboard;
