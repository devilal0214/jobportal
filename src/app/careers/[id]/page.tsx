"use client";

import { useState, useEffect } from "react";
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
  Share2,
  Facebook,
  Linkedin,
  Mail,
  CheckCircle,
} from "lucide-react";

/* ---------- Helper Functions ---------- */

// Helper function to format font family
const getFontFamily = (fontFamily?: string) => {
  if (!fontFamily || fontFamily === 'System Default') return 'inherit';
  const fontMap: Record<string, string> = {
    'Archivo': `'Archivo', sans-serif`,
    'Inter': `'Inter', sans-serif`,
    'Poppins': `'Poppins', sans-serif`,
    'Montserrat': `'Montserrat', sans-serif`,
    'Roboto': `'Roboto', sans-serif`,
    'Lato': `'Lato', sans-serif`,
    'Nunito': `'Nunito', sans-serif`,
    'Work Sans': `'Work Sans', sans-serif`,
    'Playfair Display': `'Playfair Display', serif`,
    'Merriweather': `'Merriweather', serif`,
  };
  return fontMap[fontFamily] || fontFamily;
};

/* ---------- Types ---------- */

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
  form?: {
    id: string;
    name: string;
  } | null;
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
  menuItems?: Array<{
    id: string;
    label: string;
    url: string;
    order: number;
  }>;
  navFontFamily?: string;
  navFontSize?: string;
  navFontUrl?: string;
  globalFontFamily?: string;
  globalFontUrl?: string;
  // Button styling
  jobDetailsButtonClass?: string;
  jobDetailsButtonBg?: string;
  jobDetailsButtonText?: string;
  jobDetailsButtonBorder?: string;
  jobDetailsButtonBorderColor?: string;
  jobDetailsButtonRadius?: string;
  jobDetailsButtonFontFamily?: string;
  jobDetailsButtonFontSize?: string;
  jobDetailsButtonFontWeight?: string;
  applyButtonClass?: string;
  applyButtonBg?: string;
  applyButtonText?: string;
  applyButtonBorder?: string;
  applyButtonBorderColor?: string;
  applyButtonRadius?: string;
  applyButtonFontFamily?: string;
  applyButtonFontSize?: string;
  applyButtonFontWeight?: string;
  // Share icons
  shareIconsEnabled?: boolean;
  shareIcons?: {
    facebook?: string;
    facebookImage?: string;
    twitter?: string;
    twitterImage?: string;
    linkedin?: string;
    linkedinImage?: string;
    whatsapp?: string;
    whatsappImage?: string;
    email?: string;
    emailImage?: string;
  };
  shareIconWidth?: string;
  shareIconHeight?: string;
  shareIconBorderRadius?: string;
  // Custom CSS
  customCss?: string;
  // Footer settings
  footerEnabled?: boolean;
  footerColumns?: number;
  footerWidth?: string;
  footerWidgets?: Array<{
    id: string;
    type: 'logo' | 'text' | 'menu' | 'html' | 'social';
    title?: string;
    content: string;
    menuItems?: Array<{ label: string; url: string }>;
    logoImage?: string;
    logoWidth?: string;
    logoHeight?: string;
    twoColumns?: boolean;
    customClass?: string;
    order: number;
    columnIndex: number;
  }>;
  footerBgColor?: string;
  footerTextColor?: string;
  footerPadding?: string;
  footerFontFamily?: string;
  footerFontSize?: string;
  footerFontWeight?: string;
  footerBorderTop?: string;
  footerBorderBottom?: string;
  footerBorderLeft?: string;
  footerBorderRight?: string;
  footerBorderColor?: string;
  copyrightEnabled?: boolean;
  copyrightLeftHtml?: string;
  copyrightRightHtml?: string;
  copyrightBgColor?: string;
  copyrightTextColor?: string;
  copyrightDividerEnabled?: boolean;
  copyrightDividerWidth?: string;
  copyrightDividerHeight?: string;
  copyrightDividerColor?: string;
  copyrightDividerBorderTop?: string;
  copyrightDividerBorderBottom?: string;
  copyrightDividerBorderLeft?: string;
  copyrightDividerBorderRight?: string;
  copyrightDividerBorderStyle?: string;
  socialLinks?: Array<{
    id: string;
    platform: string;
    url: string;
    iconImage?: string;
    order: number;
  }>;
}

/* ---------- Component ---------- */

export default function CareerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<CareersSettings>({
    bannerOverlay:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)",
    bannerHeight: "400px",
    bannerWidth: "100%",
    bannerBorderRadius: "0px",
    logoHeight: "40px",
    logoWidth: "40px",
    companyName: "Job Portal",
  });

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/public/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          router.push("/careers");
          return;
        }

        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error("Failed to fetch job:", error);
        router.push("/careers");
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/careers-settings/public");
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            console.log("Fetched settings:", data.settings);
            console.log("Share Icons:", data.settings.shareIcons);
            setSettings(data.settings);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchJob();
    fetchSettings();
  }, [id, router]);

  /* ---------- Share ---------- */

  const shareJob = (platform: string) => {
    if (!job) return;

    const url = window.location.href;
    const text = `Check out this job opportunity: ${job.title}`;

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent(
          text
        )}&body=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        break;
    }
  };

  /* ---------- Render States ---------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!job) return null;

  const hasForm = !!(job.formId || job.form?.id);

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Navigation */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {settings.logoImage && (
                <div
                  className="relative"
                  style={{
                    width: settings.logoWidth,
                    height: settings.logoHeight,
                  }}
                >
                  <Image
                    src={settings.logoImage}
                    alt={settings.companyName}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <Link
                href="/careers"
                className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {settings.companyName}
              </Link>
            </div>

            {/* Navigation Menu */}
            {settings.menuItems && settings.menuItems.length > 0 && (
              <nav className="hidden md:flex items-center space-x-8">
                {settings.menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                    style={{
                      fontFamily: getFontFamily(settings.navFontFamily),
                      fontSize: settings.navFontSize || '16px',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Banner */}
      <div className="flex justify-center bg-gray-100">
        <div
          className="relative text-white overflow-hidden"
          style={{
            height: settings.bannerHeight,
            width: settings.bannerWidth,
            maxWidth: "100%",
            borderRadius: settings.bannerBorderRadius,
          }}
        >
          {/* Background Image */}
          {(job.bannerImageUrl || job.imageUrl) && (
            <div className="absolute inset-0">
              <Image
                src={job.bannerImageUrl || job.imageUrl || ""}
                alt={job.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: settings.bannerOverlay }}
          />

          {/* Banner Content */}
          <div className="relative h-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
            <Link
              href="/careers"
              className="inline-flex items-center text-white hover:text-indigo-200 transition-colors mb-4 w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to all jobs
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {job.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-white">
              {job.location && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {job.location}
                </div>
              )}
              {job.department && (
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  {job.department}
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {job.experienceLevel}
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div
                className="prose prose-lg prose-indigo max-w-none
                  [&_p]:text-gray-700 [&_p]:mb-4 [&_p]:leading-relaxed
                  [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:text-gray-700
                  [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Apply Card + Share */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-12">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Interested?
              </h3>

              {job.salary && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center text-gray-600 mb-2">
                    {/* <DollarSign className="h-5 w-5 mr-2 text-indigo-600" /> */}
                    <span className="text-sm font-medium">Salary</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹ {job.salary}
                  </p>
                </div>
              )}

              {hasForm ? (
                <Link
                  href={`/careers/${job.id}/apply`}
                  className={`block w-full text-center font-semibold py-[10px] px-6 transition-colors mb-3 ${settings.applyButtonClass || ''}`}
                  style={{
                    backgroundColor: settings.applyButtonBg || '#10b981',
                    color: settings.applyButtonText || '#ffffff',
                    border: settings.applyButtonBorder ? `solid ${settings.applyButtonBorderColor || '#10b981'}` : 'none',
                    borderWidth: settings.applyButtonBorder || '0px',
                    borderRadius: settings.applyButtonRadius || '8px',
                    fontFamily: settings.applyButtonFontFamily && settings.applyButtonFontFamily !== 'System Default' ? settings.applyButtonFontFamily : 'inherit',
                    fontSize: settings.applyButtonFontSize || '14px',
                    fontWeight: settings.applyButtonFontWeight || '500',
                  }}
                >
                  Apply Now
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Application form is not configured for this job. Please contact HR."
                      )
                    }
                    className="block w-full bg-gray-300 text-gray-700 text-center font-semibold py-3 px-6 rounded-lg cursor-not-allowed mb-2"
                  >
                    Apply Now
                  </button>
                  <p className="text-xs text-red-500">
                    Application form is not configured for this job.
                  </p>
                </>
              )}

              {/* Share */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Share this job
                </p>
                <div className="flex space-x-[-10px] justify-start">
                  {/* Facebook - Always visible */}
                  <button
                    onClick={() => {
                      console.log("Facebook icon path:", settings.shareIcons?.facebookImage);
                      shareJob("facebook");
                    }}
                    className="p-2 hover:opacity-70 transition-opacity"
                    title="Share on Facebook"
                  >
                    {settings.shareIcons?.facebookImage ? (
                      <img
                        src={settings.shareIcons.facebookImage}
                        alt="Facebook"
                        style={{
                          width: settings.shareIconWidth || '32px',
                          height: settings.shareIconHeight || '32px',
                          borderRadius: settings.shareIconBorderRadius || '6px',
                          objectFit: 'contain',
                        }}
                        onLoad={() => console.log("FB image loaded successfully")}
                        onError={(e) => console.error("FB image failed to load:", e)}
                      />
                    ) : (
                      <Facebook className="h-6 w-6 text-blue-600" />
                    )}
                  </button>

                  {/* LinkedIn - Always visible */}
                  <button
                    onClick={() => {
                      console.log("LinkedIn icon path:", settings.shareIcons?.linkedinImage);
                      shareJob("linkedin");
                    }}
                    className="p-2 hover:opacity-70 transition-opacity"
                    title="Share on LinkedIn"
                  >
                    {settings.shareIcons?.linkedinImage ? (
                      <img
                        src={settings.shareIcons.linkedinImage}
                        alt="LinkedIn"
                        style={{
                          width: settings.shareIconWidth || '32px',
                          height: settings.shareIconHeight || '32px',
                          borderRadius: settings.shareIconBorderRadius || '6px',
                          objectFit: 'contain',
                        }}
                        onLoad={() => console.log("LinkedIn image loaded successfully")}
                        onError={(e) => console.error("LinkedIn image failed to load:", e)}
                      />
                    ) : (
                      <Linkedin className="h-6 w-6 text-blue-700" />
                    )}
                  </button>

                  {/* Email - Always visible */}
                  <button
                    onClick={() => {
                      console.log("Email icon path:", settings.shareIcons?.emailImage);
                      shareJob("email");
                    }}
                    className="p-2 hover:opacity-70 transition-opacity"
                    title="Share via Email"
                  >
                    {settings.shareIcons?.emailImage ? (
                      <img
                        src={settings.shareIcons.emailImage}
                        alt="Email"
                        style={{
                          width: settings.shareIconWidth || '32px',
                          height: settings.shareIconHeight || '32px',
                          borderRadius: settings.shareIconBorderRadius || '6px',
                          objectFit: 'contain',
                        }}
                        onLoad={() => console.log("Email image loaded successfully")}
                        onError={(e) => console.error("Email image failed to load:", e)}
                      />
                    ) : (
                      <Mail className="h-6 w-6 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remove the default share section as we always show now */}
              {false && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Share this job
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => shareJob("facebook")}
                      className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Share on Facebook"
                    >
                      <Facebook className="h-5 w-5 mx-auto text-blue-600" />
                    </button>
                    <button
                      onClick={() => shareJob("linkedin")}
                      className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Share on LinkedIn"
                    >
                      <Linkedin className="h-5 w-5 mx-auto text-blue-700" />
                    </button>
                    <button
                      onClick={() => shareJob("email")}
                      className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Share via Email"
                    >
                      <Mail className="h-5 w-5 mx-auto text-gray-600" />
                    </button>
                    <button
                      onClick={() => shareJob("copy")}
                      className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Copy Link"
                    >
                      <Share2 className="h-5 w-5 mx-auto text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Job Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Job Details
              </h3>
              <div className="space-y-4">
                {job.position && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Position</p>
                    <p className="font-medium text-gray-900">{job.position}</p>
                  </div>
                )}

                {job.department && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="font-medium text-gray-900">
                      {job.department}
                    </p>
                  </div>
                )}

                {job.experienceLevel && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Experience Level
                    </p>
                    <p className="font-medium text-gray-900">
                      {job.experienceLevel}
                    </p>
                  </div>
                )}

                {job.location && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium text-gray-900">{job.location}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Actively Hiring
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {settings.footerEnabled !== false && (
        <footer
          style={{
            backgroundColor: settings.footerBgColor || "#1f2937",
            color: settings.footerTextColor || "#ffffff",
            padding: settings.footerPadding || "48px 0",
            fontFamily: settings.footerFontFamily || "inherit",
            fontSize: settings.footerFontSize || "14px",
            fontWeight: settings.footerFontWeight || "normal",
            borderTop: settings.footerBorderTop
              ? `${settings.footerBorderTop} ${
                  settings.footerBorderColor || "#374151"
                }`
              : "none",
            borderBottom: settings.footerBorderBottom
              ? `${settings.footerBorderBottom} ${
                  settings.footerBorderColor || "#374151"
                }`
              : "none",
            borderLeft: settings.footerBorderLeft
              ? `${settings.footerBorderLeft} ${
                  settings.footerBorderColor || "#374151"
                }`
              : "none",
            borderRight: settings.footerBorderRight
              ? `${settings.footerBorderRight} ${
                  settings.footerBorderColor || "#374151"
                }`
              : "none",
          }}
        >
          <div
            className="mx-auto px-4"
            style={{ maxWidth: settings.footerWidth || "1280px" }}
          >
            {settings.footerWidgets && settings.footerWidgets.length > 0 ? (
              <div
                className="grid gap-8"
                style={{
                  gridTemplateColumns: `repeat(${
                    settings.footerColumns || 4
                  }, 1fr)`,
                }}
              >
                {Array.from(
                  { length: settings.footerColumns || 4 },
                  (_, columnIndex) => {
                    const columnWidgets = settings.footerWidgets!
                      .filter((w) => w.columnIndex === columnIndex)
                      .sort((a, b) => a.order - b.order);

                    return (
                      <div key={columnIndex} className="space-y-6">
                        {columnWidgets.map((widget) => (
                          <div key={widget.id} className={widget.customClass || ''}>
                            {widget.type === "logo" && widget.logoImage && (
                              <div>
                                <img
                                  src={widget.logoImage}
                                  alt="Logo"
                                  style={{
                                    width: widget.logoWidth || "auto",
                                    height: widget.logoHeight || "auto",
                                    maxWidth: "100%",
                                  }}
                                />
                              </div>
                            )}

                            {widget.type === "text" && (
                              <div>
                                {widget.title && (
                                  <h3 className="font-bold text-lg mb-3" style={{ color: settings.footerTextColor || '#ffffff' }}>
                                    {widget.title}
                                  </h3>
                                )}
                                <p
                                  className="text-sm opacity-90"
                                  style={{ whiteSpace: "pre-line", color: settings.footerTextColor || '#ffffff' }}
                                >
                                  {widget.content}
                                </p>
                              </div>
                            )}

                            {widget.type === "menu" && (
                              <div>
                                {widget.title && (
                                  <h3 className="font-bold text-lg mb-3" style={{ color: settings.footerTextColor || '#ffffff' }}>
                                    {widget.title}
                                  </h3>
                                )}
                                <ul
                                  className={
                                    widget.twoColumns ? "grid grid-cols-2" : ""
                                  }
                                >
                                  {widget.menuItems?.map((item, idx) => (
                                    <li key={idx} className="mb-2">
                                      <a
                                        href={item.url}
                                        className="text-sm opacity-90 hover:opacity-100 transition-opacity"
                                        style={{ color: settings.footerTextColor || '#ffffff' }}
                                      >
                                        {item.label}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {widget.type === "html" && (
                              <div>
                                {widget.title && (
                                  <h3 className="font-bold text-lg mb-3" style={{ color: settings.footerTextColor || '#ffffff' }}>
                                    {widget.title}
                                  </h3>
                                )}
                                <div
                                  className="text-sm opacity-90"
                                  style={{ color: settings.footerTextColor || '#ffffff' }}
                                  dangerouslySetInnerHTML={{
                                    __html: widget.content,
                                  }}
                                />
                              </div>
                            )}

                            {widget.type === "social" && (
                              <div>
                                {widget.title && (
                                  <h3 className="font-bold text-lg mb-3" style={{ color: settings.footerTextColor || '#ffffff' }}>
                                    {widget.title}
                                  </h3>
                                )}
                                <div className="flex gap-4">
                                  {settings.socialLinks?.map((link) => (
                                    <a
                                      key={link.id}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="opacity-90 hover:opacity-100 transition-opacity"
                                    >
                                      {link.iconImage && (
                                        <img
                                          src={link.iconImage}
                                          alt={link.platform}
                                          className="h-6 w-6"
                                        />
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="flex justify-center gap-6">
                {settings.socialLinks?.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-90 hover:opacity-100 transition-opacity"
                  >
                    {link.iconImage && (
                      <img
                        src={link.iconImage}
                        alt={link.platform}
                        className="h-6 w-6"
                      />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}

      {/* Copyright Section */}
      {settings.copyrightEnabled && (
        <>
          {/* Divider Above Copyright */}
          {settings.copyrightDividerEnabled && (
            <div
              className="mx-auto"
              style={{
                width: settings.copyrightDividerWidth || "100%",
                height: settings.copyrightDividerHeight || "1px",
                backgroundColor: settings.copyrightDividerColor || "#374151",
                borderTopWidth: settings.copyrightDividerBorderTop || "1px",
                borderBottomWidth: settings.copyrightDividerBorderBottom || "0px",
                borderLeftWidth: settings.copyrightDividerBorderLeft || "0px",
                borderRightWidth: settings.copyrightDividerBorderRight || "0px",
                borderStyle: settings.copyrightDividerBorderStyle || "solid",
                borderColor: settings.copyrightDividerColor || "#374151",
              }}
            />
          )}
          
          <div
            style={{
              backgroundColor: settings.copyrightBgColor || "#111827",
              color: settings.copyrightTextColor || "#9ca3af",
              padding: "16px 0",
            }}
          >
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    settings.copyrightLeftHtml ||
                    `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
                }}
              />
              {settings.copyrightRightHtml && (
                <div
                  dangerouslySetInnerHTML={{ __html: settings.copyrightRightHtml }}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom CSS Injection */}
      {settings.customCss && (
        <style dangerouslySetInnerHTML={{ __html: settings.customCss }} />
      )}
    </div>
  );
}
