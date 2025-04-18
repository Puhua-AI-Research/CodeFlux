import {
  CheckIcon,
  InformationCircleIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { IndexingStatus, PackageDocsResult, SiteIndexingConfig } from "core";
import preIndexedDocs from "core/indexing/docs/preIndexedDocs";
import { usePostHog } from "posthog-js/react";
import { useContext, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Input, SecondaryButton } from "..";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useAppSelector } from "../../redux/hooks";
import { updateConfig } from "../../redux/slices/configSlice";
import { updateIndexingStatus } from "../../redux/slices/indexingSlice";
import { setDialogMessage, setShowDialog } from "../../redux/slices/uiSlice";
import FileIcon from "../FileIcon";
import { ToolTip } from "../gui/Tooltip";
import DocsIndexingPeeks from "../indexing/DocsIndexingPeeks";
import { getLanguage } from "../../util";

function AddDocsDialog({
  currentLanguage = "en"
}) {
  const config = useAppSelector((store) => store.config.config);
  const posthog = usePostHog();
  const dispatch = useDispatch();

  const titleRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const ideMessenger = useContext(IdeMessengerContext);
  const indexingStatuses = useAppSelector(
    (store) => store.indexing.indexing.statuses,
  );

  const docsIndexingStatuses: IndexingStatus[] = useMemo(() => {
    return Object.values(indexingStatuses).filter(
      (status) => status.type === "docs" && status.status === "indexing",
    );
  }, [indexingStatuses]);

  const docsSuggestions = useAppSelector((store) => store.misc.docsSuggestions);
  const configDocs = useAppSelector((store) => store.config.config.docs);

  const sortedDocsSuggestions = useMemo(() => {
    const docsFromConfig = configDocs ?? [];
    // Don't show suggestions that are already in the config, indexing, and/or pre-indexed
    const filtered = docsSuggestions.filter((sug) => {
      const startUrl = sug.details?.docsLink;
      return (
        !docsFromConfig.find((d) => d.startUrl === startUrl) &&
        !docsIndexingStatuses.find((s) => s.id === startUrl) &&
        (startUrl ? !preIndexedDocs[startUrl] : true)
      );
    });

    filtered.sort((a, b) => {
      const rank = (result: PackageDocsResult) => {
        if (result.error) {
          return 2;
        } else if (result.details?.docsLinkWarning) {
          return 1;
        } else {
          return 0;
        }
      };
      return rank(a) - rank(b);
    });
    return filtered;
  }, [docsSuggestions, configDocs, docsIndexingStatuses]);

  const isFormValid = startUrl && title;

  useLayoutEffect(() => {
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }, 100);
  }, [titleRef]);

  const closeDialog = () => {
    dispatch(setShowDialog(false));
    dispatch(setDialogMessage(undefined));
  };

  function onSubmit(e: any) {
    e.preventDefault();

    const siteIndexingConfig: SiteIndexingConfig = {
      startUrl,
      title,
      faviconUrl,
    };

    ideMessenger.post("context/addDocs", siteIndexingConfig);

    setTitle("");
    setStartUrl("");
    setFaviconUrl("");

    posthog.capture("add_docs_gui", { url: startUrl });

    // Optimistic status update
    dispatch(
      updateIndexingStatus({
        type: "docs",
        description: currentLanguage === "en" ? "Initializing" : "正在初始化",
        id: startUrl,
        embeddingsProviderId: "mock-embeddings-provider-id",
        progress: 0,
        status: "indexing",
        title,
        url: startUrl,
      }),
    );
  }

  const handleSelectSuggestion = (docsResult: PackageDocsResult) => {
    if (docsResult.error || !docsResult.details) {
      setTitle(docsResult.packageInfo.name);
      setStartUrl("");
      urlRef.current?.focus();
      return;
    }
    const suggestedTitle =
      docsResult.details.title ?? docsResult.packageInfo.name;

    if (docsResult.details?.docsLinkWarning) {
      setTitle(suggestedTitle);
      setStartUrl(docsResult.details.docsLink);
      urlRef.current?.focus();
      return;
    }
    const siteIndexingConfig: SiteIndexingConfig = {
      startUrl: docsResult.details.docsLink,
      title: suggestedTitle,
      faviconUrl: undefined,
    };

    ideMessenger.post("context/addDocs", siteIndexingConfig);

    posthog.capture("add_docs_gui", { url: startUrl });

    // Optimistic status update
    dispatch(
      updateConfig({
        ...config,
        docs: [
          ...(config.docs?.filter(
            (doc) => doc.startUrl !== docsResult.details.docsLink,
          ) ?? []),
          {
            startUrl: docsResult.details.docsLink,
            title: suggestedTitle,
            faviconUrl: undefined,
          },
        ],
      }),
      updateIndexingStatus({
        type: "docs",
        description: "Initializing",
        id: docsResult.details.docsLink,
        embeddingsProviderId: "mock-embeddings-provider-id",
        progress: 0,
        status: "indexing",
        title: docsResult.details.title ?? docsResult.packageInfo.name,
        url: docsResult.details.docsLink,
      }),
    );
  };

  return (
    <div className="flex flex-col p-4 max-h-[90vh]">
      {/* Header Section */}
      <div className="mb-6 border-b border-gray-200/10 pb-4">
        <h1 className="text-xl font-semibold mb-0 hidden sm:block">
          {currentLanguage === "en" ? "Add documentation" : "添加文档"}
        </h1>
        <h1 className="text-xl font-semibold sm:hidden">
          {currentLanguage === "en" ? "Add docs" : "添加文档"}
        </h1>
        <p className="m-0 mt-2 p-0 text-stone-500">
          {currentLanguage === "en" 
            ? "For the @docs context provider"
            : "用于 @docs 上下文提供程序"}
        </p>
      </div>

      {/* Manual Entry Form */}
      <div className="mb-6 rounded-lg">
        <p className="m-0 mb-3 p-0 font-semibold">
          {currentLanguage === "en" ? "Manual Entry" : "手动输入"}
        </p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {currentLanguage === "en" ? "Title" : "标题"}
            </span>
            <Input
              type="text"
              placeholder={currentLanguage === "en" ? "Title" : "标题"}
              value={title}
              ref={titleRef}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {currentLanguage === "en" ? "Start URL" : "起始URL"}
            </span>
            <Input
              ref={urlRef}
              type="url"
              placeholder={currentLanguage === "en" 
                ? "https://docs.example.com"
                : "https://docs.example.com"}
              value={startUrl}
              onChange={(e) => {
                setStartUrl(e.target.value);
              }}
              className="w-full"
            />
          </label>
          <SecondaryButton
            className="bg-[rgb(255,202,7)] w-full"
            disabled={!isFormValid}
            type="submit"
          >
              <div className="flex items-center justify-center w-full text-black">
                <PlusIcon className="h-4 w-4" />
                <span className="mx-1">{currentLanguage === "en" ? "Add" : "添加"}</span>
              </div>
          </SecondaryButton>
        </form>
      </div>

      {/* Indexing Status Section */}
      {docsIndexingStatuses.length > 0 && (
        <div className="mb-6 rounded-lg">
          <p className="m-0 mb-3 p-0 font-semibold">
            {currentLanguage === "en" ? "Indexing Status" : "索引状态"}
          </p>
          <DocsIndexingPeeks statuses={docsIndexingStatuses} />
        </div>
      )}
      
      {/* Footer */}
      <div className="flex flex-row items-end justify-between mt-auto pt-3 border-t border-gray-200/10">
        <div>
          {docsIndexingStatuses.length ? (
            <p className="flex flex-row items-center gap-1 p-0 text-xs text-stone-500 mt-2">
              <CheckIcon className="h-3 w-3" />
              {currentLanguage === "en" 
                ? "It is safe to close this form while indexing"
                : "索引过程中可以安全关闭此表单"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AddDocsDialog;
