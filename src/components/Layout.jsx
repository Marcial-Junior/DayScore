import Sidebar from './nav/Sidebar'
import BottomNav from './nav/BottomNav'

export default function Layout({ activeTab, setActiveTab, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-60 flex-shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-y-auto min-h-screen">
        <div className="max-w-2xl mx-auto p-4 md:p-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}
