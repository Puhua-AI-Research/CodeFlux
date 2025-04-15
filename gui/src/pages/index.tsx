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

  const zhIcon = () => {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="&#228;&#184;&#173;&#230;&#150;&#135;">
        <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="18" height="18" fill="#999999"/>
        <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M1.125 9.125C1.125 4.71357 4.71357 1.125 9.125 1.125C13.5364 1.125 17.125 4.71357 17.125 9.125C17.125 13.5364 13.5364 17.125 9.125 17.125C4.71357 17.125 1.125 13.5364 1.125 9.125ZM2.27083 9.125C2.27083 12.9036 5.34626 15.9793 9.12512 15.9793C12.904 15.9793 15.9794 12.907 15.9794 9.125C15.9794 5.34329 12.9071 2.27072 9.12512 2.27072C5.34369 2.27072 2.27083 5.34615 2.27083 9.125Z" fill="#999999"/>
        <path id="&#228;&#184;&#173;" d="M5.76807 6.712H12.2161V10.472H11.6001V7.296H6.36807V10.512H5.76807V6.712ZM6.08807 9.424H11.9601V10.016H6.08807V9.424ZM8.66407 5.28H9.29607V12.632H8.66407V5.28Z" fill="#999999"/>
        </g>
      </svg>
    )
  };

  const enIcon = () => {
    return (
      <GlobeAltIcon className="h-5 w-5" />
    )
  }

  const settingsIcon = () => {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="&#232;&#174;&#190;&#231;&#189;&#174;">
      <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="18" height="18" fill="#999999"/>
      <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M1 9C1 4.58857 4.58857 1 9 1C13.4114 1 17 4.58857 17 9C17 13.4114 13.4114 17 9 17C4.58857 17 1 13.4114 1 9ZM2.14583 9C2.14583 12.7786 5.22126 15.8543 9.00012 15.8543C12.779 15.8543 15.8544 12.782 15.8544 9C15.8544 5.21829 12.7821 2.14572 9.00012 2.14572C5.21869 2.14572 2.14583 5.22115 2.14583 9Z" fill="#999999"/>
      <g id="Group 14">
      <path id="Vector" d="M8.68592 4.68961L8.49972 5.66679L8.27732 5.71541C7.89581 5.79894 7.53191 5.94879 7.20221 6.15814L7.00085 6.28572L6.21124 5.69265L5.73024 6.17366L6.28951 6.99706L6.16676 7.18842C5.95588 7.51717 5.80428 7.88035 5.71886 8.26146L5.66714 8.4942L4.68961 8.63316V9.31312L5.66679 9.49966L5.71541 9.72206C5.799 10.1036 5.94885 10.4674 6.15814 10.7972L6.28572 10.9985L5.69265 11.7881L6.17366 12.2691L6.99706 11.7099L7.18842 11.8326C7.51717 12.0435 7.88035 12.1951 8.26146 12.2805L8.4942 12.3322L8.63316 13.3098H9.31312L9.49966 12.3326L9.72206 12.284C10.1036 12.2004 10.4674 12.0505 10.7972 11.8412L10.9985 11.7137L11.7881 12.3067L12.2691 11.8257L11.7099 11.0023L11.8326 10.811C12.0435 10.4822 12.1951 10.119 12.2805 9.73792L12.3322 9.50517L13.3098 9.36622V8.68592L12.3326 8.49938L12.284 8.27698C12.2004 7.89548 12.0505 7.5316 11.8412 7.20187L11.7137 7.0005L12.3067 6.2109L11.8257 5.72989L11.0023 6.28917L10.811 6.16642C10.4822 5.95556 10.119 5.80396 9.73792 5.71851L9.50518 5.66679L9.36622 4.68927H8.68592V4.68961ZM7.90665 5.09752L8.11595 4H9.9648L10.1224 5.10579C10.4241 5.19268 10.7134 5.31406 10.9858 5.46749L11.9102 4.83926L13.2177 6.14676L12.5467 7.03981C12.6984 7.31359 12.8177 7.60391 12.9019 7.90631L13.9997 8.11561V9.96446L12.8939 10.122C12.8073 10.4229 12.6859 10.7127 12.5322 10.9854L13.1605 11.9099L11.853 13.2174L10.9599 12.5464C10.6861 12.6981 10.3958 12.8174 10.0934 12.9015L9.88412 13.9994H8.03527L7.87769 12.8936C7.57682 12.807 7.28706 12.6856 7.0143 12.5319L6.08953 13.1601L4.78202 11.8526L5.45301 10.9596C5.30134 10.6855 5.18215 10.3947 5.09786 10.0931L4 9.88377V8.03492L5.10579 7.87734C5.19268 7.57598 5.31406 7.28635 5.4675 7.01395L4.83926 6.08953L6.14676 4.78202L7.03981 5.45301C7.31385 5.30135 7.60465 5.18216 7.90631 5.09786L7.90665 5.09752Z" fill="#999999"/>
      <path id="Vector_2" d="M8.99999 11.0685C8.4513 11.0685 7.92508 10.8506 7.5371 10.4626C7.14912 10.0746 6.93115 9.54837 6.93115 8.99968C6.93115 8.45099 7.14912 7.92478 7.5371 7.5368C7.92508 7.14881 8.4513 6.93085 8.99999 6.93085C9.54868 6.93085 10.0749 7.14881 10.4629 7.5368C10.8509 7.92478 11.0688 8.45099 11.0688 8.99968C11.0688 9.54837 10.8509 10.0746 10.4629 10.4626C10.0749 10.8506 9.54868 11.0685 8.99999 11.0685ZM8.99999 10.3789C9.36578 10.3789 9.71659 10.2336 9.97525 9.97494C10.2339 9.71629 10.3792 9.36548 10.3792 8.99968C10.3792 8.63389 10.2339 8.28308 9.97525 8.02442C9.71659 7.76577 9.36578 7.62046 8.99999 7.62046C8.6342 7.62046 8.28338 7.76577 8.02473 8.02442C7.76608 8.28308 7.62076 8.63389 7.62076 8.99968C7.62076 9.36548 7.76608 9.71629 8.02473 9.97494C8.28338 10.2336 8.6342 10.3789 8.99999 10.3789Z" fill="#999999"/>
      </g>
      </g>
      </svg>
    )
  };

  const historyIcon = () => {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="&#230;&#151;&#182;&#233;&#151;&#180;">
      <rect id="&#231;&#159;&#169;&#229;&#189;&#162;" opacity="0.01" width="18" height="18" fill="#999999"/>
      <path id="&#229;&#189;&#162;&#231;&#138;&#182;" fill-rule="evenodd" clip-rule="evenodd" d="M1.125 9.125C1.125 4.71357 4.71357 1.125 9.125 1.125C13.5364 1.125 17.125 4.71357 17.125 9.125C17.125 13.5364 13.5364 17.125 9.125 17.125C4.71357 17.125 1.125 13.5364 1.125 9.125ZM2.27083 9.125C2.27083 12.9036 5.34626 15.9793 9.12512 15.9793C12.904 15.9793 15.9794 12.907 15.9794 9.125C15.9794 5.34329 12.9071 2.27072 9.12512 2.27072C5.34369 2.27072 2.27083 5.34615 2.27083 9.125Z" fill="#999999"/>
      <path id="&#232;&#183;&#175;&#229;&#190;&#132;" d="M11.8154 9H9.00293V5.06531C9.00293 4.75397 8.75205 4.5 8.44043 4.5C8.12909 4.5 7.87793 4.75397 7.87793 5.06531V9.56531C7.87793 9.87694 8.12909 10.1278 8.44043 10.1278H11.8154C12.1271 10.1278 12.3813 9.87694 12.3813 9.56531C12.3795 9.25365 12.1271 9.00154 11.8154 9Z" fill="#999999"/>
      </g>
      </svg>
    )
  }

  const toggleLanguage = () => {
    const newLang = currentLanguage === "en" ? "zh" : "en";
    handleLanguageChange(newLang);
  };

  // Calculate a fixed header height - adjust this value as needed
  const navHeight = "50px"; 

  return (
    <div className="flex flex-col h-screen">
      <div 
        className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-0 border-b border-b-zinc-700 bg-inherit"
        style={{ height: navHeight }}
      >
        {/* Left side tabs */}
        <div className="flex items-center ml-2">
          <div className="ml-4 flex space-x-8">
            <div 
              className="relative py-2 pb-2"
              style={{ borderBottom: activeTab === "chat" ? "2px solid" : "none" }}
            >
              <span 
                className="px-0 cursor-pointer"
                onClick={() => handleTabChange("chat")}
              >
                {currentLanguage === "en" ? "Chat" : "聊天"}
              </span>
            </div>
            <div 
              className="relative py-2 pb-2"
              style={{ borderBottom: activeTab === "More" ? "2px solid" : "none" }}
            >
              <span 
                className="px-0 cursor-pointer"
                onClick={() => handleTabChange("More")}
              >
                {currentLanguage === "en" ? "Knowledge" : "知识库"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right side icons */}
        <div className="ml-auto flex items-center space-x-[6px] mr-4">
          <div onClick={() => handleTabChange("History")} className="cursor-pointer">
            {historyIcon()}
          </div>
          
          <div onClick={() => handleTabChange("Settings")} className="cursor-pointer">
            {settingsIcon()}
          </div>
          
          <div className="cursor-pointer" onClick={toggleLanguage}>
            {currentLanguage === "en" ? enIcon() : zhIcon()}
          </div>
        </div>
      </div>
      <div 
        className="" 
        style={{ 
          height: `calc(100% - ${navHeight})`, 
          marginTop: navHeight,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div className="px-[20px] pb-[20px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
