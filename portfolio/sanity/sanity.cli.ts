import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '6xolgh7z',
    dataset: 'production'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    appId: 'mj2rrt2w1w92bg6itk6f59fu',
  },
  vite: (config) => {
    return {
      ...config,
      esbuild: {
        ...config.esbuild,
        jsxInject: `import React from 'react'`,
      },
    }
  }
})
