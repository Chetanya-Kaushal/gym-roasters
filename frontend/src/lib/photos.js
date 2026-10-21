// Progress photos stay on this device (IndexedDB), never in the synced state: a few photos
// would outgrow the per-person sync limit, and they are the most private thing in the app.
const DB = 'gym-photos', STORE = 'photos'
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1)
  r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' })
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
})
const tx = async (mode, fn) => {
  const db = await open()
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), out = fn(t.objectStore(STORE))
    t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error)
  })
}
export const listPhotos = async () => ((await tx('readonly', s => s.getAll())) || []).sort((a, b) => (a.d < b.d ? 1 : -1))
export const deletePhoto = id => tx('readwrite', s => s.delete(id))

// Downscale to 900 px on the long side as JPEG before storing.
export async function addPhoto(file, d) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height))
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * k), height: Math.round(bmp.height * k) })
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82))
  await tx('readwrite', s => s.put({ id: Date.now().toString(36), d, blob }))
}
