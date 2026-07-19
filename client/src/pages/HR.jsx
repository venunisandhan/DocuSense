import React, { useState, useEffect, useCallback } from 'react';
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
  Settings,
  X,
  Check,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { searchEmployees, getGroups, createGroup, deleteGroup, updateGroup } from '../services/hr.service';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ────────── Confirm Dialog ────────── */
const ConfirmDialog = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-rose-500" />
        </div>
        <h3 className="text-lg font-heading font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-bold text-slate-600 py-3 cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-rose-500 hover:bg-rose-600 transition-colors rounded-xl text-white font-bold flex items-center justify-center gap-2 py-3 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ────────── Create / Edit Group Modal ────────── */
const GroupModal = ({ onClose, onSaved, allEmployees, editGroup }) => {
  const [groupName, setGroupName] = useState(editGroup?.name || '');
  const [searchQ, setSearchQ] = useState('');
  const [selected, setSelected] = useState(
    new Set((editGroup?.members || []).map(m => m._id))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = allEmployees.filter(e =>
    e.role !== 'HR' && (
      e.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQ.toLowerCase())
    )
  );

  const toggle = id => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSave = async () => {
    if (!groupName.trim()) return setError('Group name is required');
    setSaving(true);
    setError('');
    try {
      if (editGroup) {
        await updateGroup(editGroup._id, { name: groupName.trim(), memberIds: [...selected] });
      } else {
        await createGroup({ name: groupName.trim(), memberIds: [...selected] });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-heading font-bold text-slate-800">
            {editGroup ? 'Edit Group' : 'Create New Group'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Group Name</label>
            <input
              type="text"
              placeholder="e.g. Engineering, Finance…"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-blue/50 focus:border-sky-blue transition-all"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Members &nbsp;
                <span className="normal-case font-normal text-slate-400">
                  ({selected.size} selected)
                </span>
              </label>
              {selected.size > 0 && (
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-sky-blue/50 focus:border-sky-blue transition-all text-sm"
              />
            </div>
            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6 italic">No employees found</p>
              ) : filtered.map(emp => {
                const isSelected = selected.has(emp._id);
                return (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => toggle(emp._id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left',
                      isSelected
                        ? 'bg-sky-blue/10 border border-sky-blue/30'
                        : 'hover:bg-slate-50 border border-transparent'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                      isSelected ? 'bg-sky-blue text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      {isSelected ? <Check className="w-4 h-4" /> : emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{emp.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" /> {emp.email}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-blue shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">
              {error}
            </p>
          )}
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl font-bold text-slate-600 py-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !groupName.trim()}
            className="flex-1 bg-sky-blue hover:bg-sky-blue/90 transition-colors rounded-xl text-white font-bold flex items-center justify-center gap-2 py-3 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {editGroup ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────── Main HR Page ────────── */
const HR = () => {
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [activeTab, setActiveTab] = useState('employees');

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, groupData] = await Promise.all([
        searchEmployees(''),
        getGroups(),
      ]);
      setEmployees(empData);
      setAllEmployees(empData);
      setGroups(groupData);
    } catch (err) {
      console.error('HR data fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const handleDeleteGroup = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteGroup(deleteConfirm.id);
      setGroups(prev => prev.filter(g => g._id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const openCreateGroup = () => { setEditGroup(null); setShowGroupModal(true); };
  const openEditGroup = (group) => { setEditGroup(group); setShowGroupModal(true); };

  return (
    <AppLayout title="HR Management">
      <div className="flex items-center gap-1 glass p-1 rounded-2xl w-fit mb-8">
        {['employees', 'groups'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer capitalize',
              activeTab === tab ? 'bg-white text-sky-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab === 'groups' ? 'Groups & Access' : 'Employees'}
          </button>
        ))}
      </div>
      {activeTab === 'employees' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees by name or email…"
                value={employeeSearch}
                onChange={handleSearch}
                className="glass-input pl-10 w-full"
              />
            </div>
          </div>

          <div className="glass-card overflow-hidden p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/20 bg-white/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-24 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-blue mb-2" />
                      <span className="text-slate-400">Loading directory…</span>
                    </td>
                  </tr>
                ) : employees.length > 0 ? employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-white/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-blue/10 flex items-center justify-center text-sky-blue font-bold">
                          {emp.name.charAt(0).toUpperCase()}
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
                        <Building className="w-4 h-4 text-slate-400" />
                        {emp.role === 'HR' ? 'HR Admin' : 'Employee'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    </td>

                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-24 text-center text-slate-400 italic">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Groups Tab ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={openCreateGroup}
            className="glass border-2 border-dashed border-white/60 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-sky-blue hover:text-sky-blue transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <h4 className="font-bold">Create New Group</h4>
            <p className="text-xs text-center mt-2 px-4">Select employees and assign document access.</p>
          </button>

          {loading ? (
            <div className="col-span-full py-24 flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-sky-blue opacity-20" />
            </div>
          ) : groups.map(group => (
            <div key={group._id} className="glass-card flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-tangerine/10 flex items-center justify-center text-tangerine">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditGroup(group)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer"
                    title="Edit group"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: group._id, name: group.name })}
                    className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-xl font-heading font-extrabold text-slate-800 mb-1">{group.name}</h4>
              <p className="text-xs text-slate-400 mb-4">
                {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
              </p>
              {group.members?.length > 0 && (
                <div className="flex -space-x-2 mb-4">
                  {group.members.slice(0, 5).map(m => (
                    <div
                      key={m._id}
                      title={m.name}
                      className="w-8 h-8 rounded-full border-2 border-white bg-sky-blue/10 flex items-center justify-center text-[10px] font-bold text-sky-blue"
                    >
                      {(m.name || '?').charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {group.members.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      +{group.members.length - 5}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-white/20">
                <button
                  onClick={() => openEditGroup(group)}
                  className="w-full text-[11px] font-bold text-sky-blue hover:underline text-center cursor-pointer"
                >
                  Manage Members →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showGroupModal && (
        <GroupModal
          allEmployees={allEmployees}
          editGroup={editGroup}
          onClose={() => setShowGroupModal(false)}
          onSaved={fetchData}
        />
      )}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Group"
          message={`Delete "${deleteConfirm.name}"? This will revoke all document access granted through it.`}
          onConfirm={handleDeleteGroup}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}
    </AppLayout>
  );
};

export default HR;
