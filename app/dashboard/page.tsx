export const metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">CAS Simulator — Dashboard</h1>
        <p className="text-gray-300 mt-2">Choose a mode to begin. Your access is tied to your plan.</p>

        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          <a
            href="/dashboard/test-mode"
            className="block rounded-2xl border border-gray-800 bg-gray-900 hover:bg-gray-800 p-6"
          >
            <h2 className="text-xl font-semibold">Practice Mode</h2>
            <p className="text-gray-300 mt-1">Unlimited practice with instant feedback.</p>
            <span className="mt-4 inline-block px-3 py-1 rounded bg-blue-600">Open</span>
          </a>

          <a
            href="/dashboard/live-mode"
            className="block rounded-2xl border border-gray-800 bg-gray-900 hover:bg-gray-800 p-6"
          >
            <h2 className="text-xl font-semibold">Live Mode (Mock Exam)</h2>
            <p className="text-gray-300 mt-1">12 stations • 2 hours • AI scoring.</p>
            <span className="mt-4 inline-block px-3 py-1 rounded bg-blue-600">Open</span>
          </a>
        </div>
      </div>
    </main>
  );
}
