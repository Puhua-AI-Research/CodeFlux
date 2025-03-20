package com.github.puhua.codeflux.activities

import IntelliJIDE
import com.github.puhua.codeflux.auth.AuthListener
import com.github.puhua.codeflux.auth.CodeFluxAuthService
import com.github.puhua.codeflux.auth.ControlPlaneSessionInfo
import com.github.puhua.codeflux.constants.getCodeFluxGlobalPath
import com.github.puhua.codeflux.`codeflux`.*
import com.github.puhua.codeflux.listeners.CodeFluxPluginSelectionListener
import com.github.puhua.codeflux.services.CodeFluxExtensionSettings
import com.github.puhua.codeflux.services.CodeFluxPluginService
import com.github.puhua.codeflux.services.SettingsListener
import com.github.puhua.codeflux.utils.toUriOrNull
import com.intellij.openapi.actionSystem.KeyboardShortcut
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.ApplicationNamesInfo
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.editor.EditorFactory
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.keymap.KeymapManager
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.StartupActivity
import com.intellij.openapi.util.io.StreamUtil
import com.intellij.openapi.vfs.LocalFileSystem
import kotlinx.coroutines.*
import java.io.*
import java.nio.charset.StandardCharsets
import java.nio.file.Paths
import javax.swing.*
import com.intellij.openapi.components.service
import com.intellij.openapi.module.ModuleManager
import com.intellij.openapi.project.guessProjectDir
import com.intellij.openapi.roots.ModuleRootManager
import com.intellij.openapi.vfs.VirtualFileManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.vfs.newvfs.events.VFileEvent
import com.intellij.openapi.vfs.newvfs.events.VFileDeleteEvent
import com.intellij.openapi.vfs.newvfs.events.VFileContentChangeEvent
import com.intellij.ide.ui.LafManagerListener

fun showTutorial(project: Project) {
    val tutorialFileName = getTutorialFileName()

    CodeFluxPluginStartupActivity::class.java.getClassLoader().getResourceAsStream(tutorialFileName)
        .use { `is` ->
            if (`is` == null) {
                throw IOException("Resource not found: $tutorialFileName")
            }
            var content = StreamUtil.readText(`is`, StandardCharsets.UTF_8)
            
            // All jetbrains will use J instead of L
            content = content.replace("[Cmd + L]", "[Cmd + J]")
            content = content.replace("[Cmd + Shift + L]", "[Cmd + Shift + J]")

            if (!System.getProperty("os.name").lowercase().contains("mac")) {
                content = content.replace("[Cmd + J]", "[Ctrl + J]")
                content = content.replace("[Cmd + Shift + J]", "[Ctrl + Shift + J]")
                content = content.replace("[Cmd + I]", "[Ctrl + I]")
                content = content.replace("⌘", "⌃")
            }
            val filepath = Paths.get(getCodeFluxGlobalPath(), tutorialFileName).toString()
            File(filepath).writeText(content)
            val virtualFile = LocalFileSystem.getInstance().findFileByPath(filepath)

            ApplicationManager.getApplication().invokeLater {
                if (virtualFile != null) {
                    FileEditorManager.getInstance(project).openFile(virtualFile, true)
                }
            }
        }
}

private fun getTutorialFileName(): String {
    val appName = ApplicationNamesInfo.getInstance().fullProductName.lowercase()
    return when {
        appName.contains("intellij") -> "test_tutorial.java"
        appName.contains("pycharm") -> "test_tutorial.py"
        appName.contains("webstorm") -> "test_tutorial.ts"
        else -> "test_tutorial.py" // Default to Python tutorial
    }
}

class CodeFluxPluginStartupActivity : StartupActivity, DumbAware {

    override fun runActivity(project: Project) {
        removeShortcutFromAction(getPlatformSpecificKeyStroke("J"))
        removeShortcutFromAction(getPlatformSpecificKeyStroke("shift J"))
        removeShortcutFromAction(getPlatformSpecificKeyStroke("I"))
        initializePlugin(project)
    }

    private fun getPlatformSpecificKeyStroke(key: String): String {
        val osName = System.getProperty("os.name").toLowerCase()
        val modifier = if (osName.contains("mac")) "meta" else "control"
        return "$modifier $key"
    }

    private fun removeShortcutFromAction(shortcut: String) {
        val keymap = KeymapManager.getInstance().activeKeymap
        val keyStroke = KeyStroke.getKeyStroke(shortcut)
        val actionIds = keymap.getActionIds(keyStroke)

        // If CodeFlux has been re-assigned to another key, don't remove the shortcut
        if (!actionIds.any { it.startsWith("codeflux") }) {
            return
        }

        for (actionId in actionIds) {
            if (actionId.startsWith("codeflux")) {
                continue
            }
            val shortcuts = keymap.getShortcuts(actionId)
            for (shortcut in shortcuts) {
                if (shortcut is KeyboardShortcut && shortcut.firstKeyStroke == keyStroke) {
                    keymap.removeShortcut(actionId, shortcut)
                }
            }
        }
    }

    private fun initializePlugin(project: Project) {
        val coroutineScope = CoroutineScope(Dispatchers.IO)
        val codefluxPluginService = ServiceManager.getService(
            project,
            CodeFluxPluginService::class.java
        )

        coroutineScope.launch {
            val settings =
                ServiceManager.getService(CodeFluxExtensionSettings::class.java)
            if (!settings.codefluxState.shownWelcomeDialog) {
                settings.codefluxState.shownWelcomeDialog = true
                // Open tutorial file
                showTutorial(project)
            }

            settings.addRemoteSyncJob()

            val ideProtocolClient = IdeProtocolClient(
                codefluxPluginService,
                coroutineScope,
                project
            )

            val diffManager = DiffManager(project)

            codefluxPluginService.diffManager = diffManager
            codefluxPluginService.ideProtocolClient = ideProtocolClient

            // Listen to changes to settings so the core can reload remote configuration
            val connection = ApplicationManager.getApplication().messageBus.connect()
            connection.subscribe(SettingsListener.TOPIC, object : SettingsListener {
                override fun settingsUpdated(settings: CodeFluxExtensionSettings.CodeFluxState) {
                    codefluxPluginService.coreMessenger?.request("config/ideSettingsUpdate", settings, null) { _ -> }
                    codefluxPluginService.sendToWebview(
                        "didChangeIdeSettings", mapOf(
                            "settings" to mapOf(
                                "remoteConfigServerUrl" to settings.remoteConfigServerUrl,
                                "remoteConfigSyncPeriod" to settings.remoteConfigSyncPeriod,
                                "userToken" to settings.userToken,
                                "enableControlServerBeta" to settings.enableCodeFluxTeamsBeta
                            )
                        )
                    )
                }
            })

            // Handle file changes and deletions - reindex
            connection.subscribe(VirtualFileManager.VFS_CHANGES, object : BulkFileListener {
                override fun after(events: List<VFileEvent>) {
                    // Collect all relevant URIs for deletions
                    val deletedURIs = events.filterIsInstance<VFileDeleteEvent>()
                        .mapNotNull { event -> event.file.toUriOrNull() }

                    // Send "files/deleted" message if there are any deletions
                    if (deletedURIs.isNotEmpty()) {
                        val data = mapOf("files" to deletedURIs)
                        codefluxPluginService.coreMessenger?.request("files/deleted", data, null) { _ -> }
                    }

                    // Collect all relevant URIs for content changes
                    val changedURIs = events.filterIsInstance<VFileContentChangeEvent>()
                        .mapNotNull { event -> event.file.toUriOrNull() }

                    // Notify core of content changes
                    if (changedURIs.isNotEmpty()) {
                        val data = mapOf("files" to changedURIs)
                        codefluxPluginService.coreMessenger?.request("files/changed", data, null) { _ -> }
                    }
                }
            })

            // Listen for theme changes
            connection.subscribe(LafManagerListener.TOPIC, LafManagerListener {
                val colors = GetTheme().getTheme();
                codefluxPluginService.sendToWebview(
                    "jetbrains/setColors",
                    colors
                )
            })
            
            // Listen for clicking settings button to start the auth flow
            val authService = service<CodeFluxAuthService>()
            val initialSessionInfo = authService.loadControlPlaneSessionInfo()

            if (initialSessionInfo != null) {
                val data = mapOf(
                    "sessionInfo" to initialSessionInfo
                )
                codefluxPluginService.coreMessenger?.request("didChangeControlPlaneSessionInfo", data, null) { _ -> }
                codefluxPluginService.sendToWebview("didChangeControlPlaneSessionInfo", data)
            }

            connection.subscribe(AuthListener.TOPIC, object : AuthListener {
                override fun startAuthFlow() {
                    authService.startAuthFlow(project, false)
                }

                override fun handleUpdatedSessionInfo(sessionInfo: ControlPlaneSessionInfo?) {
                    val data = mapOf(
                        "sessionInfo" to sessionInfo
                    )
                    codefluxPluginService.coreMessenger?.request(
                        "didChangeControlPlaneSessionInfo",
                        data,
                        null
                    ) { _ -> }
                    codefluxPluginService.sendToWebview("didChangeControlPlaneSessionInfo", data)
                }
            })

            val listener =
                CodeFluxPluginSelectionListener(
                    coroutineScope,
                )

            // Reload the WebView
            codefluxPluginService?.let { pluginService ->
                val allModulePaths = ModuleManager.getInstance(project).modules
                    .flatMap { module -> ModuleRootManager.getInstance(module).contentRoots.mapNotNull { it.toUriOrNull() } }

                val topLevelModulePaths = allModulePaths
                    .filter { modulePath -> allModulePaths.none { it != modulePath && modulePath.startsWith(it) } }

                pluginService.workspacePaths = topLevelModulePaths.toTypedArray()
            }

            EditorFactory.getInstance().eventMulticaster.addSelectionListener(
                listener,
                CodeFluxPluginDisposable.getInstance(project)
            )

            val coreMessengerManager = CoreMessengerManager(project, ideProtocolClient, coroutineScope)
            codefluxPluginService.coreMessengerManager = coreMessengerManager
        }
    }
}