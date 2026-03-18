'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  summary: {
    totalViews: number;
    uniqueToday: number;
    uniqueWeek: number;
    uniqueMonth: number;
  };
  topPages: { page: string; views: number; uniqueVisitors: number }[];
  topCountries: { country: string; countryCode: string; views: number; uniqueVisitors: number }[];
  dailyTrend: { day: string; views: number; uniqueVisitors: number }[];
  newVsReturning: { isReturning: boolean; count: number }[];
}

const FLAG_BASE = 'https://flagcdn.com/20x15';

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-3xl font-bold text-purple-700">{value.toLocaleString()}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => {
        if (!r.ok) throw new Error('Unauthorized or error');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-purple-600 text-lg animate-pulse">Loading analytics…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">
          {error || 'Could not load analytics. Make sure you are signed in as super admin.'}
        </div>
      </div>
    );
  }

  const newCount = data.newVsReturning.find((r) => !r.isReturning)?.count || 0;
  const returningCount = data.newVsReturning.find((r) => r.isReturning)?.count || 0;
  const totalNR = newCount + returningCount || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">Site Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Unique visitors &amp; page views — last 30 days</p>
          </div>
          <Link href="/" className="text-sm text-purple-600 hover:underline">← Back to home</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Page Views" value={data.summary.totalViews} sub="all time" />
          <StatCard label="Unique Visitors Today" value={data.summary.uniqueToday} />
          <StatCard label="Unique Visitors (7d)" value={data.summary.uniqueWeek} />
          <StatCard label="Unique Visitors (30d)" value={data.summary.uniqueMonth} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">New vs Returning (30d)</h2>
            <div className="flex gap-6 items-center">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600 font-medium">New</span>
                  <span>{newCount.toLocaleString()} ({Math.round((newCount / totalNR) * 100)}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.round((newCount / totalNR) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-purple-600 font-medium">Returning</span>
                  <span>{returningCount.toLocaleString()} ({Math.round((returningCount / totalNR) * 100)}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.round((returningCount / totalNR) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Daily Trend (7d)</h2>
            {data.dailyTrend.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-2">
                {data.dailyTrend.map((d) => (
                  <div key={d.day} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-gray-500 shrink-0">{d.day}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{
                          width: `${Math.min(100, (d.views / (Math.max(...data.dailyTrend.map((x) => x.views)) || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-gray-600">{d.views} views</span>
                    <span className="w-16 text-right text-purple-500">{d.uniqueVisitors} uniq</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Top Countries (30d)</h2>
            {data.topCountries.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topCountries.map((c) => (
                  <div key={c.country} className="flex items-center gap-3 text-sm">
                    {c.countryCode && (
                      <img
                        src={`${FLAG_BASE}/${c.countryCode.toLowerCase()}.png`}
                        alt={c.country}
                        className="w-5 h-4 rounded-sm object-cover shrink-0"
                      />
                    )}
                    <span className="flex-1 text-gray-700">{c.country}</span>
                    <span className="text-gray-500">{c.views.toLocaleString()} views</span>
                    <span className="text-purple-500 w-20 text-right">{c.uniqueVisitors.toLocaleString()} uniq</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Top Pages (30d)</h2>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topPages.map((p) => (
                  <div key={p.page} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 text-gray-700 truncate font-mono text-xs">{p.page || '/'}</span>
                    <span className="text-gray-500 shrink-0">{p.views.toLocaleString()} views</span>
                    <span className="text-purple-500 shrink-0 w-20 text-right">{p.uniqueVisitors.toLocaleString()} uniq</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
