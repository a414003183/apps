// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
// monorepo root: apps/projects/mobile -> apps (workspace root)
const workspaceRoot = path.resolve(projectRoot, '../../..')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

// Resolve the JS entry file relative to the mobile package root, not the
// monorepo workspace root. This is required because Expo's default config
// sets server.unstable_serverRoot to the workspace root in pnpm monorepos.
config.server = {
  ...config.server,
  unstable_serverRoot: projectRoot,
}

// Watch all files within the monorepo workspace so Metro can resolve
// workspace packages and shared modules. Project root is listed first
// so relative entry-file paths resolve against the mobile package.
// 同时把 pnpm 依赖的物理存储目录也加进来，避免真机打包时 Metro 解析到项目根目录外。
const realNodeModulesRoot = path.resolve('C:/Users/41400/p/apps/node_modules')
config.watchFolders = [projectRoot, workspaceRoot, realNodeModulesRoot]

// Make sure Metro looks for dependencies in the mobile package first,
// then falls back to the workspace root (pnpm hoisted virtual store).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  realNodeModulesRoot,
]

// Disable the Metro warning about symlinks in pnpm monorepos.
config.resolver.unstable_enableSymlinks = true

module.exports = config
