"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

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

function toArrayOptions(options?: string[] | string | null) {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  try {
    const maybe = JSON.parse(options);
    return Array.isArray(maybe) ? maybe : [options];
  } catch {
    return [options];
  }
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
      if (!f.isRequired) continue;
      const key = f.fieldId || f.id;
      const v = values[key];
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);
      if (isEmpty) errs.push(`${f.label} is required`);
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
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job?.id,
          formData: values,
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
      case "PHONE":
      case "URL":
      case "NUMBER": {
        const type =
          f.fieldType === "EMAIL"
            ? "email"
            : f.fieldType === "PHONE"
            ? "tel"
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
        );
      case "RADIO":
        return (
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
        );
      }
      case "FILE":
        return (
          <div
            className={`border-2 border-dashed border-gray-300 rounded-md p-6 text-center ${
              f.cssClass || ""
            }`}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="mt-2">
              <label className="text-sm font-medium text-gray-900 cursor-pointer inline-flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setVal(f, e.target.files?.[0] || null)}
                />
                Choose file…
              </label>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, DOCX (Max 2MB)
              </p>
              {getVal(f) && (
                <p className="text-xs text-gray-600 mt-2">
                  Selected: {(getVal(f) as File).name}
                </p>
              )}
            </div>
          </div>
        );
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
