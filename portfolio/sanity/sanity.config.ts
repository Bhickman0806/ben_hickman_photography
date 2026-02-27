import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

import { structure } from './deskStructure'

export default defineConfig([
  {
    name: 'production',
    title: 'Production - Ben Hickman Photography',
    projectId: '6xolgh7z',
    dataset: 'production',
    basePath: '/production',
    plugins: [structureTool({ structure }), visionTool()],
    schema: {
      types: schemaTypes,
    },
  },
  {
    name: 'staging',
    title: 'Staging - Ben Hickman Photography',
    projectId: '6xolgh7z',
    dataset: 'staging',
    basePath: '/staging',
    plugins: [structureTool({ structure }), visionTool()],
    schema: {
      types: schemaTypes,
    },
  }
])
