import { useTranslation } from 'react-i18next'
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
import { useColorsGrafic, ambAlfa } from '../../utils/tema'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function GraficBarres({ groupData, groupLabel, metricKeys, metricLabels }) {
  const { t } = useTranslation()
  const { series: COLORS, text: colorText, grid: colorGrid } = useColorsGrafic()
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
      backgroundColor: ambAlfa(COLORS[i % COLORS.length], 0.6),
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 1,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: t('dashboard.per_grup', { label: groupLabel || t('dashboard.grup') }), font: { size: 13 }, color: colorText },
      legend: { labels: { boxWidth: 10, font: { size: 10 }, color: colorText } },
    },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45, color: colorText }, grid: { color: colorGrid } },
      y: { ticks: { font: { size: 9 }, color: colorText }, grid: { color: colorGrid } },
    },
  }

  return (
    <div className="dashboard-chart-box">
      <Bar data={data} options={options} />
    </div>
  )
}
