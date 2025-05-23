import { ConfigHandler } from "core/config/ConfigHandler";
import { getModelByRole } from "core/config/util";
import { applyCodeBlock } from "core/edit/lazy/applyCodeBlock";
import {
  FromCoreProtocol,
  FromWebviewProtocol,
  ToCoreProtocol,
} from "core/protocol";
import { ToWebviewFromCoreProtocol } from "core/protocol/coreWebview";
import { ToIdeFromWebviewOrCoreProtocol } from "core/protocol/ide";
import { ToIdeFromCoreProtocol } from "core/protocol/ideCore";
import { InProcessMessenger, Message } from "core/protocol/messenger";
import {
  CORE_TO_WEBVIEW_PASS_THROUGH,
  WEBVIEW_TO_CORE_PASS_THROUGH,
} from "core/protocol/passThrough";
import { stripImages } from "core/util/messageContent";
import { getUriPathBasename } from "core/util/uri";
import * as vscode from "vscode";

import { VerticalDiffManager } from "../diff/vertical/manager";
import EditDecorationManager from "../quickEdit/EditDecorationManager";
import {
  getControlPlaneSessionInfo,
  WorkOsAuthProvider,
} from "../stubs/WorkOsAuthProvider";
import { showTutorial } from "../util/tutorial";
import { getExtensionUri } from "../util/vscode";
import { VsCodeIde } from "../VsCodeIde";
import { VsCodeWebviewProtocol } from "../webviewProtocol";

/**
 * A shared messenger class between Core and Webview
 * so we don't have to rewrite some of the handlers
 */
type TODO = any;
type ToIdeOrWebviewFromCoreProtocol = ToIdeFromCoreProtocol &
  ToWebviewFromCoreProtocol;

export class VsCodeMessenger {
  onWebview<T extends keyof FromWebviewProtocol>(
    messageType: T,
    handler: (
      message: Message<FromWebviewProtocol[T][0]>,
    ) => Promise<FromWebviewProtocol[T][1]> | FromWebviewProtocol[T][1],
  ): void {
    void this.webviewProtocol.on(messageType, handler);
  }

  onCore<T extends keyof ToIdeOrWebviewFromCoreProtocol>(
    messageType: T,
    handler: (
      message: Message<ToIdeOrWebviewFromCoreProtocol[T][0]>,
    ) =>
      | Promise<ToIdeOrWebviewFromCoreProtocol[T][1]>
      | ToIdeOrWebviewFromCoreProtocol[T][1],
  ): void {
    this.inProcessMessenger.externalOn(messageType, handler);
  }

  onWebviewOrCore<T extends keyof ToIdeFromWebviewOrCoreProtocol>(
    messageType: T,
    handler: (
      message: Message<ToIdeFromWebviewOrCoreProtocol[T][0]>,
    ) =>
      | Promise<ToIdeFromWebviewOrCoreProtocol[T][1]>
      | ToIdeFromWebviewOrCoreProtocol[T][1],
  ): void {
    this.onWebview(messageType, handler);
    this.onCore(messageType, handler);
  }

  constructor(
    private readonly inProcessMessenger: InProcessMessenger<
      ToCoreProtocol,
      FromCoreProtocol
    >,
    private readonly webviewProtocol: VsCodeWebviewProtocol,
    private readonly ide: VsCodeIde,
    private readonly verticalDiffManagerPromise: Promise<VerticalDiffManager>,
    private readonly configHandlerPromise: Promise<ConfigHandler>,
    private readonly workOsAuthProvider: WorkOsAuthProvider,
    private readonly editDecorationManager: EditDecorationManager,
  ) {
    /** WEBVIEW ONLY LISTENERS **/
    this.onWebview("showFile", (msg) => {
      this.ide.openFile(msg.data.filepath);
    });

    this.onWebview("vscode/openMoveRightMarkdown", (msg) => {
      vscode.commands.executeCommand(
        "markdown.showPreview",
        vscode.Uri.joinPath(
          getExtensionUri(),
          "media",
          "move-chat-panel-right.md",
        ),
      );
    });

    this.onWebview("toggleDevTools", (msg) => {
      vscode.commands.executeCommand("codeflux.viewLogs");
    });
    this.onWebview("reloadWindow", (msg) => {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    });
    this.onWebview("focusEditor", (msg) => {
      vscode.commands.executeCommand("workbench.action.focusActiveEditorGroup");
    });
    this.onWebview("toggleFullScreen", (msg) => {
      vscode.commands.executeCommand("codeflux.toggleFullScreen");
    });

    this.onWebview("acceptDiff", async ({ data: { filepath, streamId } }) => {
      await vscode.commands.executeCommand(
        "codeflux.acceptDiff",
        filepath,
        streamId,
      );
    });

    this.onWebview("rejectDiff", async ({ data: { filepath, streamId } }) => {
      await vscode.commands.executeCommand(
        "codeflux.rejectDiff",
        filepath,
        streamId,
      );
    });

    this.onWebview("applyToFile", async ({ data }) => {
      webviewProtocol.request("updateApplyState", {
        streamId: data.streamId,
        status: "streaming",
        fileContent: data.text,
      });

      if (data.filepath) {
        const fileExists = await this.ide.fileExists(data.filepath);
        if (!fileExists) {
          await this.ide.writeFile(data.filepath, "");
          await this.ide.openFile(data.filepath);
        }

        await this.ide.openFile(data.filepath);
      }

      // Get active text editor
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active editor to apply edits to");
        return;
      }

      // If document is empty, insert at 0,0 and finish
      if (!editor.document.getText().trim()) {
        editor.edit((builder) =>
          builder.insert(new vscode.Position(0, 0), data.text),
        );

        void webviewProtocol.request("updateApplyState", {
          streamId: data.streamId,
          status: "closed",
          numDiffs: 0,
          fileContent: data.text,
        });

        return;
      }

      // Get LLM from config
      const configHandler = await configHandlerPromise;
      const { config } = await configHandler.loadConfig();

      if (!config) {
        vscode.window.showErrorMessage("Config not loaded");
        return;
      }

      let llm = getModelByRole(config, "applyCodeBlock");

      if (!llm) {
        llm = config.models.find(
          (model) => model.title === data.curSelectedModelTitle,
        );

        if (!llm) {
          vscode.window.showErrorMessage(
            `Model ${data.curSelectedModelTitle} not found in config.`,
          );
          return;
        }
      }

      const fastLlm = getModelByRole(config, "repoMapFileSelection") ?? llm;

      // Generate the diff and pass through diff manager
      const [instant, diffLines] = await applyCodeBlock(
        editor.document.getText(),
        data.text,
        getUriPathBasename(editor.document.uri.toString()),
        llm,
        fastLlm,
      );

      const verticalDiffManager = await this.verticalDiffManagerPromise;

      if (instant) {
        await verticalDiffManager.streamDiffLines(
          diffLines,
          instant,
          data.streamId,
        );
      } else {
        const prompt = `The following code was suggested as an edit:\n\`\`\`\n${data.text}\n\`\`\`\nPlease apply it to the previous code.`;
        const fullEditorRange = new vscode.Range(
          0,
          0,
          editor.document.lineCount - 1,
          editor.document.lineAt(editor.document.lineCount - 1).text.length,
        );
        const rangeToApplyTo = editor.selection.isEmpty
          ? fullEditorRange
          : editor.selection;

        await verticalDiffManager.streamEdit(
          prompt,
          llm.title,
          data.streamId,
          undefined,
          undefined,
          rangeToApplyTo,
        );
      }
    });

    this.onWebview("showTutorial", async (msg) => {
      await showTutorial(this.ide);
    });

    this.onWebview(
      "overwriteFile",
      async ({ data: { prevFileContent, filepath } }) => {
        if (prevFileContent === null) {
          // TODO: Delete the file
          return;
        }

        await this.ide.openFile(filepath);

        // Get active text editor
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
          vscode.window.showErrorMessage("No active editor to apply edits to");
          return;
        }

        editor.edit((builder) =>
          builder.replace(
            new vscode.Range(
              editor.document.positionAt(0),
              editor.document.positionAt(editor.document.getText().length),
            ),
            prevFileContent,
          ),
        );
      },
    );

    this.onWebview("insertAtCursor", async (msg) => {
      const editor = vscode.window.activeTextEditor;
      if (editor === undefined || !editor.selection) {
        return;
      }

      editor.edit((editBuilder) => {
        editBuilder.replace(
          new vscode.Range(editor.selection.start, editor.selection.end),
          msg.data.text,
        );
      });
    });
    this.onWebview("edit/sendPrompt", async (msg) => {
      const prompt = msg.data.prompt;
      const { start, end } = msg.data.range.range;
      const verticalDiffManager = await verticalDiffManagerPromise;
      const modelTitle = await this.webviewProtocol.request(
        "getDefaultModelTitle",
        undefined,
      );
      const fileAfterEdit = await verticalDiffManager.streamEdit(
        stripImages(prompt),
        modelTitle,
        "edit",
        undefined,
        undefined,
        new vscode.Range(
          new vscode.Position(start.line, start.character),
          new vscode.Position(end.line, end.character),
        ),
      );

      void this.webviewProtocol.request("setEditStatus", {
        status: "accepting",
        fileAfterEdit,
      });
    });
    this.onWebview("edit/acceptReject", async (msg) => {
      const { onlyFirst, accept, filepath } = msg.data;
      if (accept && onlyFirst) {
        // Accept first
        vscode.commands.executeCommand(
          "codeflux.acceptVerticalDiffBlock",
          filepath,
          0,
        );
      } else if (accept) {
        vscode.commands.executeCommand("codeflux.acceptDiff", filepath);
        // Accept all
      } else if (onlyFirst) {
        // Reject first
        vscode.commands.executeCommand(
          "codeflux.rejectVerticalDiffBlock",
          filepath,
          0,
        );
      } else {
        // Reject all
        vscode.commands.executeCommand("codeflux.rejectDiff", filepath);
      }
    });
    this.onWebview("edit/exit", async (msg) => {
      if (msg.data.shouldFocusEditor) {
        const activeEditor = vscode.window.activeTextEditor;

        if (activeEditor) {
          vscode.window.showTextDocument(activeEditor.document);
        }
      }

      editDecorationManager.clear();
    });

    /** PASS THROUGH FROM WEBVIEW TO CORE AND BACK **/
    WEBVIEW_TO_CORE_PASS_THROUGH.forEach((messageType) => {
      this.onWebview(messageType, async (msg) => {
        return await this.inProcessMessenger.externalRequest(
          messageType,
          msg.data,
          msg.messageId,
        );
      });
    });

    /** PASS THROUGH FROM CORE TO WEBVIEW AND BACK **/
    CORE_TO_WEBVIEW_PASS_THROUGH.forEach((messageType) => {
      this.onCore(messageType, async (msg) => {
        return this.webviewProtocol.request(messageType, msg.data);
      });
    });

    /** CORE ONLY LISTENERS **/
    // None right now

    /** BOTH CORE AND WEBVIEW **/
    this.onWebviewOrCore("readRangeInFile", async (msg) => {
      return await vscode.workspace
        .openTextDocument(msg.data.filepath)
        .then((document) => {
          const start = new vscode.Position(0, 0);
          const end = new vscode.Position(5, 0);
          const range = new vscode.Range(start, end);

          const contents = document.getText(range);
          return contents;
        });
    });

    this.onWebviewOrCore("getIdeSettings", async (msg) => {
      return ide.getIdeSettings();
    });
    this.onWebviewOrCore("getDiff", async (msg) => {
      return ide.getDiff(msg.data.includeUnstaged);
    });
    this.onWebviewOrCore("getTerminalContents", async (msg) => {
      return ide.getTerminalContents();
    });
    this.onWebviewOrCore("getDebugLocals", async (msg) => {
      return ide.getDebugLocals(Number(msg.data.threadIndex));
    });
    this.onWebviewOrCore("getAvailableThreads", async (msg) => {
      return ide.getAvailableThreads();
    });
    this.onWebviewOrCore("getTopLevelCallStackSources", async (msg) => {
      return ide.getTopLevelCallStackSources(
        msg.data.threadIndex,
        msg.data.stackDepth,
      );
    });
    this.onWebviewOrCore("getWorkspaceDirs", async (msg) => {
      return ide.getWorkspaceDirs();
    });
    this.onWebviewOrCore("writeFile", async (msg) => {
      return ide.writeFile(msg.data.path, msg.data.contents);
    });
    this.onWebviewOrCore("showVirtualFile", async (msg) => {
      return ide.showVirtualFile(msg.data.name, msg.data.content);
    });
    this.onWebviewOrCore("openFile", async (msg) => {
      return ide.openFile(msg.data.path);
    });
    this.onWebviewOrCore("runCommand", async (msg) => {
      await ide.runCommand(msg.data.command);
    });
    this.onWebviewOrCore("getSearchResults", async (msg) => {
      return ide.getSearchResults(msg.data.query);
    });
    this.onWebviewOrCore("subprocess", async (msg) => {
      return ide.subprocess(msg.data.command, msg.data.cwd);
    });
    this.onWebviewOrCore("getProblems", async (msg) => {
      return ide.getProblems(msg.data.filepath);
    });
    this.onWebviewOrCore("getBranch", async (msg) => {
      const { dir } = msg.data;
      return ide.getBranch(dir);
    });
    this.onWebviewOrCore("getOpenFiles", async (msg) => {
      return ide.getOpenFiles();
    });
    this.onWebviewOrCore("getCurrentFile", async () => {
      return ide.getCurrentFile();
    });
    this.onWebviewOrCore("getPinnedFiles", async (msg) => {
      return ide.getPinnedFiles();
    });
    this.onWebviewOrCore("showLines", async (msg) => {
      const { filepath, startLine, endLine } = msg.data;
      return ide.showLines(filepath, startLine, endLine);
    });
    this.onWebviewOrCore("showToast", (msg) => {
      this.ide.showToast(...msg.data);
    });
    this.onWebviewOrCore("getGitHubAuthToken", (msg) =>
      ide.getGitHubAuthToken(msg.data),
    );
    this.onWebviewOrCore("getControlPlaneSessionInfo", async (msg) => {
      return getControlPlaneSessionInfo(
        msg.data.silent,
        msg.data.useOnboarding,
      );
    });
    this.onWebviewOrCore("logoutOfControlPlane", async (msg) => {
      const sessions = await this.workOsAuthProvider.getSessions();
      await Promise.all(
        sessions.map((session) => workOsAuthProvider.removeSession(session.id)),
      );
      vscode.commands.executeCommand(
        "setContext",
        "codeflux.isSignedInToControlPlane",
        false,
      );
    });
    this.onWebviewOrCore("saveFile", async (msg) => {
      return await ide.saveFile(msg.data.filepath);
    });
    this.onWebviewOrCore("readFile", async (msg) => {
      return await ide.readFile(msg.data.filepath);
    });
    this.onWebviewOrCore("openUrl", (msg) => {
      vscode.env.openExternal(vscode.Uri.parse(msg.data));
    });

    this.onWebviewOrCore("fileExists", async (msg) => {
      return await ide.fileExists(msg.data.filepath);
    });

    this.onWebviewOrCore("gotoDefinition", async (msg) => {
      return await ide.gotoDefinition(msg.data.location);
    });

    this.onWebviewOrCore("getFileStats", async (msg) => {
      return await ide.getFileStats(msg.data.files);
    });

    this.onWebviewOrCore("getGitRootPath", async (msg) => {
      return await ide.getGitRootPath(msg.data.dir);
    });

    this.onWebviewOrCore("listDir", async (msg) => {
      return await ide.listDir(msg.data.dir);
    });

    this.onWebviewOrCore("getRepoName", async (msg) => {
      return await ide.getRepoName(msg.data.dir);
    });

    this.onWebviewOrCore("getTags", async (msg) => {
      return await ide.getTags(msg.data);
    });

    this.onWebviewOrCore("getIdeInfo", async (msg) => {
      return await ide.getIdeInfo();
    });

    this.onWebviewOrCore("isTelemetryEnabled", async (msg) => {
      return await ide.isTelemetryEnabled();
    });

    this.onWebviewOrCore("getWorkspaceConfigs", async (msg) => {
      return await ide.getWorkspaceConfigs();
    });

    this.onWebviewOrCore("getUniqueId", async (msg) => {
      return await ide.getUniqueId();
    });
  }
}
