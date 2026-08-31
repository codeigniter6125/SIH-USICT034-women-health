"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";
import { storage, db } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [reports, setReports] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("idToken");
    const storedPhone = localStorage.getItem("userPhone") || "+919876543210";
    if (!token && !storedPhone) {
      router.push("/login");
      return;
    }
    setPhone(storedPhone);

    // 1. Immediate load from localStorage
    const localKey = `userReports_${storedPhone}`;
    const cached = localStorage.getItem(localKey);
    let initialList = [];
    if (cached) {
      try {
        initialList = JSON.parse(cached);
        if (Array.isArray(initialList) && initialList.length > 0) {
          setReports(initialList);
        }
      } catch (e) {
        console.error("Local storage parse error:", e);
      }
    }

    // 2. Fetch persistent reports from Backend
    fetch(`${BACKEND_URL}/api/reports?user_phone=${encodeURIComponent(storedPhone)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reports)) {
          const backendReports = data.reports.map((r) => ({
            id: r.id || `rep_${r.date}`,
            title: r.title || r.report_type || "Medical Report",
            report_type: r.report_type || "Lab Report",
            date: r.date || new Date().toLocaleDateString(),
            format: r.format || "PDF / JPG",
            category: r.category || "Lab Reports",
            status: "Analyzed",
            findings: r.findings || [],
            health_summary: r.health_summary || r.interpretation || "",
            main_pointers: r.main_pointers || [],
            solutions_and_remedies: r.solutions_and_remedies || {},
            storage_url: r.storage_url || null,
          }));

          // Merge without duplicates
          setReports((prev) => {
            const merged = [...backendReports];
            for (const p of prev) {
              if (!merged.some((m) => m.id === p.id || (m.title === p.title && m.date === p.date))) {
                merged.push(p);
              }
            }
            localStorage.setItem(localKey, JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => console.log("Backend reports fetch notice:", err));

    // 3. Sync from Firestore if available
    try {
      if (db) {
        const reportsRef = collection(db, "patient_context", storedPhone, "reports");
        getDocs(reportsRef)
          .then((snapshot) => {
            const firestoreReports = [];
            snapshot.forEach((docSnap) => {
              firestoreReports.push({ id: docSnap.id, ...docSnap.data() });
            });
            if (firestoreReports.length > 0) {
              setReports((prev) => {
                const combined = [...prev];
                for (const fr of firestoreReports) {
                  if (!combined.some((c) => c.id === fr.id)) {
                    combined.unshift(fr);
                  }
                }
                localStorage.setItem(localKey, JSON.stringify(combined));
                return combined;
              });
            }
          })
          .catch((fsErr) => console.log("Firestore sync notice:", fsErr));
      }
    } catch (e) {
      console.log("Firestore setup notice:", e);
    }
  }, [router]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !phone) return;

    setUploading(true);
    setUploadProgress("Uploading file to Firebase Storage...");

    let fileDownloadUrl = null;

    // Step 1: Upload raw image / PDF to Firebase Storage
    try {
      if (storage) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `reports/${phone}/${Date.now()}_${safeName}`);
        const snapshot = await uploadBytes(storageRef, file);
        fileDownloadUrl = await getDownloadURL(snapshot.ref);
        console.log("Firebase Storage uploaded:", fileDownloadUrl);
      }
    } catch (storageErr) {
      console.warn("Firebase Storage fallback:", storageErr);
    }

    // Step 2: Extract text & clinical interpretation via Backend OCR + Agent
    setUploadProgress("Analyzing biomarkers with Google OCR & Maya AI...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_phone", phone);
    formData.append("category", selectedCategory === "All" ? "Lab Reports" : selectedCategory);

    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.report) {
        const newReport = {
          id: data.report.id || `rep_${Date.now()}`,
          title: data.report.title || file.name.replace(/\.[^/.]+$/, ""),
          report_type: data.report.report_type || "Medical Report",
          date: data.report.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          format: `${file.type.split("/")[1]?.toUpperCase() || "DOC"} • ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          category: selectedCategory === "All" ? "Lab Reports" : selectedCategory,
          status: "Analyzed",
          findings: data.report.findings || [],
          health_summary: data.report.health_summary || data.report.interpretation || "",
          main_pointers: data.report.main_pointers || [],
          solutions_and_remedies: data.report.solutions_and_remedies || {},
          storage_url: fileDownloadUrl,
        };

        // Step 3: Persist in Firestore database
        try {
          if (db) {
            const reportDocRef = doc(db, "patient_context", phone, "reports", newReport.id);
            await setDoc(reportDocRef, newReport, { merge: true });
          }
        } catch (fsWriteErr) {
          console.log("Firestore write notice:", fsWriteErr);
        }

        // Step 4: Persist in local state & localStorage
        const localKey = `userReports_${phone}`;
        setReports((prev) => {
          const updated = [newReport, ...prev.filter((r) => r.id !== newReport.id)];
          localStorage.setItem(localKey, JSON.stringify(updated));
          return updated;
        });

        // Step 5: Save present report to session & navigate to interpretation
        sessionStorage.setItem("currentReport", JSON.stringify(newReport));
        router.push("/reports/interpretation");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to analyze report. Please check your network connection.");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full bg-surface-container-lowest border border-outline rounded-3xl p-5 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              Firebase Secure Vault
            </span>
            <h2 className="font-headline-lg-mobile text-xl md:text-2xl font-bold text-on-surface mt-1">
              Your Medical Records
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Permanently saved to your private Firebase storage database with AI analysis.
            </p>
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
            className="bg-[#5B6FA6] text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-body-bold text-xs sm:text-sm shadow-md disabled:opacity-60 shrink-0 w-full sm:w-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              upload_file
            </span>
            <span>{uploading ? uploadProgress || "Processing..." : "Upload New Report"}</span>
          </button>
        </section>

        {/* Categories (Bento Grid) */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-title-md text-sm md:text-base text-on-surface font-bold">Categories</h3>
            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="text-xs text-primary font-bold hover:underline"
              >
                Clear Filter (Show All)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "All" : cat.id)}
                  className={`bg-surface-container-lowest border rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2.5 transition-all group h-28 shadow-2xs active:scale-95 cursor-pointer ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-outline hover:border-primary/40"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${cat.bg} flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
                    <span className={`material-symbols-outlined text-2xl ${cat.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {cat.icon}
                    </span>
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
            <h3 className="font-title-md text-sm md:text-base text-on-surface font-bold">
              Stored Reports ({filteredReports.length})
            </h3>
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-primary font-body-bold text-xs hover:underline"
            >
              View All ({reports.length})
            </button>
          </div>

          {filteredReports.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredReports.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sessionStorage.setItem("currentReport", JSON.stringify(item));
                    router.push("/reports/interpretation");
                  }}
                  className="bg-surface-container-lowest border border-outline rounded-3xl p-4 flex items-center gap-3.5 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group shadow-2xs active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#5B6FA6] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      description
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-body-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate font-bold">
                        {item.title}
                      </h4>
                      {item.report_type && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                          {item.report_type}
                        </span>
                      )}
                    </div>
                    <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
                      {item.date} • {item.format || item.category}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#486550] bg-[#486550]/10 border border-[#486550]/20 px-2.5 py-1 rounded-full shrink-0">
                    {item.status || "Analyzed"}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface-container-lowest rounded-3xl border border-dashed border-outline space-y-3 p-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">No reports in this category</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
                  Upload your lab results, ultrasound, or prescriptions to store them safely.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-primary text-on-primary font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Upload First Report
              </button>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

