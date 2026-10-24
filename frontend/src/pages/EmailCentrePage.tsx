import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail,
  Send,
  Sparkles,
  Inbox,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink,
  Edit2,
  FileCheck,
  Paperclip
} from "lucide-react";
import { api } from "../lib/api";
import { EmailMessage, RecruiterContact } from "../lib/types";
import { Navbar } from "../components/Navbar";

export const EmailCentrePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("target_email") || "";
  const prefillJobId = searchParams.get("job_id");

  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [contacts, setContacts] = useState<RecruiterContact[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New Draft Composer Modal / Section
  const [showComposer, setShowComposer] = useState(Boolean(prefillEmail));
  const [recipientEmail, setRecipientEmail] = useState(prefillEmail);
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [attachResume, setAttachResume] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchEmailsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [emailList, contactList] = await Promise.all([
        api.listEmails(statusFilter !== "all" ? statusFilter : undefined),
        api.listContacts(),
      ]);
      setEmails(emailList);
      setContacts(contactList);
    } catch (err: any) {
      setError(err.message || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailsData();
  }, [statusFilter]);

  const handleGenerateAiDraft = async () => {
    setGenerating(true);
    setError(null);
    try {
      const draft = await api.generateDraft({
        job_id: prefillJobId ? parseInt(prefillJobId) : 1,
        tone: "professional",
      });
      setSubject(draft.subject);
      setBodyText(draft.body_text);
      if (!recipientEmail) setRecipientEmail(draft.recipient_email);
      if (!recipientName) setRecipientName(draft.recipient_name);
    } catch (err: any) {
      setError(err.message || "Draft generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await api.saveDraft({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject,
        body_text: bodyText,
        attach_resume: attachResume,
      });
      setShowComposer(false);
      setNotification("Draft saved successfully!");
      await fetchEmailsData();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleSendEmail = async (id: number) => {
    if (!confirm("Confirm sending this outreach email via your connected Gmail?")) return;
    try {
      const res = await api.sendEmail(id);
      setNotification(`Email sent successfully! (Message ID: ${res.message_id})`);
      await fetchEmailsData();
    } catch (err: any) {
      alert(`Send failed: ${err.message}`);
    }
  };

  const handleSyncReplies = async () => {
    setSyncing(true);
    try {
      const res = await api.syncReplies();
      setNotification(`Gmail Sync Complete: ${res.replies_found} replies detected & categorized.`);
      await fetchEmailsData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <Navbar
        title="Email Centre & Recruiter Outreach"
        subtitle="Review-before-send safeguards, verified recruiter contacts, and Gmail reply classification"
        onRefresh={fetchEmailsData}
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-700 text-xs">✕</button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Filter:</span>
            {["all", "draft", "sent"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncReplies}
              disabled={syncing}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-subtle transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing Gmail..." : "Sync Gmail Replies"}</span>
            </button>

            <button
              onClick={() => {
                setShowComposer(true);
                handleGenerateAiDraft();
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compose with Gemini</span>
            </button>
          </div>
        </div>

        {/* Composer Card if open */}
        {showComposer && (
          <div className="p-6 rounded-2xl bg-white border border-indigo-200 shadow-card space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Personalized Outreach Draft</h3>
              </div>
              <button
                onClick={() => setShowComposer(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Recipient Email (Verified Contact)</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Recipient Name / Title</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Application: Role - Candidate Name"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Body (Grounded in Resume)</label>
                <textarea
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={attachResume}
                    onChange={(e) => setAttachResume(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Attach Primary Resume (PDF)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateAiDraft}
                    disabled={generating}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                    <span>Regenerate with Gemini</span>
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Save Draft for Review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column: Messages List & Verified Recruiter Contacts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Messages List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Outreach Log & Replies ({emails.length})
            </h3>

            {emails.length > 0 ? (
              <div className="space-y-3">
                {emails.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{msg.subject}</h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                            msg.status === "sent" ? "bg-emerald-100 text-emerald-800" :
                            msg.status === "draft" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {msg.status}
                          </span>
                          {msg.is_reply && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                              Recruiter Reply: {msg.reply_classification || "inquiry"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          To: <span className="font-medium text-slate-700">{msg.recipient_name || msg.recipient_email}</span> ({msg.recipient_email})
                        </p>
                      </div>

                      {msg.status === "draft" && (
                        <button
                          onClick={() => handleSendEmail(msg.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>Approve & Send</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                      {msg.body_text}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Created {new Date(msg.created_at).toLocaleString()}</span>
                      {msg.sent_at && <span>Sent: {new Date(msg.sent_at).toLocaleString()}</span>}
                      {msg.gmail_message_id && (
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                          ID: {msg.gmail_message_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No outreach emails or replies found in this view.</p>
              </div>
            )}
          </div>

          {/* Verified Contacts Directory (1 col) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Recruiter Contacts</span>
            </h3>

            <div className="space-y-2.5">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-subtle space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{c.full_name || "Technical Recruiter"}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {c.verification_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{c.email}</p>
                  <p className="text-[10px] text-slate-400">Verified via: {c.verification_method || "Official Post"}</p>

                  <button
                    onClick={() => {
                      setRecipientEmail(c.email);
                      setRecipientName(c.full_name || "Hiring Team");
                      setShowComposer(true);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold block pt-1"
                  >
                    Compose Email →
                  </button>
                </div>
              ))}

              {contacts.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No verified contacts discovered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
