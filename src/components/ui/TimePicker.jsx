import { useRef, useEffect, useCallback, useState } from 'react'

const ITEM_H = 48
const VISIBLE = 5   // items visible at once
const COL_H = ITEM_H * VISIBLE  // 240px

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function Column({ items, value, onChange }) {
  const ref = useRef(null)
  const timerRef = useRef(null)
  const idx = Math.max(0, items.indexOf(value))

  // Scroll to value on mount (no animation — instant)
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = idx * ITEM_H
    }
  }, [])  // mount only

  const onScroll = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (!ref.current) return
      const i = Math.round(ref.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(i, items.length - 1))
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
      onChange(items[clamped])
    }, 120)
  }, [items, onChange])

  return (
    <div className="relative flex-1" style={{ height: COL_H }}>
      {/* Scroll column */}
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar { display: none }`}</style>
        <div style={{ paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2 }}>
          {items.map((item) => (
            <div
              key={item}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
              className={`flex items-center justify-center text-2xl font-mono transition-colors select-none ${
                item === value ? 'text-primary font-extrabold' : 'text-gray-300 font-medium'
              }`}
            >
              {String(item).padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>
      {/* Highlight band at center */}
      <div
        className="pointer-events-none absolute inset-x-0 border-t-2 border-b-2 border-primary/20 bg-primary/5"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
    </div>
  )
}

export default function TimePicker({ value, onChange, triggerClassName }) {
  const [open, setOpen] = useState(false)
  const [h, setH] = useState(9)
  const [m, setM] = useState(0)

  const openPicker = () => {
    if (value) {
      const [hh, mm] = value.split(':').map(Number)
      setH(hh)
      setM(mm)
    } else {
      setH(9)
      setM(0)
    }
    setOpen(true)
  }

  const confirm = () => {
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setOpen(false)
  }

  const label = value
    ? `${value.split(':')[0].padStart(2, '0')}:${value.split(':')[1].padStart(2, '0')}`
    : null

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className={
          triggerClassName ||
          `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            label
              ? 'border-primary/40 text-primary bg-primary/5'
              : 'border-gray-200 text-gray-400 bg-white'
          }`
        }
      >
        {label ? `⏰ ${label}` : '⏰ Time'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Title row */}
            <div className="flex items-center justify-between px-5 py-3">
              <button
                type="button"
                onClick={clear}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
              <span className="text-sm font-semibold text-gray-800">Select time</span>
              <button
                type="button"
                onClick={confirm}
                className="text-sm font-bold text-primary"
              >
                Done
              </button>
            </div>

            {/* Columns */}
            <div className="flex items-center px-8 gap-2">
              <Column items={HOURS} value={h} onChange={setH} />
              <span className="text-3xl font-bold text-gray-300 flex-shrink-0 pb-1">:</span>
              <Column items={MINUTES} value={m} onChange={setM} />
            </div>

            {/* Live preview */}
            <p className="text-center text-xs text-gray-400 mt-3">
              {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
