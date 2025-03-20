package com.github.puhua.codeflux.`codeflux`

import com.github.puhua.codeflux.services.CodeFluxPluginService
import com.intellij.openapi.vfs.AsyncFileListener
import com.intellij.openapi.vfs.newvfs.events.VFileEvent

class AsyncFileSaveListener(private val codefluxPluginService: CodeFluxPluginService) : AsyncFileListener {
    private val configFilePatterns = listOf(
        ".codeflux/config.json",
        ".codeflux/config.ts",
        ".codeflux/config.yaml",
        ".codefluxrc.json"
    )

    override fun prepareChange(events: MutableList<out VFileEvent>): AsyncFileListener.ChangeApplier? {
        val isConfigFile = events.any { event ->
            configFilePatterns.any { pattern ->
                event.path.endsWith(pattern) || event.path.endsWith(pattern.replace("/", "\\"))
            }
        }

        return if (isConfigFile) {
            object : AsyncFileListener.ChangeApplier {
                override fun afterVfsChange() {
                    codefluxPluginService.coreMessenger?.request("config/reload", null, null) { _ -> }
                }
            }
        } else null
    }
}