import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(
    localStorage.getItem("lang") || "en",
  );

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <select
      value={language}
      onChange={(e) => changeLanguage(e.target.value)}
      className="px-3 py-1 border rounded-md text-sm bg-white"
    >
      <option value="en">English</option>
      <option value="hi">Hindi (हिन्दी)</option>
      <option value="ta">Tamil (தமிழ்)</option>
      <option value="mr">Marathi (मराठी)</option>
      <option value="te">Telugu (తెలుగు)</option>
      <option value="gu">Gujarati (ગુજરાતી)</option>
    </select>
  );
}
