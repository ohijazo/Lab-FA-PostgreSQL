import { useTranslation } from 'react-i18next'
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
import { useColorsGrafic, ambAlfa } from '../../utils/tema'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function GraficLinia({ serieTemporal, metricKeys, metricLabels }) {
  const { t } = useTranslation()
  const { series: COLORS, text: colorText, grid: colorGrid } = useColorsGrafic()
  if (!serieTemporal || Object.keys(serieTemporal).length === 0) {
    return <p>{t('dashboard.no_dades_temporals')}</p>
  }

  const mesos = Object.keys(serieTemporal).sort()

  const data = {
    labels: mesos,
    datasets: (metricKeys || []).map((mk, i) => ({
      label: metricLabels?.[mk] || mk,
      data: mesos.map((mes) => serieTemporal[mes]?.[mk] ?? null),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: ambAlfa(COLORS[i % COLORS.length], 0.2),
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
      title: { display: true, text: t('dashboard.evolucio_mensual'), font: { size: 13 }, color: colorText },
      legend: { labels: { boxWidth: 10, font: { size: 10 }, color: colorText } },
    },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45, color: colorText }, grid: { color: colorGrid } },
      y: { beginAtZero: false, ticks: { font: { size: 9 }, color: colorText }, grid: { color: colorGrid } },
    },
  }

  return (
    <div className="dashboard-chart-box">
      <Line data={data} options={options} />
    </div>
  )
}
