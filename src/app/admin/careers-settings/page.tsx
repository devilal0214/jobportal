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
  Eye,
} from "lucide-react";

/* ========== Types ========== */

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
}



type ShadowKey = "none" | "sm" | "md" | "lg" | "xl";

interface CareersSettings {
  /* tab 1: logo & nav */
  logoImage?: string;
  logoHeight: string;
  logoWidth: string;
  companyName: string;
  menuItems: MenuItem[];
  navFontFamily?: string; // 'System Default' | 'Inter' | ... | 'Custom Uploaded'
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

  /* tab 3: job cards */
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
  cardGridColumns?: 1 | 2 | 3;
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
    "logo" | "banner" | "cards" | "preview"
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
    cardGridColumns: 3,
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
      formData.set("menuItems", JSON.stringify(settings.menuItems || []));

      // keep font URLs if no upload this time
      formData.append("navFontUrl", settings.navFontUrl || "");
      formData.append("globalFontUrl", settings.globalFontUrl || "");

      // append images/fonts if newly uploaded
      if (bannerImageFile) formData.append("bannerImage", bannerImageFile);
      if (logoImageFile) formData.append("logoImage", logoImageFile);
      if (navFontFile) formData.append("navFontFile", navFontFile);
      if (globalFontFile) formData.append("globalFontFile", globalFontFile);

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
    } catch (e) {
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
              className={`px-3 py-2 rounded-md text-sm font-medium ${
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
              className={`px-3 py-2 rounded-md text-sm font-medium ${
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
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "cards"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border"
              }`}
            >
              <LayoutGrid className="h-4 w-4 inline mr-2" />
              Job Cards
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
