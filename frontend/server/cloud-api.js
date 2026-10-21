/* Cloud API for the hosted Gym Roasters (Vercel + Neon Postgres).
   The same contract as api/server.js for what the hosted app needs — passkey sign-up/sign-in,
   signed session cookies, and one saved state per person (plan, workouts, food, water, …) —
   with Postgres instead of JSON files, because serverless functions have no lasting disk.
   Self-hosting keeps using api/server.js; this file only runs in the Vercel deployment. */
import crypto from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse
} from '@simplewebauthn/server'

const RP_ID = process.env.RP_ID || 'gym-roasters.vercel.app'
const ORIGIN = process.env.ORIGIN || 'https://' + RP_ID
const RP_NAME = process.env.RP_NAME || 'Gym Roasters'
const SESSION_DAYS = Math.max(1, +(process.env.SESSION_DAYS || 90) || 90)
const MAX_STATE = 4 * 1024 * 1024   // Vercel Functions accept 4.5 MB request bodies

let _sql = null
const sql = () => (_sql ||= neon(process.env.DATABASE_URL))
let ready = null
// Tables are created on first use, so a fresh database needs no migration step.
const migrate = () => (ready ||= (async () => {
  const q = sql()
  await q`CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, name text NOT NULL, created timestamptz NOT NULL DEFAULT now(), sv int NOT NULL DEFAULT 0, disabled boolean NOT NULL DEFAULT false)`
  await q`CREATE TABLE IF NOT EXISTS creds (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, public_key text NOT NULL, counter bigint NOT NULL DEFAULT 0, transports jsonb NOT NULL DEFAULT '[]')`
  await q`CREATE TABLE IF NOT EXISTS states (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, state jsonb NOT NULL, updated timestamptz NOT NULL DEFAULT now())`
  await q`CREATE TABLE IF NOT EXISTS challenges (cid text PRIMARY KEY, data jsonb NOT NULL, exp bigint NOT NULL)`
})().catch(e => { ready = null; throw e }))

/* ---------- sessions: `<uid>:<expiry>:<version>` signed with HMAC (same scheme as api/server.js) ---------- */
const SECRET = () => {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET is not set')
  return s
}
const mac = p => crypto.createHmac('sha256', SECRET()).update(p).digest('base64url')
const sign = p => p + '.' + mac(p)
function verifySig(tok) {
  const i = tok.lastIndexOf('.')
  if (i < 0) return null
  const p = tok.slice(0, i), m = Buffer.from(tok.slice(i + 1)), e = Buffer.from(mac(p))
  return m.length === e.length && crypto.timingSafeEqual(m, e) ? p : null
}
const cookie = (v, age) => `gymsid=${v}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Lax`
const sessionCookie = u => cookie(sign(`${u.id}:${Date.now() + SESSION_DAYS * 86400000}:${u.sv || 0}`), SESSION_DAYS * 86400)
const clearCookie = cookie('', 0)

async function readSession(req) {
  const tok = (req.headers.get('cookie') || '').split(';').map(c => c.trim()).find(c => c.startsWith('gymsid='))?.slice(7)
  const p = tok && verifySig(tok)
  if (!p) return null
  const [uid, exp, ver] = p.split(':')
  if (!uid || +exp < Date.now()) return null
  const [u] = await sql()`SELECT id, name, sv, disabled FROM users WHERE id = ${uid}`
  if (!u || u.disabled || Number(ver || 0) !== u.sv) return null
  return u
}

/* ---------- one-time WebAuthn challenges, 5 min ---------- */
async function putChallenge(data) {
  const cid = crypto.randomBytes(16).toString('base64url')
  await sql()`DELETE FROM challenges WHERE exp < ${Date.now()}`
  await sql()`INSERT INTO challenges (cid, data, exp) VALUES (${cid}, ${JSON.stringify(data)}, ${Date.now() + 300000})`
  return cid
}
async function takeChallenge(cid) {
  if (!cid) return null
  const [c] = await sql()`DELETE FROM challenges WHERE cid = ${String(cid)} RETURNING data, exp`
  return c && +c.exp >= Date.now() ? c.data : null
}

const json = (status, obj, setCookie) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(setCookie ? { 'Set-Cookie': setCookie } : {}) }
})
const body = async req => { try { return await req.json() } catch { return {} } }
const pub = u => ({ id: u.id, name: u.name, admin: false })

const routes = {
  'GET config': async () => json(200, { invite_only: false, push: false }),

  'GET me': async req => {
    const u = await readSession(req)
    return u ? json(200, { user: pub(u) }) : json(401, { error: 'not signed in' })
  },

  'POST register/options': async req => {
    const b = await body(req)
    const name = String(b.name || '').trim().slice(0, 40)
    if (!name) return json(400, { error: 'name required' })
    const uid = crypto.randomBytes(12).toString('base64url')
    const options = await generateRegistrationOptions({
      rpName: RP_NAME, rpID: RP_ID, userID: Buffer.from(uid), userName: name, userDisplayName: name,
      attestationType: 'none', authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' }
    })
    return json(200, { cid: await putChallenge({ challenge: options.challenge, name, uid }), options })
  },

  'POST register/verify': async req => {
    const b = await body(req)
    const c = await takeChallenge(b.cid)
    if (!c?.uid) return json(400, { error: 'challenge expired — try again' })
    let v
    try {
      v = await verifyRegistrationResponse({ response: b.credential, expectedChallenge: c.challenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID, requireUserVerification: false })
    } catch (e) { return json(400, { error: 'verification failed: ' + e.message }) }
    if (!v.verified) return json(400, { error: 'not verified' })
    const { credential } = v.registrationInfo
    const [dup] = await sql()`SELECT 1 FROM creds WHERE id = ${credential.id}`
    if (dup) return json(409, { error: 'credential already registered' })
    const u = { id: c.uid, name: c.name, sv: 0 }
    await sql().transaction(q => [
      q`INSERT INTO users (id, name) VALUES (${u.id}, ${u.name})`,
      q`INSERT INTO creds (id, user_id, public_key, counter, transports) VALUES (${credential.id}, ${u.id}, ${Buffer.from(credential.publicKey).toString('base64url')}, ${credential.counter || 0}, ${JSON.stringify(b.credential?.response?.transports || [])})`
    ])
    return json(200, { user: pub(u) }, sessionCookie(u))
  },

  'POST login/options': async () => {
    const options = await generateAuthenticationOptions({ rpID: RP_ID, userVerification: 'preferred', allowCredentials: [] })
    return json(200, { cid: await putChallenge({ challenge: options.challenge }), options })
  },

  'POST login/verify': async req => {
    const b = await body(req)
    const c = await takeChallenge(b.cid)
    if (!c) return json(400, { error: 'challenge expired — try again' })
    const [cred] = await sql()`SELECT * FROM creds WHERE id = ${String(b.credential?.id || '')}`
    if (!cred) return json(404, { error: 'unknown passkey — create a profile first' })
    let v
    try {
      v = await verifyAuthenticationResponse({
        response: b.credential, expectedChallenge: c.challenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID, requireUserVerification: false,
        credential: { id: cred.id, publicKey: Buffer.from(cred.public_key, 'base64url'), counter: Number(cred.counter), transports: cred.transports }
      })
    } catch (e) { return json(400, { error: 'verification failed: ' + e.message }) }
    if (!v.verified) return json(400, { error: 'not verified' })
    await sql()`UPDATE creds SET counter = ${v.authenticationInfo.newCounter} WHERE id = ${cred.id}`
    const [u] = await sql()`SELECT id, name, sv, disabled FROM users WHERE id = ${cred.user_id}`
    if (!u) return json(500, { error: 'user missing' })
    if (u.disabled) return json(403, { error: 'this account has been disabled' })
    return json(200, { user: pub(u) }, sessionCookie(u))
  },

  'POST logout': async () => json(200, { ok: true }, clearCookie),

  // Bumps the session version: every cookie issued for this person stops working everywhere.
  'POST logout/all': async req => {
    const u = await readSession(req)
    if (!u) return json(401, { error: 'not signed in' })
    await sql()`UPDATE users SET sv = sv + 1 WHERE id = ${u.id}`
    return json(200, { ok: true }, clearCookie)
  },

  'GET data': async req => {
    const u = await readSession(req)
    if (!u) return json(401, { error: 'not signed in' })
    const [r] = await sql()`SELECT state FROM states WHERE user_id = ${u.id}`
    return json(200, { state: r ? r.state : null })
  },

  'PUT data': async req => {
    const u = await readSession(req)
    if (!u) return json(401, { error: 'not signed in' })
    const raw = await req.text()
    if (raw.length > MAX_STATE) return json(413, { error: 'state too large' })
    let b
    try { b = JSON.parse(raw) } catch { return json(400, { error: 'bad json' }) }
    if (!b.state || typeof b.state !== 'object' || Array.isArray(b.state)) return json(400, { error: 'state required' })
    delete b.state.active   // an in-progress workout stays on the device, as on the self-hosted server
    await sql()`INSERT INTO states (user_id, state, updated) VALUES (${u.id}, ${JSON.stringify(b.state)}, now())
      ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated = now()`
    return json(200, { ok: true, ts: b.state._ts || null })
  }
}

export async function handle(req, method, path) {
  const fn = routes[method + ' ' + path]
  if (!fn) return json(404, { error: 'not available on this server' })
  try {
    await migrate()
    return await fn(req)
  } catch (e) {
    console.error('api error', method, path, e)
    return json(500, { error: 'server error' })
  }
}
