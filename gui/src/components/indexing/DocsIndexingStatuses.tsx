import { useDispatch } from "react-redux";
import { SecondaryButton } from "..";
import { setDialogMessage, setShowDialog } from "../../redux/slices/uiSlice";
import AddDocsDialog from "../dialogs/AddDocsDialog";
import DocsIndexingStatus from "./DocsIndexingStatus";
import { useAppSelector } from "../../redux/hooks";
import { useContext, useMemo } from "react";
import { ExclamationTriangleIcon, DocumentTextIcon, PlusIcon } from "@heroicons/react/24/outline";
import { IdeMessengerContext } from "../../context/IdeMessenger";

function DocsIndexingStatuses({
  currentLanguage="en"
}) {
  const dispatch = useDispatch();
  const config = useAppSelector((store) => store.config.config);
  const ideMessenger = useContext(IdeMessengerContext);
  const disableIndexing = useAppSelector(
    (state) => state.config.config.disableIndexing,
  );

  const hasDocsProvider = useMemo(() => {
    return !!config.contextProviders?.some(
      (provider) => provider.title === "docs",
    );
  }, [config]);

  const configDocs = useMemo(() => {
    return config.docs ?? [];
  }, [config]);

  return (
    <div className="relative">
      {/* <div className="font-medium mb-4 text-base flex items-center gap-2 text-[#FFD700]">
        <h3 className="text-xl font-medium text-[rgb(255,202,7)] mb-4 flex items-center gap-2">
          <span className="transition-colors duration-300">Docs Knowledge</span>
        </h3>
      </div> */}
      
      <div className="mb-4">
        {hasDocsProvider ? (
          configDocs.length ? (
            currentLanguage === "en" ? "Manage your documentation sources" : "管理您的文档源"
          ) : (
            currentLanguage === "en" ? "No docs yet" : "暂无文档"
          )
        ) : (
          <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
            <div className="flex flex-row gap-2 items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-[#FFD700]" />
              <span className="">
                {currentLanguage === "en" ? "@docs is not in your config" : "@docs 不在您的配置中"}
              </span>
            </div>
            <span
              className="cursor-pointer text-[#FFD700] hover:text-[#FFD700]/80 transition-colors duration-300 flex items-center gap-1"
              onClick={() => {
                ideMessenger.post("config/addContextProvider", {
                  name: "docs",
                  params: {},
                });
              }}
            >
              <PlusIcon className="h-3 w-3" />
              {currentLanguage === "en" ? "Add @docs to my config" : "添加 @docs 到我的配置"}
            </span>
          </div>
        )}
      </div>

      {disableIndexing ? (
              <div className="py-3 text-center font-semibold bg-black/20 rounded-lg">
                {currentLanguage === "en" ? "Indexing is disabled" : "索引已禁用"}
              </div>
            ) : (
              <></>
            )}

      {configDocs.length && !disableIndexing ? (
        <div className="justify-center mb-4 w-full" hidden={disableIndexing}>
          <SecondaryButton
            className="bg-[rgb(255,202,7)] w-full h-[30px] border-0 transition-all duration-300 flex items-center gap-1 py-1 px-3"
            onClick={() => {
              dispatch(setShowDialog(true));
              dispatch(setDialogMessage(<AddDocsDialog currentLanguage={currentLanguage}/>));
            }}
          >
            <div className="flex items-center justify-center w-full">
              <PlusIcon className="h-4 w-4" />
              <span className="mx-1">{currentLanguage === "en" ? "Add Documentation" : "添加文档"}</span>
            </div>
          </SecondaryButton>
        </div>
      ) : null}

      <div className="max-h-[100vh-200px] overflow-y-auto overflow-x-hidden pr-2 space-y-2" hidden={disableIndexing}>
        {configDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-lg border border-white/5">
            <p className="mb-4 text-center">
              {currentLanguage === "en" ? "No documentation sources added yet" : "尚未添加任何文档源"}
            </p>
            <SecondaryButton
              className="bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 transition-all duration-300 flex items-center gap-1 py-1 px-3"
              onClick={() => {
                dispatch(setShowDialog(true));
                dispatch(setDialogMessage(<AddDocsDialog currentLanguage={currentLanguage}/>));
              }}
              hidden={disableIndexing}
            >
              <PlusIcon className="h-4 w-4" />
              {currentLanguage === "en" ? "Add Documentation" : "添加文档"}
            </SecondaryButton>
          </div>
        ) : (
          configDocs.map((doc) => (
            <div 
              key={doc.startUrl} 
              className="group/item rounded-md transition-all duration-300 bg-[rgb(195,195,195,0.05)] p-3"
            >
              <DocsIndexingStatus docConfig={doc} currentLanguage={currentLanguage} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocsIndexingStatuses;