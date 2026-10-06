export function mongoConnectionFromEnv(env = process.env) {
  const value = (...keys) => keys.map(key => String(env[key] || '').trim()).find(Boolean) || ''
  const directUri = value('MONGODB_URI', 'NUXT_MONGODB_URI')
  const address = value('MONGODB_ADDR', 'NUXT_MONGODB_ADDR')
  const username = value('MONGO_USERNAME', 'NUXT_MONGO_USERNAME')
  const password = value('MONGO_PWD', 'NUXT_MONGO_PWD')
  const database = value('MONGODB_DB_NAME', 'MONGO_DBNAME', 'NUXT_MONGODB_DB_NAME', 'NUXT_MONGO_DBNAME')
  let uri = directUri
  if (!uri) {
    if (!address) throw new Error('Missing MONGODB_URI or MONGODB_ADDR')
    uri = /^mongodb(?:\+srv)?:\/\//i.test(address) ? address : `mongodb://${address}`
    if (username && password && !uri.includes('@')) {
      uri = uri.replace(/^(mongodb(?:\+srv)?:\/\/)/i, `$1${encodeURIComponent(username)}:${encodeURIComponent(password)}@`)
    }
  }
  if (!database) throw new Error('Missing MONGODB_DB_NAME or MONGO_DBNAME')
  return { uri, database }
}
