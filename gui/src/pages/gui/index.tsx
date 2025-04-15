import { History } from "../../components/History";
import { Chat } from "./Chat";

export default function GUI({
  currentLanguage = "en"
}) {
  

  return (
    <div className="flex overflow-hidden">
      <aside className="4xl:block border-vsc-input-border no-scrollbar hidden w-96 overflow-y-auto border-0 border-r border-solid">
        <History currentLanguage={currentLanguage}/>
      </aside>
      <main className="no-scrollbar flex flex-col overflow-y-auto w-full">
        <Chat currentLanguage={currentLanguage}/>
      </main>
    </div>
  );
}
