package com.github.puhua.codeflux.`codeflux`

import com.github.puhua.codeflux.activities.CodeFluxPluginStartupActivity
import com.github.puhua.codeflux.constants.getCodeFluxGlobalPath
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.io.StreamUtil
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFile
import com.jetbrains.jsonSchema.extension.JsonSchemaFileProvider
import com.jetbrains.jsonSchema.extension.JsonSchemaProviderFactory
import com.jetbrains.jsonSchema.extension.SchemaType
import java.io.File
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.nio.file.Paths

class ConfigRcJsonSchemaProviderFactory : JsonSchemaProviderFactory {
    override fun getProviders(project: Project): MutableList<JsonSchemaFileProvider> {
        return mutableListOf(ConfigRcJsonSchemaFileProvider())
    }
}

class ConfigRcJsonSchemaFileProvider : JsonSchemaFileProvider {
    override fun isAvailable(file: VirtualFile): Boolean {
        return file.name == ".codefluxrc.json"
    }

    override fun getName(): String {
        return ".codefluxrc.json"
    }

    override fun getSchemaFile(): VirtualFile? {
        CodeFluxPluginStartupActivity::class.java.getClassLoader().getResourceAsStream("codeflux_rc_schema.json")
            .use { `is` ->
                if (`is` == null) {
                    throw IOException("Resource not found: codeflux_rc_schema.json")
                }
                val content = StreamUtil.readText(`is`, StandardCharsets.UTF_8)
                val filepath = Paths.get(getCodeFluxGlobalPath(), "codeflux_rc_schema.json").toString()
                File(filepath).writeText(content)
                return LocalFileSystem.getInstance().findFileByPath(filepath)
            }
    }

    override fun getSchemaType(): SchemaType {
        return SchemaType.embeddedSchema
    }

}
