package com.github.puhua.codeflux.actions

import com.github.puhua.codeflux.editor.DiffStreamService
import com.github.puhua.codeflux.services.CodeFluxPluginService
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.PlatformDataKeys
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.components.service
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager

fun getPluginService(project: Project?): CodeFluxPluginService? {
    if (project == null) {
        return null
    }
    return ServiceManager.getService(
        project,
        CodeFluxPluginService::class.java
    )
}

class AcceptDiffAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        acceptHorizontalDiff(e)
        acceptVerticalDiff(e)
    }

    private fun acceptHorizontalDiff(e: AnActionEvent) {
        val codefluxPluginService = getPluginService(e.project) ?: return
        codefluxPluginService?.diffManager?.acceptDiff(null)
    }

    private fun acceptVerticalDiff(e: AnActionEvent) {
        val project = e.project ?: return
        val editor =
            e.getData(PlatformDataKeys.EDITOR) ?: FileEditorManager.getInstance(project).selectedTextEditor ?: return
        val diffStreamService = project.service<DiffStreamService>()
        diffStreamService.accept(editor)
    }
}

class RejectDiffAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        rejectHorizontalDiff(e)
        rejectVerticalDiff(e)
    }

    private fun rejectHorizontalDiff(e: AnActionEvent) {
        val codefluxPluginService = getPluginService(e.project) ?: return
        codefluxPluginService.diffManager?.rejectDiff(null)
    }

    private fun rejectVerticalDiff(e: AnActionEvent) {
        val project = e.project ?: return
        val editor =
            e.getData(PlatformDataKeys.EDITOR) ?: FileEditorManager.getInstance(project).selectedTextEditor ?: return
        val diffStreamService = project.service<DiffStreamService>()
        diffStreamService.reject(editor)
    }
}

fun getCodeFluxPluginService(project: Project?): CodeFluxPluginService? {
    if (project != null) {
        val toolWindowManager = ToolWindowManager.getInstance(project)
        val toolWindow = toolWindowManager.getToolWindow("CodeFlux")

        if (toolWindow != null) {
            if (!toolWindow.isVisible) {
                toolWindow.activate(null)
            }
        }
    }

    return getPluginService(project)
}

fun focusCodeFluxInput(project: Project?) {
    val codefluxPluginService = getCodeFluxPluginService(project) ?: return
    codefluxPluginService.codefluxPluginWindow?.content?.components?.get(0)?.requestFocus()
    codefluxPluginService.sendToWebview("focusCodeFluxInputWithoutClear", null)

    codefluxPluginService.ideProtocolClient?.sendHighlightedCode()
}

class FocusCodeFluxInputWithoutClearAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project
        focusCodeFluxInput(project)
    }
}

class FocusCodeFluxInputAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val codefluxPluginService = getCodeFluxPluginService(e.project) ?: return

        codefluxPluginService.codefluxPluginWindow?.content?.components?.get(0)?.requestFocus()
        codefluxPluginService.sendToWebview("focusContinueInputWithNewSession", null)

        codefluxPluginService.ideProtocolClient?.sendHighlightedCode()
    }
}

class NewCodeFluxSessionAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val codefluxPluginService = getCodeFluxPluginService(e.project) ?: return
        codefluxPluginService.codefluxPluginWindow?.content?.components?.get(0)?.requestFocus()
        codefluxPluginService.sendToWebview("focusContinueInputWithNewSession", null)
    }
}

class ViewHistoryAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val codefluxPluginService = getCodeFluxPluginService(e.project) ?: return
        val params = mapOf("path" to "/history", "toggle" to true)
        codefluxPluginService.sendToWebview("navigateTo", params)
    }
}

class OpenConfigAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val codefluxPluginService = getCodeFluxPluginService(e.project) ?: return
        codefluxPluginService.codefluxPluginWindow?.content?.components?.get(0)?.requestFocus()
        val params = mapOf("path" to "/config", "toggle" to true)
        codefluxPluginService.sendToWebview("navigateTo", params)
    }
}

class OpenMorePageAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val codefluxPluginService = getCodeFluxPluginService(e.project) ?: return
        codefluxPluginService.codefluxPluginWindow?.content?.components?.get(0)?.requestFocus()
        val params = mapOf("path" to "/more", "toggle" to true)
        codefluxPluginService.sendToWebview("navigateTo", params)
    }
}