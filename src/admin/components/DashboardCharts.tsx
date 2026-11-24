import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { formatNaira } from '../../utils/format';

Chart.register(...registerables);

interface RevenuePoint {
  label: string;
  value: number;
}

export const RevenueLineChart: React.FC<{
  points: RevenuePoint[];
  currency: string;
}> = ({ points, currency }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(232, 93, 4, 0.22)');
    gradient.addColorStop(1, 'rgba(255, 243, 232, 0.02)');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map((p) => p.label),
        datasets: [
          {
            label: 'Verified Revenue',
            data: points.map((p) => p.value),
            borderColor: '#E85D04',
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#E85D04',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#252525',
            padding: 10,
            titleFont: { family: 'Poppins', size: 12, weight: 'bold' },
            bodyFont: { family: 'Poppins', size: 12 },
            callbacks: {
              label: (context) => ` ${formatNaira(Number(context.raw || 0), currency)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#737373',
              font: { family: 'Poppins', size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F1F1' },
            border: { display: false },
            ticks: {
              color: '#737373',
              font: { family: 'Poppins', size: 11 },
              callback: (val) => formatNaira(Number(val), currency),
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [points, currency]);

  return (
    <div className="relative h-64 w-full">
      <canvas ref={canvasRef} aria-label="Verified revenue trend chart" />
    </div>
  );
};

export const OrdersBarChart: React.FC<{
  completed: number;
  pending: number;
  cancelled: number;
}> = ({ completed, pending, cancelled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Completed', 'Pending', 'Cancelled'],
        datasets: [
          {
            label: 'Orders',
            data: [completed, pending, cancelled],
            backgroundColor: ['#267A43', '#E85D04', '#DC2626'],
            borderRadius: 8,
            barThickness: 38,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#252525',
            padding: 10,
            titleFont: { family: 'Poppins', size: 12, weight: 'bold' },
            bodyFont: { family: 'Poppins', size: 12 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#252525',
              font: { family: 'Poppins', size: 11, weight: 'bold' },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#F1F1F1' },
            border: { display: false },
            ticks: {
              stepSize: 1,
              precision: 0,
              color: '#737373',
              font: { family: 'Poppins', size: 11 },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [completed, pending, cancelled]);

  return (
    <div className="relative h-64 w-full">
      <canvas ref={canvasRef} aria-label="Order analytics bar chart" />
    </div>
  );
};

interface CategorySlice {
  name: string;
  count: number;
}

const DOUGHNUT_COLORS = [
  '#E85D04',
  '#267A43',
  '#252525',
  '#F48C06',
  '#D97706',
  '#525252',
  '#9CA3AF',
];

export const CategoryDoughnutChart: React.FC<{
  slices: CategorySlice[];
}> = ({ slices }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const activeSlices = slices.filter((s) => s.count > 0);
    const hasData = activeSlices.length > 0;

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: hasData ? activeSlices.map((s) => s.name) : ['No Meals'],
        datasets: [
          {
            data: hasData ? activeSlices.map((s) => s.count) : [1],
            backgroundColor: hasData
              ? activeSlices.map((_, i) => DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length])
              : ['#E5E5E5'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: hasData,
            backgroundColor: '#252525',
            padding: 10,
            titleFont: { family: 'Poppins', size: 12, weight: 'bold' },
            bodyFont: { family: 'Poppins', size: 12 },
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} meals`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [slices]);

  const activeSlices = slices.filter((s) => s.count > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-48 w-full">
        <canvas ref={canvasRef} aria-label="Food categories distribution chart" />
      </div>
      {activeSlices.length > 0 && (
        <ul className="space-y-1.5 text-xs">
          {activeSlices.map((slice, idx) => (
            <li key={slice.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: DOUGHNUT_COLORS[idx % DOUGHNUT_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="text-[#252525] truncate">{slice.name}</span>
              </span>
              <span className="font-semibold tabular-nums text-neutral-700 shrink-0">
                {slice.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
