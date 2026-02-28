import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

const app = express()

// Behövs för att path.dirname ska fungera med ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Tjänar allt i src/public/ som statiska filer (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'src', 'public')))

// ─── TextTV API ───
const TEXTTV_BASE = 'https://texttv.nu/api/get'
const APP_ID = 'texttvonline'

// Hämtar en sida (eller range) från texttv.nu
async function fetchTextTV(pages) {
  const url = `${TEXTTV_BASE}/${pages}?app=${APP_ID}&includePlainTextContent=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TextTV API: ${res.status}`)
  return res.json()
}

// Endpoint för enstaka sida eller range, t.ex. /api/page/300 eller /api/page/101-103
app.get('/api/page/:pages', async (req, res) => {
  try {
    const data = await fetchTextTV(req.params.pages)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte hämta sidan' })
  }
})

// Endpoint för startsidan — hämtar nyheter, sport och väder parallellt
app.get('/api/start', async (req, res) => {
  try {
    const [nyheter, sport, vader] = await Promise.all([
      fetchTextTV('100'),
      fetchTextTV('300'),
      fetchTextTV('401')
    ])
    res.json({ nyheter, sport, vader })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Kunde inte hämta startdata' })
  }
})

// Allt annat → skicka index.html (så att navigering i browsern funkar)
app.get('*s', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'))
})

// Startar servern
const PORT = 7000
app.listen(PORT, () => {
  console.log(`TextTV Online running on http://localhost:${PORT}`)
})
