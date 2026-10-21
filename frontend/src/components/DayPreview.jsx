import { exOr } from '../lib/exercises.js'
import { exLine } from '../lib/history.js'
import { t } from '../lib/i18n.js'
import { exerciseDetailSheet } from '../sheets.jsx'
import { Thumb } from './Media.jsx'
import Icon from './Icon.jsx'

// One session's exercises with demo thumbnails and the prescription (sets × reps / minutes).
// Tapping an exercise opens its animated demo and step-by-step instructions.
export default function DayPreview({ ex, unit = 'kg' }) {
  let warm = true
  return <div className="list" style={{ marginTop: 8 }}>
    {ex.map((e, i) => {
      const x = exOr(e.id)
      const head = warm && !e.wu ? (warm = false, <div className="small dim" style={{ padding: '6px 2px 2px' }}>{t('Workout')}</div>) : null
      return <div key={i}>
        {i === 0 && e.wu && <div className="small dim" style={{ padding: '2px 2px 2px' }}><Icon name="flame" /> {t('Warm-up')}</div>}
        {head}
        <div className="item" onClick={() => exerciseDetailSheet(x)}>
          <Thumb ex={x} animated />
          <div className="grow">
            <div className="tt capitalize">{x.n}</div>
            <div className="ss">{exLine(e, unit)}{e.reps && !e.min ? ' ' + t('reps') : ''}{e.note ? ' · ' + t(e.note) : ''}</div>
          </div>
          <Icon name="play" className="chev" />
        </div>
      </div>
    })}
  </div>
}
