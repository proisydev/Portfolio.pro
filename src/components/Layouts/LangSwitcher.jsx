"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { createTranslator } from "../../utils/i18n/i18n";
import { isValidLocale, getLocalizedHref } from "../../utils/i18n/locale";

export default function LangSwitcher({ currentLocale }) {
  const [t, setT] = useState(() =>
    createTranslator(
      isValidLocale(currentLocale)
        ? currentLocale
        : new Error(`Local unsupported: ${currentLocale}`),
    ),
  );

  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(currentLocale);
  const [currentPath, setCurrentPath] = useState("/");

  useEffect(() => {
    setT(() => createTranslator(currentLocale));
    setCurrentLanguage(currentLocale);
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, [currentLocale]);

  const languages = [
    { code: "fr", name: "Français" },
    { code: "en", name: "English" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-white hover:text-purple-400 transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">{currentLanguage.toLocaleUpperCase()}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-md bg-black border border-zinc-800 shadow-lg z-10">
          <ul className="py-1">
            {languages.map((language) => (
              <li key={language.code}>
                <a
                  href={getLocalizedHref(currentPath, language.code)}
                  hrefLang={language.code}
                  className="block w-full"
                >
                  <button
                    onClick={() => {
                      setCurrentLanguage(language.code);
                      setIsOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      currentLanguage === language.code
                        ? "text-purple-400"
                        : "text-white hover:text-purple-400"
                    } transition-colors duration-200`}
                  >
                    {language.name}
                  </button>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
