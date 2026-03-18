/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.pob.analysis',
  productName: 'PoB Analysis',
  copyright: 'MIT',
  directories: {
    output: 'dist-release',
    buildResources: 'build'
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*'
  ],
  extraResources: [
    { from: 'resources/luajit/', to: 'luajit/', filter: ['**/*'] },
    { from: 'resources/pob-src/', to: 'pob-src/', filter: ['**/*.lua', '**/*.txt', '**/*.bin', '**/*.zip', '**/*.zip.*', '**/*.png', '**/*.jpg', '**/*.webp', '**/*.csv', '**/*.dll', '**/*.so'] },
    { from: 'resources/pob-runtime/lua/', to: 'pob-runtime/lua/', filter: ['**/*'] }
  ],
  asar: true,
  mac: {
    target: [
      { target: 'dmg', arch: ['arm64'] }
    ],
    icon: 'build/icon.icns',
    category: 'public.app-category.utilities',
    hardenedRuntime: false,
    gatekeeperAssess: false,
    artifactName: '${productName}-${version}-mac-${arch}.${ext}'
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] }
    ],
    icon: 'build/icon.png',
    artifactName: '${productName}-Setup-${version}.${ext}'
  },
  nsis: {
    oneClick: true,
    perMachine: false,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'PoB Analysis',
    runAfterFinish: true,
    deleteAppDataOnUninstall: true
  },
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] }
    ],
    icon: 'build/icon.png',
    category: 'Utility',
    artifactName: '${productName}-${version}-linux-${arch}.${ext}'
  }
}

module.exports = config
