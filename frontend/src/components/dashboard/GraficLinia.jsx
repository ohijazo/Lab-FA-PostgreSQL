import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706']

export default function GraficLinia({ serieTemporal, metricKeys, metricLabels }) {
  if (!serieTemporal || Object.keys(serieTemporal).length === 0) {
    return <p>No hi ha dades temporals.</p>
  }

  const mesos = Object.keys(serieTemporal).sort()

  const data = {
    labels: mesos,
    datasets: (metricKeys || []).map((mk, i) => ({
      label: metricLabels?.[mk] || mk,
      data: mesos.map((mes) => serieTemporal[mes]?.[mk] ?? null),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: COLORS[i % COLORS.length] + '33',
      tension: 0.3,
      spanGaps: true,
      pointRadius: 2,
      borderWidth: 2,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Evolució mensual', font: { size: 13 } },
      legend: { labels: { boxWidth: 10, font: { size: 10 } } },
    },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45 } },
      y: { beginAtZero: false, ticks: { font: { size: 9 } } },
    },
  }

  return (
    <div className="dashboard-chart-box">
      <Line data={data} options={options} />
    </div>
  )
}
