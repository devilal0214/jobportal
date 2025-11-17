"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Save,
  Upload,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Menu as MenuIcon,
  Type,
  LayoutGrid,
  Code,
  Share2,
} from "lucide-react";
import FooterWidgetBuilder from "@/components/FooterWidgetBuilder";

/* ========== Types ========== */

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  iconImage?: string;
  order: number;
}

interface FooterWidget {
  id: string;
  type: 'logo' | 'text' | 'menu' | 'html' | 'social';
  title?: string;
  content: string;
  menuItems?: Array<{ label: string; url: string }>;
  logoImage?: string;
  logoWidth?: string;
  logoHeight?: string;
  twoColumns?: boolean; // For menu widget
  customClass?: string; // Custom CSS class
  order: number;
  columnIndex: number;
}

type ShadowKey = "none" | "sm" | "md" | "lg" | "xl";

interface CareersSettings {
  /* tab 1: logo & nav */
  logoImage?: string;
  logoHeight: string;
  logoWidth: string;
  companyName: string;
  menuItems: MenuItem[];
  navFontFamily?: string;
  navFontSize?: string;
  navFontUrl?: string | null;

  /* tab 2: banner */
  bannerImage?: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerDescription: string;
  bannerOverlay: string;
  bannerHeight: string;
  bannerWidth: string;
  bannerBorderRadius: string;
  titleColor: string;
  titleFontSize: string;
  subtitleColor: string;
  subtitleFontSize: string;
  descriptionColor: string;
  descriptionFontSize: string;
  globalFontFamily?: string;
  globalFontUrl?: string | null;

  /* tab 3: job cards & page layout */
  cardRadius?: string;
  cardPadding?: string;
  cardShadow?: ShadowKey;
  cardHoverLift?: boolean;
  cardImageHeight?: string;
  cardTitleSize?: string;
  cardDescriptionSize?: string;
  cardShowIcons?: boolean;
  cardButtonBg?: string;
  cardButtonText?: string;
  cardButtonLabel?: string;
  cardButtonClass?: string;
  cardButtonBorder?: string;
  cardButtonBorderColor?: string;
  cardButtonRadius?: string;
  cardButtonFontFamily?: string;
  cardButtonFontSize?: string;
  cardButtonFontWeight?: string;
  cardGridColumns?: 1 | 2 | 3;
  pageLayout?: 'grid' | 'list' | 'masonry';
  pageMaxWidth?: string;
  
  /* Filters visibility */
  showFilters?: boolean;
  showSearchFilter?: boolean;
  showDepartmentFilter?: boolean;
  showExperienceFilter?: boolean;
  
  /* tab 4: footer */
  footerEnabled?: boolean;
  footerColumns?: 2 | 3 | 4 | 5 | 6;
  footerWidth?: string; // New: footer max width
  footerWidgets?: FooterWidget[];
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
  socialLinks?: SocialLink[];
  
  /* tab 5: custom styling */
  customCss?: string;
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
}

/* ========== Helpers ========== */

const FONT_OPTIONS = [
  "System Default",
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lato",
  "Nunito",
  "Work Sans",
  "Playfair Display",
  "Merriweather",
  "Custom Uploaded",
] as const;

const fontStack = (family?: string) => {
  if (!family || family === "System Default") return "inherit";
  if (family === "Custom Uploaded") return `'__AdminCustom'`;
  const map: Record<string, string> = {
    Inter: `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
    Poppins: `'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
    Montserrat: `'Montserrat', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
    Roboto: `'Roboto', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial`,
    Lato: `'Lato', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Arial`,
    Nunito: `'Nunito', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto`,
    "Work Sans": `'Work Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto`,
    "Playfair Display": `'Playfair Display', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif`,
    Merriweather: `'Merriweather', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif`,
  };
  return map[family] || "inherit";
};

const shadowMap: Record<ShadowKey, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px rgba(0,0,0,0.08)",
  lg: "0 10px 15px rgba(0,0,0,0.10)",
  xl: "0 20px 25px rgba(0,0,0,0.12)",
};

/* ========== Component ========== */

export default function CareersSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "logo" | "banner" | "cards" | "footer" | "styling" | "preview"
  >("logo");

  const [settings, setSettings] = useState<CareersSettings>({
    /* defaults */
    bannerTitle: "Careers at JV",
    bannerSubtitle:
      "Explore Our Job Openings and Start Your Exciting Career with Us",
    bannerDescription:
      "We are a fast-growing creative marketing agency looking for talented and passionate individuals to join our team.",
    bannerOverlay:
      "linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)",
    bannerHeight: "400px",
    bannerWidth: "100%",
    bannerBorderRadius: "0px",
    titleColor: "#ffffff",
    titleFontSize: "48px",
    subtitleColor: "#ffffff",
    subtitleFontSize: "24px",
    descriptionColor: "#f3f4f6",
    descriptionFontSize: "16px",
    logoHeight: "40px",
    logoWidth: "40px",
    companyName: "Job Portal",
    menuItems: [],
    navFontFamily: "System Default",
    navFontSize: "16px",
    globalFontFamily: "System Default",

    /* card defaults */
    cardRadius: "12px",
    cardPadding: "16px",
    cardShadow: "md",
    cardHoverLift: true,
    cardImageHeight: "180px",
    cardTitleSize: "18px",
    cardDescriptionSize: "14px",
    cardShowIcons: true,
    cardButtonBg: "#4f46e5",
    cardButtonText: "#ffffff",
    cardButtonLabel: "Know More",
    cardButtonClass: "",
    cardButtonBorder: "0px",
    cardButtonBorderColor: "#4f46e5",
    cardButtonRadius: "8px",
    cardButtonFontFamily: "System Default",
    cardButtonFontSize: "14px",
    cardButtonFontWeight: "500",
    cardGridColumns: 3,
    pageLayout: "grid",
    pageMaxWidth: "1280px",
    
    /* filter visibility defaults */
    showFilters: true,
    showSearchFilter: true,
    showDepartmentFilter: true,
    showExperienceFilter: true,
    
    /* footer defaults */
    footerEnabled: false,
    footerColumns: 4,
    footerWidth: "1280px",
    footerWidgets: [],
    footerBgColor: "#1f2937",
    footerTextColor: "#f3f4f6",
    footerPadding: "48px",
    footerFontFamily: "System Default",
    footerFontSize: "14px",
    footerFontWeight: "400",
    footerBorderTop: "0px",
    footerBorderBottom: "0px",
    footerBorderLeft: "0px",
    footerBorderRight: "0px",
    footerBorderColor: "#374151",
    copyrightEnabled: false,
    copyrightLeftHtml: "© 2025 Your Company. All rights reserved.",
    copyrightRightHtml: "",
    copyrightBgColor: "#111827",
    copyrightTextColor: "#9ca3af",
    copyrightBorderTop: "1px",
    copyrightBorderBottom: "0px",
    copyrightBorderLeft: "0px",
    copyrightBorderRight: "0px",
    copyrightBorderColor: "#374151",
    socialLinks: [],
    
    /* custom styling defaults */
    customCss: "",
    jobDetailsButtonClass: "",
    jobDetailsButtonBg: "#4f46e5",
    jobDetailsButtonText: "#ffffff",
    jobDetailsButtonBorder: "0px",
    jobDetailsButtonBorderColor: "#4f46e5",
    jobDetailsButtonRadius: "8px",
    jobDetailsButtonFontFamily: "System Default",
    jobDetailsButtonFontSize: "14px",
    jobDetailsButtonFontWeight: "500",
    applyButtonClass: "",
    applyButtonBg: "#10b981",
    applyButtonText: "#ffffff",
    applyButtonBorder: "0px",
    applyButtonBorderColor: "#10b981",
    applyButtonRadius: "8px",
    applyButtonFontFamily: "System Default",
    applyButtonFontSize: "14px",
    applyButtonFontWeight: "500",
    shareIconsEnabled: false,
    shareIcons: {},
    shareIconWidth: "32px",
    shareIconHeight: "32px",
    shareIconBorderRadius: "6px",
  });

  /* uploads & previews */
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [navFontFile, setNavFontFile] = useState<File | null>(null);
  const [globalFontFile, setGlobalFontFile] = useState<File | null>(null);
  const [navFontDataUrl, setNavFontDataUrl] = useState<string>(""); // for live preview
  const [globalFontDataUrl, setGlobalFontDataUrl] = useState<string>(""); // for live preview

  /* share icon uploads */
  const [shareIconFiles, setShareIconFiles] = useState<{
    facebook?: File;
    twitter?: File;
    linkedin?: File;
    whatsapp?: File;
    email?: File;
  }>({});
  const [shareIconPreviews, setShareIconPreviews] = useState<{
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    whatsapp?: string;
    email?: string;
  }>({});

  /* footer widget logo uploads */
  const [widgetLogoFiles, setWidgetLogoFiles] = useState<Record<string, File>>({});
  const [widgetLogoPreviews, setWidgetLogoPreviews] = useState<Record<string, string>>({});

  const handleWidgetLogoUpload = (widgetId: string, file: File) => {
    setWidgetLogoFiles(prev => ({ ...prev, [widgetId]: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setWidgetLogoPreviews(prev => ({ ...prev, [widgetId]: reader.result as string }));
      
      // Update widget with preview
      setSettings(s => ({
        ...s,
        footerWidgets: (s.footerWidgets || []).map(w =>
          w.id === widgetId ? { ...w, logoImage: reader.result as string } : w
        )
      }));
    };
    reader.readAsDataURL(file);
  };

  /* auth + fetch */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/careers-settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const s = data.settings as CareersSettings;
            setSettings((prev) => ({ ...prev, ...s }));
            if (s.bannerImage) setBannerPreview(s.bannerImage);
            if (s.logoImage) setLogoPreview(s.logoImage);
            // rehydrate font URLs into preview
            if (s.navFontUrl) setNavFontDataUrl(s.navFontUrl);
            if (s.globalFontUrl) setGlobalFontDataUrl(s.globalFontUrl);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchSettings();
  }, [router]);

  /* file handlers */
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNavFontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNavFontFile(f);
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setNavFontDataUrl(url);
      setSettings((s) => ({
        ...s,
        navFontFamily: "Custom Uploaded",
        navFontUrl: url,
      }));
    };
    reader.readAsDataURL(f);
  };
  const handleGlobalFontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setGlobalFontFile(f);
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setGlobalFontDataUrl(url);
      setSettings((s) => ({
        ...s,
        globalFontFamily: "Custom Uploaded",
        globalFontUrl: url,
      }));
    };
    reader.readAsDataURL(f);
  };

  /* SAVE */
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // tab1 + tab2 base fields
      Object.entries(settings).forEach(([k, v]) => {
        // we will append special cases below too; this keeps simple types covered
        if (
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
        )
          formData.append(k, String(v));
      });
      
      // Serialize complex objects as JSON
      formData.set("menuItems", JSON.stringify(settings.menuItems || []));
      formData.set("footerWidgets", JSON.stringify(settings.footerWidgets || []));
      formData.set("socialLinks", JSON.stringify(settings.socialLinks || []));
      formData.set("shareIcons", JSON.stringify(settings.shareIcons || {}));

      // keep font URLs if no upload this time
      formData.append("navFontUrl", settings.navFontUrl || "");
      formData.append("globalFontUrl", settings.globalFontUrl || "");

      // append images/fonts if newly uploaded
      if (bannerImageFile) formData.append("bannerImage", bannerImageFile);
      if (logoImageFile) formData.append("logoImage", logoImageFile);
      if (navFontFile) formData.append("navFontFile", navFontFile);
      if (globalFontFile) formData.append("globalFontFile", globalFontFile);
      
      // append share icon files if uploaded
      if (shareIconFiles.facebook) formData.append("shareIconFacebook", shareIconFiles.facebook);
      if (shareIconFiles.twitter) formData.append("shareIconTwitter", shareIconFiles.twitter);
      if (shareIconFiles.linkedin) formData.append("shareIconLinkedin", shareIconFiles.linkedin);
      if (shareIconFiles.whatsapp) formData.append("shareIconWhatsapp", shareIconFiles.whatsapp);
      if (shareIconFiles.email) formData.append("shareIconEmail", shareIconFiles.email);

      const res = await fetch("/api/admin/careers-settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to save: ${err.error || "Unknown error"}`);
        return;
      }
      alert("Settings saved!");
      // OPTIONAL refresh
      window.location.reload();
    } catch (err) {
      console.error('Save error:', err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* dynamic font-face for preview */
  const dynamicFontCss = useMemo(() => {
    const parts: string[] = [];
    if (globalFontDataUrl) {
      parts.push(`
@font-face {
  font-family: '__AdminCustom';
  src: url('${globalFontDataUrl}');
  font-display: swap;
}`);
    }
    if (navFontDataUrl) {
      parts.push(`
@font-face {
  font-family: '__AdminNav';
  src: url('${navFontDataUrl}');
  font-display: swap;
}`);
    }
    return parts.join("\n");
  }, [globalFontDataUrl, navFontDataUrl]);

  const globalFamily =
    settings.globalFontFamily === "Custom Uploaded"
      ? `'__AdminCustom'`
      : fontStack(settings.globalFontFamily);

  const navFamily =
    settings.navFontFamily === "Custom Uploaded"
      ? `'__AdminNav'`
      : fontStack(settings.navFontFamily);

  /* PREVIEW CARD (Admin side only) */
  const PreviewCard = () => (
    <div
      className="transition-all"
      style={{
        borderRadius: settings.cardRadius,
        padding: settings.cardPadding,
        boxShadow: shadowMap[settings.cardShadow || "md"],
        background: "#fff",
        fontFamily: globalFamily,
      }}
    >
      <div
        className="relative w-full overflow-hidden mb-4"
        style={{ height: settings.cardImageHeight }}
      >
        <div className="absolute inset-0 bg-gray-200" />
      </div>
      <h3
        className="text-gray-900 mb-1"
        style={{ fontSize: settings.cardTitleSize }}
      >
        Senior Graphic Designer
      </h3>
      <p
        className="text-gray-600 mb-3"
        style={{ fontSize: settings.cardDescriptionSize }}
      >
        Help us craft compelling visuals across digital campaigns and product
        UI.
      </p>
      {settings.cardShowIcons && (
        <div className="text-sm text-gray-700 mb-4">
          📍 New Delhi · 🎯 Design
        </div>
      )}
      <button
        className="rounded-md px-4 py-2 font-medium"
        style={{
          background: settings.cardButtonBg,
          color: settings.cardButtonText,
        }}
      >
        {settings.cardButtonLabel || "Know More"}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: globalFamily }}
    >
      <style dangerouslySetInnerHTML={{ __html: dynamicFontCss }} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Careers Page Settings
          </h1>
          <p className="text-gray-600">
            Customize your public careers page appearance and content
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("logo")}
              className={`px-3 text-black py-2 rounded-md text-sm font-medium  ${
                activeTab === "logo"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <MenuIcon className="h-4 w-4 inline mr-2" />
              Logo & Navigation
            </button>
            <button
              onClick={() => setActiveTab("banner")}
              className={`px-3 text-black py-2 rounded-md text-sm font-medium ${
                activeTab === "banner"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <Type className="h-4 w-4 inline mr-2" />
              Banner
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`px-3  text-black py-2 rounded-md text-sm font-medium ${
                activeTab === "cards"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <LayoutGrid className="h-4 w-4 inline mr-2" />
              Job Cards
            </button>
            <button
              onClick={() => setActiveTab("footer")}
              className={`px-3 text-black py-2 rounded-md text-sm font-medium ${
                activeTab === "footer"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <MenuIcon className="h-4 w-4 inline mr-2" />
              Footer
            </button>
            <button
              onClick={() => setActiveTab("styling")}
              className={`px-3 text-black py-2 rounded-md text-sm font-medium ${
                activeTab === "styling"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <Code className="h-4 w-4 inline mr-2" />
              Custom Styling
            </button>
            {/* <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "preview"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Live Preview
            </button> */}
          </div>
        </div>

        {/* Panels */}
        <div className="space-y-6">
          {activeTab === "logo" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <ImageIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Logo & Navigation
                </h2>
              </div>

              {/* Logo upload */}
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-start gap-4">
                  {logoPreview && (
                    <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={() => {
                          setLogoPreview("");
                          setLogoImageFile(null);
                          setSettings((s) => ({ ...s, logoImage: "" }));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border rounded-md text-sm bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Company name & sizes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        companyName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Height
                  </label>
                  <input
                    type="text"
                    value={settings.logoHeight}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, logoHeight: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    placeholder="e.g., 40px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Width
                  </label>
                  <input
                    type="text"
                    value={settings.logoWidth}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, logoWidth: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    placeholder="e.g., 40px"
                  />
                </div>
              </div>

              {/* Nav font */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nav Font Family
                  </label>
                  <select
                    value={settings.navFontFamily}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        navFontFamily: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <label className="inline-flex items-center px-3 py-2 border rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Custom Nav Font (ttf/otf/woff)
                      <input
                        type="file"
                        accept=".ttf,.otf,.woff,.woff2"
                        onChange={handleNavFontChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nav Font Size
                  </label>
                  <input
                    type="text"
                    value={settings.navFontSize || ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        navFontSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    placeholder="e.g., 16px"
                  />
                </div>
              </div>

              {/* Menu items */}
              <div className="flex items-center justify-between mt-6 mb-2">
                <div className="flex items-center">
                  <MenuIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Navigation Menu
                  </h3>
                </div>
                <button
                  onClick={() => {
                    const ni: MenuItem = {
                      id: `menu-${Date.now()}`,
                      label: "",
                      url: "",
                      order: settings.menuItems.length,
                    };
                    setSettings((s) => ({
                      ...s,
                      menuItems: [...(s.menuItems || []), ni],
                    }));
                  }}
                  className="inline-flex items-center px-3 py-2 rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Menu Item
                </button>
              </div>
              <div className="space-y-3">
                {(settings.menuItems || []).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No menu items added yet
                  </p>
                ) : (
                  settings.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              menuItems: s.menuItems.map((mi) =>
                                mi.id === item.id
                                  ? { ...mi, label: e.target.value }
                                  : mi
                              ),
                            }))
                          }
                          placeholder="Menu label"
                          className="w-full px-3 py-2 border rounded text-sm mb-2 text-gray-900"
                        />
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              menuItems: s.menuItems.map((mi) =>
                                mi.id === item.id
                                  ? { ...mi, url: e.target.value }
                                  : mi
                              ),
                            }))
                          }
                          placeholder="URL (e.g., /about)"
                          className="w-full px-3 py-2 border rounded text-sm text-gray-900"
                        />
                      </div>
                      <button
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            menuItems: s.menuItems.filter(
                              (mi) => mi.id !== item.id
                            ),
                          }))
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Global font (applies to full page) */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">
                  Global Font (Page Body)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Font Family
                    </label>
                    <select
                      value={settings.globalFontFamily}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          globalFontFamily: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-gray-900"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <label className="inline-flex items-center px-3 py-2 border rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Custom Body Font (ttf/otf/woff)
                        <input
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2"
                          onChange={handleGlobalFontChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "banner" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Type className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Banner</h2>
              </div>

              {/* Banner upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Background Image
                </label>
                <div className="mb-3">
                  {bannerPreview && (
                    <div className="relative w-full h-48 border rounded overflow-hidden mb-2">
                      <Image
                        src={bannerPreview}
                        alt="Banner"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => {
                          setBannerPreview("");
                          setBannerImageFile(null);
                          setSettings((s) => ({ ...s, bannerImage: "" }));
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border rounded-md text-sm bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Title
                  </label>
                  <input
                    type="text"
                    value={settings.bannerTitle}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        bannerTitle: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={settings.bannerSubtitle}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        bannerSubtitle: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={settings.bannerDescription}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      bannerDescription: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded text-gray-900"
                />
              </div>

              {/* dims */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Height
                  </label>
                  <input
                    type="text"
                    value={settings.bannerHeight}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        bannerHeight: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="400px or 50vh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Width
                  </label>
                  <input
                    type="text"
                    value={settings.bannerWidth}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        bannerWidth: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="100% or 1200px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Radius
                  </label>
                  <input
                    type="text"
                    value={settings.bannerBorderRadius}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        bannerBorderRadius: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="0px, 8px, 16px"
                  />
                </div>
              </div>

              {/* colors & sizes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Color
                  </label>
                  <input
                    type="text"
                    value={settings.titleColor}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, titleColor: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Size
                  </label>
                  <input
                    type="text"
                    value={settings.titleFontSize}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        titleFontSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="48px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overlay (CSS)
                  </label>
                  <input
                    type="text"
                    value={settings.bannerOverlay}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        bannerOverlay: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    placeholder="linear-gradient(...)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle Color
                  </label>
                  <input
                    type="text"
                    value={settings.subtitleColor}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        subtitleColor: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle Size
                  </label>
                  <input
                    type="text"
                    value={settings.subtitleFontSize}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        subtitleFontSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="24px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description Color
                  </label>
                  <input
                    type="text"
                    value={settings.descriptionColor}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        descriptionColor: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    placeholder="#f3f4f6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description Size
                  </label>
                  <input
                    type="text"
                    value={settings.descriptionFontSize}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        descriptionFontSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="16px"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "cards" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <LayoutGrid className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Job Cards
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Corner Radius
                  </label>
                  <input
                    type="text"
                    value={settings.cardRadius}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, cardRadius: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="12px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Padding
                  </label>
                  <input
                    type="text"
                    value={settings.cardPadding}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardPadding: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="16px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shadow
                  </label>
                  <select
                    value={settings.cardShadow}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardShadow: e.target.value as ShadowKey,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">XL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <input
                    id="hoverlift"
                    type="checkbox"
                    checked={!!settings.cardHoverLift}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardHoverLift: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="hoverlift" className="text-sm text-gray-700">
                    Hover Lift
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Height
                  </label>
                  <input
                    type="text"
                    value={settings.cardImageHeight}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardImageHeight: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="180px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grid Columns
                  </label>
                  <select
                    value={settings.cardGridColumns}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardGridColumns: Number(e.target.value) as 1 | 2 | 3,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Size
                  </label>
                  <input
                    type="text"
                    value={settings.cardTitleSize}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardTitleSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="18px"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description Size
                  </label>
                  <input
                    type="text"
                    value={settings.cardDescriptionSize}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardDescriptionSize: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="14px"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="showicons"
                    type="checkbox"
                    checked={!!settings.cardShowIcons}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardShowIcons: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="showicons" className="text-sm text-gray-700">
                    Show icons row
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button BG
                  </label>
                  <input
                    type="text"
                    value={settings.cardButtonBg}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardButtonBg: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    placeholder="#4f46e5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={settings.cardButtonText}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardButtonText: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={settings.cardButtonLabel}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        cardButtonLabel: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded text-gray-900"
                    placeholder="Know More"
                  />
                </div>
              </div>

              {/* Card Button Styling */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Button Styling</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Width
                    </label>
                    <input
                      type="text"
                      value={settings.cardButtonBorder}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cardButtonBorder: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                      placeholder="0px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Color
                    </label>
                    <input
                      type="text"
                      value={settings.cardButtonBorderColor}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cardButtonBorderColor: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                      placeholder="#4f46e5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Radius
                    </label>
                    <input
                      type="text"
                      value={settings.cardButtonRadius}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cardButtonRadius: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                      placeholder="8px"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={settings.cardButtonFontFamily}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cardButtonFontFamily: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <input
                      type="text"
                      value={settings.cardButtonFontSize}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cardButtonFontSize: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                      placeholder="14px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Weight
                    </label>
                    <select
                      value={settings.cardButtonFontWeight}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cardButtonFontWeight: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extrabold (800)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filter Visibility Settings */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Filter Visibility</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.showFilters}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          showFilters: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Show Filters Section
                    </span>
                  </label>

                  {settings.showFilters && (
                    <div className="ml-6 space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!settings.showSearchFilter}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              showSearchFilter: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Show Search Filter
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!settings.showDepartmentFilter}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              showDepartmentFilter: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Show Department Filter
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!settings.showExperienceFilter}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              showExperienceFilter: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Show Experience Level Filter
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin preview */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Admin Preview</p>
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns:
                      settings.cardGridColumns === 1
                        ? "1fr"
                        : settings.cardGridColumns === 2
                        ? "repeat(2, minmax(0, 1fr))"
                        : "repeat(3, minmax(0, 1fr))",
                  }}
                >
                  <PreviewCard />
                  <PreviewCard />
                  <PreviewCard />
                </div>
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <MenuIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Footer Settings
                </h2>
              </div>

              {/* Footer Enable/Disable */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.footerEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, footerEnabled: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Footer
                  </span>
                </label>
              </div>

              {settings.footerEnabled && (
                <>
                  {/* Footer Layout Settings */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Footer Columns
                      </label>
                      <select
                        value={settings.footerColumns}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            footerColumns: parseInt(e.target.value) as 2 | 3 | 4 | 5 | 6,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      >
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                        <option value={6}>6 Columns</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Footer Width
                      </label>
                      <input
                        type="text"
                        value={settings.footerWidth}
                        onChange={(e) =>
                          setSettings({ ...settings, footerWidth: e.target.value })
                        }
                        placeholder="1280px or 100%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Footer Widget Builder */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Footer Widgets</h3>
                    <p className="text-xs text-gray-600 mb-4">
                      Drag and drop widgets between columns. Add multiple widgets per column (e.g., Logo + About text in first column, Heading + Menu in second column).
                    </p>
                    <FooterWidgetBuilder
                      columns={settings.footerColumns || 4}
                      widgets={settings.footerWidgets || []}
                      onChange={(widgets) => setSettings({ ...settings, footerWidgets: widgets })}
                      onLogoUpload={handleWidgetLogoUpload}
                    />
                  </div>

                  {/* Footer Background & Text Color */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={settings.footerBgColor}
                        onChange={(e) =>
                          setSettings({ ...settings, footerBgColor: e.target.value })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={settings.footerTextColor}
                        onChange={(e) =>
                          setSettings({ ...settings, footerTextColor: e.target.value })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>
                  </div>

                  {/* Footer Padding */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Footer Padding
                    </label>
                    <input
                      type="text"
                      value={settings.footerPadding}
                      onChange={(e) =>
                        setSettings({ ...settings, footerPadding: e.target.value })
                      }
                      placeholder="48px"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  {/* Footer Typography */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Footer Typography</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Family
                        </label>
                        <select
                          value={settings.footerFontFamily}
                          onChange={(e) =>
                            setSettings({ ...settings, footerFontFamily: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        >
                          {FONT_OPTIONS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={settings.footerFontSize}
                          onChange={(e) =>
                            setSettings({ ...settings, footerFontSize: e.target.value })
                          }
                          placeholder="14px"
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Weight
                        </label>
                        <select
                          value={settings.footerFontWeight}
                          onChange={(e) =>
                            setSettings({ ...settings, footerFontWeight: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        >
                          <option value="300">Light (300)</option>
                          <option value="400">Normal (400)</option>
                          <option value="500">Medium (500)</option>
                          <option value="600">Semibold (600)</option>
                          <option value="700">Bold (700)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Footer Borders */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Footer Borders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Top
                        </label>
                        <input
                          type="text"
                          value={settings.footerBorderTop}
                          onChange={(e) =>
                            setSettings({ ...settings, footerBorderTop: e.target.value })
                          }
                          placeholder="0px"
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bottom
                        </label>
                        <input
                          type="text"
                          value={settings.footerBorderBottom}
                          onChange={(e) =>
                            setSettings({ ...settings, footerBorderBottom: e.target.value })
                          }
                          placeholder="0px"
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Left
                        </label>
                        <input
                          type="text"
                          value={settings.footerBorderLeft}
                          onChange={(e) =>
                            setSettings({ ...settings, footerBorderLeft: e.target.value })
                          }
                          placeholder="0px"
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Right
                        </label>
                        <input
                          type="text"
                          value={settings.footerBorderRight}
                          onChange={(e) =>
                            setSettings({ ...settings, footerBorderRight: e.target.value })
                          }
                          placeholder="0px"
                          className="w-full px-3 py-2 border rounded text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Border Color
                        </label>
                        <input
                          type="color"
                          value={settings.footerBorderColor}
                          onChange={(e) =>
                            setSettings({ ...settings, footerBorderColor: e.target.value })
                          }
                          className="w-full h-10 rounded border"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">
                        <Share2 className="h-4 w-4 inline mr-2" />
                        Social Media Links
                      </h3>
                      <button
                        onClick={() => {
                          const newLink: SocialLink = {
                            id: `social-${Date.now()}`,
                            platform: 'Facebook',
                            url: '',
                            order: (settings.socialLinks?.length || 0) + 1,
                          };
                          setSettings({
                            ...settings,
                            socialLinks: [...(settings.socialLinks || []), newLink],
                          });
                        }}
                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        <Plus className="h-3 w-3 inline mr-1" />
                        Add Social Link
                      </button>
                    </div>

                    {settings.socialLinks && settings.socialLinks.length > 0 && (
                      <div className="space-y-3">
                        {settings.socialLinks.map((link, idx) => (
                          <div key={link.id} className="flex items-start gap-2 bg-white p-3 rounded">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={link.platform}
                                onChange={(e) => {
                                  const updated = [...(settings.socialLinks || [])];
                                  updated[idx].platform = e.target.value;
                                  setSettings({ ...settings, socialLinks: updated });
                                }}
                                placeholder="Platform (e.g., Facebook)"
                                className="px-2 py-1 border rounded text-sm text-gray-900"
                              />
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...(settings.socialLinks || [])];
                                  updated[idx].url = e.target.value;
                                  setSettings({ ...settings, socialLinks: updated });
                                }}
                                placeholder="URL"
                                className="px-2 py-1 border rounded text-sm text-gray-900"
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={link.iconImage || ''}
                                  onChange={(e) => {
                                    const updated = [...(settings.socialLinks || [])];
                                    updated[idx].iconImage = e.target.value;
                                    setSettings({ ...settings, socialLinks: updated });
                                  }}
                                  placeholder="Icon URL (optional)"
                                  className="flex-1 px-2 py-1 border rounded text-sm text-gray-900"
                                />
                                <button
                                  onClick={() => {
                                    setSettings({
                                      ...settings,
                                      socialLinks: settings.socialLinks?.filter((_, i) => i !== idx),
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Copyright Footer Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      Copyright Footer
                    </h3>
                    
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.copyrightEnabled}
                          onChange={(e) =>
                            setSettings({ ...settings, copyrightEnabled: e.target.checked })
                          }
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Enable Copyright Section
                        </span>
                      </label>
                    </div>

                    {settings.copyrightEnabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Left Side HTML
                            </label>
                            <textarea
                              value={settings.copyrightLeftHtml}
                              onChange={(e) =>
                                setSettings({ ...settings, copyrightLeftHtml: e.target.value })
                              }
                              rows={3}
                              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              placeholder="© 2025 Company. All rights reserved."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Right Side HTML
                            </label>
                            <textarea
                              value={settings.copyrightRightHtml}
                              onChange={(e) =>
                                setSettings({ ...settings, copyrightRightHtml: e.target.value })
                              }
                              rows={3}
                              className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              placeholder='<a href="/privacy">Privacy</a> | <a href="/terms">Terms</a>'
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Background Color
                            </label>
                            <input
                              type="color"
                              value={settings.copyrightBgColor}
                              onChange={(e) =>
                                setSettings({ ...settings, copyrightBgColor: e.target.value })
                              }
                              className="w-full h-8 rounded border"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Text Color
                            </label>
                            <input
                              type="color"
                              value={settings.copyrightTextColor}
                              onChange={(e) =>
                                setSettings({ ...settings, copyrightTextColor: e.target.value })
                              }
                              className="w-full h-8 rounded border"
                            />
                          </div>
                        </div>

                        {/* Copyright Divider */}
                        <div className="mb-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-900 mb-2">
                            <input
                              type="checkbox"
                              checked={settings.copyrightDividerEnabled}
                              onChange={(e) =>
                                setSettings({ ...settings, copyrightDividerEnabled: e.target.checked })
                              }
                              className="rounded"
                            />
                            Enable Divider Above Copyright
                          </label>
                          
                          {settings.copyrightDividerEnabled && (
                            <>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Divider Width</label>
                                  <input
                                    type="text"
                                    value={settings.copyrightDividerWidth || ''}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerWidth: e.target.value })
                                    }
                                    placeholder="100%"
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Divider Height</label>
                                  <input
                                    type="text"
                                    value={settings.copyrightDividerHeight || ''}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerHeight: e.target.value })
                                    }
                                    placeholder="1px"
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Divider Color</label>
                                  <input
                                    type="color"
                                    value={settings.copyrightDividerColor || '#374151'}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerColor: e.target.value })
                                    }
                                    className="w-full h-8 rounded border"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Border Style</label>
                                  <select
                                    value={settings.copyrightDividerBorderStyle || 'solid'}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerBorderStyle: e.target.value })
                                    }
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                    <option value="double">Double</option>
                                    <option value="groove">Groove</option>
                                    <option value="ridge">Ridge</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Border Top</label>
                                  <input
                                    type="text"
                                    value={settings.copyrightDividerBorderTop || ''}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerBorderTop: e.target.value })
                                    }
                                    placeholder="1px"
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Border Bottom</label>
                                  <input
                                    type="text"
                                    value={settings.copyrightDividerBorderBottom || ''}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerBorderBottom: e.target.value })
                                    }
                                    placeholder="0px"
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Border Left</label>
                                  <input
                                    type="text"
                                    value={settings.copyrightDividerBorderLeft || ''}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerBorderLeft: e.target.value })
                                    }
                                    placeholder="0px"
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Border Right</label>
                                  <input
                                    type="text"
                                    value={settings.copyrightDividerBorderRight || ''}
                                    onChange={(e) =>
                                      setSettings({ ...settings, copyrightDividerBorderRight: e.target.value })
                                    }
                                    placeholder="0px"
                                    className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer Widget Builder - Placeholder for Phase 2 */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Advanced drag-and-drop footer widget builder coming soon!
                      For now, you can configure footer appearance and social links above.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "styling" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <Code className="h-5 w-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Custom Styling
                </h2>
              </div>

              {/* Button Custom Classes */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Button CSS Classes
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Card Button Class
                    </label>
                    <input
                      type="text"
                      value={settings.cardButtonClass}
                      onChange={(e) =>
                        setSettings({ ...settings, cardButtonClass: e.target.value })
                      }
                      placeholder="custom-card-btn"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Details Button Class
                    </label>
                    <input
                      type="text"
                      value={settings.jobDetailsButtonClass}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonClass: e.target.value })
                      }
                      placeholder="custom-details-btn"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apply Button Class
                    </label>
                    <input
                      type="text"
                      value={settings.applyButtonClass}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonClass: e.target.value })
                      }
                      placeholder="custom-apply-btn"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Button Colors */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Button Colors
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Job Details Button BG
                      </label>
                      <input
                        type="color"
                        value={settings.jobDetailsButtonBg}
                        onChange={(e) =>
                          setSettings({ ...settings, jobDetailsButtonBg: e.target.value })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Job Details Button Text
                      </label>
                      <input
                        type="color"
                        value={settings.jobDetailsButtonText}
                        onChange={(e) =>
                          setSettings({ ...settings, jobDetailsButtonText: e.target.value })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Apply Button BG
                      </label>
                      <input
                        type="color"
                        value={settings.applyButtonBg}
                        onChange={(e) =>
                          setSettings({ ...settings, applyButtonBg: e.target.value })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Apply Button Text
                      </label>
                      <input
                        type="color"
                        value={settings.applyButtonText}
                        onChange={(e) =>
                          setSettings({ ...settings, applyButtonText: e.target.value })
                        }
                        className="w-full h-10 rounded border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details Button Styling */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Job Details Button Styling
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Width
                    </label>
                    <input
                      type="text"
                      value={settings.jobDetailsButtonBorder}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonBorder: e.target.value })
                      }
                      placeholder="0px"
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Color
                    </label>
                    <input
                      type="text"
                      value={settings.jobDetailsButtonBorderColor}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonBorderColor: e.target.value })
                      }
                      placeholder="#4f46e5"
                      className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Radius
                    </label>
                    <input
                      type="text"
                      value={settings.jobDetailsButtonRadius}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonRadius: e.target.value })
                      }
                      placeholder="8px"
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={settings.jobDetailsButtonFontFamily}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonFontFamily: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="text"
                      value={settings.jobDetailsButtonFontSize}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonFontSize: e.target.value })
                      }
                      placeholder="14px"
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={settings.jobDetailsButtonFontWeight}
                      onChange={(e) =>
                        setSettings({ ...settings, jobDetailsButtonFontWeight: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extrabold (800)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Apply Button Styling */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Apply Button Styling
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Width
                    </label>
                    <input
                      type="text"
                      value={settings.applyButtonBorder}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonBorder: e.target.value })
                      }
                      placeholder="0px"
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Color
                    </label>
                    <input
                      type="text"
                      value={settings.applyButtonBorderColor}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonBorderColor: e.target.value })
                      }
                      placeholder="#10b981"
                      className="w-full px-3 py-2 border rounded text-gray-900 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Radius
                    </label>
                    <input
                      type="text"
                      value={settings.applyButtonRadius}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonRadius: e.target.value })
                      }
                      placeholder="8px"
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={settings.applyButtonFontFamily}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonFontFamily: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="text"
                      value={settings.applyButtonFontSize}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonFontSize: e.target.value })
                      }
                      placeholder="14px"
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={settings.applyButtonFontWeight}
                      onChange={(e) =>
                        setSettings({ ...settings, applyButtonFontWeight: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded text-gray-900"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extrabold (800)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Share Icons */}
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  <Share2 className="h-4 w-4 inline mr-2" />
                  Share Icons
                </h3>
                
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.shareIconsEnabled}
                      onChange={(e) =>
                        setSettings({ ...settings, shareIconsEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Share Icons on Job Details
                    </span>
                  </label>
                </div>

                {settings.shareIconsEnabled && (
                  <>
                    {/* Share Icon Dimensions */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Icon Width
                        </label>
                        <input
                          type="text"
                          value={settings.shareIconWidth}
                          onChange={(e) =>
                            setSettings({ ...settings, shareIconWidth: e.target.value })
                          }
                          placeholder="32px"
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Icon Height
                        </label>
                        <input
                          type="text"
                          value={settings.shareIconHeight}
                          onChange={(e) =>
                            setSettings({ ...settings, shareIconHeight: e.target.value })
                          }
                          placeholder="32px"
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Border Radius
                        </label>
                        <input
                          type="text"
                          value={settings.shareIconBorderRadius}
                          onChange={(e) =>
                            setSettings({ ...settings, shareIconBorderRadius: e.target.value })
                          }
                          placeholder="6px"
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Facebook Icon */}
                    <div className="p-3 bg-white rounded border">
                      <label className="block text-xs font-semibold text-gray-900 mb-2">
                        Facebook Icon
                      </label>
                      <div className="flex items-center gap-3">
                        {(shareIconPreviews.facebook || settings.shareIcons?.facebookImage) && (
                          <img
                            src={shareIconPreviews.facebook || settings.shareIcons?.facebookImage}
                            alt="Facebook"
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setShareIconFiles({ ...shareIconFiles, facebook: file });
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShareIconPreviews({
                                  ...shareIconPreviews,
                                  facebook: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Or Enter URL</label>
                        <input
                          type="text"
                          value={settings.shareIcons?.facebook || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shareIcons: { ...settings.shareIcons, facebook: e.target.value },
                            })
                          }
                          placeholder="https://example.com/facebook.svg"
                          className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Twitter Icon */}
                    <div className="p-3 bg-white rounded border">
                      <label className="block text-xs font-semibold text-gray-900 mb-2">
                        Twitter/X Icon
                      </label>
                      <div className="flex items-center gap-3">
                        {(shareIconPreviews.twitter || settings.shareIcons?.twitterImage) && (
                          <img
                            src={shareIconPreviews.twitter || settings.shareIcons?.twitterImage}
                            alt="Twitter"
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setShareIconFiles({ ...shareIconFiles, twitter: file });
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShareIconPreviews({
                                  ...shareIconPreviews,
                                  twitter: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Or Enter URL</label>
                        <input
                          type="text"
                          value={settings.shareIcons?.twitter || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shareIcons: { ...settings.shareIcons, twitter: e.target.value },
                            })
                          }
                          placeholder="https://example.com/twitter.svg"
                          className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        />
                      </div>
                    </div>

                    {/* LinkedIn Icon */}
                    <div className="p-3 bg-white rounded border">
                      <label className="block text-xs font-semibold text-gray-900 mb-2">
                        LinkedIn Icon
                      </label>
                      <div className="flex items-center gap-3">
                        {(shareIconPreviews.linkedin || settings.shareIcons?.linkedinImage) && (
                          <img
                            src={shareIconPreviews.linkedin || settings.shareIcons?.linkedinImage}
                            alt="LinkedIn"
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setShareIconFiles({ ...shareIconFiles, linkedin: file });
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShareIconPreviews({
                                  ...shareIconPreviews,
                                  linkedin: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Or Enter URL</label>
                        <input
                          type="text"
                          value={settings.shareIcons?.linkedin || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shareIcons: { ...settings.shareIcons, linkedin: e.target.value },
                            })
                          }
                          placeholder="https://example.com/linkedin.svg"
                          className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Icon */}
                    <div className="p-3 bg-white rounded border">
                      <label className="block text-xs font-semibold text-gray-900 mb-2">
                        WhatsApp Icon
                      </label>
                      <div className="flex items-center gap-3">
                        {(shareIconPreviews.whatsapp || settings.shareIcons?.whatsappImage) && (
                          <img
                            src={shareIconPreviews.whatsapp || settings.shareIcons?.whatsappImage}
                            alt="WhatsApp"
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setShareIconFiles({ ...shareIconFiles, whatsapp: file });
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShareIconPreviews({
                                  ...shareIconPreviews,
                                  whatsapp: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Or Enter URL</label>
                        <input
                          type="text"
                          value={settings.shareIcons?.whatsapp || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shareIcons: { ...settings.shareIcons, whatsapp: e.target.value },
                            })
                          }
                          placeholder="https://example.com/whatsapp.svg"
                          className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Email Icon */}
                    <div className="p-3 bg-white rounded border">
                      <label className="block text-xs font-semibold text-gray-900 mb-2">
                        Email Icon
                      </label>
                      <div className="flex items-center gap-3">
                        {(shareIconPreviews.email || settings.shareIcons?.emailImage) && (
                          <img
                            src={shareIconPreviews.email || settings.shareIcons?.emailImage}
                            alt="Email"
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setShareIconFiles({ ...shareIconFiles, email: file });
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShareIconPreviews({
                                  ...shareIconPreviews,
                                  email: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="flex-1 text-xs"
                        />
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">Or Enter URL</label>
                        <input
                          type="text"
                          value={settings.shareIcons?.email || ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shareIcons: { ...settings.shareIcons, email: e.target.value },
                            })
                          }
                          placeholder="https://example.com/email.svg"
                          className="w-full px-2 py-1 border rounded text-xs text-gray-900"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Custom CSS */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom CSS
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add custom CSS that will apply globally to the Careers page and Job Details page.
                  Use this to override or extend default styles.
                </p>
                <textarea
                  value={settings.customCss}
                  onChange={(e) =>
                    setSettings({ ...settings, customCss: e.target.value })
                  }
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
                  placeholder={`.custom-card-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.custom-card-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Add your custom styles here */`}
                />
              </div>

              {/* CSS Preview */}
              {settings.customCss && (
                <div className="p-4 bg-gray-100 rounded-md">
                  <p className="text-xs font-semibold text-gray-700 mb-2">CSS Preview:</p>
                  <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">
                    {settings.customCss}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "preview" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-500 mb-3">Live header preview</p>
              <div className="flex items-center justify-between border rounded p-3">
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <div
                      className="relative"
                      style={{
                        width: settings.logoWidth,
                        height: settings.logoHeight,
                      }}
                    >
                      <Image
                        src={logoPreview}
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span
                    style={{
                      fontFamily: navFamily,
                      fontSize: settings.navFontSize,
                    }}
                    className="font-bold text-gray-900"
                  >
                    {settings.companyName}
                  </span>
                </div>
                <nav
                  className="hidden md:flex items-center gap-6"
                  style={{ fontFamily: navFamily }}
                >
                  {(settings.menuItems || []).map((mi) => (
                    <span key={mi.id} className="text-gray-700">
                      {mi.label || "Menu"}
                    </span>
                  ))}
                </nav>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">
                  Live banner preview
                </p>
                <div
                  className="relative overflow-hidden rounded"
                  style={{
                    height: settings.bannerHeight,
                    borderRadius: settings.bannerBorderRadius,
                  }}
                >
                  {bannerPreview && (
                    <Image
                      src={bannerPreview}
                      alt="Banner"
                      fill
                      className="object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: settings.bannerOverlay }}
                  />
                  <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                    <h1
                      style={{
                        color: settings.titleColor,
                        fontSize: settings.titleFontSize,
                      }}
                      className="font-bold"
                    >
                      {settings.bannerTitle}
                    </h1>
                    <p
                      style={{
                        color: settings.subtitleColor,
                        fontSize: settings.subtitleFontSize,
                      }}
                      className="mt-2"
                    >
                      {settings.bannerSubtitle}
                    </p>
                    <p
                      style={{
                        color: settings.descriptionColor,
                        fontSize: settings.descriptionFontSize,
                      }}
                      className="mt-4 max-w-3xl"
                    >
                      {settings.bannerDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
