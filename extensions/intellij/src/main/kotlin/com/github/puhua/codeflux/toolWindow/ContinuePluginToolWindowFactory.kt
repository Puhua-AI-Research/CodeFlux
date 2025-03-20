package com.github.puhua.codeflux.toolWindow

import com.github.puhua.codeflux.services.CodeFluxPluginService
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import javax.swing.*

const val JS_QUERY_POOL_SIZE = "200"

class CodeFluxPluginToolWindowFactory : ToolWindowFactory, DumbAware {
  override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
    val codefluxToolWindow = CodeFluxPluginWindow(project)
    val content =
        ContentFactory.getInstance().createContent(codefluxToolWindow.content, null, false)
    toolWindow.contentManager.addContent(content)
    val titleActions = mutableListOf<AnAction>()
    createTitleActions(titleActions)

    // Add MaximizeToolWindow action
    val action = ActionManager.getInstance().getAction("MaximizeToolWindow")
    if (action != null) {
      titleActions.add(action)
    }

    toolWindow.setTitleActions(titleActions)
  }

  private fun createTitleActions(titleActions: MutableList<in AnAction>) {
    val action = ActionManager.getInstance().getAction("CodeFluxSidebarActionsGroup")
    if (action != null) {
      titleActions.add(action)
    }
  }

  override fun shouldBeAvailable(project: Project) = true

  class CodeFluxPluginWindow(project: Project) {
    private val defaultGUIUrl = "http://codeflux/index.html"

    init {
      System.setProperty("ide.browser.jcef.jsQueryPoolSize", JS_QUERY_POOL_SIZE)
      System.setProperty("ide.browser.jcef.contextMenu.devTools.enabled", "true")
    }

    val browser: CodeFluxBrowser by lazy {
      val url = System.getenv("GUI_URL")?.toString() ?: defaultGUIUrl

      val browser = CodeFluxBrowser(project, url)
      val codefluxPluginService =
          ServiceManager.getService(project, CodeFluxPluginService::class.java)
      codefluxPluginService.codefluxPluginWindow = this
      browser
    }

    val content: JComponent
      get() = browser.browser.component
  }
}
