"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const CATEGORIES = [
  { id: "Lab Reports",    icon: "science",       bg: "bg-[#5B6FA6]", text: "text-white" },
  { id: "Prescriptions",  icon: "prescriptions", bg: "bg-[#C97B5C]", text: "text-white" },
  { id: "Imaging",        icon: "radiology",     bg: "bg-[#486550]", text: "text-white" },
  { id: "Others",         icon: "folder_open",   bg: "bg-[#7B5C92]", text: "text-white" },
];

export default function MedicalVaultPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Lab Reports");
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([
    {
      id: "rep_1",
      title: "Complete Blood Count (CBC)",
      date: "Oct 24, 2023",
      format: "PDF • 1.2 MB",
      category: "Lab Reports",
      status: "Analyzed",
    },
    {
      id: "rep_2",
      title: "Dr. Sharma - Consultation",
      date: "June 28, 2024",
      format: "JPG • 2.4 MB",
      category: "Prescriptions",
      status: "Analyzed",
    },
    {
      id: "rep_3",
      title: "Annual Pelvic Ultrasound",
      date: "May 05, 2024",
      format: "PDF • 4.1 MB",
      category: "Imaging",
      status: "Analyzed",
    },
  ]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone");
    if (!token || !storedPhone) {
      router.push("/login");
      return;
    }
    setPhone(storedPhone);
  }, [router]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !phone) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_phone", phone);
    formData.append("category", selectedCategory);

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.report) {
        setReports((prev) => [
          {
            id: data.report.id,
            title: data.report.title,
            date: data.report.date,
            format: `${file.type.split("/")[1]?.toUpperCase() || "DOC"} • ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            category: selectedCategory,
            status: "Analyzed",
            findings: data.report.findings,
            interpretation: data.report.interpretation,
          },
          ...prev,
        ]);
        // Save latest report in session to display in interpretation screen
        sessionStorage.setItem("currentReport", JSON.stringify(data.report));
        router.push("/reports/interpretation");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to extract report via Google OCR. Please check connection.");
    } finally {
      setUploading(false);
    }
  }

  const filteredReports = reports.filter(
    (r) => selectedCategory === "All" || r.category === selectedCategory
  );

  return (
    <div className="bg-background text-on-surface font-body-base antialiased min-h-screen flex flex-col pb-28">
      <TopHeader title="Medical Vault" />

      <main className="flex-1 max-w-max-width-dashboard mx-auto w-full px-margin-mobile pt-6 flex flex-col gap-6">
        {/* Upload Action */}
        <section className="flex justify-between items-center w-full">
          <div>
            <h2 className="font-headline-lg-mobile text-2xl font-bold text-on-surface">Your Medical Vault</h2>
            <p className="text-xs text-on-surface-variant">Encrypted, private, and OCR-analyzed</p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#5B6FA6] text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-2.5 px-5 py-3 rounded-2xl font-body-bold text-xs sm:text-sm shadow-md disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span>
            <span>{uploading ? "Running Google OCR..." : "Upload Document"}</span>
          </button>
        </section>

        {/* Categories (Bento Grid) */}
        <section>
          <h3 className="font-title-md text-sm md:text-base text-on-surface font-bold mb-3">Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`bg-surface-container-lowest border rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2.5 transition-all group h-32 shadow-2xs active:scale-95 ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-outline hover:border-primary/40"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${cat.bg} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
                    <span className={`material-symbols-outlined text-2xl ${cat.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                  </div>
                  <span className="font-body-bold text-xs text-on-surface text-center font-bold">{cat.id}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Uploads List */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <h3 className="font-title-md text-sm md:text-base text-on-surface font-bold">Recent Uploads</h3>
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-primary font-body-bold text-xs hover:underline"
            >
              View All ({reports.length})
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredReports.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  sessionStorage.setItem("currentReport", JSON.stringify(item));
                  router.push("/reports/interpretation");
                }}
                className="bg-surface-container-lowest border border-outline rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-primary hover:bg-primary-container/10 transition-colors cursor-pointer group shadow-2xs active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">description</span>
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-body-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate font-semibold">
                    {item.title}
                  </h4>
                  <p className="font-body-base text-xs text-on-surface-variant">
                    {item.date} • {item.format}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full shrink-0">
                  {item.status}
                </span>
                <span className="material-symbols-outlined text-outline-variant text-lg">chevron_right</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
