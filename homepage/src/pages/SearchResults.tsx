import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { Search, ArrowLeft, Loader2, Map as MapIcon, List as ListIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import StoreCard from "@/components/StoreCard";
import SearchBar from "@/components/SearchBar";
import type { Place } from "@/lib/types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";

function getDirectionsEmbedUrl(
  origin: { lat: string; lon: string } | null,
  dest: Place | null
) {
  if (origin && dest) {
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin.lat},${origin.lon}&destination=${dest.lat},${dest.lon}&mode=walking&zoom=15`;
  }
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=Munich&zoom=13`;
}

function SearchResults() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const lat = searchParams.get("lat") || "";
  const lon = searchParams.get("lon") || "";

  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Fetch places from backend
  useEffect(() => {
    if (!query) return;

    const fetchPlaces = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ query });
        if (lat) params.set("lat", lat);
        if (lon) params.set("lon", lon);

        const res = await fetch(`${BACKEND_URL}/get_places?${params.toString()}`);
        if (!res.ok) throw new Error(t('search.fetchError'));

        const data = await res.json();
        console.log("Raw API response:", data);
        const fetched: Place[] = data.places || [];

        // Sort by distance
        fetched.sort((a, b) => {
          const getVal = (s: string) => {
            const match = s.match(/([\d.]+)\s*(km|m)/);
            if (!match) return Infinity;
            return match[2] === "km"
              ? parseFloat(match[1])
              : parseFloat(match[1]) / 1000;
          };
          return getVal(a.distance) - getVal(b.distance);
        });

        setPlaces(fetched);
        if (fetched.length > 0) setSelectedPlace(fetched[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('search.unknownError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, [query, lat, lon]);

  useEffect(() => {
    console.log("Places updated:", places);
  }, [places]);

  const userOrigin = lat && lon ? { lat, lon } : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Orange header bar */}
      <div className="bg-orange-500 text-white px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('search.backToHome')}
          </a>
          <SearchBar typeText={false} showLocationStatus={false} value={query} />
          <p className="mt-2 text-white/80 text-sm">
            {isLoading
              ? t('search.searching')
              : t('search.storesFound', { count: places.length })}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span className="text-lg">{t('search.loading')}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-4">
            {error}
          </div>
        )}

        {!isLoading && !error && places.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('search.noResults')}</p>
            <p className="text-sm mt-1">{t('search.tryAnother')}</p>
          </div>
        )}

        {!isLoading && places.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Place list - Hidden on mobile if viewMode is map */}
              <div className={`flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1 ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
                {places.map((place, idx) => (
                  <StoreCard
                    key={idx}
                    place={place}
                    selected={selectedPlace?.lat === place.lat && selectedPlace?.lon === place.lon}
                    onSelect={(p) => setSelectedPlace(p)}
                  />
                ))}
              </div>

              {/* Map - Hidden on mobile if viewMode is list */}
              <div className={`sticky top-20 lg:top-6 w-full min-h-[450px] lg:h-[600px] border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
                <iframe
                  src={getDirectionsEmbedUrl(userOrigin, selectedPlace)}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t('search.mapTitle')}
                />
              </div>
            </div>

            {/* Mobile View Toggle FAB */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-orange-600 transition-all active:scale-95"
              >
                {viewMode === 'list' ? (
                  <>
                    <MapIcon className="w-5 h-5" />
                    <span>{t('search.mapTitle')}</span>
                  </>
                ) : (
                  <>
                    <ListIcon className="w-5 h-5" />
                    <span>{t('search.storesFound', { count: places.length })}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResults;