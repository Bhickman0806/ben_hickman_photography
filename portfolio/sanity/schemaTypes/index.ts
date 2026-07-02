import { photo } from './photo'
import { collection } from './collection'
import { page } from './page'
import { siteSettings } from './siteSettings'
import { essay } from './essay'
import { poem } from './poem'
import { spreadLayoutTypes } from './spreadLayouts'

export const schemaTypes = [photo, collection, ...spreadLayoutTypes, page, siteSettings, essay, poem]
