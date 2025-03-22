import { useDispatch } from "react-redux";
import { SecondaryButton } from "..";
import { setDialogMessage, setShowDialog } from "../../redux/slices/uiSlice";
import AddDocsDialog from "../dialogs/AddDocsDialog";
import DocsIndexingStatus from "./DocsIndexingStatus";
import { useAppSelector } from "../../redux/hooks";
import { useContext, useMemo } from "react";
import { ExclamationTriangleIcon, DocumentTextIcon, PlusIcon } from "@heroicons/react/24/outline";
import { IdeMessengerContext } from "../../context/IdeMessenger";

function DocsIndexingStatuses() {
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
            "Manage your documentation sources"
          ) : (
            "No docs yet"
          )
        ) : (
          <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-lg border border-white/5">
            <div className="flex flex-row gap-2 items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-[#FFD700]" />
              <span className="">
                @docs is not in your config
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
              Add @docs to my config
            </span>
          </div>
        )}
      </div>

      {disableIndexing ? (
              <div className="py-3 text-center font-semibold bg-black/20 rounded-lg">
                Indexing is disabled
              </div>
            ) : (
              <></>
            )}

      {configDocs.length ? (
        <div className="flex justify-end mb-4" hidden={disableIndexing}>
          <SecondaryButton
            className="bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 transition-all duration-300 flex items-center gap-1 py-1 px-3"
            onClick={() => {
              dispatch(setShowDialog(true));
              dispatch(setDialogMessage(<AddDocsDialog />));
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Documentation
          </SecondaryButton>
        </div>
      ) : null}

      <div className="max-h-[170px] overflow-y-auto overflow-x-hidden pr-2 space-y-2" hidden={disableIndexing}>
        {configDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-lg border border-white/5">
            <p className="mb-4 text-center">No documentation sources added yet</p>
            <SecondaryButton
              className="bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 transition-all duration-300 flex items-center gap-1 py-1 px-3"
              onClick={() => {
                dispatch(setShowDialog(true));
                dispatch(setDialogMessage(<AddDocsDialog />));
              }}
              hidden={disableIndexing}
            >
              <PlusIcon className="h-4 w-4" />
              Add Documentation
            </SecondaryButton>
          </div>
        ) : (
          configDocs.map((doc) => (
            <div 
              key={doc.startUrl} 
              className="group/item hover:bg-[#FFD700]/5 rounded-lg transition-all duration-300"
            >
              <DocsIndexingStatus docConfig={doc} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocsIndexingStatuses;