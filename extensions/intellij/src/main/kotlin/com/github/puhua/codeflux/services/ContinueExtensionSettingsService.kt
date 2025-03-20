package com.github.puhua.codeflux.services

import com.github.puhua.codeflux.constants.getConfigJsPath
import com.github.puhua.codeflux.constants.getConfigJsonPath
import com.intellij.execution.target.value.constant
import com.intellij.openapi.application.ApplicationInfo
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.*
import com.intellij.openapi.options.Configurable
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.util.SystemInfo
import com.intellij.util.concurrency.AppExecutorUtil
import com.intellij.util.messages.Topic
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.awt.GridBagConstraints
import java.awt.GridBagLayout
import java.io.File
import java.io.IOException
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import javax.swing.*

class CodeFluxSettingsComponent : DumbAware {
    val panel: JPanel = JPanel(GridBagLayout())
    val remoteConfigServerUrl: JTextField = JTextField()
    val remoteConfigSyncPeriod: JTextField = JTextField()
    val userToken: JTextField = JTextField()
    val enableTabAutocomplete: JCheckBox = JCheckBox("Enable Tab Autocomplete")
    val enableCodeFluxTeamsBeta: JCheckBox = JCheckBox("Enable CodeFlux for Teams Beta")
    val enableOSR: JCheckBox = JCheckBox("Enable Off-Screen Rendering")
    val displayEditorTooltip: JCheckBox = JCheckBox("Display Editor Tooltip")
    val showIDECompletionSideBySide: JCheckBox = JCheckBox("Show IDE completions side-by-side")

    init {
        val constraints = GridBagConstraints()

        constraints.fill = GridBagConstraints.HORIZONTAL
        constraints.weightx = 1.0
        constraints.weighty = 0.0
        constraints.gridx = 0
        constraints.gridy = GridBagConstraints.RELATIVE

        panel.add(JLabel("Remote Config Server URL:"), constraints)
        constraints.gridy++
        constraints.gridy++
        panel.add(remoteConfigServerUrl, constraints)
        constraints.gridy++
        panel.add(JLabel("Remote Config Sync Period (in minutes):"), constraints)
        constraints.gridy++
        panel.add(remoteConfigSyncPeriod, constraints)
        constraints.gridy++
        panel.add(JLabel("User Token:"), constraints)
        constraints.gridy++
        panel.add(userToken, constraints)
        constraints.gridy++
        panel.add(enableTabAutocomplete, constraints)
        constraints.gridy++
        panel.add(enableCodeFluxTeamsBeta, constraints)
        constraints.gridy++
        panel.add(enableOSR, constraints)
        constraints.gridy++
        panel.add(displayEditorTooltip, constraints)
        constraints.gridy++
        panel.add(showIDECompletionSideBySide, constraints)
        constraints.gridy++

        // Add a "filler" component that takes up all remaining vertical space
        constraints.weighty = 1.0
        val filler = JPanel()
        panel.add(filler, constraints)
    }
}

@Serializable
class CodeFluxRemoteConfigSyncResponse {
    var configJson: String? = null
    var configJs: String? = null
}

@State(
    name = "com.github.puhua.codeflux.services.CodeFluxExtensionSettings",
    storages = [Storage("CodeFluxExtensionSettings.xml")]
)
open class CodeFluxExtensionSettings : PersistentStateComponent<CodeFluxExtensionSettings.CodeFluxState> {

    class CodeFluxState {
        var lastSelectedInlineEditModel: String? = null
        var shownWelcomeDialog: Boolean = false
        var remoteConfigServerUrl: String? = null
        var remoteConfigSyncPeriod: Int = 60
        var userToken: String? = null
        var enableTabAutocomplete: Boolean = true
        var ghAuthToken: String? = null
        var enableCodeFluxTeamsBeta: Boolean = false
        var enableOSR: Boolean = shouldRenderOffScreen()
        var displayEditorTooltip: Boolean = true
        var showIDECompletionSideBySide: Boolean = false
        var codefluxTestEnvironment: String = "production"
    }

    var codefluxState: CodeFluxState = CodeFluxState()

    private var remoteSyncFuture: ScheduledFuture<*>? = null

    override fun getState(): CodeFluxState {
        return codefluxState
    }

    override fun loadState(state: CodeFluxState) {
        codefluxState = state
    }

    companion object {
        val instance: CodeFluxExtensionSettings
            get() = ServiceManager.getService(CodeFluxExtensionSettings::class.java)
    }


    // Sync remote config from server
    private fun syncRemoteConfig() {
        val state = instance.codefluxState

        if (state.remoteConfigServerUrl != null && state.remoteConfigServerUrl!!.isNotEmpty()) {
            // download remote config as json file

            val client = OkHttpClient()
            val baseUrl = state.remoteConfigServerUrl?.removeSuffix("/")

            val requestBuilder = Request.Builder().url("${baseUrl}/sync")

            if (state.userToken != null) {
                requestBuilder.addHeader("Authorization", "Bearer ${state.userToken}")
            }

            val request = requestBuilder.build()
            var configResponse: CodeFluxRemoteConfigSyncResponse? = null

            try {
                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) throw IOException("Unexpected code $response")

                    response.body?.string()?.let { responseBody ->
                        try {
                            configResponse =
                                Json.decodeFromString<CodeFluxRemoteConfigSyncResponse>(responseBody)
                        } catch (e: Exception) {
                            e.printStackTrace()
                            return
                        }
                    }
                }
            } catch (e: IOException) {
                e.printStackTrace()
                return
            }

            if (configResponse?.configJson?.isNotEmpty()!!) {
                val file = File(getConfigJsonPath(request.url.host))
                file.writeText(configResponse!!.configJson!!)
            }

            if (configResponse?.configJs?.isNotEmpty()!!) {
                val file = File(getConfigJsPath(request.url.host))
                file.writeText(configResponse!!.configJs!!)
            }
        }
    }

    // Create a scheduled task to sync remote config every `remoteConfigSyncPeriod` minutes
    fun addRemoteSyncJob() {

        if (remoteSyncFuture != null) {
            remoteSyncFuture?.cancel(false)
        }

        instance.remoteSyncFuture = AppExecutorUtil.getAppScheduledExecutorService()
            .scheduleWithFixedDelay(
                { syncRemoteConfig() },
                0,
                codefluxState.remoteConfigSyncPeriod.toLong(),
                TimeUnit.MINUTES
            )
    }
}

interface SettingsListener {
    fun settingsUpdated(settings: CodeFluxExtensionSettings.CodeFluxState)

    companion object {
        val TOPIC = Topic.create("SettingsUpdate", SettingsListener::class.java)
    }
}

class CodeFluxExtensionConfigurable : Configurable {
    private var mySettingsComponent: CodeFluxSettingsComponent? = null

    override fun createComponent(): JComponent {
        mySettingsComponent = CodeFluxSettingsComponent()
        return mySettingsComponent!!.panel
    }

    override fun isModified(): Boolean {
        val settings = CodeFluxExtensionSettings.instance
        val modified =
            mySettingsComponent?.remoteConfigServerUrl?.text != settings.codefluxState.remoteConfigServerUrl ||
                    mySettingsComponent?.remoteConfigSyncPeriod?.text?.toInt() != settings.codefluxState.remoteConfigSyncPeriod ||
                    mySettingsComponent?.userToken?.text != settings.codefluxState.userToken ||
                    mySettingsComponent?.enableTabAutocomplete?.isSelected != settings.codefluxState.enableTabAutocomplete ||
                    mySettingsComponent?.enableCodeFluxTeamsBeta?.isSelected != settings.codefluxState.enableCodeFluxTeamsBeta ||
                    mySettingsComponent?.enableOSR?.isSelected != settings.codefluxState.enableOSR ||
                    mySettingsComponent?.displayEditorTooltip?.isSelected != settings.codefluxState.displayEditorTooltip ||
                    mySettingsComponent?.showIDECompletionSideBySide?.isSelected != settings.codefluxState.showIDECompletionSideBySide
        return modified
    }

    override fun apply() {
        val settings = CodeFluxExtensionSettings.instance
        settings.codefluxState.remoteConfigServerUrl = mySettingsComponent?.remoteConfigServerUrl?.text
        settings.codefluxState.remoteConfigSyncPeriod = mySettingsComponent?.remoteConfigSyncPeriod?.text?.toInt() ?: 60
        settings.codefluxState.userToken = mySettingsComponent?.userToken?.text
        settings.codefluxState.enableTabAutocomplete = mySettingsComponent?.enableTabAutocomplete?.isSelected ?: false
        settings.codefluxState.enableCodeFluxTeamsBeta =
            mySettingsComponent?.enableCodeFluxTeamsBeta?.isSelected ?: false
        settings.codefluxState.enableOSR = mySettingsComponent?.enableOSR?.isSelected ?: true
        settings.codefluxState.displayEditorTooltip = mySettingsComponent?.displayEditorTooltip?.isSelected ?: true
        settings.codefluxState.showIDECompletionSideBySide =
            mySettingsComponent?.showIDECompletionSideBySide?.isSelected ?: false

        ApplicationManager.getApplication().messageBus.syncPublisher(SettingsListener.TOPIC)
            .settingsUpdated(settings.codefluxState)
        CodeFluxExtensionSettings.instance.addRemoteSyncJob()
    }

    override fun reset() {
        val settings = CodeFluxExtensionSettings.instance
        mySettingsComponent?.remoteConfigServerUrl?.text = settings.codefluxState.remoteConfigServerUrl
        mySettingsComponent?.remoteConfigSyncPeriod?.text = settings.codefluxState.remoteConfigSyncPeriod.toString()
        mySettingsComponent?.userToken?.text = settings.codefluxState.userToken
        mySettingsComponent?.enableTabAutocomplete?.isSelected = settings.codefluxState.enableTabAutocomplete
        mySettingsComponent?.enableCodeFluxTeamsBeta?.isSelected = settings.codefluxState.enableCodeFluxTeamsBeta
        mySettingsComponent?.enableOSR?.isSelected = settings.codefluxState.enableOSR
        mySettingsComponent?.displayEditorTooltip?.isSelected = settings.codefluxState.displayEditorTooltip
        mySettingsComponent?.showIDECompletionSideBySide?.isSelected =
            settings.codefluxState.showIDECompletionSideBySide

        CodeFluxExtensionSettings.instance.addRemoteSyncJob()
    }

    override fun disposeUIResources() {
        mySettingsComponent = null
    }

    override fun getDisplayName(): String {
        return "CodeFlux Extension Settings"
    }
}

/**
 * This function checks if off-screen rendering (OSR) should be used.
 *
 * If ui.useOSR is set in config.json, that value is used.
 *
 * Otherwise, we check if the pluginSinceBuild is greater than or equal to 233, which corresponds
 * to IntelliJ platform version 2023.3 and later.
 *
 * Setting `setOffScreenRendering` to `false` causes a number of issues such as a white screen flash when loading
 * the GUI and the inability to set `cursor: pointer`. However, setting `setOffScreenRendering` to `true` on
 * platform versions prior to 2023.3.4 causes larger issues such as an inability to type input for certain languages,
 * e.g. Korean.
 *
 * References:
 * 1. https://youtrack.jetbrains.com/issue/IDEA-347828/JCEF-white-flash-when-tool-window-show#focus=Comments-27-9334070.0-0
 *    This issue mentions that white screen flash problems were resolved in platformVersion 2023.3.4.
 * 2. https://www.jetbrains.com/idea/download/other.html
 *    This documentation shows mappings from platformVersion to branchNumber.
 *
 * We use the branchNumber (e.g., 233) instead of the full version number (e.g., 2023.3.4) because
 * it's a simple integer without dot notation, making it easier to compare.
 */
private fun shouldRenderOffScreen(): Boolean {
    val minBuildNumber = 233
    val applicationInfo = ApplicationInfo.getInstance()
    val currentBuildNumber = applicationInfo.build.baselineVersion
    return currentBuildNumber >= minBuildNumber
}