import ReadingCheckPage from './reading-check/ReadingCheckPage.vue'

export interface FeatureDefinition {
  key: string
  name: string
  path: string
  component: any
  auth?: boolean
  roles?: string[]
}

export const featureRegistry: Record<string, FeatureDefinition> = {
  'reading-check': {
    key: 'reading-check',
    name: '독서 진단',
    path: '/reading-check',
    component: ReadingCheckPage,
  },
}

export function featureByPath(path: string) {
  return Object.values(featureRegistry).find(feature => feature.path === path)
}
