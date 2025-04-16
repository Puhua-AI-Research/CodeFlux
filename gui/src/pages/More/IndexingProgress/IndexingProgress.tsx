import { IndexingProgressUpdate } from "core";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { IdeMessengerContext } from "../../../context/IdeMessenger";
import { isJetBrains } from "../../../util";
import { useWebviewListener } from "../../../hooks/useWebviewListener";
import IndexingProgressBar from "./IndexingProgressBar";
import IndexingProgressIndicator from "./IndexingProgressIndicator";
import IndexingProgressTitleText from "./IndexingProgressTitleText";
import IndexingProgressSubtext from "./IndexingProgressSubtext";
import { usePostHog } from "posthog-js/react";
import ConfirmationDialog from "../../../components/dialogs/ConfirmationDialog";
import { setShowDialog, setDialogMessage } from "../../../redux/slices/uiSlice";
import IndexingProgressErrorText from "./IndexingProgressErrorText";

export function getProgressPercentage(
  progress: IndexingProgressUpdate["progress"],
) {
  return Math.min(100, Math.max(0, progress * 100));
}

interface IndexingProgressProps {
  currentLanguage?: string;
}

function IndexingProgress({ currentLanguage = "en" }: IndexingProgressProps) {
  const ideMessenger = useContext(IdeMessengerContext);
  const posthog = usePostHog();
  const dispatch = useDispatch();
  const [paused, setPaused] = useState<boolean | undefined>(undefined);
  const [update, setUpdate] = useState<IndexingProgressUpdate>({
    desc: currentLanguage === "en" ? "Loading indexing config" : "正在加载索引配置",
    progress: 0.0,
    status: "loading",
  });

  // If sidebar is opened after extension initializes, retrieve saved states.
  let initialized = false;

  useWebviewListener("indexProgress", async (data) => {
    setUpdate(data);
  });

  useEffect(() => {
    if (!initialized) {
      // Triggers retrieval for possible non-default states set prior to IndexingProgressBar initialization
      ideMessenger.post("index/indexingProgressBarInitialized", undefined);
      initialized = true;
    }
  }, []);

  useEffect(() => {
    if (paused === undefined) return;
    ideMessenger.post("index/setPaused", paused);
  }, [paused]);

  function onClickRetry() {
    // For now, we don't show in JetBrains since the re-index command
    // is not yet implemented
    if (update.shouldClearIndexes && !isJetBrains()) {
      dispatch(setShowDialog(true));
      dispatch(
        setDialogMessage(
          <ConfirmationDialog
            title={currentLanguage === "en" ? "Rebuild codebase index" : "重建代码库索引"}
            confirmText={currentLanguage === "en" ? "Rebuild" : "重建"}
            text={
              currentLanguage === "en"
                ? "Your index appears corrupted. We recommend clearing and rebuilding it, " +
                "which may take time for large codebases.\n\n" +
                "For a faster rebuild without clearing data, press 'Shift + Command + P' to open " +
                "the Command Palette, and type out 'Continue: Force Codebase Re-Indexing'"
                : "您的索引似乎已损坏。我们建议清除并重建它，" +
                "对于大型代码库可能需要一些时间。\n\n" +
                "要更快地重建而不清除数据，请按 'Shift + Command + P' 打开 " +
                "命令面板，然后输入 'Continue: Force Codebase Re-Indexing'"
            }
            onConfirm={() => {
              posthog.capture("rebuild_index_clicked");
              ideMessenger.post("index/forceReIndex", {
                shouldClearIndexes: true,
              });
            }}
          />,
        ),
      );
    } else {
      ideMessenger.post("index/forceReIndex", undefined);
    }
  }

  function onClick() {
    switch (update.status) {
      case "failed":
        onClickRetry();
        break;
      case "indexing":
      case "loading":
      case "paused":
        if (update.progress < 1 && update.progress >= 0) {
          setPaused((prev) => !prev);
        } else {
          ideMessenger.post("index/forceReIndex", undefined);
        }
        break;
      case "disabled":
        ideMessenger.post("config/openProfile", {
          profileId: undefined,
        });
        break;
      case "done":
        ideMessenger.post("index/forceReIndex", undefined);
      default:
        break;
    }
  }

  return (
    <div className="bg-[rgb(195,195,195,0.05)] rounded-md">
      <div
        className="flex w-full items-center p-3"
        onClick={onClick}
      >
        {/* <IndexingProgressIndicator update={update} /> */}
        <div className="w-[calc(100vw-70px)]">
          <IndexingProgressTitleText
            status={update.status}
            currentLanguage={currentLanguage}
          />
          <IndexingProgressBar update={update} />
          {update.status === "failed" && (
            <IndexingProgressErrorText
              update={update}
            />
          )}
          <IndexingProgressSubtext
            status={update.status}
            desc={update.desc}
            currentLanguage={currentLanguage}
            onClick={onClick}
          />
        </div>
      </div>

    </div>
  );
}

export default IndexingProgress;
