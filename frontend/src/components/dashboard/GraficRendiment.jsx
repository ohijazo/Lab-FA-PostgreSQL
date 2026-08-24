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

export default function GraficRendiment({ groupData, groupLabel, metricKey, metricLabel }) {
  const { series, text: colorText, grid: colorGrid } = useColorsGrafic()
  if (!groupData || Object.keys(groupData).length === 0 || !metricKey) {
    return null
  }

  const entries = Object.entries(groupData)
    .filter(([nom, info]) => !nom.startsWith('Sense ') && info[metricKey] != null)
    .sort((a, b) => (b[1][metricKey] || 0) - (a[1][metricKey] || 0))

  if (entries.length === 0) return null

  const data = {
    labels: entries.map(([nom]) => nom),
    datasets: [
      {
        label: metricLabel || metricKey,
        data: entries.map(([, info]) => info[metricKey]),
        backgroundColor: ambAlfa(series[2], 0.6),
        borderColor: series[2],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: `${metricLabel || metricKey} per ${groupLabel || 'grup'}`, font: { size: 13 }, color: colorText },
      legend: { display: false },
    },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45, color: colorText }, grid: { color: colorGrid } },
      y: { beginAtZero: true, ticks: { font: { size: 9 }, color: colorText }, grid: { color: colorGrid } },
    },
  }

  return (
    <div className="dashboard-chart-box">
      <Bar data={data} options={options} />
    </div>
  )
}
