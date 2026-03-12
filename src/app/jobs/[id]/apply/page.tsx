"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import TagsInput from "@/components/TagsInput";
import SkillsWithRatings from "@/components/SkillsWithRatings";

export interface SkillRating {
  skill: string;
  rating: number;
}

type FieldType =
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "TEXTAREA"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "TAGS"
  | "SKILLS"
  | "FILE"
  | "DATE"
  | "NUMBER"
  | "URL"
  | "PASSWORD"
  | "COUNTRY_CODE"
  | "PAGE_BREAK";

interface FormField {
  id: string;
  label: string;
  fieldType: FieldType;
  placeholder?: string;
  options?: string[] | string | null;
  cssClass?: string;
  fieldId?: string;
  fieldWidth?: string;
  isRequired: boolean;
  order: number;
}

interface Form {
  id: string;
  name: string;
  description?: string | null;
  fields: FormField[];
}

interface Job {
  id: string;
  title: string;
  position?: string | null;
  form?: Form | null;
}

interface UserLocation {
  city: string;
  region: string;
  country: string;
  ip: string;
}

function toArrayOptions(options?: string[] | string | null): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return options;

  let parsed: any = options;
  // keep parsing in case it's double or equivalently stringified
  while (typeof parsed === "string") {
    try {
      // try to parse it as JSON
      const attempt = JSON.parse(parsed);
      // if it parse back exactly into a string without quotes, break out
      if (typeof attempt === "string" && attempt === parsed) {
        break;
      }
      parsed = attempt;
    } catch {
      // Not JSON, just break
      break;
    }
  }

  return Array.isArray(parsed) ? parsed : [String(parsed)];
}

function groupByPageBreak(fields: FormField[]) {
  const steps: FormField[][] = [];
  let buf: FormField[] = [];
  for (const f of fields) {
    if (f.fieldType === "PAGE_BREAK") {
      steps.push(buf);
      buf = [];
      continue;
    }
    buf.push(f);
  }
  steps.push(buf);
  return steps.filter((step) => step.length > 0);
}

function isOtherSelected(val: any): boolean {
  if (Array.isArray(val)) {
    return val.some((v) => String(v).toLowerCase().includes("other"));
  }
  if (!val) return false;
  return String(val).toLowerCase().includes("other");
}

function gridSpan(width?: string) {
  switch (width) {
    case "25%":
      return "col-span-3";
    case "33%":
      return "col-span-4";
    case "50%":
      return "col-span-6";
    case "66%":
      return "col-span-8";
    case "75%":
      return "col-span-9";
    case "100%":
    default:
      return "col-span-12";
  }
}

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [values, setValues] = useState<Record<string, any>>({});
  const [step, setStep] = useState(0);

  // ✅ User location state
  const [userLocation, setUserLocation] = useState<UserLocation>({
    city: "",
    region: "",
    country: "",
    ip: "",
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
        if (!res.ok) {
          setError("Failed to load job");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data?.form?.fields?.length) {
          data.form.fields = [...data.form.fields].sort(
            (a: FormField, b: FormField) => a.order - b.order
          );
        }
        setJob(data);
      } catch (e) {
        setError("Failed to load job");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // ✅ Fetch rough location (IP based) once
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = await res.json();
        setUserLocation({
          city: data.city || "",
          region: data.region || data.region_code || "",
          country: data.country_name || data.country || "",
          ip: data.ip || "",
        });
      } catch (err) {
        console.error("Location fetch failed:", err);
      }
    };
    fetchLocation();
  }, []);

  const steps = useMemo(() => {
    const fields = job?.form?.fields || [];
    return groupByPageBreak(fields);
  }, [job]);

  const currentFields = steps[step] || [];

  const setVal = (field: FormField, v: any) => {
    const key = field.fieldId || field.id;
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const getVal = (field: FormField) => {
    const key = field.fieldId || field.id;
    return values[key] ?? "";
  };

  const validateStep = (): string[] => {
    const errs: string[] = [];
    for (const f of currentFields) {
      const key = f.fieldId || f.id;
      const v = values[key];
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);

      if (f.fieldType === "SKILLS") {
        const skills = v as SkillRating[] | undefined;
        if (f.isRequired && (!skills || skills.length === 0)) {
          errs.push(`${f.label} is required`);
        } else if (skills && skills.length > 0 && skills.some((s) => !s.rating || s.rating === 0)) {
          errs.push(`Please rate all skills in ${f.label}`);
        }
        continue;
      }

      if (f.isRequired && isEmpty) {
        errs.push(`${f.label} is required`);
        continue;
      }

      if (!isEmpty && f.fieldType === "URL") {
        const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-./?%&\=;]*)?$/i;
        if (!urlRegex.test(String(v))) {
          errs.push(`Please enter a valid URL for ${f.label}`);
        }
      }
    }
    return errs;
  };

  const onNext = () => {
    const errs = validateStep();
    if (errs.length) {
      setError(errs[0]);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onPrev = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = async () => {
    const errs = validateStep();
    if (errs.length) {
      setError(errs[0]);
      return;
    }
    setError("");
    setSubmitting(true);
    
    try {
      // 1. Upload files first
      const fieldsToProcess = job?.form?.fields || [];
      const processedValues = { ...values };

      for (const f of fieldsToProcess) {
        if (f.fieldType === "FILE") {
          const key = f.fieldId || f.id;
          const file = values[key];
          if (file && typeof file === 'object' && 'name' in file) {
            const formData = new FormData();
            formData.append("file", file as Blob);
            
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            
            if (!uploadRes.ok) {
              const err = await uploadRes.json();
              throw new Error(err.error || `Failed to upload ${f.label}`);
            }
            
            const uploadData = await uploadRes.json();
            processedValues[key] = JSON.stringify({
              fileName: uploadData.originalName || file.name,
              path: uploadData.path,
            });
          }
        }
      }

      // 2. Submit application
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job?.id,
          formData: processedValues,
          // ✅ send location to backend
          location: userLocation,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to submit");
      }

      // ✅ Show thank you message
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f: FormField) => {
    const base = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 text-gray-900 placeholder-gray-600 ${
      f.cssClass || ""
    }`;
    const options = toArrayOptions(f.options);

    switch (f.fieldType) {
      case "TEXT":
      case "PASSWORD":
      case "EMAIL":
      case "URL":
      case "NUMBER": {
        const type =
          f.fieldType === "EMAIL"
            ? "email"
            : f.fieldType === "URL"
            ? "url"
            : f.fieldType === "NUMBER"
            ? "number"
            : f.fieldType === "PASSWORD"
            ? "password"
            : "text";
        return (
          <input
            type={type}
            placeholder={f.placeholder}
            className={base}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );
      }
      case "PHONE":
        return (
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder={f.placeholder}
            className={base}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
        );
      case "DATE":
        return (
          <input
            type="date"
            className={base}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );
      case "TEXTAREA":
        return (
          <textarea
            placeholder={f.placeholder}
            className={base}
            rows={4}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );
      case "SELECT":
        return (
          <div className="space-y-2">
            <select
              className={base}
              value={getVal(f)}
              onChange={(e) => setVal(f, e.target.value)}
            >
              <option value="">{f.placeholder || "Select an option"}</option>
              {options.map((opt, i) => (
                <option key={i} value={String(opt)}>
                  {String(opt)}
                </option>
              ))}
            </select>
            {isOtherSelected(getVal(f)) && (
              <input
                type="text"
                className={base}
                placeholder="Please specify..."
                value={values[`${f.fieldId || f.id}_other`] || ""}
                onChange={(e) => setValues(prev => ({ ...prev, [`${f.fieldId || f.id}_other`]: e.target.value }))}
              />
            )}
          </div>
        );
      case "RADIO":
        return (
          <div className="space-y-2">
            <div className="space-y-2">
              {options.map((opt, i) => (
                <label key={i} className="flex items-center">
                  <input
                    type="radio"
                    name={f.fieldId || f.id}
                    className="mr-2"
                    checked={getVal(f) === String(opt)}
                    onChange={() => setVal(f, String(opt))}
                  />
                  <span>{String(opt)}</span>
                </label>
              ))}
            </div>
            {isOtherSelected(getVal(f)) && (
              <input
                type="text"
                className={base}
                placeholder="Please specify..."
                value={values[`${f.fieldId || f.id}_other`] || ""}
                onChange={(e) => setValues(prev => ({ ...prev, [`${f.fieldId || f.id}_other`]: e.target.value }))}
              />
            )}
          </div>
        );
      case "CHECKBOX": {
        const selected: string[] = Array.isArray(getVal(f)) ? getVal(f) : [];
        const toggle = (opt: string) => {
          const next = selected.includes(opt)
            ? selected.filter((o) => o !== opt)
            : [...selected, opt];
          setVal(f, next);
        };
        return (
          <div className="space-y-2">
            <div className="space-y-2">
              {options.map((opt, i) => (
                <label key={i} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selected.includes(String(opt))}
                    onChange={() => toggle(String(opt))}
                  />
                  <span>{String(opt)}</span>
                </label>
              ))}
            </div>
            {isOtherSelected(selected) && (
              <input
                type="text"
                className={base}
                placeholder="Please specify..."
                value={values[`${f.fieldId || f.id}_other`] || ""}
                onChange={(e) => setValues(prev => ({ ...prev, [`${f.fieldId || f.id}_other`]: e.target.value }))}
              />
            )}
          </div>
        );
      }
      case "TAGS":
        return (
          <TagsInput
            value={(getVal(f) as string[]) || []}
            onChange={(tags) => setVal(f, tags)}
            options={options}
            placeholder={f.placeholder || "Type to add tags..."}
            className="w-full"
            id={f.fieldId || f.id}
          />
        );
      case "SKILLS":
        return (
          <SkillsWithRatings
            value={(getVal(f) as SkillRating[]) || []}
            onChange={(skills) => setVal(f, skills)}
            options={options}
            placeholder={f.placeholder || "Type to add skills..."}
            className="w-full"
            id={f.fieldId || f.id}
          />
        );
      case "FILE": {
        const file = getVal(f) as File | null;
        return (
          <label
            className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-all min-h-[120px] ${
              f.cssClass || ""
            }`}
          >
            <Upload className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-900">
              {file ? file.name : "Choose file…"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, DOCX (Max 2MB)
            </p>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setVal(f, e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx"
            />
          </label>
        );
      }
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-semibold text-green-700 mb-2">
          🎉 Thank you for submitting your application!
        </h1>
        <p className="text-gray-600 mb-6">
          Our team will review your details and contact you soon.
        </p>
        <button
          onClick={() => router.push(`/jobs/${job?.id}`)}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Back to Job
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Job not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Details
        </Link>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-900">
              Apply for {job.title}
            </h1>
            {job.position && (
              <p className="text-gray-600 mt-1">{job.position}</p>
            )}
            {job.form?.name && (
              <p className="text-gray-500 mt-1">{job.form.name}</p>
            )}
          </div>

          <div className="p-6">
            {steps.length === 0 ? (
              <p className="text-gray-500">
                This job has no application fields yet.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">
                    Step {Math.min(step + 1, steps.length)} of {steps.length}
                  </span>
                  <div className="h-2 bg-gray-100 rounded w-40 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{
                        width: `${((step + 1) / steps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  {currentFields.map((f) => (
                    <div key={f.id} className={gridSpan(f.fieldWidth)}>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        {f.label}
                        {f.isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {renderField(f)}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onPrev}
                    disabled={step === 0}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={onNext}
                      className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={submitting}
                      className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
