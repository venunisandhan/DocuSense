import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MoreHorizontal, 
  Mail, 
  UserCheck,
  Building,
  Plus,
  Loader2,
  Settings
} from 'lucide-react';
import { searchEmployees, getGroups, createGroup, deleteGroup } from '../services/hr.service';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const HR = () => {
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empData, groupData] = await Promise.all([
          searchEmployees(''),
          getGroups()
        ]);
        setEmployees(empData);
        setGroups(groupData);
      } catch (err) {
        console.error('HR data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setEmployeeSearch(query);
    try {
      const data = await searchEmployees(query);
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="HR Management">
      <div className="flex items-center gap-1 glass p-1 rounded-2xl w-fit mb-8">
        <button 
          onClick={() => setActiveTab('employees')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
            activeTab === 'employees' ? "bg-white text-sky-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Employees
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer",
            activeTab === 'groups' ? "bg-white text-sky-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Groups & Access
        </button>
      </div>

      {activeTab === 'employees' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search employees by name, email or department..." 
                value={employeeSearch}
                onChange={handleSearch}
                className="glass-input pl-10 w-full"
              />
            </div>
            <button className="glass-button bg-sky-blue text-white flex items-center gap-2 cursor-pointer">
              <UserPlus className="w-5 h-5" /> Add Employee
            </button>
          </div>

          <div className="glass-card overflow-hidden p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20 bg-white/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-24 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-blue mb-2" />
                      <span className="text-slate-400">Loading directory...</span>
                    </td>
                  </tr>
                ) : employees.length > 0 ? employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-white/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-blue/10 flex items-center justify-center text-sky-blue font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <Building className="w-4 h-4 text-slate-400" /> {emp.department || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sage/20 text-sage uppercase">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-24 text-center text-slate-400 italic">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button className="glass border-2 border-dashed border-white/60 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-sky-blue hover:text-sky-blue transition-all group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <h4 className="font-bold">Create New Group</h4>
            <p className="text-xs text-center mt-2 px-4">Manage access levels for teams or departments.</p>
          </button>

          {loading ? (
            <div className="col-span-full py-24 flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-sky-blue opacity-20" />
            </div>
          ) : groups.map((group) => (
            <div key={group._id} className="glass-card flex flex-col group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-tangerine/10 flex items-center justify-center text-tangerine">
                  <Shield className="w-6 h-6" />
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              
              <h4 className="text-xl font-heading font-extrabold text-slate-800 mb-2">{group.name}</h4>
              <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">{group.description}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/20">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      U
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-sky-blue text-white flex items-center justify-center text-[10px] font-bold">
                    +{group.members?.length || 0}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {group.members?.length || 0} Members
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default HR;
