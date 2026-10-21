import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { REPO } from '../lib/demo.js'

// Plain-language privacy notice for the hosted app (gym-roasters.vercel.app).
const S = ({ h, children }) => <div className="card"><h2 style={{ marginTop: 0 }}>{h}</h2><div className="small" style={{ lineHeight: 1.6 }}>{children}</div></div>

export default function Privacy() {
  const nav = useNavigate()
  return <div className="narrow">
    <div className="hdr">
      <button className="iconbtn" onClick={() => nav(-1)} aria-label="Back"><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginLeft: 10 }}><h1>Privacy</h1><div className="sub">Last updated 21 October 2026</div></div>
    </div>
    <S h="The short version">Gym Roasters has no ads, no tracking and no analytics. Your data is used only to run the app for you, and you can delete it at any time.</S>
    <S h="What is stored, and where">
      <b>Without an account</b> everything stays in this browser on this device.<br />
      <b>With an account</b> your name, your passkey's public key and your app data (plan, workouts, food, water, steps, sleep, body measurements, goals, friends) are stored in a database (Neon Postgres) so they follow you to every device. Passkeys never send a password or your Face ID / fingerprint anywhere.<br />
      <b>Progress photos</b> never leave your phone.
    </S>
    <S h="AI meal analysis">When you analyse a meal, the photo and/or text is sent through Vercel AI Gateway to Google's Gemini model to estimate nutrition. It is not stored by Gym Roasters; only the foods you choose to log are saved. Each account can run up to 40 analyses a day.</S>
    <S h="Friends">Friends you add see only your ring percentages and competition points — never your workouts, food or body data. Remove a friend at any time.</S>
    <S h="Other services">The app is hosted on Vercel. Exercise images load from the jsDelivr CDN. The song on the welcome screen plays in YouTube's privacy-enhanced player, and only after you tap play.</S>
    <S h="Your choices">Export a backup or delete your data in Settings. Signed-in users can <b>Delete my account</b> in Settings, which permanently removes the account and everything stored with it.</S>
    <S h="Health information">Plans and numbers are estimates from published guidelines, not medical advice. Talk to a doctor before starting if you are pregnant, under 18 or managing a health condition.</S>
    <S h="Contact">Questions or requests: open an issue at <a href={REPO} target="_blank" rel="noopener">{REPO.replace('https://', '')}</a>.</S>
    <div style={{ height: 24 }} />
  </div>
}
