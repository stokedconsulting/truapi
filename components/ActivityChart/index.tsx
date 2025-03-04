"use client";

import React from "react";
import {
    ResponsiveContainer,
    AreaChart,
    XAxis,
    YAxis,
    Tooltip,
    Area
} from "recharts";
import styles from "./ActivityChart.module.scss";

export default function ActivityChart({ data, isLoading }: { data?: { name: string, volume: number }[], isLoading: boolean }) {
    return (
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={data}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0051FF" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0051FF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis axisLine={false} orientation="right" tickLine={false} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
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
