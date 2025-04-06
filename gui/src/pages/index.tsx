import { useState, useRef, useEffect, useContext } from "react";
import { GlobeAltIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Chat from "./gui";
import History from "./history";
import ConfigPage from "./config";
import MorePage from "./More";
import { setLocalStorage, getLocalStorage } from "../util/localStorage";
import { getLanguage } from "../util";
import { modifyContinueConfigWithSharedConfig, SharedConfigSchema } from "core/config/sharedConfig";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { IdeMessengerContext } from "../context/IdeMessenger";
import { useNavigationListener } from "../hooks/useNavigationListener";
import { updateConfig } from "../redux/slices/configSlice";

export default function Index() {
  useNavigationListener();
  const dispatch = useAppDispatch();
  const ideMessenger = useContext(IdeMessengerContext);
  const config = useAppSelector((state) => state.config.config);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "chat";
  });
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "zh">(() => {
    return (getLanguage() as "en" | "zh") || "en";
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: "en" | "zh") => {
    handleUpdate({ language: lang });
    setCurrentLanguage(lang);
    setLocalStorage("language", lang);
    setIsLanguageMenuOpen(false);
  };

  function handleUpdate(sharedConfig: Partial<SharedConfigSchema>) {
    dispatch(
      updateConfig(modifyContinueConfigWithSharedConfig(config, sharedConfig)),
    );
    ideMessenger.post("config/updateSharedConfig", sharedConfig);
  }

  const handleTabChange = (tab: string) => {
    console.log(tab);
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <Chat currentLanguage={currentLanguage}/>;
      case "History":
        return <History currentLanguage={currentLanguage} handleTabChange={handleTabChange}/>;
      case "Settings":
        return <ConfigPage currentLanguage={currentLanguage}/>;
      case "More":
        return <MorePage currentLanguage={currentLanguage}/>;
      default:
        return <Chat currentLanguage={currentLanguage}/>;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="fixed top-0 left-0 right-0 h-100 z-20 flex items-center justify-between border-0 border-b border-solid border-b-zinc-700 bg-inherit pb-1">
        <div className="flex items-center">
          <div className="ml-4 flex space-x-2">
            {[
              { id: "chat", label: currentLanguage === "en" ? "Chat" : "聊天" },
              { id: "History", label: currentLanguage === "en" ? "History" : "历史" },
              { id: "Settings", label: currentLanguage === "en" ? "Settings" : "设置" },
              { id: "More", label: currentLanguage === "en" ? "Knowledge" : "知识库" }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-1 rounded-md text-sm border-0 font-medium transition-colors duration-200 ${
                  activeTab === tab.id ? "bg-[rgb(255,202,7)] text-white" : ""
                }`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4 mr-4">
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-1 border-0 transition-colors duration-200"
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            >
              <GlobeAltIcon className="h-4 w-4" />
              <span className="text-sm">{currentLanguage === "en" ? "English" : "中文"}</span>
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {isLanguageMenuOpen && (
              <div className="absolute right-0 mt-2 w-40">
                <button
                  className={`flex items-center w-full px-4 py-2.5 border-0 text-sm transition-all duration-200 ${
                    currentLanguage === "en" ? "bg-[rgb(255,202,7)] text-white" : ""
                  }`}
                  onClick={() => handleLanguageChange("en")}
                >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  English
                </button>
                <button
                  className={`flex items-center w-full px-4 py-2.5 border-0 text-sm transition-all duration-200 ${
                    currentLanguage === "zh" ? "bg-[rgb(255,202,7)] text-white" : ""
                  }`}
                  onClick={() => handleLanguageChange("zh")}
                >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  中文
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="full-h mt-12">
        {renderContent()}
      </div>
    </div>
  );
}
