'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function LineChart({
  labels,
  datasets,
  yReverse,
  yTitle,
}: {
  labels: string[];
  datasets: Array<{ label: string; data: Array<number | null> }>;
  yReverse?: boolean;
  yTitle?: string;
}) {
  const data = {
    labels,
    datasets: datasets.map((d) => ({
      label: d.label,
      data: d.data,
      tension: 0.25,
      fill: true,
    })),
  };

  return (
    <div className="card">
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' as const },
          },
          scales: {
            y: {
              reverse: !!yReverse,
              title: yTitle ? { display: true, text: yTitle } : undefined,
              ticks: { color: '#cbd5e1' },
              grid: { color: 'rgba(255,255,255,0.08)' },
            },
            x: {
              ticks: { color: '#cbd5e1' },
              grid: { color: 'rgba(255,255,255,0.06)' },
            },
          },
        }}
      />
    </div>
  );
}
