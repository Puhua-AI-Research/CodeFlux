package com.github.puhua.codeflux.actions

import com.github.puhua.codeflux.autocomplete.AcceptAutocompleteAction
import com.github.puhua.codeflux.services.CodeFluxExtensionSettings
import com.intellij.openapi.actionSystem.ActionPromoter
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.DataContext
import com.intellij.openapi.components.ServiceManager
import org.jetbrains.annotations.NotNull

class CodeFluxActionPromote : ActionPromoter {

    override fun promote(@NotNull actions: List<AnAction>, @NotNull context: DataContext): List<AnAction>? {

        if (actions.none { it is AcceptAutocompleteAction }) {
            return null
        } else {
            val settings = ServiceManager.getService(CodeFluxExtensionSettings::class.java)
            if (!settings.codefluxState.showIDECompletionSideBySide) {
                return null;
            }
            return actions.filterIsInstance<AcceptAutocompleteAction>()
        }
    }
}