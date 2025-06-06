package com.github.puhua.codeflux.autocomplete

import com.intellij.openapi.actionSystem.DataContext
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.editor.Caret
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.actionSystem.EditorAction
import com.intellij.openapi.editor.actionSystem.EditorActionHandler

class PartialAcceptAutocompleteAction : EditorAction(object : EditorActionHandler() {
    override fun doExecute(editor: Editor, caret: Caret?, dataContext: DataContext?) {
        ApplicationManager.getApplication().runWriteAction {
            editor.project?.service<AutocompleteService>()?.partialAccept()
        }
    }

    override fun isEnabledForCaret(editor: Editor, caret: Caret, dataContext: DataContext?): Boolean {
        val autocompleteService = editor.project?.service<AutocompleteService>();
        val enabled = editor == autocompleteService?.pendingCompletion?.editor
                && caret.offset == autocompleteService.pendingCompletion?.offset
                && autocompleteService.pendingCompletion?.text != null
        return enabled
    }
}) {}