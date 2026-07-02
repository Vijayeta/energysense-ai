import { Activity, TrendingDown, Leaf, Sparkles } from 'lucide-react'
import FileUpload from '@/components/FileUpload'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-1 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="EnergySense AI" className="h-20 w-auto" />
        </div>
      </header>

      {/* Hero + Upload */}
      <div className="bg-gradient-to-b from-green-50 to-white">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-3">
            Turn Utility Bills
            <br />
            <span className="text-green-600">into Energy Intelligence</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
            Upload your energy data and get AI-generated insights, anomaly alerts, and
            cost-saving recommendations in under 60 seconds.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
          {/* Trust pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {['No Signup', 'Secure Upload', '60-Second Analysis', 'CSV Compatible'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm"
              >
                <span className="text-green-500">✓</span>
                {label}
              </span>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-5 sm:p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-green-600 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">Start your energy analysis</h2>
            </div>
            <FileUpload />
          </div>
        </section>
      </div>

      {/* Outcomes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Built for results
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Activity,
              title: 'Reduce Energy Waste',
              desc: 'Spot consumption spikes and operational inefficiencies automatically.',
              color: 'text-orange-600',
              iconBg: 'bg-orange-50',
            },
            {
              icon: TrendingDown,
              title: 'Lower Utility Costs',
              desc: 'Ranked actions with estimated annual ₹ savings — ready to act on.',
              color: 'text-green-600',
              iconBg: 'bg-green-50',
            },
            {
              icon: Leaf,
              title: 'Improve Sustainability',
              desc: 'Find ways to cut energy use and reduce carbon emissions.',
              color: 'text-teal-600',
              iconBg: 'bg-teal-50',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-3`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-gray-800 text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
