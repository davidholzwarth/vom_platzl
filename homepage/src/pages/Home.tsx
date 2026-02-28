import SearchBar from "@/components/SearchBar";
import RoadMap from "./Roadmap";
import { useTranslation } from "react-i18next";
import "./Home.css";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero section – orange background with centered search */}
      <section className="landing-page flex flex-col items-center justify-center text-white min-h-[60vh] h-dvh px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('home.title')}</h1>
        {/* <p className="text-lg md:text-xl mb-8 opacity-90">
          {t('home.subtitle')}
        </p> */}

        <SearchBar />
      </section>

      {/* Content section – white background */}
      <section className="bg-white min-h-[40vh] px-4 py-16 flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
          {t('home.about')}
        </h2>
        <p className="text-gray-600 max-w-2xl text-center">
          {t('home.aboutText')}
        </p>
      </section>

      <section className="bg-white min-h-[40vh] px-4 py-16 flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
          {t('home.roadmap')}
        </h2>
        <div className="text-gray-600 max-w-2xl text-center">
          <RoadMap />
        </div>
      </section>
    </>
  );
}
