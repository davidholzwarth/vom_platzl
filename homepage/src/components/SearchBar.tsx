import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { requestUserLocation, getLocationStatusString, type LocationData } from "@/lib/location";

const getRandomTimeout = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

interface SearchBarProps {
  // You can add props here if needed in the future
  typeText?: boolean;
  showLocationStatus?: boolean;
  value?: string;
}

function SearchBar({typeText = true, showLocationStatus = true, value}: SearchBarProps) {
  const { t, i18n } = useTranslation();
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationStatusString, setLocationStatusString] = useState(t('searchBar.locating'));
  const [placeholderText, setPlaceholderText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [showTypeText, setShowTypeText] = useState<boolean>(typeText);

  const placeholderPrefix: string = t('searchBar.prefix');
  const placeholderSuffix: string = t('searchBar.suffix');
  let searchTerms: string[] = t('searchBar.terms', { returnObjects: true }) as string[];

  if (placeholderSuffix !== "") {
    searchTerms = searchTerms.map(term => term + placeholderSuffix);
  }

  const handleSearch = (value: string) => {
    console.log("Search for:", value);

    const params = new URLSearchParams({ q: value });

    if (userLocation) {
      params.set('lat', userLocation.latitude.toString());
      params.set('lon', userLocation.longitude.toString());
      params.set('source', userLocation.source);
    }

    window.location.href = `/search?${params.toString()}`;
  };

  // Request user location on component mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await requestUserLocation();
        setUserLocation(location);
        const status = getLocationStatusString(location);
        setLocationStatusString(t(status.key, status.params));

        sessionStorage.setItem('userLocation', JSON.stringify(location));
      } catch (error) {
        console.log(error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
        console.error('Location error:', errorMessage);
      }
    };

    getLocation();
  }, []);



  // Typing animation effect
  useEffect(() => {
    if (!showTypeText) return;

    setPlaceholderText("");
    let currentTermIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      const currentTerm = searchTerms[currentTermIndex];

      if (isDeleting) {
        setPlaceholderText(placeholderPrefix + currentTerm.substring(0, currentCharIndex - 1));
        currentCharIndex--;

        if (currentCharIndex === 0) {
          isDeleting = false;
          currentTermIndex = (currentTermIndex + 1) % searchTerms.length;
          timeout = setTimeout(type, 500);
        } else {
          timeout = setTimeout(type, getRandomTimeout(50, 50));
        }
      } else {
        setPlaceholderText(placeholderPrefix + currentTerm.substring(0, currentCharIndex + 1));
        currentCharIndex++;

        if (currentCharIndex === currentTerm.length) {
          isDeleting = true;
          timeout = setTimeout(type, 2000);
        } else {
          timeout = setTimeout(type, getRandomTimeout(100, 100));
        }
      }
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, [showTypeText, i18n.language]);

  // Blinking cursor effect
  useEffect(() => {
    if (!showTypeText) return;
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [showTypeText, i18n.language]);
  

  return (
    <div className="relative w-full max-w-xl flex flex-col">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none" />
        <Input
          placeholder={placeholderText + (showCursor ? "|" : "")}
          className="w-full h-14 pl-12 pr-4 rounded-full text-lg bg-white text-gray-900 border-none shadow-lg focus-visible:ring-2 focus-visible:ring-orange-300"
          defaultValue={value}
          onFocus={(_) => {setPlaceholderText(""); setShowTypeText(false)}}
          onBlur={(_) => setShowTypeText(true && typeText)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") {
            handleSearch(e.currentTarget.value);
          }
          }}
        />
      </div>
      {(locationStatusString && showLocationStatus) && (
        <p className="text-sm text-white/80 mt-3 text-center">
          {locationStatusString}
        </p>
      )}
    </div>
  )
}

export default SearchBar;