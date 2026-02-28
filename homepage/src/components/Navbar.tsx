import { Link } from './custom-shadcn/Link';
import { FaGithub } from "react-icons/fa";
import { SiDevpost } from "react-icons/si";
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router';
import { ChevronDown, Menu, X } from 'lucide-react';

const languages = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

function Navbar() {
    const { t, i18n } = useTranslation();
    const [langOpen, setLangOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const desktopDropdownRef = useRef<HTMLDivElement>(null);
    const mobileDropdownRef = useRef<HTMLDivElement>(null);
    const { pathname } = useLocation();

    const normalizedLang = i18n.language.split('-')[0];
    const currentLang = languages.find(l => l.code === normalizedLang) || languages[0];

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const inDesktop = desktopDropdownRef.current?.contains(e.target as Node);
            const inMobile = mobileDropdownRef.current?.contains(e.target as Node);
            if (!inDesktop && !inMobile) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menu when navigating
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    return(
    <div className="bg-white shadow-md p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
            <div className='flex items-center'>
                <img src="/logo.png" alt="Logo" className="w-8 h-8 inline mr-2" />
                <Link to="/" className="text-xl font-bold hover:text-orange-500">Vom Platzl</Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4 items-center">
                <Link to="/" className="text-gray-700 hover:text-orange-500">{t('nav.home')}</Link>
                <Link to="/download" className="text-gray-700 hover:text-orange-500">{t('nav.download')}</Link>
                <Link to="/about" className="text-gray-700 hover:text-orange-500">{t('nav.about')}</Link>
                <Link to="https://devpost.com/software/vom-platzl" className="text-gray-700 hover:text-orange-500"><SiDevpost className="w-5 h-5 inline mr-1" /></Link>
                <Link to="https://github.com/davidholzwarth/vom_platzl" className="text-gray-700 hover:text-orange-500"><FaGithub className="w-5 h-5 inline mr-1" /></Link>

                {/* Language dropdown */}
                <div className="relative ml-2" ref={desktopDropdownRef}>
                    <button
                        onClick={() => setLangOpen(!langOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-sm font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                        <span>{currentLang.flag}</span>
                        <span>{currentLang.code.toUpperCase()}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {langOpen && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer ${
                                        normalizedLang === lang.code
                                            ? 'bg-orange-50 text-orange-600 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
                 {/* Mobile Language selector */}
                 <div className="relative" ref={mobileDropdownRef}>
                    <button
                        onClick={() => setLangOpen(!langOpen)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 text-gray-700"
                    >
                        <span>{currentLang.flag}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {langOpen && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer ${
                                        normalizedLang === lang.code
                                            ? 'bg-orange-50 text-orange-600 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-gray-700 hover:text-orange-500 focus:outline-none"
                >
                    {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {menuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100 flex flex-col gap-4 pt-4">
                <Link to="/" className="text-gray-700 font-medium px-2">{t('nav.home')}</Link>
                <Link to="/download" className="text-gray-700 font-medium px-2">{t('nav.download')}</Link>
                <Link to="/about" className="text-gray-700 font-medium px-2">{t('nav.about')}</Link>
                <div className="flex gap-4 px-2 pt-2 border-t border-gray-50">
                    <Link to="https://devpost.com/software/vom-platzl" className="text-gray-700"><SiDevpost className="w-6 h-6" /></Link>
                    <Link to="https://github.com/davidholzwarth/vom_platzl" className="text-gray-700"><FaGithub className="w-6 h-6" /></Link>
                </div>
            </div>
        )}
    </div>)
}

export default Navbar;