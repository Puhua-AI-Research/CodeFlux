import { IndexingProgressUpdate } from "core";

export interface IndexingProgressSubtextProps {
  status: IndexingProgressUpdate["status"];
  desc: string;
  currentLanguage?: string;
  onClick?: () => void;
}

const STATUS_TO_SUBTITLE_TEXT_EN: Record<
  IndexingProgressUpdate["status"],
  string | undefined
> = {
  done: "Click to re-index",
  loading: "",
  indexing: "Click to pause",
  paused: "Click to resume",
  failed: "Click to retry",
  disabled: "Click to open config",
  cancelled: "Click to restart",
};

const STATUS_TO_SUBTITLE_TEXT_ZH: Record<
  IndexingProgressUpdate["status"],
  string | undefined
> = {
  done: "点击重新索引",
  loading: "",
  indexing: "点击暂停",
  paused: "点击继续",
  failed: "点击重试",
  disabled: "点击打开配置",
  cancelled: "点击重新开始",
};

function IndexingProgressSubtext({
  status,
  desc,
  currentLanguage = "en",
  onClick
}: IndexingProgressSubtextProps) {
  const showIndexingDesc = status === "indexing";
  const text = currentLanguage === "en" ? STATUS_TO_SUBTITLE_TEXT_EN[status] : STATUS_TO_SUBTITLE_TEXT_ZH[status];

  return (
    <div className="flex justify-between">
      <span
        className={`cursor-pointer text-xs text-stone-500 underline ${
          showIndexingDesc ? "w-1/3" : "w-full"
        }`}
        onClick={onClick}
      >
        {text}
      </span>

      {showIndexingDesc && (
        <span className="w-2/3 truncate text-right text-xs text-stone-500">
          {desc}
        </span>
      )}
    </div>
  );
}

export default IndexingProgressSubtext;
