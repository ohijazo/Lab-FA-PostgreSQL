import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706']

export default function GraficBarres({ groupData, groupLabel, metricKeys, metricLabels }) {
  if (!groupData || Object.keys(groupData).length === 0) {
    return null
  }

  const entries = Object.entries(groupData)
    .filter(([nom]) => !nom.startsWith('Sense '))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)

  if (entries.length === 0) return null

  const data = {
    labels: entries.map(([nom]) => nom),
    datasets: (metricKeys || []).slice(0, 2).map((mk, i) => ({
      label: metricLabels?.[mk] || mk,
      data: entries.map(([, info]) => info[mk]),
      backgroundColor: COLORS[i % COLORS.length] + '99',
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 1,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: `Per ${groupLabel || 'grup'}`, font: { size: 13 } },
      legend: { labels: { boxWidth: 10, font: { size: 10 } } },
    },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45 } },
      y: { ticks: { font: { size: 9 } } },
    },
  }

  return (
    <div className="dashboard-chart-box">
      <Bar data={data} options={options} />
    </div>
  )
}
