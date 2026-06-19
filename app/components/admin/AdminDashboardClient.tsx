"use client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DailyStat { date: string; posts: number; likes: number; comments: number; }
interface TopPost { id: string; title: string; author: string; likes: number; comments: number; }
interface IpEntry { id: string; title: string; author: string; ip: string; createdAt: string; }
interface AuthorCount { author: string; count: number; }
interface Totals { totalPosts: number; totalLikes: number; totalComments: number; totalUsers: number; }

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboardClient({
  totals, dailyStats, topPosts, ipLog, postsByAuthor,
}: { totals: Totals; dailyStats: DailyStat[]; topPosts: TopPost[]; ipLog: IpEntry[]; postsByAuthor: AuthorCount[]; }) {
  const stats = [
    { label: "Total Posts", value: totals.totalPosts, color: "#f97316", icon: "📝" },
    { label: "Total Likes", value: totals.totalLikes, color: "#ef4444", icon: "❤️" },
    { label: "Total Comments", value: totals.totalComments, color: "#6366f1", icon: "💬" },
    { label: "Total Users", value: totals.totalUsers, color: "#22c55e", icon: "👥" },
  ];

  const card = { background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 24px" };

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Overview of all activity</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...card, borderTop: "3px solid " + s.color }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#111" }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Activity — Last 14 Days</h2>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="posts" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="comments" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar + Top posts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Posts by Author</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={postsByAuthor}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="author" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Top Posts</h2>
          {topPosts.map((p, i) => (
            <a key={p.id} href={"/posts/" + p.id + "?from=/admin"}
              style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < topPosts.length - 1 ? "1px solid #f5f5f5" : "none", textDecoration: "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{p.title.length > 35 ? p.title.slice(0, 35) + "..." : p.title}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>by {p.author}</div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap", marginLeft: 12 }}>
                ❤️{p.likes} 💬{p.comments}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* IP log */}
      <div style={card}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>IP Address Log (latest 20)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                {["Title", "Author", "IP Address", "Date"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#9ca3af", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ipLog.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111" }}>
                    <a href={"/posts/" + e.id} style={{ color: "#111", textDecoration: "none" }}>{e.title}</a>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#374151" }}>{e.author}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6b7280" }}>{e.ip}</td>
                  <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{fmt(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}