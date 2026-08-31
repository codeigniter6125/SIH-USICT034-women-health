"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function EmergencyHelpPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [smsStatus, setSmsStatus] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(false);

  useEffect(() => {
    const storedPhone = localStorage.getItem("userPhone") || "+919876543210";
    setPhone(storedPhone);

    // Prompt for location to find nearest hospital
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          fetchNearestHospital(loc, storedPhone);
        },
        () => {
          console.log("Location permission not granted");
        },
        { timeout: 6000 }
      );
    }
  }, []);

  async function fetchNearestHospital(loc, userPhone) {
    setLoadingHospital(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/emergency/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_phone: userPhone,
          symptoms: "Emergency assistance requested from Emergency Help Screen",
          location: loc,
        }),
      });
      const data = await res.json();
      if (data?.hospital) {
        setNearestHospital(data.hospital);
      }
      if (data?.sms_result) {
        setSmsStatus("Emergency SMS notification sent to registered emergency contacts.");
      }
    } catch (err) {
      console.error("Emergency lookup error:", err);
    } finally {
      setLoadingHospital(false);
    }
  }

  return (
    <div className="bg-background text-on-surface antialiased flex flex-col min-h-screen pb-28">
      {/* Top App Bar with Emergency Theme */}
      <header className="bg-escalation-container text-escalation border-b border-outline-variant sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-margin-mobile h-14 max-w-max-width-dashboard mx-auto">
          <Link
            href="/"
            className="hover:bg-escalation-container/60 active:scale-95 transition-transform p-1.5 -ml-1 rounded-full flex items-center justify-center text-escalation"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>
          <h1 className="font-headline-md text-base md:text-lg font-bold text-escalation text-center flex-1 mx-2 truncate">
            Emergency Help | आपातकालीन सहायता
          </h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-max-width-dashboard mx-auto px-margin-mobile py-6 flex flex-col gap-6">
        {/* Primary Escalation Action Area */}
        <section className="flex flex-col gap-3 items-center justify-center text-center mt-2 mb-4">
          <div className="w-20 h-20 bg-escalation-container rounded-full flex items-center justify-center mb-1 shadow-sm animate-pulse">
            <span
              className="material-symbols-outlined text-4xl text-escalation"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emergency
            </span>
          </div>

          <p className="font-body-lg text-sm md:text-base text-on-surface font-semibold max-w-[420px]">
            If you are experiencing severe pain, heavy bleeding, or a medical emergency, request help immediately.
            <span className="font-body-base text-xs text-on-surface-variant block mt-1">
              यदि आप आपात स्थिति का अनुभव कर रही हैं, तो तुरंत सहायता कॉल करें।
            </span>
          </p>

          {/* Call Helpline Button */}
          <a
            href="tel:112"
            className="mt-2 w-full md:w-auto min-h-[58px] bg-escalation text-white rounded-full px-8 py-3.5 flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(194,69,46,0.3)] hover:bg-[#a63925] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2 font-bold text-base">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                phone_in_talk
              </span>
              <span>Call Emergency Helpline (112)</span>
            </div>
            <span className="text-[11px] text-white/90">हेल्पलाइन को कॉल करें</span>
          </a>

          {/* Direct Alternate Numbers */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <a
              href="tel:108"
              className="bg-surface-container-lowest border border-outline px-3 py-1.5 rounded-full text-xs font-bold text-escalation hover:bg-escalation-container transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">local_hospital</span>
              <span>Ambulance: 108</span>
            </a>
            <a
              href="tel:181"
              className="bg-surface-container-lowest border border-outline px-3 py-1.5 rounded-full text-xs font-bold text-primary hover:bg-primary-container transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              <span>Women Helpline: 181</span>
            </a>
          </div>
        </section>

        {/* Secondary Actions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Find Hospital Card */}
          <div className="bg-surface-container-lowest border-[1.5px] border-outline rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex flex-shrink-0 items-center justify-center">
              <span className="material-symbols-outlined text-2xl">local_hospital</span>
            </div>
            <div className="flex flex-col gap-0.5 flex-grow">
              <span className="font-title-md text-sm font-bold text-on-surface">Nearest Hospital</span>
              {nearestHospital ? (
                <div>
                  <p className="text-xs font-bold text-primary">{nearestHospital.name}</p>
                  <a
                    href={nearestHospital.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline mt-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">
                  {loadingHospital ? "Locating nearest facility..." : "Enable GPS to view closest emergency hospital"}
                </p>
              )}
            </div>
          </div>

          {/* Share Location Card */}
          <div className="bg-surface-container-lowest border-[1.5px] border-outline rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-primary-container text-primary flex flex-shrink-0 items-center justify-center">
              <span className="material-symbols-outlined text-2xl">share_location</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-title-md text-sm font-bold text-on-surface">Emergency Contact Alert</span>
              <p className="text-xs text-on-surface-variant">
                {smsStatus || "Automated SMS with helpline numbers sent to verified emergency phone."}
              </p>
            </div>
          </div>
        </section>

        {/* Guidance Section */}
        <section className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">list_alt</span>
            <h2 className="font-title-md text-sm font-bold text-on-surface">What to do next | आगे क्या करें</h2>
          </div>

          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                1
              </div>
              <div>
                <span className="font-bold text-on-surface block">Stay calm and find a safe, comfortable spot.</span>
                <span className="text-on-surface-variant">शांत रहें और एक सुरक्षित स्थान खोजें।</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                2
              </div>
              <div>
                <span className="font-bold text-on-surface block">Keep your ID and medical information ready.</span>
                <span className="text-on-surface-variant">अपना आईडी और चिकित्सा जानकारी तैयार रखें।</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center flex-shrink-0 font-bold text-[11px]">
                3
              </div>
              <div>
                <span className="font-bold text-on-surface block">Clearly share your symptoms with the responder.</span>
                <span className="text-on-surface-variant">जवाब देने वाले को अपने लक्षण स्पष्ट रूप से बताएं।</span>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
