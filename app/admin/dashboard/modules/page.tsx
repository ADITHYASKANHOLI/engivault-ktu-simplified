"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Globe, EyeOff, Layers, BookOpen, X } from "lucide-react";
import { Subject, Module } from "@/types";
import { slugify } from "@/lib/utils";

export default function AdminModulesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [formData, setFormData] = useState({
    subject_id: "",
    title: "",
    slug: "",
    short_description: "",
    display_order: 1,
    published: true,
  });

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (res.ok) {
        const subs: Subject[] = await res.json();
        setSubjects(subs);
        if (subs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subs[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingModule(null);
    setFormData({
      subject_id: selectedSubjectId,
      title: "",
      slug: "",
      short_description: "",
      display_order: modules.length + 1,
      published: true,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingModule ? prev.slug : slugify(val),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModule) {
        const res = await fetch("/api/admin/modules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingModule.id, ...formData }),
        });
        if (res.ok) {
          await loadData();
          setModalOpen(false);
        }
      } else {
        const res = await fetch("/api/admin/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await loadData();
          setModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module and its associated lessons?")) return;
    try {
      await fetch(`/api/admin/modules?id=${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Module Management</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Organize each KTU subject into structured syllabus modules (e.g. Module 1, Module 2).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={!selectedSubjectId}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Module</span>
        </button>
      </div>

      {/* Filter by Subject */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4 text-xs shadow-xs">
        <span className="font-semibold text-slate-700">Filter by Subject:</span>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/80 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.code || "KTU"})
            </option>
          ))}
        </select>
      </div>

      {/* Modules List / Card View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
          <span>Configured Modules</span>
          <span>Order</span>
        </div>

        <div className="divide-y divide-slate-100 p-2">
          {subjects
            .filter((s) => s.id === selectedSubjectId)
            .map((s) => (
              <div key={s.id} className="p-4 space-y-3">
                <div className="text-xs text-slate-400 font-mono">
                  Displaying modules for: <strong className="text-slate-800">{s.title}</strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-600" />
                      <span>Module 1 — Foundational Principles & Theorems</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      module-1-foundational-principles • 2 lectures
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      PUBLISHED
                    </span>
                    <button
                      onClick={() => alert("Module edit dialog")}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-600" />
                      <span>Module 2 — Advanced Methods & Numerical Applications</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      module-2-advanced-methods • 1 lecture
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      PUBLISHED
                    </span>
                    <button
                      onClick={() => alert("Module edit dialog")}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal for Create Module */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Module</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Parent Subject
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Module 3 — Vector Calculus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Syllabus Description
                </label>
                <textarea
                  rows={3}
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Topics covered in this module..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
