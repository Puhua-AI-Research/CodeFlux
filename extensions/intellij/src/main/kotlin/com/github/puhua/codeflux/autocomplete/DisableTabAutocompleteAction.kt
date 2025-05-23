package com.github.puhua.codeflux.autocomplete

import com.github.puhua.codeflux.services.CodeFluxExtensionSettings
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
class DisableTabAutocompleteAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val codefluxSettingsService = service<CodeFluxExtensionSettings>()
        codefluxSettingsService.codefluxState.enableTabAutocomplete = true
    }
}
