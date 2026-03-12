import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Milestone {
  title: string;
  date: string;
  description: string;
}

// Which milestones are already done (by index)
const DONE_INDICES = new Set([0, 1]);

function MilestoneItem({
  milestone,
  index,
  done,
}: {
  milestone: Milestone;
  index: number;
  done: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative pl-8 md:pl-10 pb-14 last:pb-0 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Dot — sits directly on the vertical line */}
      <span
        className={`absolute left-[1px] top-[6px] z-10 block w-3 h-3 rounded-full -translate-x-1/2 ${
          done ? "bg-orange-500" : "bg-gray-400"
        }`}
      />

      {/* Title row with date on the right */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
        <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
        <span className="shrink-0 text-sm text-gray-400">{milestone.date}</span>
      </div>

      {/* Description */}
      <p className="mt-1 text-sm leading-relaxed text-gray-500 max-w-lg text-left">
        {milestone.description}
      </p>
    </div>
  );
}

function RoadMap() {
  const { t } = useTranslation();
  const milestones = t("roadmap.milestones", { returnObjects: true }) as Milestone[];

  return (
    <div className="relative w-full max-w-2xl pt-8 pb-6 ml-2 md:ml-4">
      {/* Vertical line — stops where the arrowhead begins */}
      <div className="absolute left-0 top-0 w-[2px] bg-orange-500/60" style={{ bottom: "14px" }} />

      {/* Arrowhead — top edge flush with the bottom of the line */}
      <svg
        className="absolute -translate-x-1/2 left-[1px]"
        style={{ bottom: 0 }}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path d="M7 14L0 0H14L7 14Z" fill="#f97316" />
      </svg>

      {/* Milestones */}
      {milestones.map((m, i) => (
        <MilestoneItem key={i} milestone={m} index={i} done={DONE_INDICES.has(i)} />
      ))}
    </div>
  );
}

export default RoadMap;