import React, { useState, useEffect } from "react";
import { createTranslator } from "../../utils/i18n/i18n";
import { isValidLocale } from "../../utils/i18n/locale";

export default function CVModal({ currentLocale }) {
  const [t, setT] = useState(() =>
    createTranslator(isValidLocale(currentLocale) ? currentLocale : "en"),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setT(() => createTranslator(currentLocale));
  }, [currentLocale]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  // Expose the openModal function to the window object
  if (typeof window !== "undefined") {
    window.openCVModal = () => setIsOpen(true);
  }

  if (!isOpen) return null;

  const overlayClass = `fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay ${
    isClosing ? "modal-overlay-closing" : ""
  }`;

  const contentClass = `p-8 rounded-lg max-w-md w-full border border-purple-700/30 shadow-xl modal-content backdrop-blur-sm ${
    isClosing ? "modal-content-closing" : ""
  }`;

  return (
    <div
      id="CVModal"
      className={overlayClass}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className={contentClass}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {t("OTHER.informations")}
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p>{t("OTHER.inDevAgain")}</p>
      </div>
    </div>
  );
}
