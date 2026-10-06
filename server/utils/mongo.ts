import os from 'node:os'
import { MongoClient, type Db } from 'mongodb'

let clientPromise: Promise<MongoClient> | null = null

function envValue(...values: unknown[]) {
  return values.map(value => String(value || '').trim()).find(Boolean) || ''
}

/**
 * Supports both the new URI form and the existing InsureDesign-style env names:
 * MONGODB_ADDR, MONGO_USERNAME, MONGO_PWD, MONGO_DBNAME.
 * Credentials are encoded here so characters such as `~`, `@`, `:` and `/`
 * cannot corrupt the connection string.
 */
export function buildMongoConnectionOptions() {
  const config = useRuntimeConfig()
  const directUri = envValue(process.env.NUXT_MONGODB_URI, process.env.MONGODB_URI, config.mongodbUri)
  const address = envValue(process.env.NUXT_MONGODB_ADDR, process.env.MONGODB_ADDR, config.mongodbAddr)
  const username = envValue(process.env.NUXT_MONGO_USERNAME, process.env.MONGO_USERNAME, config.mongoUsername)
  const password = envValue(process.env.NUXT_MONGO_PWD, process.env.MONGO_PWD, config.mongoPassword)
  const database = envValue(
    process.env.NUXT_MONGODB_DB_NAME,
    process.env.MONGODB_DB_NAME,
    process.env.NUXT_MONGO_DBNAME,
    process.env.MONGO_DBNAME,
    config.mongodbDbName,
  )

  let uri = directUri
  if (!uri) {
    if (!address) throw new Error('Missing MONGODB_URI or MONGODB_ADDR')
    uri = /^mongodb(?:\+srv)?:\/\//i.test(address) ? address : `mongodb://${address}`
    if (username && password && !uri.includes('@')) {
      uri = uri.replace(
        /^(mongodb(?:\+srv)?:\/\/)/i,
        `$1${encodeURIComponent(username)}:${encodeURIComponent(password)}@`,
      )
    }
  }
  if (!database) throw new Error('Missing MONGODB_DB_NAME or MONGO_DBNAME')

  return {
    uri,
    database,
    username,
    hasPassword: Boolean(password),
  }
}

export async function useDb(): Promise<Db> {
  const { uri, database } = buildMongoConnectionOptions()
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      appName: 'multisite-cms',
      connectTimeoutMS: 10_000,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
      // mongodb 7.4+ falls back to `require('os')`, which does not exist in the
      // ESM production bundle; hand it the module explicitly.
      runtimeAdapters: { os },
    })
    clientPromise = client.connect().catch((error) => {
      clientPromise = null
      throw error
    })
  }
  const client = await clientPromise
  return client.db(database)
}
