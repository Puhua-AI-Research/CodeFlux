import {
  ArrowTopRightOnSquareIcon,
  DocumentArrowUpIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useNavigationListener } from "../../hooks/useNavigationListener";
import { setOnboardingCard } from "../../redux/slices/uiSlice";
import MoreHelpRow from "./MoreHelpRow";
import IndexingProgress from "./IndexingProgress";
import DocsIndexingStatuses from "../../components/indexing/DocsIndexingStatuses";
import PageHeader from "../../components/PageHeader";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { saveCurrentSession } from "../../redux/thunks/session";

function MorePage() {
  useNavigationListener();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ideMessenger = useContext(IdeMessengerContext);
  const disableIndexing = useAppSelector(
    (state) => state.config.config.disableIndexing,
  );

  return (
    <div className="overflow-y-scroll bg-gradient-to-b from-[#1a1a1a] to-[#141414]">
      <PageHeader onTitleClick={() => navigate("/")} title="Chat" />

      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <h3 className="text-xl font-medium text-[#FFD700] mb-4 flex items-center gap-2">
              <span className="transition-colors duration-300">@Codebase Index</span>
            </h3>
            <span className="text-gray-300 text-sm block mb-4">
              Local embeddings of your codebase
            </span>
            
            {disableIndexing ? (
              <div className="py-3 text-center font-semibold text-gray-300 bg-black/20 rounded-lg">
                Indexing is disabled
              </div>
            ) : (
              <IndexingProgress />
            )}
          </div>
        </div>

        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <DocsIndexingStatuses />
          </div>
        </div>

        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <h3 className="text-xl font-medium text-[#FFD700] mb-4 flex items-center gap-2">
              <span className="transition-colors duration-300">Help Center</span>
            </h3>
            
            <div className="flex flex-col space-y-2">
              {/* <MoreHelpRow
                title="Documentation"
                description="Learn how to configure and use Continue"
                Icon={ArrowTopRightOnSquareIcon}
                onClick={() =>
                  ideMessenger.post("openUrl", "https://docs.continue.dev/")
                }
              /> */}

              {/* <MoreHelpRow
                title="Have an issue?"
                description="Let us know on GitHub and we'll do our best to resolve it"
                Icon={ArrowTopRightOnSquareIcon}
                onClick={() =>
                  ideMessenger.post(
                    "openUrl",
                    "https://github.com/continuedev/continue/issues/new/choose",
                  )
                }
              /> */}

              {/* <MoreHelpRow
                title="Join the community!"
                description="Join us on Discord to stay up-to-date on the latest developments"
                Icon={ArrowTopRightOnSquareIcon}
                onClick={() =>
                  ideMessenger.post("openUrl", "https://discord.gg/vapESyrFmJ")
                }
              /> */}

              <MoreHelpRow
                title="Token usage"
                description="Daily token usage across models"
                Icon={TableCellsIcon}
                onClick={() => navigate("/stats")}
              />

              {/* <MoreHelpRow
                title="Quickstart"
                description="Reopen the quickstart and tutorial file"
                Icon={DocumentArrowUpIcon}
                onClick={async () => {
                  navigate("/");
                  // Used to clear the chat panel before showing onboarding card
                  await dispatch(
                    saveCurrentSession({
                      openNewSession: true,
                    }),
                  );
                  dispatch(setOnboardingCard({ show: true, activeTab: "Best" }));
                  ideMessenger.post("showTutorial", undefined);
                }}
              /> */}
            </div>
          </div>
        </div>

        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <h3 className="text-xl font-medium text-[#FFD700] mb-4 flex items-center gap-2">
              <span className="transition-colors duration-300">Keyboard Shortcuts</span>
            </h3>
            <KeyboardShortcuts />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MorePage;
