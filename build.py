import json
import argparse
import os
import shutil
import glob
import subprocess
import platform

# https://microsoft.github.io/vscode-codicons/dist/codicon.html

# CodeFlux
# python build.py --product_name=CodeFlux --dry
# python3 build.py --ide_type=vscode --product_name=CodeFlux --action=install
# python3 build.py --ide_type=vscode --product_name=CodeFlux --action=build
# python3 build.py --ide_type=vscode --product_name=CodeFlux --action=build_all
# python3 build.py --ide_type=vscode --product_name=CodeFlux --action=publish_vsix
# python3 build.py --ide_type=jetbrains --product_name=CodeFlux


# 注意配置时需要png,svg 都需要

config = {
    "CodeFlux": {
        "name": "CodeFlux",
        "displayName": "CodeFlux - Code Generator",
        "description": "CodeFlux 是一款基于人工智能的代码生成工具，旨在帮助开发者快速生成高质量、可维护的代码，显著提升开发效率并减少重复性劳动",
        "icon": "media/codeflux",
        "publisher": "Puhua",
        "author": "Puhua",
        "version": "1.1.2"
    }
}

# 对于jetbrains 需要全局修改 pluginID=com.github.puhua.codeflux
# 将目录也要对应修改
# com/github/puhua/codeflux 也要修改


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

    with open("extensions/intellij/src/main/kotlin/com/github/puhua/codeflux/autocomplete/AutocompleteSpinnerWidgetFactory.kt", "w", encoding="utf-8") as f:
        f.write("""
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
        return if (enabled) "XXXXXXXXXXX autocomplete enabled" else "XXXXXXXXXXX autocomplete disabled"
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
    <id>com.github.puhua.codeflux</id>
    <name>{name}</name>
    <vendor url="https://www.codeflux.dev/">{name}</vendor>
    <change-notes>
        <![CDATA[View the latest release notes on <a href="https://github.com/Puhua-AI-Research/CodeFlux-Extention/releases">GitHub</a>]]></change-notes>

    <depends>com.intellij.modules.platform</depends>

    <!-- See here for why this is optional:  https://github.com/codefluxdev/codeflux/issues/2775#issuecomment-2535620877-->
    <depends optional="true" config-file="codefluxintellijextension-withJSON.xml">
        com.intellij.modules.json
    </depends>

    <!-- com.intellij.openapi.module.ModuleManager.Companion is only available since this build -->
    <idea-version since-build="223.7571.182"/>

    <extensions defaultExtensionNs="com.intellij">
        <editorFactoryListener
                implementation="com.github.puhua.codeflux.autocomplete.AutocompleteEditorListener"/>
        <toolWindow id="{name}" anchor="right" icon="/tool-window-icon.svg"
                    factoryClass="com.github.puhua.codeflux.toolWindow.CodeFluxPluginToolWindowFactory"/>
        <projectService id="CodeFluxPluginService"
                        serviceImplementation="com.github.puhua.codeflux.services.CodeFluxPluginService"/>
        <projectService
                id="DiffStreamService"
                serviceImplementation="com.github.puhua.codeflux.editor.DiffStreamService"/>
        <projectService
                id="AutocompleteLookupListener"
                serviceImplementation="com.github.puhua.codeflux.autocomplete.AutocompleteLookupListener"/>
        <statusBarWidgetFactory
                implementation="com.github.puhua.codeflux.autocomplete.AutocompleteSpinnerWidgetFactory"
                id="AutocompleteSpinnerWidget"/>
        <notificationGroup id="CodeFlux"
                           displayType="BALLOON"/>
        <actionPromoter order="last"
                        implementation="com.github.puhua.codeflux.actions.CodeFluxActionPromote"/>
    </extensions>

    <resource-bundle>messages.MyBundle</resource-bundle>

    <extensions defaultExtensionNs="com.intellij">
        <postStartupActivity
                implementation="com.github.puhua.codeflux.activities.CodeFluxPluginStartupActivity"/>
        <applicationConfigurable
                parentId="tools"
                instance="com.github.puhua.codeflux.services.CodeFluxExtensionConfigurable"
                id="com.github.puhua.codeflux.services.CodeFluxExtensionConfigurable"
                displayName="CodeFlux"/>
        <applicationService
                serviceImplementation="com.github.puhua.codeflux.services.CodeFluxExtensionSettings"/>
    </extensions>

    <actions>
        <action class="com.github.puhua.codeflux.editor.InlineEditAction"
                id="codeflux.inlineEdit"
                description="Inline Edit"
                text="Inline Edit">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="ctrl I"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="meta I"/>
            <override-text place="GoToAction" text="CodeFlux: Edit Code"/>
        </action>

        <action id="codeflux.acceptDiff"
                class="com.github.puhua.codeflux.actions.AcceptDiffAction"
                text="Accept Diff" description="Accept Diff">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="shift ctrl ENTER"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="shift meta ENTER"/>
            <override-text place="GoToAction" text="CodeFlux: Accept Diff"/>
        </action>

        <action id="codeflux.rejectDiff"
                class="com.github.puhua.codeflux.actions.RejectDiffAction"
                text="Reject Diff" description="Reject Diff">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="shift ctrl DELETE"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="shift meta DELETE"/>
            <override-text place="GoToAction" text="CodeFlux: Reject Diff"/>
        </action>

        <action id="codeflux.acceptVerticalDiffBlock"
                class="com.github.puhua.codeflux.actions.AcceptDiffAction"
                text="Accept Diff" description="Accept Vertical Diff Block">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="alt shift Y"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="alt shift Y"/>
            <override-text place="GoToAction" text="CodeFlux: Accept Vertical Diff Block"/>
        </action>

        <action id="codeflux.rejectVerticalDiffBlock"
                class="com.github.puhua.codeflux.actions.RejectDiffAction"
                text="Reject Diff" description="Reject Vertical Diff Block">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="alt shift N"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="alt shift N"/>
            <override-text place="GoToAction" text="CodeFlux: Reject Vertical Diff Block"/>
        </action>

        <action id="codeflux.focusCodeFluxInputWithoutClear"
                class="com.github.puhua.codeflux.actions.FocusCodeFluxInputWithoutClearAction"
                text="Add selected code to context"
                description="Focus CodeFlux Input With Edit">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="ctrl shift J"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="meta shift J"/>
            <override-text place="GoToAction" text="CodeFlux: Add Highlighted Code to Context"/>
        </action>

        <action id="codeflux.newCodeFluxSession"
                icon="AllIcons.General.Add"
                class="com.github.puhua.codeflux.actions.NewCodeFluxSessionAction"
                text="New Session"
                description="New Session">

            <override-text place="GoToAction" text="New Session"/>
        </action>

        <action id="codeflux.viewHistory"
                icon="AllIcons.Vcs.History"
                class="com.github.puhua.codeflux.actions.ViewHistoryAction"
                text="View History"
                description="View History">
            <override-text place="GoToAction" text="View History"/>
        </action>

        <action id="codeflux.openConfigPage"
                class="com.github.puhua.codeflux.actions.OpenConfigAction"
                icon="AllIcons.General.GearPlain"
                text="Open Config"
                description="Open Config">
            <override-text place="GoToAction" text="Open Config"/>
        </action>

        <action id="codeflux.openMorePage"
                class="com.github.puhua.codeflux.actions.OpenMorePageAction"
                icon="AllIcons.Actions.MoreHorizontal"
                text="More"
                description="More">
            <override-text place="GoToAction" text="More"/>
        </action>

        <group id="CodeFluxSidebarActionsGroup">
        </group>

        <action id="codeflux.focusCodeFluxInput"
                class="com.github.puhua.codeflux.actions.FocusCodeFluxInputAction"
                text="Add selected code to context"
                description="Focus CodeFlux Input">
            <keyboard-shortcut keymap="$default"
                               first-keystroke="ctrl J"/>
            <keyboard-shortcut keymap="Mac OS X"
                               first-keystroke="meta J"/>
            <add-to-group group-id="EditorPopupMenu"/>
            <override-text place="GoToAction" text="CodeFlux: Add Highlighted Code to Context and Clear Chat"/>
        </action>

        <action id="com.github.puhua.codeflux.autocomplete.AcceptAutocompleteAction"
                class="com.github.puhua.codeflux.autocomplete.AcceptAutocompleteAction"
                text="Accept Autocomplete Suggestion" description="Accept Autocomplete Suggestion">
            <keyboard-shortcut keymap="$default" first-keystroke="TAB"/>
            <keyboard-shortcut keymap="Mac OS X" first-keystroke="TAB"/>
        </action>

        <action id="com.github.puhua.codeflux.autocomplete.CancelAutocompleteAction"
                class="com.github.puhua.codeflux.autocomplete.CancelAutocompleteAction"
                text="Cancel Autocomplete Suggestion" description="Cancel Autocomplete Suggestion">
            <keyboard-shortcut keymap="$default" first-keystroke="ESCAPE"/>
        </action>

        <action id="com.github.puhua.codeflux.autocomplete.PartialAcceptAutocompleteAction"
                class="com.github.puhua.codeflux.autocomplete.PartialAcceptAutocompleteAction"
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
            "id": "codeflux.codefluxSubMenu",
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
        f"{icon}/icon.svg", "extensions/intellij/src/main/resources/icons/codeflux.svg")
    shutil.copy(f"{icon}/MainLogoIcon.tsx",
                "./gui/src/components/svg/MainLogoIcon.tsx")
    set_gradle(name, version)


def publish_vsix_files(product_name, vsix_dir="./extensions/vscode/build"):
    """
    遍历指定目录中的所有VSIX文件并逐个发布

    Args:
        product_name: 产品名称前缀
        vsix_dir: VSIX文件所在目录

    Returns:
        bool: 是否成功发布至少一个文件
    """
    # 确保目录存在
    if not os.path.exists(vsix_dir):
        print(f"目录不存在: {vsix_dir}")
        return False

    # 获取目录中所有的VSIX文件
    vsix_pattern = os.path.join(vsix_dir, f"{product_name}*.vsix")
    all_vsix_files = glob.glob(vsix_pattern)

    if not all_vsix_files:
        print(f"未找到匹配的VSIX文件: {vsix_pattern}")
        return False

    print(f"找到 {len(all_vsix_files)} 个VSIX文件:")
    for file in all_vsix_files:
        print(f"  - {os.path.basename(file)}")

    # 一个一个地发布VSIX文件
    success_count = 0
    for vsix_file in all_vsix_files:
        file_name = os.path.basename(vsix_file)
        print(f"\n正在发布: {file_name}...")

        try:
            # 使用subprocess运行vsce命令
            result = subprocess.run(
                ["vsce", "publish", "--packagePath", vsix_file],
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode == 0:
                print(f"✅ 成功发布: {file_name}")
                success_count += 1
            else:
                print(f"❌ 发布失败: {file_name}")
                print(f"错误信息: {result.stderr}")
        except Exception as e:
            print(f"❌ 发布过程中出错: {str(e)}")

    print(f"\n发布总结: 成功 {success_count}/{len(all_vsix_files)} 个文件")
    return success_count > 0


def get_gradle_command():
    """Get the appropriate gradle command based on the platform"""
    if platform.system() == "Windows":
        return "gradlew.bat"
    return "./gradlew"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ide_type", type=str,
                        default="vscode", choices=["vscode", "jetbrains"])
    parser.add_argument("--product_name", type=str, default="CodeFlux")
    parser.add_argument("--action", type=str, default="build",
                        choices=["build", "install", "build_all", "publish_vsix"])
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

        elif args.action == "build_all":
            update_vscode(**config[args.product_name])
            os.system("cd ./core && npm run build:npm")
            os.system(
                "cd ./extensions/vscode && npm run tsc && npm run package-all")
        elif args.action == "publish_vsix":
            if os.environ.get("VSCE_PAT"):
                # npm install vsce -g
                publish_vsix_files(args.product_name)
            else:
                print("请设置环境变量 VSCE_PAT")

        elif args.action == "install":
            os.system("cd ./gui && npm install")
            os.system("cd ./core && npm install")
            os.system("cd ./binary && npm install")
            os.system("cd ./extensions/vscode && npm install")

    elif args.ide_type == "jetbrains":
        update_jetbrains(**config[args.product_name])
        gradle_cmd = get_gradle_command()
        print(f"Using gradle command: {gradle_cmd}")
        os.system("cd ./core && npm run build:npm")
        os.system("cd ./binary && npm run build")
        os.system(f"cd ./extensions/intellij && {gradle_cmd} clean buildPlugin --no-build-cache")


if __name__ == "__main__":
    main()
