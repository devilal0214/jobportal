"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

/* ---------- Types ---------- */

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
  fieldName?: string | null;
  fieldType: FieldType;
  label: string;
  placeholder?: string | null;
  options?: string | null;
  cssClass?: string | null;
  fieldId?: string | null;
  fieldWidth?: string | null;
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
  description: string;
  position?: string | null;
  department?: string | null;
  location?: string | null;
  salary?: string | null;
  experienceLevel?: string | null;
  status: string;
  createdAt: string;
  imageUrl?: string | null;
  bannerImageUrl?: string | null;
  formId?: string | null;
  form?: Form | null; // expect this from /api/jobs/public/[id]
}

interface CareersSettings {
  bannerOverlay: string;
  bannerHeight: string;
  bannerWidth: string;
  bannerBorderRadius: string;
  logoImage?: string;
  logoHeight: string;
  logoWidth: string;
  companyName: string;
}

/* ---------- Helpers ---------- */

function normalizeOptions(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore JSON parse errors
  }
  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [raw];
}

function splitSteps(fields: FormField[]): FormField[][] {
  const steps: FormField[][] = [];
  let current: FormField[] = [];

  for (const f of fields) {
    if (f.fieldType === "PAGE_BREAK") {
      if (current.length) steps.push(current);
      current = [];
    } else {
      current.push(f);
    }
  }
  if (current.length) steps.push(current);

  return steps.length ? steps : fields.length ? [fields] : [];
}

function widthToCols(width?: string | null): string {
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

const inputBase =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

/* ---------- Page Component ---------- */

export default function CareerApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [settings, setSettings] = useState<CareersSettings>({
    bannerOverlay:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)",
    bannerHeight: "260px",
    bannerWidth: "100%",
    bannerBorderRadius: "0px",
    logoHeight: "40px",
    logoWidth: "40px",
    companyName: "Job Portal",
  });
  const [loading, setLoading] = useState(true);

  // multi-step state
  const [step, setStep] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ----- Load job + settings ----- */

  useEffect(() => {
    if (!id) return;

    const fetchJobAndSettings = async () => {
      try {
        // Job + form (public)
        const resJob = await fetch(`/api/jobs/public/${id}`, {
          cache: "no-store",
        });

        if (!resJob.ok) {
          router.push("/careers");
          return;
        }

        const jobData = await resJob.json();

        // Ensure form fields sorted if present
        if (jobData?.form?.fields?.length) {
          jobData.form.fields = [...jobData.form.fields].sort(
            (a: FormField, b: FormField) => a.order - b.order
          );
        }

        setJob(jobData);

        // Settings
        const resSettings = await fetch("/api/careers-settings/public");
        if (resSettings.ok) {
          const data = await resSettings.json();
          if (data.settings) {
            setSettings((prev) => ({
              ...prev,
              ...data.settings,
            }));
          }
        }
      } catch (err) {
        console.error("Apply page load error:", err);
        router.push("/careers");
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndSettings();
  }, [id, router]);

  /* ----- Build steps from form fields ----- */

  const steps = useMemo(
    () => splitSteps(job?.form?.fields || []),
    [job?.form?.fields]
  );
  const currentFields = steps[step] || [];

  // Helpers to map stored values keys consistently
  const keyFor = (f: FormField) => f.fieldId || f.fieldName || f.id;

  const setVal = (f: FormField, v: any) =>
    setFormValues((prev) => ({ ...prev, [keyFor(f)]: v }));

  const getVal = (f: FormField) => {
    const v = formValues[keyFor(f)];
    if (v === undefined && f.fieldType === "CHECKBOX") return [];
    return v ?? "";
  };

  /* ----- Validation + navigation ----- */

  const validateStep = (): string | null => {
    for (const f of currentFields) {
      if (!f.isRequired || f.fieldType === "PAGE_BREAK") continue;

      const v = getVal(f);
      const empty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);

      if (empty) {
        return `${f.label} is required`;
      }
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goPrev = () => {
    setFormError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  /* ----- Submit ----- */

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) {
      setFormError(err);
      return;
    }
    if (!job) return;
    if (!job.form?.id && !job.formId) {
      setFormError("Application form is not configured for this job.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      // NOTE: This sends JSON. If you need real file uploads, adapt to FormData + upload API.
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          formId: job.form?.id || job.formId,
          formData: formValues,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (e: any) {
      console.error("Application submit error:", e);
      setFormError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ----- Field Renderer ----- */

  const renderField = (f: FormField) => {
    const options = normalizeOptions(f.options);

    switch (f.fieldType) {
      case "TEXT":
      case "EMAIL":
      case "PHONE":
      case "URL":
      case "PASSWORD":
      case "NUMBER": {
        const type =
          f.fieldType === "EMAIL"
            ? "email"
            : f.fieldType === "PHONE"
            ? "tel"
            : f.fieldType === "URL"
            ? "url"
            : f.fieldType === "PASSWORD"
            ? "password"
            : f.fieldType === "NUMBER"
            ? "number"
            : "text";
        return (
          <input
            type={type}
            className={inputBase}
            placeholder={f.placeholder || ""}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );
      }

      case "TEXTAREA":
        return (
          <textarea
            className={inputBase}
            rows={4}
            placeholder={f.placeholder || ""}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );

      case "DATE":
        return (
          <input
            type="date"
            className={inputBase}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );

      case "SELECT":
        return (
          <select
            className={inputBase}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          >
            <option value="">{f.placeholder || "Select an option"}</option>
            {options.map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
        );

      case "RADIO":
        return (
          <div className="space-y-1">
            {options.map((o, i) => (
              <label
                key={i}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name={keyFor(f)}
                  className="text-indigo-600"
                  checked={getVal(f) === o}
                  onChange={() => setVal(f, o)}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
        );

      case "CHECKBOX": {
        const selected: string[] = Array.isArray(getVal(f)) ? getVal(f) : [];
        const toggle = (o: string) => {
          const next = selected.includes(o)
            ? selected.filter((x) => x !== o)
            : [...selected, o];
          setVal(f, next);
        };
        return (
          <div className="space-y-1">
            {options.map((o, i) => (
              <label
                key={i}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  className="text-indigo-600"
                  checked={selected.includes(o)}
                  onChange={() => toggle(o)}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
        );
      }

      case "FILE":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-3 text-center text-xs text-gray-600">
            <p className="mb-1 font-medium">{f.placeholder || "Upload file"}</p>
            <input
              type="file"
              className="block w-full text-xs text-gray-700"
              onChange={(e) => setVal(f, e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-[10px] text-gray-500">
              (This demo stores the File object in state. Hook it to your upload
              API as needed.)
            </p>
          </div>
        );

      case "PAGE_BREAK":
        return null;

      default:
        return (
          <input
            type="text"
            className={inputBase}
            placeholder={f.placeholder || ""}
            value={getVal(f)}
            onChange={(e) => setVal(f, e.target.value)}
          />
        );
    }
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!job) return null;

  // No form configured: show clear message
  if (!job.form || !job.form.fields || job.form.fields.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link
              href={`/careers/${job.id}`}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to job details
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {job.title}
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-red-600 font-medium mb-2">
              Application form is not configured for this job.
            </p>
            <p className="text-sm text-gray-600">
              Please contact the company directly or check back later.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
        <h1 className="text-2xl font-semibold text-green-700 mb-2">
          Application submitted!
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Thank you for applying for <strong>{job.title}</strong>. Our team will
          review your details and contact you if you are shortlisted.
        </p>
        <div className="flex gap-3">
          <Link
            href="/careers"
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            View other openings
          </Link>
          <Link
            href={`/careers/${job.id}`}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Back to job details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href={`/careers/${job.id}`}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to job details
          </Link>
          <span className="text-sm text-gray-500">
            Applying for{" "}
            <span className="font-semibold text-gray-900">{job.title}</span>
          </span>
        </div>
      </header>

      {/* Banner (compact) */}
      <div className="bg-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Application Form
          </h1>
          <p className="text-m text-gray-600">
            Please complete all required fields. It only takes a few minutes.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
            {job.department && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {job.department}
              </span>
            )}
            {job.experienceLevel && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {job.experienceLevel}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
          {/* Step indicator */}
          <div className="mb-4">
            <p className="text-s text-gray-500 mb-1">
              Step {step + 1} of {steps.length}
            </p>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= step ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            {currentFields.map((f) =>
              f.fieldType === "PAGE_BREAK" ? null : (
                <div
                  key={f.id}
                  className={`${widthToCols(f.fieldWidth)} flex flex-col gap-1`}
                >
                  <label className="text-s font-medium text-gray-700">
                    {f.label}
                    {f.isRequired && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </label>
                  {renderField(f)}
                </div>
              )
            )}
          </div>

          {/* Errors */}
          {formError && (
            <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {formError}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 0}
              className="px-4 py-2 text-xs rounded-full border border-gray-300 text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="ml-auto px-5 py-2 text-xs rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto px-5 py-2 text-xs rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
