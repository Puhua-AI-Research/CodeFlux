
package com.github.puhua.codeflux.autocomplete

import com.github.puhua.codeflux.activities.CodeFluxPluginDisposable
import com.github.puhua.codeflux.services.CodeFluxExtensionSettings
import com.intellij.openapi.Disposable
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.util.IconLoader
import com.intellij.openapi.wm.StatusBarWidgetFactory
import com.intellij.openapi.wm.WindowManager
import com.intellij.openapi.wm.impl.status.EditorBasedWidget
import com.intellij.ui.AnimatedIcon
import com.intellij.util.Consumer
import java.awt.event.MouseEvent
import javax.swing.Icon
import javax.swing.JLabel

class AutocompleteSpinnerWidget(project: Project) : EditorBasedWidget(project), StatusBarWidget.IconPresentation,
    Disposable {
    private val iconLabel = JLabel()
    private var isLoading = false
    
    private val animatedIcon = AnimatedIcon(
        100,
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading1(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading2(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading3(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading4(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading5(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading6(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading7(RiderLight).svg", javaClass),
        IconLoader.getIcon("/icons/AnimationLoadingIcon/AnimationLoading8(RiderLight).svg", javaClass),
    )

    init {
        Disposer.register(CodeFluxPluginDisposable.getInstance(project), this)
        updateIcon()
    }

    fun show() {
        println("Showing autocomplete spinner widget")
    }

    override fun dispose() {}

    override fun ID(): String {
        return "AutocompleteSpinnerWidget"
    }

    override fun getTooltipText(): String? {
        val enabled = service<CodeFluxExtensionSettings>().state.enableTabAutocomplete
        return if (enabled) "CodeFlux autocomplete enabled" else "CodeFlux autocomplete disabled"
    }

    override fun getClickConsumer(): Consumer<MouseEvent>? {
        return null
    }

    override fun getIcon(): Icon = if (isLoading) animatedIcon else
        IconLoader.getIcon("/icons/codeflux.svg", javaClass)

    fun setLoading(loading: Boolean) {
        isLoading = loading
        updateIcon()
    }

    private fun updateIcon() {
        iconLabel.icon = getIcon()


        // Update the widget
        val statusBar = WindowManager.getInstance().getStatusBar(project)
        statusBar?.updateWidget(ID())
    }

    override fun install(statusBar: StatusBar) {
        updateIcon()
    }

    override fun getPresentation(): StatusBarWidget.WidgetPresentation? {
        return this
    }
}

class AutocompleteSpinnerWidgetFactory : StatusBarWidgetFactory {
    fun create(project: Project): AutocompleteSpinnerWidget {
        return AutocompleteSpinnerWidget(project)
    }

    override fun getId(): String {
        return "AutocompleteSpinnerWidget"
    }

    override fun getDisplayName(): String {
        return "CodeFlux Autocomplete"
    }

    override fun isAvailable(p0: Project): Boolean {
        return true
    }

    override fun createWidget(project: Project): StatusBarWidget {
        return AutocompleteSpinnerWidget(project)
    }

    override fun disposeWidget(p0: StatusBarWidget) {
        Disposer.dispose(p0)
    }

    override fun canBeEnabledOn(p0: StatusBar): Boolean = true
}
