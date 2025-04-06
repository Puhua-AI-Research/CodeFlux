import { IndexingProgressUpdate } from "core";
import { AnimatedEllipsis } from "../../../components";

export interface IndexingProgressTitleTextProps {
  status: IndexingProgressUpdate["status"];
  currentLanguage?: string;
}

const STATUS_TO_TEXT_EN: Record<IndexingProgressUpdate["status"], string> = {
  done: "Indexing complete",
  loading: "Initializing",
  indexing: "Indexing in-progress",
  paused: "Indexing paused",
  failed: "Indexing failed",
  disabled: "Indexing disabled",
  cancelled: "Indexing cancelled",
};

const STATUS_TO_TEXT_ZH: Record<IndexingProgressUpdate["status"], string> = {
  done: "索引完成",
  loading: "正在初始化",
  indexing: "正在索引",
  paused: "索引已暂停",
  failed: "索引失败",
  disabled: "索引已禁用",
  cancelled: "索引已取消",
};

function IndexingProgressTitleText({ status, currentLanguage = "en" }: IndexingProgressTitleTextProps) {
  const showEllipsis = status === "loading";
  const text = currentLanguage === "en" ? STATUS_TO_TEXT_EN[status] : STATUS_TO_TEXT_ZH[status];

  return (
    <span>
      {text}
      {showEllipsis && <AnimatedEllipsis />}
    </span>
  );
}

export default IndexingProgressTitleText;
