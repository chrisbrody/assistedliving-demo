import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Facility Ready Board
          </h1>
          <p className="mt-3 text-gray-600">
            Real-time resident pickup coordination
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/admin"
            className="block w-full py-4 px-6 bg-blue-600 hover:bg-blue-700
                     text-white text-xl font-semibold rounded-xl transition-colors"
          >
            Front Desk (Clerk)
          </Link>

          <Link
            href="/floor"
            className="block w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700
                     text-white text-xl font-semibold rounded-xl transition-colors"
          >
            Nursing Floor (Tablet)
          </Link>
        </div>

        <div className="pt-8 text-sm text-gray-500">
          <p>Demo Mode</p>
          <p className="mt-1">Open both views on different devices to see real-time sync</p>
        </div>
      </div>
    </main>
  );
}
