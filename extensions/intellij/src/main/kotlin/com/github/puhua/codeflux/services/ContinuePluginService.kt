package com.github.puhua.codeflux.services

import IntelliJIDE
import com.github.puhua.codeflux.`codeflux`.CoreMessenger
import com.github.puhua.codeflux.`codeflux`.CoreMessengerManager
import com.github.puhua.codeflux.`codeflux`.DiffManager
import com.github.puhua.codeflux.`codeflux`.IdeProtocolClient
import com.github.puhua.codeflux.toolWindow.CodeFluxPluginToolWindowFactory
import com.github.puhua.codeflux.utils.uuid
import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.DumbAware
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel

@Service(Service.Level.PROJECT)
class CodeFluxPluginService : Disposable, DumbAware {
    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    var codefluxPluginWindow: CodeFluxPluginToolWindowFactory.CodeFluxPluginWindow? = null
    var ideProtocolClient: IdeProtocolClient? = null
    var coreMessengerManager: CoreMessengerManager? = null
    val coreMessenger: CoreMessenger?
        get() = coreMessengerManager?.coreMessenger
    var workspacePaths: Array<String>? = null
    var windowId: String = uuid()
    var diffManager: DiffManager? = null

    override fun dispose() {
        coroutineScope.cancel()
        coreMessenger?.coroutineScope?.let {
            it.cancel()
            coreMessenger?.killSubProcess()
        }
    }

    fun sendToWebview(
        messageType: String,
        data: Any?,
        messageId: String = uuid()
    ) {
        codefluxPluginWindow?.browser?.sendToWebview(messageType, data, messageId)
    }
}