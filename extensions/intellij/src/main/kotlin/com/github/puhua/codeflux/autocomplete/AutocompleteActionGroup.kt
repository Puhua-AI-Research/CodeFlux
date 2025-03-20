package com.github.puhua.codeflux.autocomplete

import com.github.puhua.codeflux.services.CodeFluxExtensionSettings
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.components.service

class AutocompleteActionGroup : DefaultActionGroup() {
    override fun getActionUpdateThread(): ActionUpdateThread {
        return ActionUpdateThread.EDT
    }

    override fun update(e: AnActionEvent) {
        super.update(e)
        removeAll()

        val codefluxSettingsService = service<CodeFluxExtensionSettings>()
        if (codefluxSettingsService.codefluxState.enableTabAutocomplete) {
            addAll(
                DisableTabAutocompleteAction(),
            )
        } else {
            addAll(
                EnableTabAutocompleteAction(),
            )
        }
    }
}