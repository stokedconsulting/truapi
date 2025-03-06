"use client";

import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    XAxis,
    YAxis,
    Tooltip,
    Area
} from "recharts";
import styles from "./ActivityChart.module.scss";

type ChartData = { name: string; volume: number };

export default function ActivityChart({ data, isLoading }: { data?: ChartData[], isLoading: boolean }) {
    const [loadingData, setLoadingData] = useState<ChartData[]>()

    useEffect(() => {
        if (!isLoading) {
            setLoadingData(undefined);
            return;
        }

        // Generates an array of 50 data points with minimal variation
        const generateRandomData = () => {
            let lastValue = 50;   // Start near the midpoint
            const maxChange = 2;  // Maximum ± change per step (tweak for bigger/smaller bumps)

            return Array.from({ length: 50 }, (_, i) => {
                // Random offset in range [-maxChange, +maxChange]
                const offset = (Math.random() - 0.5) * 2 * maxChange;
                // Apply offset, clamp to [0, 100]
                lastValue = Math.max(0, Math.min(100, lastValue + offset));

                return {
                    name: i.toString(),
                    volume: lastValue
                };
            });
        };

        // Re‐generate the data on each interval
        const updateData = () => {
            setLoadingData(generateRandomData());
        };

        // Initialize once
        updateData();

        // Then update periodically
        const intervalId = setInterval(updateData, 1500);

        return () => clearInterval(intervalId);
    }, [isLoading]);

    return (
        <div className={styles.chartContainer}>
            {(!data || isLoading) && <div className={styles.info}>
                {isLoading ? "LOADING" : "NO DATA"}
            </div>}
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={isLoading ? loadingData : data}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0051FF" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0051FF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {!isLoading && <XAxis dataKey="name" />}
                    {!isLoading && <YAxis axisLine={false} orientation="right" tickLine={false} />}
                    {!isLoading && <Tooltip cursor={{ strokeDasharray: "3 3" }} />}
                    <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#0051FF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
