import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Place, Review as ReviewType } from "@/lib/types";

function Review({ review }: { review: ReviewType }) {
  const { t } = useTranslation();
  const fullText: string = review.text || "";
  const maxLen = 200;
  const needsTruncate = fullText.length > maxLen;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400">
      <div className="font-semibold mb-1 text-gray-800">
        {"★".repeat(review.rating || 0)}
        {"☆".repeat(5 - (review.rating || 0))}
        <span className="ml-2 text-gray-500 font-normal">
          {review.author_name || t('store.anonymousUser')}
        </span>
      </div>
      <p className="italic leading-relaxed text-gray-700">
        {expanded ? fullText : fullText.slice(0, maxLen)}
        {needsTruncate && !expanded && "… "}
        {needsTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-orange-500 font-semibold text-xs hover:underline cursor-pointer"
          >
            {expanded ? t('store.showLess') : t('store.showMore')}
          </button>
        )}
      </p>
    </div>
  );
}

interface StoreCardProps {
  place: Place;
  selected?: boolean;
  onSelect: (place: Place) => void;
}

export default function StoreCard({ place, selected, onSelect }: StoreCardProps) {
  const { t } = useTranslation();
  const openNow = place.opening_hours?.openNow;
  const rating = place.rating ? `⭐ ${place.rating}` : "";
  const ratingCount = place.user_ratings_total
    ? ` (${place.user_ratings_total})`
    : "";

  const bestReview =
    place.reviews && place.reviews.length > 0
      ? place.reviews.reduce((best: any, cur: any) =>
          (cur.rating || 0) > (best.rating || 0) ? cur : best
        )
      : null;

  return (
    <div
      onClick={() => onSelect(place)}
      className={`bg-white border rounded-2xl p-4 md:p-5 shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-orange-300 ${
        selected
          ? "border-orange-400 ring-2 ring-orange-200"
          : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {place.name || t('store.unknown')}
          </h3>
          {place.tags?.vicinity && (
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {place.tags.vicinity}
            </p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
        {place.distance && <span className="font-medium">{place.distance}</span>}
        {place.duration && <span>· {place.duration}</span>}
        {rating && (
          <span>
            {rating}
            {ratingCount}
          </span>
        )}
      </div>

      {/* Open/closed badge */}
      {place.opening_hours && (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-3 ${
            openNow
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              openNow ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {openNow ? t('store.openNow') : t('store.closed')}
        </div>
      )}

      {/* Best review */}
      {bestReview ? (
        <Review review={bestReview} />
      ) : (
        <p className="text-sm text-gray-400 italic mb-3 px-3 py-2 bg-gray-50 rounded-lg">
          {t('store.noReviews')}
        </p>
      )}

      {/* Google Maps link */}
      <a
        href={
          place.google_maps_url ||
          `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`
        }
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
      >
        <ExternalLink className="w-4 h-4" />
        {t('store.openInMaps')}
      </a>
    </div>
  );
}
