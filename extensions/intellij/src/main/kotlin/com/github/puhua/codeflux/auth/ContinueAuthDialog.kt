package com.github.puhua.codeflux.auth

import com.intellij.openapi.ui.DialogWrapper
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import javax.swing.JComponent
import javax.swing.JPanel
import java.awt.BorderLayout

class CodeFluxAuthDialog(private val useOnboarding: Boolean, private val onTokenEntered: (String) -> Unit) :
    DialogWrapper(true) {
    private val tokenField = JBTextField()

    init {
        init()
        title = "CodeFlux authentication"
    }

    override fun createCenterPanel(): JComponent {
        val panel = JPanel(BorderLayout())
        val message =
            if (useOnboarding) "After onboarding you will be shown an authentication token. Please enter it here:" else "Please enter your CodeFlux authentication token:"
        panel.add(JBLabel(message), BorderLayout.NORTH)
        panel.add(tokenField, BorderLayout.CENTER)
        return panel
    }

    override fun doOKAction() {
        val token = tokenField.text
        if (token.isNotBlank()) {
            onTokenEntered(token)
            super.doOKAction()
        } else {
            setErrorText("Please enter a valid token")
        }
    }
}
