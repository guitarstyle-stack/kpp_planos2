"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface IndicatorProgressChartProps {
    data: Array<{
        label: string;
        actualValue: number | null;
        targetValue: number;
        date: string;
    }>;
    unit: string;
}

export function IndicatorProgressChart({ data, unit }: IndicatorProgressChartProps) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current || data.length === 0) return;

        // Destroy previous chart instance
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");
        if (!ctx) return;

        const labels = data.map((d) => d.label);
        const actualValues = data.map((d) => d.actualValue || 0);
        const targetValues = data.map((d) => d.targetValue);

        chartInstance.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: `ค่าจริง (${unit})`,
                        data: actualValues,
                        borderColor: "rgb(59, 130, 246)",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    },
                    {
                        label: `เป้าหมาย (${unit})`,
                        data: targetValues,
                        borderColor: "rgb(34, 197, 94)",
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: "normal",
                            },
                        },
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: "bold",
                        },
                        bodyFont: {
                            size: 13,
                        },
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || "";
                                if (label) {
                                    label += ": ";
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString();
                                }
                                return label;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: {
                                size: 11,
                            },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(0, 0, 0, 0.05)",
                        },
                        ticks: {
                            font: {
                                size: 11,
                            },
                            callback: function (value) {
                                return value.toLocaleString();
                            },
                        },
                    },
                },
                interaction: {
                    mode: "nearest",
                    axis: "x",
                    intersect: false,
                },
            },
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, unit]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-base-200/30 rounded-lg">
                <p className="text-sm opacity-50">ยังไม่มีข้อมูลสำหรับแสดงกราฟ</p>
            </div>
        );
    }

    return (
        <div className="relative h-80 w-full">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}
