import { useState } from 'react'

export default function NameModal({ onSave }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-5xl mb-4 text-center">👋</div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Welcome to DayScore</h1>
        <p className="text-gray-500 text-center mb-6 text-sm">Track your day, build your streak.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What's your name?"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
            autoFocus
            maxLength={30}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Let's go →
          </button>
        </form>
      </div>
    </div>
  )
}
