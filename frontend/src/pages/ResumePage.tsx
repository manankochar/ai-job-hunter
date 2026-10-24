import React, { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star,
  Plus,
  Briefcase,
  GraduationCap,
  Code,
  Edit2,
  Save,
  X
} from "lucide-react";
import { api } from "../lib/api";
import { Resume } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const ResumePage: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [summary, setSummary] = useState("");
  const [skillsText, setSkillsText] = useState("");

  const fetchResumes = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listResumes();
      setResumes(list);
      if (list.length > 0) {
        const primary = list.find((r) => r.is_primary) || list[0];
        setSelectedResume(primary);
        setSummary(primary.parsed_json?.summary || "");
        setSkillsText((primary.parsed_json?.skills || []).join(", "));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setUploading(true);
    setError(null);
    try {
      const uploaded = await api.uploadResume(file, file.name.replace(/\.[^/.]+$/, ""));
      await fetchResumes();
      setSelectedResume(uploaded);
      alert("Resume uploaded and parsed successfully!");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedResume) return;
    setLoading(true);
    try {
      const updatedJson = {
        ...selectedResume.parsed_json,
        summary,
        skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const updated = await api.updateResume(selectedResume.id, {
        parsed_json: updatedJson,
      });
      setSelectedResume(updated);
      setEditMode(false);
      alert("Resume corrections saved!");
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this resume?")) return;
    try {
      await api.deleteResume(id);
      await fetchResumes();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await api.updateResume(id, { is_primary: true });
      await fetchResumes();
    } catch (err: any) {
      alert(`Could not set primary: ${err.message}`);
    }
  };

  return (
    <div>
      <Navbar
        title="Resume Vault & Structured Qualifications"
        subtitle="Upload PDF or DOCX documents parsed by Google Gemini AI"
        onRefresh={fetchResumes}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload a New Resume Version</h2>
              <p className="text-xs text-slate-500">Supports PDF, DOCX, or TXT up to 10MB. Automatically structured into skills, roles and projects.</p>
            </div>
          </div>

          <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0">
            <Upload className="w-4 h-4" />
            <span>{uploading ? "Parsing Document..." : "Choose File to Upload"}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Main Content Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Resume Versions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Stored Resumes ({resumes.length})</h3>
            {resumes.map((r) => {
              const isSelected = selectedResume?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedResume(r);
                    setSummary(r.parsed_json?.summary || "");
                    setSkillsText((r.parsed_json?.skills || []).join(", "));
                    setEditMode(false);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-400 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {r.title}
                        {r.is_primary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{r.file_name} • {(r.file_size_bytes / 1024).toFixed(0)} KB</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResume(r.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!r.is_primary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(r.id);
                      }}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      Set as Primary
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Structured View */}
          <div className="lg:col-span-2">
            {selectedResume ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedResume.title}</h2>
                    <p className="text-xs text-slate-500">
                      Uploaded on {new Date(selectedResume.created_at).toLocaleDateString()} • Verified by Gemini
                    </p>
                  </div>

                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Fields</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Corrections</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Candidate Summary */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Candidate Executive Summary</span>
                  {editMode ? (
                    <textarea
                      rows={3}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedResume.parsed_json?.summary || "No summary extracted."}
                    </p>
                  )}
                </div>

                {/* Extracted Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-500" />
                    Verified Technical Skills ({selectedResume.parsed_json?.skills?.length || 0})
                  </span>

                  {editMode ? (
                    <input
                      type="text"
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      placeholder="Comma separated skills..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-indigo-500"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedResume.parsed_json?.skills || []).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-medium text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Experience */}
                {selectedResume.parsed_json?.experience && selectedResume.parsed_json.experience.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      Work Experience
                    </span>
                    <div className="space-y-3">
                      {selectedResume.parsed_json.experience.map((exp, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{exp.title}</h4>
                            <span className="text-[11px] text-slate-500">{exp.start_date} - {exp.end_date}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{exp.company}</p>
                          <p className="text-xs text-slate-500 leading-relaxed pt-1">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {selectedResume.parsed_json?.education && selectedResume.parsed_json.education.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      Education
                    </span>
                    <div className="space-y-2">
                      {selectedResume.parsed_json.education.map((edu, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{edu.degree}</p>
                            <p className="text-[11px] text-slate-500">{edu.institution}</p>
                          </div>
                          {edu.graduation_year && (
                            <span className="text-xs text-slate-500 font-medium">{edu.graduation_year}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-400">
                No resume selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
