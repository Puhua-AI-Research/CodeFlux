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
    <div className="overflow-y-scroll">
      <PageHeader onTitleClick={() => navigate("/")} title="Chat" />
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="relative bg-white/3 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 group transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-500"></div>
          <div className="relative">
            <h3 className="text-xl font-medium text-[rgb(255,202,7)] mb-4 flex items-center gap-2">
              <span className="transition-colors duration-300">Codebase Knowledge</span>
            </h3>
            <span className="text-sm block mb-4">
              Local embeddings of your codebase
            </span>
            
            {disableIndexing ? (
              <div className="py-3 text-center font-semibold bg-black/20 rounded-lg">
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

      </div>
    </div>
  );
}

export default MorePage;
