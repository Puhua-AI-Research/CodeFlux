/**
 * Note: This file is out of sync with the contents of core/util/paths.ts, which we use in VS Code.
 * This is potentially causing JetBrains specific bugs.
 */
package com.github.puhua.codeflux.constants

import java.nio.file.Files
import java.nio.file.Paths

// Uncertain if this is being used anywhere since we also attempt to write a default config in
// core/util/paths.ts
const val DEFAULT_CONFIG =
    """
{
  "models": [
    {
      "model": "claude-3-5-sonnet-latest",
      "provider": "anthropic",
      "apiKey": "",
      "title": "Claude 3.5 Sonnet"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Codestral",
    "provider": "mistral",
    "model": "codestral-latest",
    "apiKey": "" 
  },
  "customCommands": [
    {
      "name": "test",
      "prompt": "{{{ input }}}\n\nWrite a comprehensive set of unit tests for the selected code. It should setup, run tests that check for correctness including important edge cases, and teardown. Ensure that the tests are complete and sophisticated. Give the tests just as chat output, don't edit any file.",
      "description": "Write unit tests for highlighted code"
    }
  ],
  "contextProviders": [
    {
      "name": "diff",
      "params": {}
    },
    {
      "name": "folder",
      "params": {}
    },
    {
      "name": "codebase",
      "params": {}
    }
  ],
  "slashCommands": [
    {
      "name": "share",
      "description": "Export the current chat session to markdown"
    },
    {
      "name": "commit",
      "description": "Generate a git commit message"
    }
  ],
  "docs": []
}
"""

const val DEFAULT_CONFIG_JS =
    """
function modifyConfig(config) {
  return config;
}
export {
  modifyConfig
};
"""

fun getCodeFluxGlobalPath(): String {
  val codefluxPath = Paths.get(System.getProperty("user.home"), ".codeflux")
  if (Files.notExists(codefluxPath)) {
    Files.createDirectories(codefluxPath)
  }
  return codefluxPath.toString()
}

fun getCodeFluxRemoteConfigPath(remoteHostname: String): String {
  val path = Paths.get(getCodeFluxGlobalPath(), ".configs")
  if (Files.notExists(path)) {
    Files.createDirectories(path)
  }
  return Paths.get(path.toString(), remoteHostname).toString()
}

fun getConfigJsonPath(remoteHostname: String? = null): String {
  val path =
      Paths.get(
          if (remoteHostname != null) getCodeFluxRemoteConfigPath(remoteHostname)
          else getCodeFluxGlobalPath(),
          "config.json")
  if (Files.notExists(path)) {
    Files.createFile(path)
    Files.writeString(path, if (remoteHostname == null) DEFAULT_CONFIG else "{}")
  }
  return path.toString()
}

fun getConfigJsPath(remoteHostname: String? = null): String {
  val path =
      Paths.get(
          if (remoteHostname != null) getCodeFluxRemoteConfigPath(remoteHostname)
          else getCodeFluxGlobalPath(),
          "config.js")
  if (Files.notExists(path)) {
    Files.createFile(path)
    Files.writeString(path, DEFAULT_CONFIG_JS)
  }
  return path.toString()
}

fun getSessionsDir(): String {
  val path = Paths.get(getCodeFluxGlobalPath(), "sessions")
  if (Files.notExists(path)) {
    Files.createDirectories(path)
  }
  return path.toString()
}

fun getSessionsListPath(): String {
  val path = Paths.get(getSessionsDir(), "sessions.json")
  if (Files.notExists(path)) {
    Files.createFile(path)
    Files.writeString(path, "[]")
  }
  return path.toString()
}

fun getSessionFilePath(sessionId: String): String {
  val path = Paths.get(getSessionsDir(), "$sessionId.json")
  if (Files.notExists(path)) {
    Files.createFile(path)
    Files.writeString(path, "{}")
  }
  return path.toString()
}
