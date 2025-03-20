package com.github.puhua.codeflux.toolWindow

import com.github.puhua.codeflux.activities.CodeFluxPluginDisposable
import com.github.puhua.codeflux.constants.MessageTypes
import com.github.puhua.codeflux.constants.MessageTypes.Companion.PASS_THROUGH_TO_CORE
import com.github.puhua.codeflux.factories.CustomSchemeHandlerFactory
import com.github.puhua.codeflux.services.CodeFluxExtensionSettings
import com.github.puhua.codeflux.services.CodeFluxPluginService
import com.github.puhua.codeflux.utils.uuid
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.intellij.openapi.components.ServiceManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.ui.jcef.*
import org.cef.CefApp
import org.cef.browser.CefBrowser
import org.cef.handler.CefLoadHandlerAdapter

class CodeFluxBrowser(val project: Project, url: String) {
    private fun registerAppSchemeHandler() {
        CefApp.getInstance().registerSchemeHandlerFactory(
            "http",
            "codeflux",
            CustomSchemeHandlerFactory()
        )
    }

    val browser: JBCefBrowser

    init {
        val isOSREnabled = ServiceManager.getService(CodeFluxExtensionSettings::class.java).codefluxState.enableOSR

        this.browser = JBCefBrowser.createBuilder().setOffScreenRendering(isOSREnabled).build()

        registerAppSchemeHandler()
        browser.loadURL(url);
        Disposer.register(CodeFluxPluginDisposable.getInstance(project), browser)

        // Listen for events sent from browser
        val myJSQueryOpenInBrowser = JBCefJSQuery.create((browser as JBCefBrowserBase?)!!)

        myJSQueryOpenInBrowser.addHandler { msg: String? ->
            val parser = JsonParser()
            val json: JsonObject = parser.parse(msg).asJsonObject
            val messageType = json.get("messageType").asString
            val data = json.get("data")
            val messageId = json.get("messageId")?.asString

            val codefluxPluginService = ServiceManager.getService(
                project,
                CodeFluxPluginService::class.java
            )

            val respond = fun(data: Any?) {
                sendToWebview(messageType, data, messageId ?: uuid())
            }

            if (PASS_THROUGH_TO_CORE.contains(messageType)) {
                codefluxPluginService.coreMessenger?.request(messageType, data, messageId, respond)
                return@addHandler null
            }

            // If not pass through, then put it in the status/content/done format for webview
            // Core already sends this format
            val respondToWebview = fun(data: Any?) {
                sendToWebview(messageType, mapOf(
                    "status" to "success",
                    "content" to data,
                    "done" to true
                ), messageId ?: uuid())
            }

            if (msg != null) {
                codefluxPluginService.ideProtocolClient?.handleMessage(msg, respondToWebview)
            }

            null
        }

        // Listen for the page load event
        browser.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadingStateChange(
                browser: CefBrowser?,
                isLoading: Boolean,
                canGoBack: Boolean,
                canGoForward: Boolean
            ) {
                if (!isLoading) {
                    // The page has finished loading
                    executeJavaScript(browser, myJSQueryOpenInBrowser)
                }
            }
        }, browser.cefBrowser)

    }

    fun executeJavaScript(browser: CefBrowser?, myJSQueryOpenInBrowser: JBCefJSQuery) {
        // Execute JavaScript - you might want to handle potential exceptions here
        val script = """window.postIntellijMessage = function(messageType, data, messageId) {
                const msg = JSON.stringify({messageType, data, messageId});
                ${myJSQueryOpenInBrowser.inject("msg")}
            }""".trimIndent()

        browser?.executeJavaScript(script, browser.url, 0)
    }

    fun sendToWebview(
        messageType: String,
        data: Any?,
        messageId: String = uuid()
    ) {
        val jsonData = Gson().toJson(
            mapOf(
                "messageId" to messageId,
                "messageType" to messageType,
                "data" to data
            )
        )
        val jsCode = buildJavaScript(jsonData)

        try {
            this.browser.executeJavaScriptAsync(jsCode).onError {
                println("Failed to execute jsCode error: ${it.message}")
            }
        } catch (error: IllegalStateException) {
            println("Webview not initialized yet $error")
        }
    }

    private fun buildJavaScript(jsonData: String): String {
        return """window.postMessage($jsonData, "*");"""
    }

}
