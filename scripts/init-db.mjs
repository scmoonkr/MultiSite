import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { mongoConnectionFromEnv } from './mongo-config.mjs'

const { uri, database } = mongoConnectionFromEnv()
const client = new MongoClient(uri, { appName: 'multisite-cms-init', serverSelectionTimeoutMS: 10000 })
const db = client.db(database)

try {
  await client.connect()
  await Promise.all([
    db.collection('sites').createIndex({ siteId: 1 }, { unique: true, name: 'site_id_unique' }),
    db.collection('sites').createIndex({ domains: 1 }, { unique: true, name: 'site_domain_unique' }),
    db.collection('contents').createIndex({ siteId: 1, slug: 1 }, { unique: true, name: 'content_site_slug_unique' }),
    db.collection('contents').createIndex({ siteId: 1, contentType: 1, status: 1, publishedAt: -1 }, { name: 'content_public_list' }),
    db.collection('contents').createIndex({ siteId: 1, categoryIds: 1, publishedAt: -1 }, { name: 'content_category' }),
    db.collection('contents').createIndex({ siteId: 1, tagIds: 1, publishedAt: -1 }, { name: 'content_tag' }),
    db.collection('categories').createIndex({ siteId: 1, slug: 1 }, { unique: true, name: 'category_site_slug_unique' }),
    db.collection('categories').createIndex({ siteId: 1, parentId: 1 }, { name: 'category_site_parent' }),
    db.collection('media').createIndex({ siteId: 1, createdAt: -1 }, { name: 'media_site_recent' }),
    db.collection('tags').createIndex({ siteId: 1, slug: 1 }, { unique: true, name: 'tag_site_slug_unique' }),
    db.collection('menus').createIndex({ siteId: 1, location: 1 }, { unique: true, name: 'menu_site_location_unique' }),
    db.collection('redirects').createIndex({ siteId: 1, fromPath: 1 }, { unique: true, name: 'redirect_site_path_unique' }),
  ])
  console.log('MongoDB indexes are ready.')
} finally {
  await client.close()
}
