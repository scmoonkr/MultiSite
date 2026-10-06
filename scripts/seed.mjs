import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { mongoConnectionFromEnv } from './mongo-config.mjs'

const { uri, database } = mongoConnectionFromEnv()
const client = new MongoClient(uri, { appName: 'multisite-cms-seed', serverSelectionTimeoutMS: 10000 })
const db = client.db(database)
const now = new Date()

const sites = [
  {
    siteId: 'readfit', name: 'ReadFit', description: '나에게 맞는 독서 경험을 발견하는 공간',
    domains: ['readfit.localhost', 'localhost'], primaryDomain: 'readfit.localhost', status: 'active',
    enabledFeatures: ['reading-check'], theme: { primary: '#153b57', accent: '#c57942', background: '#fffdf8', text: '#172126' },
  },
  {
    siteId: 'community', name: 'Community Notes', description: '사람과 이야기가 만나는 작은 기록 보관소',
    domains: ['community.localhost'], primaryDomain: 'community.localhost', status: 'active', enabledFeatures: [],
    theme: { primary: '#23382d', accent: '#b28b45', background: '#fbfcf8', text: '#18201b' },
  },
]

try {
  await client.connect()
  for (const site of sites) {
    await db.collection('sites').updateOne({ siteId: site.siteId }, { $set: { ...site, updatedAt: now, isDeleted: false }, $setOnInsert: { createdAt: now } }, { upsert: true })
    const categoryName = site.siteId === 'readfit' ? '독서 이야기' : '소식'
    await db.collection('categories').updateOne(
      { siteId: site.siteId, slug: 'stories' },
      { $set: { name: categoryName, description: `${site.name}의 주요 이야기`, order: 1, updatedAt: now, isDeleted: false }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    )
    const category = await db.collection('categories').findOne({ siteId: site.siteId, slug: 'stories' })
    const welcome = `# ${site.name}에 오신 것을 환영합니다\n\n이 글은 **${site.siteId}** 사이트에만 속하는 콘텐츠입니다.\n\n:::notice\n모든 공개 API는 요청 도메인으로 사이트를 결정합니다.\n:::`
    await db.collection('contents').updateOne(
      { siteId: site.siteId, slug: 'welcome' },
      { $set: { contentType: 'post', title: `${site.name} 시작하기`, summary: site.description, markdown: welcome, template: 'default', categoryIds: [String(category._id)], tagIds: [], status: 'published', visibility: 'public', publishedAt: now, updatedAt: now, isDeleted: false, meta: {} }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    )
    const about = `# ${site.name}\n\n${site.description}\n\n하나의 코드베이스와 공통 CMS를 사용하지만 데이터와 디자인 설정은 사이트별로 분리됩니다.`
    await db.collection('contents').updateOne(
      { siteId: site.siteId, slug: 'about' },
      { $set: { contentType: 'page', title: '소개', summary: `${site.name} 소개`, markdown: about, template: 'default', categoryIds: [], tagIds: [], status: 'published', visibility: 'public', publishedAt: now, updatedAt: now, isDeleted: false, meta: {} }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    )
    const menu = [
      { id: 'posts', title: '글', type: 'url', url: '/posts' },
      { id: 'about', title: '소개', type: 'page', slug: 'about' },
      { id: 'categories', title: '카테고리', type: 'url', url: '/categories' },
    ]
    if (site.enabledFeatures.includes('reading-check')) menu.push({ id: 'reading-check', title: '독서 진단', type: 'feature', featureKey: 'reading-check' })
    await db.collection('menus').updateOne({ siteId: site.siteId, location: 'header' }, { $set: { name: 'Header', items: menu, updatedAt: now, isDeleted: false }, $setOnInsert: { createdAt: now } }, { upsert: true })
  }
  console.log('Sample sites, categories, contents, and menus are ready.')
} finally {
  await client.close()
}
