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

export default function GraficRendiment({ groupData, groupLabel, metricKey, metricLabel }) {
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
        backgroundColor: '#16a34a99',
        borderColor: '#16a34a',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: `${metricLabel || metricKey} per ${groupLabel || 'grup'}`, font: { size: 13 } },
      legend: { display: false },
    },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45 } },
      y: { beginAtZero: true, ticks: { font: { size: 9 } } },
    },
  }

  return (
    <div className="dashboard-chart-box">
      <Bar data={data} options={options} />
    </div>
  )
}
