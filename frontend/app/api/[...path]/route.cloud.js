// Hosted (Vercel) API. The `.cloud.js` extension is only a page extension in the Vercel
// build (see next.config.mjs); static-export builds (Docker, GitHub Pages, mobile) skip it.
import { handle } from '../../../server/cloud-api.js'

export const dynamic = 'force-dynamic'
const run = method => async (req, { params }) => handle(req, method, (await params).path.join('/'))
export const GET = run('GET')
export const POST = run('POST')
export const PUT = run('PUT')
