"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import BottomNav from "../../components/BottomNav";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState({
    tip_of_the_day: {
      title: "Honor your body's rhythm.",
      category: "Maya's Tip of the Day",
      content:
        "As you transition into your luteal phase, you might notice a natural desire to slow down. Embrace lighter movements like yoga or stretching, and nourish yourself with warm, grounding foods. It's not a pause in productivity, but a necessary gathering of energy.",
    },
    articles: [
      {
        id: "art_1",
        category: "Cycle Science",
        title: "Understanding your Follicular Phase",
        summary:
          "Discover how rising estrogen levels influence your energy, mood, and creativity, and how to harness this dynamic phase.",
        read_time: "3 min read",
        icon: "science",
      },
      {
        id: "art_2",
        category: "Nourishment",
        title: "Nutrition for Cycle Harmony",
        summary:
          "A guide to adapting your diet to support hormonal balance through the four distinct phases of your cycle.",
        read_time: "4 min read",
        icon: "restaurant",
      },
      {
        id: "art_3",
        category: "Wellbeing",
        title: "The Power of Rest",
        summary:
          "Redefining productivity by understanding the biological imperative of deep rest and deliberate downtime.",
        read_time: "3 min read",
        icon: "bedtime",
      },
    ],
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/education/insights`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.tip_of_the_day) setData(resData);
      })
      .catch((err) => console.error("Error fetching insights:", err));
  }, []);

  return (
    <div className="font-body-base text-on-background min-h-screen pb-32 bg-background">
      <TopHeader title="Insights" showBack backHref="/" />

      <main className="max-w-max-width-dashboard mx-auto px-margin-mobile pt-6 space-y-8">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-headline-lg font-bold text-on-surface">
            Insights &amp; Wellness
          </h2>
          <p className="font-body-base text-xs md:text-sm text-on-surface-variant mt-1">
            Curated cycle science and thoughtful guidance to support your daily wellness.
          </p>
        </div>

        {/* Hero Card: Maya's Tip of the Day */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline p-6 relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="flex-1 relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">lightbulb</span>
              <span className="font-label-caps uppercase">{data.tip_of_the_day.category}</span>
            </div>

            <h3 className="font-headline-lg-mobile text-xl md:text-2xl font-bold text-on-surface">
              {data.tip_of_the_day.title}
            </h3>

            <p className="font-body-base text-sm text-on-surface-variant leading-relaxed">
              {data.tip_of_the_day.content}
            </p>

            <div className="pt-2">
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Discuss this tip with Maya</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Latest Articles Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="font-headline-md text-lg font-bold text-on-surface">Latest Articles</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.articles.map((art) => (
              <article
                key={art.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline overflow-hidden flex flex-col p-5 shadow-2xs hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => router.push(`/chat?prompt=Tell me more about ${encodeURIComponent(art.title)}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-label-caps text-[10px] text-primary tracking-wider uppercase font-bold bg-primary-container/40 px-2 py-0.5 rounded-full">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-medium">{art.read_time}</span>
                </div>

                <h4 className="font-title-md text-sm font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {art.title}
                </h4>

                <p className="font-body-base text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
                  {art.summary}
                </p>

                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-primary font-semibold">
                  <span>Read &amp; Chat</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
