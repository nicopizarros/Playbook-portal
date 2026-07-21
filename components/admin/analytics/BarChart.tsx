'use client';

import { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

type Props = { labels: string[]; values: number[]; color: string };

// Direct Chart.js usage (no wrapper lib) — same as legacy/admin/analytics.js's
// barChart(), just using the already-installed npm package instead of a
// CDN <script>.
export function BarChart({ labels, values, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    chartRef.current?.destroy();
    chartRef.current = null;
    if (!canvasRef.current || !labels.length) return undefined;

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: color, borderRadius: 4, maxBarThickness: 22 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} vistas` } },
        },
        scales: { x: { beginAtZero: true } },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, values, color]);

  if (!labels.length) return <p className="analytics-empty">Todavía no hay suficientes datos.</p>;
  return (
    <div className="analytics-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
