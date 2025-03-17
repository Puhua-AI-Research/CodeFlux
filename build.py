import json
import argparse
import os
import shutil

# https://microsoft.github.io/vscode-codicons/dist/codicon.html

# CodeFlux
# python build.py --product_name=CodeFlux --dry
# python build.py --ide_type=vscode --product_name=CodeFlux --action=install
# python build.py --ide_type=vscode --product_name=CodeFlux --action=build
# python build.py --ide_type=jetbrains --product_name=CodeFlux


# 注意配置时需要png,svg 都需要

config = {
    "CodeFlux": {
        "name": "CodeFlux",
        "displayName": "CodeFlux - Code Generator",
        "description": "CodeFlux 是一款基于人工智能的代码生成工具，旨在帮助开发者快速生成高质量、可维护的代码，显著提升开发效率并减少重复性劳动",
        "icon": "media/codeflux",
        "publisher": "Puhua-AI-Research",
        "author": "Puhua-AI-Research",
        "version": "1.0.0"
    }
}


def set_gradle(name: str, version: str):
    with open("extensions/intellij/gradle.properties", "w", encoding="utf-8") as f:
        f.write(f"""
# IntelliJ Platform Artifacts Repositories -> https://plugins.jetbrains.com/docs/intellij/intellij-artifacts.html
pluginGroup=com.github.intellij.Puhua-AI-Research
pluginName={name}
pluginRepositoryUrl=https://github.com/Puhua-AI-Research/CodeFlux-Extention
# SemVer format -> https://semver.org
pluginVersion={version}
# Supported build number ranges and IntelliJ Platform versions -> https://plugins.jetbrains.com/docs/intellij/build-number-ranges.html
pluginSinceBuild=223
# IntelliJ Platform Properties -> https://plugins.jetbrains.com/docs/intellij/tools-gradle-intellij-plugin.html#configuration-intellij-extension
platformType=IC
platformVersion=2022.3.3
#platformVersion = LATEST-EAP-SNAPSHOT
# Plugin Dependencies -> https://plugins.jetbrains.com/docs/intellij/plugin-dependencies.html
# Example: platformPlugins = com.intellij.java, com.jetbrains.php:203.4449.22
platformPlugins=org.jetbrains.plugins.terminal
# Gradle Releases -> https://github.com/gradle/gradle/releases
gradleVersion=8.3
# Opt-out flag for bundling Kotlin standard library -> https://jb.gg/intellij-platform-kotlin-stdlib
kotlin.stdlib.default.dependency=false
# Enable Gradle Configuration Cache -> https://docs.gradle.org/current/userguide/configuration_cache.html
org.gradle.configuration-cache=true
# Enable Gradle Build Cache -> https://docs.gradle.org/current/userguide/build_cache.html
org.gradle.caching=true
# Enable Gradle Kotlin DSL Lazy Property Assignment -> https://docs.gradle.org/current/userguide/kotlin_dsl.html#kotdsl:assignment
systemProp.org.gradle.unsafe.kotlin.assignment=true
""")

    with open("extensions/intellij/src/main/kotlin/com/github/continuedev/continueintellijextension/autocomplete/AutocompleteSpinnerWidgetFactory.kt", "w", encoding="utf-8") as f:
        f.write("""
package com.github.continuedev.continueintellijextension.autocomplete

import com.github.continuedev.continueintellijextension.activities.ContinuePluginDisposable
import com.github.continuedev.continueintellijextension.services.ContinueExtensionSettings
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
        Disposer.register(ContinuePluginDisposable.getInstance(project), this)
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
        val enabled = service<ContinueExtensionSettings>().state.enableTabAutocomplete
        return if (enabled) "XXXXXXXXXXX autocomplete enabled" else "XXXXXXXXXXX autocomplete disabled"
    }

    override fun getClickConsumer(): Consumer<MouseEvent>? {
        return null
    }

    override fun getIcon(): Icon = if (isLoading) animatedIcon else
        IconLoader.getIcon("/icons/continue.svg", javaClass)

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
        return "XXXXXXXXXXX Autocomplete"
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
""".replace("XXXXXXXXXXX", name))

    with open("extensions/intellij/settings.gradle.kts", "w", encoding="utf-8") as f:
        f.write(f"""rootProject.name = \"{name}-intellij\"""")
    with open("extensions/intellij/src/main/resources/META-INF/plugin.xml", "w", encoding="utf-8") as f:
        f.write(f"""
<!-- Plugin Configuration File. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-configuration-file.html -->
<idea-plugin>
    <id>com.github.continuedev.continueintellijextension</id>
    <name>{name}</name>
    <!-- <vendor url="https://www.continue.dev/">{name}</vendor> -->
    <change-notes>
        <![CDATA[View the latest release notes on <a href="https://github.com/Puhua-AI-Research/CodeFlux-Extention/releases">GitHub</a>]]></change-notes>

    <depends>com.intellij.modules.platform</depends>

    <!-- See here for why this is optional:  https://github.com/continuedev/continue/issues/2775#issuecomment-2535620877-->
    <depends optional="true" config-file="continueintellijextension-withJSON.xml">
        com.intellij.modules.json
    </depends>

    <!-- com.intellij.openapi.module.ModuleManager.Companion is only available since this build -->
    <idea-version since-build="223.7571.182"/>

    <extensions defaultExtensionNs="com.intellij">
        <editorFactoryListener
                implementation="com.github.continuedev.continueintellijextension.autocomplete.AutocompleteEditorListener"/>
        <toolWindow id="{name}" anchor="right" icon="/tool-window-icon.svg"
                    factoryClass="com.github.continuedev.continueintellijextension.toolWindow.ContinuePluginToolWindowFactory"/>
        <projectService id="ContinuePluginService"
                        serviceImplementation="com.github.continuedev.continueintellijextension.services.ContinuePluginService"/>
        <projectService
                id="DiffStreamService"
                serviceImplementation="com.github.continuedev.continueintellijextension.editor.DiffStreamService"/>
        <projectService
                id="AutocompleteLookupListener"
                serviceImplementation="com.github.continuedev.continueintellijextension.autocomplete.AutocompleteLookupListener"/>
        <statusBarWidgetFactory
                implementation="com.github.continuedev.continueintellijextension.autocomplete.AutocompleteSpinnerWidgetFactory"
                id="AutocompleteSpinnerWidget"/>
        <notificationGroup id="Continue"
                           displayType="BALLOON"/>
        <actionPromoter order="last"
                        implementation="com.github.continuedev.continueintellijextension.actions.ContinueActionPromote"/>
    </extensions>

    <resource-bundle>messages.MyBundle</resource-bundle>

    <extensions defaultExtensionNs="com.intellij">
        <postStartupActivity
                implementation="com.github.continuedev.continueintellijextension.activities.ContinuePluginStartupActivity"/>
        <applicationConfigurable
                parentId="tools"
                instance="com.github.continuedev.continueintellijextension.services.ContinueExtensionConfigurable"
                id="com.github.continuedev.continueintellijextension.services.ContinueExtensionConfigurable"
                displayName="Continue"/>
        <applicationService
                serviceImplementation="com.github.continuedev.continueintellijextension.services.ContinueExtensionSettings"/>
    </extensions>

    <actions>
        <action class="com.github.continuedev.continueintellijextension.editor.InlineEditAction"
                id="continue.inlineEdit"
                description="Inline Edit"
                text="Inline Edit">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="ctrl I"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="meta I"/>
            <override-text place="GoToAction" text="Continue: Edit Code"/>
        </action>

        <action id="continue.acceptDiff"
                class="com.github.continuedev.continueintellijextension.actions.AcceptDiffAction"
                text="Accept Diff" description="Accept Diff">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="shift ctrl ENTER"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="shift meta ENTER"/>
            <override-text place="GoToAction" text="Continue: Accept Diff"/>
        </action>

        <action id="continue.rejectDiff"
                class="com.github.continuedev.continueintellijextension.actions.RejectDiffAction"
                text="Reject Diff" description="Reject Diff">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="shift ctrl DELETE"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="shift meta DELETE"/>
            <override-text place="GoToAction" text="Continue: Reject Diff"/>
        </action>

        <action id="continue.acceptVerticalDiffBlock"
                class="com.github.continuedev.continueintellijextension.actions.AcceptDiffAction"
                text="Accept Diff" description="Accept Vertical Diff Block">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="alt shift Y"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="alt shift Y"/>
            <override-text place="GoToAction" text="Continue: Accept Vertical Diff Block"/>
        </action>

        <action id="continue.rejectVerticalDiffBlock"
                class="com.github.continuedev.continueintellijextension.actions.RejectDiffAction"
                text="Reject Diff" description="Reject Vertical Diff Block">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="alt shift N"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="alt shift N"/>
            <override-text place="GoToAction" text="Continue: Reject Vertical Diff Block"/>
        </action>

        <action id="continue.focusContinueInputWithoutClear"
                class="com.github.continuedev.continueintellijextension.actions.FocusContinueInputWithoutClearAction"
                text="Add selected code to context"
                description="Focus Continue Input With Edit">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="ctrl shift J"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="meta shift J"/>
            <override-text place="GoToAction" text="Continue: Add Highlighted Code to Context"/>
        </action>

        <action id="continue.newContinueSession"
                icon="AllIcons.General.Add"
                class="com.github.continuedev.continueintellijextension.actions.NewContinueSessionAction"
                text="New Session"
                description="New Session">

            <override-text place="GoToAction" text="New Session"/>
        </action>

        <action id="continue.viewHistory"
                icon="AllIcons.Vcs.History"
                class="com.github.continuedev.continueintellijextension.actions.ViewHistoryAction"
                text="View History"
                description="View History">
            <override-text place="GoToAction" text="View History"/>
        </action>

        <action id="continue.openConfigPage"
                class="com.github.continuedev.continueintellijextension.actions.OpenConfigAction"
                icon="AllIcons.General.GearPlain"
                text="Open Config"
                description="Open Config">
            <override-text place="GoToAction" text="Open Config"/>
        </action>

        <action id="continue.openMorePage"
                class="com.github.continuedev.continueintellijextension.actions.OpenMorePageAction"
                icon="AllIcons.Actions.MoreHorizontal"
                text="More"
                description="More">
            <override-text place="GoToAction" text="More"/>
        </action>

        <group id="ContinueSidebarActionsGroup">
            <reference ref="continue.newContinueSession"/>
            <reference ref="continue.viewHistory"/>
            <reference ref="continue.openConfigPage"/>
            <reference ref="continue.openMorePage"/>
        </group>

        <action id="continue.focusContinueInput"
                class="com.github.continuedev.continueintellijextension.actions.FocusContinueInputAction"
                text="Add selected code to context"
                description="Focus Continue Input">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="ctrl J"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="meta J"/>
            <add-to-group group-id="EditorPopupMenu"/>
            <override-text place="GoToAction" text="Continue: Add Highlighted Code to Context and Clear Chat"/>
        </action>

        <action id="com.github.continuedev.continueintellijextension.autocomplete.AcceptAutocompleteAction"
                class="com.github.continuedev.continueintellijextension.autocomplete.AcceptAutocompleteAction"
                text="Accept Autocomplete Suggestion" description="Accept Autocomplete Suggestion">
            <keyboard-shortcut keymap="$default" first-keystroke="TAB"/>
            <keyboard-shortcut keymap="Mac OS X" first-keystroke="TAB"/>
        </action>

        <action id="com.github.continuedev.continueintellijextension.autocomplete.CancelAutocompleteAction"
                class="com.github.continuedev.continueintellijextension.autocomplete.CancelAutocompleteAction"
                text="Cancel Autocomplete Suggestion" description="Cancel Autocomplete Suggestion">
            <keyboard-shortcut keymap="$default" first-keystroke="ESCAPE"/>
        </action>

        <action id="com.github.continuedev.continueintellijextension.autocomplete.PartialAcceptAutocompleteAction"
                class="com.github.continuedev.continueintellijextension.autocomplete.PartialAcceptAutocompleteAction"
                text="Partial Accept Autocomplete Suggestion"
                description="Partial Accept Autocomplete Suggestion">
            <keyboard-shortcut first-keystroke="control alt RIGHT" keymap="$default"/>
            <keyboard-shortcut first-keystroke="alt meta RIGHT" keymap="Mac OS X"/>
        </action>
    </actions>
</idea-plugin>
""")


def update_vscode(name: str,
                  version="1.0.0",
                  author="AutoOpenai",
                  icon="media/codeflux",
                  publisher="AutoOpenai",
                  displayName="CodeFlux - 代码生成",
                  description="本地化代码生成器"):
    shutil.copy(f"{icon}/icon.png", "./extensions/vscode/media/icon.png")
    shutil.copy(f"{icon}/sidebar-icon.png",
                "./extensions/vscode/media/sidebar-icon.png")
    shutil.copy(f"{icon}/MainLogoIcon.tsx",
                "./gui/src/components/svg/MainLogoIcon.tsx")
    with open("./extensions/vscode/package.json", "r", encoding="utf-8") as f:
        package = json.load(f)
    package["name"] = name
    package["displayName"] = displayName
    package["description"] = description
    package["version"] = version
    package["publisher"] = publisher
    package["author"] = author
    package["contributes"]["title"] = name
    package["contributes"]["submenus"] = [
        {
            "id": "continue.continueSubMenu",
            "label": name
        }
    ]
    with open("./extensions/vscode/package.json", "w") as f:
        json.dump(package, f, indent=4)
    return


def update_jetbrains(name: str,
                     version="1.0.0",
                     author="AutoOpenai",
                     icon="media/codeflux",
                     publisher="AutoOpenai",
                     displayName="CodeFlux - 代码生成 Cursor",
                     description="本地化代码生成器"):
    shutil.copy(
        f"{icon}/icon.svg", "extensions/intellij/src/main/resources/tool-window-icon.svg")
    shutil.copy(
        f"{icon}/icon.svg", "extensions/intellij/src/main/resources/tool-window-icon_dark.svg")
    shutil.copy(
        f"{icon}/icon.svg", "extensions/intellij/src/main/resources/META-INF/pluginIcon.svg")
    shutil.copy(
        f"{icon}/icon.svg", "extensions/intellij/src/main/resources/META-INF/pluginIcon_dark.svg")
    shutil.copy(
            f"{icon}/icon.svg", "extensions/intellij/src/main/resources/icons/continue.svg")
    shutil.copy(f"{icon}/MainLogoIcon.tsx",
                "./gui/src/components/svg/MainLogoIcon.tsx")
    set_gradle(name, version)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ide_type", type=str,
                        default="vscode", choices=["vscode", "jetbrains"])
    parser.add_argument("--product_name", type=str, default="CodeFlux")
    parser.add_argument("--action", type=str, default="build",
                        choices=["build", "install"])
    parser.add_argument("--dry", action="store_true", default=False)
    args = parser.parse_args()

    if args.dry:
        update_vscode(**config[args.product_name])
        update_jetbrains(**config[args.product_name])
        return

    if args.ide_type == "vscode":
        if args.action == "build":
            update_vscode(**config[args.product_name])
            os.system("cd ./core && npm run build:npm")
            os.system(
                "cd ./extensions/vscode && npm run tsc && npm run e2e:build")

        elif args.action == "install":
            os.system("cd ./gui && npm install")
            os.system("cd ./core && npm install")
            os.system("cd ./binary && npm install")
            os.system("cd ./extensions/vscode && npm install")

    elif args.ide_type == "jetbrains":
        update_jetbrains(**config[args.product_name])
        os.system("cd ./extensions/intellij && gradlew.bat buildPlugin")


if __name__ == "__main__":
    main()
