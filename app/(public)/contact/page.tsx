"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle, MessageSquare, AlertCircle, Loader2, Clock, ShieldCheck } from "lucide-react";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  hp_company: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
    hp_company: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Full name is required.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    } else if (formData.name.length > 100) {
      errors.name = "Name cannot exceed 100 characters.";
    } else if (/[\r\n]/.test(formData.name)) {
      errors.name = "Name cannot contain line breaks.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    } else if (formData.email.length > 254) {
      errors.email = "Email address is too long.";
    }

    if (!formData.subject.trim()) {
      errors.subject = "Subject is required.";
    } else if (formData.subject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters.";
    } else if (formData.subject.length > 200) {
      errors.subject = "Subject cannot exceed 200 characters.";
    } else if (/[\r\n]/.test(formData.subject)) {
      errors.subject = "Subject cannot contain line breaks.";
    }

    if (!formData.message.trim()) {
      errors.message = "Message content is required.";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters.";
    } else if (formData.message.length > 5000) {
      errors.message = "Message cannot exceed 5000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);

    // Validate client-side first for immediate responsive feedback
    if (!validateClient()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          hp_company: formData.hp_company,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400 && data?.details) {
          setFieldErrors(data.details);
          setServerError("Please correct the highlighted fields and try again.");
        } else if (response.status === 429) {
          setServerError(
            data?.error || "Too many requests. Please wait a few minutes before trying again."
          );
        } else {
          setServerError(
            data?.error || "We could not send your message right now. Please try again later."
          );
        }
        return;
      }

      // Success
      setSubmittedEmail(formData.email.trim());
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        hp_company: "",
      });
      setFieldErrors({});
    } catch {
      setServerError("We could not send your message right now. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setServerError(null);
    setFieldErrors({});
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
      hp_company: "",
    });
  };

  return (
    <main className="flex-1 pt-32 pb-24 bg-[#F7F9FC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <MessageSquare className="w-3.5 h-3.5" />
            <span>OFFICIAL FOLE SUPPORT</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Contact & Support
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Have questions regarding KTU course lectures, syllabus revisions, or general academic inquiries? Send a message directly to the official FOLE CEV team.
          </p>
        </div>

        {/* Quick Contact & Mission Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono font-semibold text-slate-500 uppercase">Official Email</div>
              <a
                href="mailto:folecev@gmail.com"
                className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-600 truncate block transition-colors"
                title="Send direct email to folecev@gmail.com"
              >
                folecev@gmail.com
              </a>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-500 uppercase">Response Time</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">Within 24–48 hours</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-slate-500 uppercase">Platform</div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">FOLE CEV Academic Vault</div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
          {isSuccess ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  Message Sent Successfully!
                </h3>
                <p className="text-base text-slate-700 font-medium max-w-md mx-auto">
                  Thank you for contacting FOLE CEV. Your message has been submitted successfully.
                </p>
                {submittedEmail && (
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    A confirmation will be directed to <span className="font-semibold text-slate-700">{submittedEmail}</span>.
                  </p>
                )}
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Server-level error banner */}
              {serverError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm"
                >
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{serverError}</div>
                </div>
              )}

              {/* Bot Honeypot (Visually Hidden) */}
              <div
                className="hidden"
                aria-hidden="true"
                style={{ display: "none", position: "absolute", left: "-9999px" }}
              >
                <label htmlFor="hp_company">Leave this field blank</label>
                <input
                  type="text"
                  id="hp_company"
                  name="hp_company"
                  value={formData.hp_company}
                  onChange={(e) => setFormData({ ...formData, hp_company: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono"
                  >
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) {
                        setFieldErrors({ ...fieldErrors, name: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all ${
                      fieldErrors.name
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="e.g. Arjun Nair"
                    autoComplete="name"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono"
                  >
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all ${
                      fieldErrors.email
                        ? "border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/20"
                        : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="e.g. student@ktu.edu.in"
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono"
                >
                  Subject / Topic <span className="text-rose-600">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    if (fieldErrors.subject) {
                      setFieldErrors({ ...fieldErrors, subject: "" });
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all ${
                    fieldErrors.subject
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="e.g. Question regarding MAT101 Limits lecture notes"
                  autoComplete="off"
                />
                {fieldErrors.subject && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="message"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono"
                  >
                    Your Message <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {formData.message.length} / 5000
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  disabled={isSubmitting}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (fieldErrors.message) {
                      setFieldErrors({ ...fieldErrors, message: "" });
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all resize-y min-h-[140px] ${
                    fieldErrors.message
                      ? "border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="Please describe your question, KTU topic inquiry, or platform suggestion..."
                />
                {fieldErrors.message && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.message}</p>
                )}
              </div>

              {/* Privacy Note */}
              <div className="text-xs text-slate-500 leading-relaxed">
                By submitting this form, your enquiry will be sent directly to the official FOLE CEV team at{" "}
                <span className="font-semibold text-slate-700">folecev@gmail.com</span>. We will never share your personal information.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-sm flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Submitting to FOLE CEV...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>Send Message to FOLE CEV</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
