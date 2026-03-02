export default defineEventHandler(async () => {
  for (const name of [
    'migration-meta',
    // Add your domain storage namespaces here
  ]) {
    const storage = useStorage(name)
    const keys = await storage.getKeys()
    for (const key of keys) await storage.removeItem(key)
  }
  return { status: 200, message: 'Database reset' }
})
