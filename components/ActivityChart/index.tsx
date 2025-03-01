"use client";

import React, { useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    XAxis,
    YAxis,
    Tooltip,
    Area
} from "recharts";
import styles from "./ActivityChart.module.scss";

const dayData = [
    { name: "00:00", volume: 30 },
    { name: "06:00", volume: 80 },
    { name: "12:00", volume: 65 },
    { name: "18:00", volume: 120 },
    { name: "23:59", volume: 100 }
];

const weekData = [
    { name: "Mon", volume: 120 },
    { name: "Tue", volume: 200 },
    { name: "Wed", volume: 180 },
    { name: "Thu", volume: 250 },
    { name: "Fri", volume: 190 },
    { name: "Sat", volume: 300 },
    { name: "Sun", volume: 100 }
];

const monthData = [
    { name: "Week 1", volume: 500 },
    { name: "Week 2", volume: 700 },
    { name: "Week 3", volume: 450 },
    { name: "Week 4", volume: 900 }
];

const halfYearData = [
    { name: "Jan", volume: 320 },
    { name: "Feb", volume: 450 },
    { name: "Mar", volume: 600 },
    { name: "Apr", volume: 900 },
    { name: "May", volume: 700 },
    { name: "Jun", volume: 1050 }
];

const yearData = [
    { name: "Jan", volume: 320 },
    { name: "Feb", volume: 450 },
    { name: "Mar", volume: 600 },
    { name: "Apr", volume: 900 },
    { name: "May", volume: 700 },
    { name: "Jun", volume: 1050 },
    { name: "Jul", volume: 800 },
    { name: "Aug", volume: 1200 },
    { name: "Sep", volume: 600 },
    { name: "Oct", volume: 900 },
    { name: "Nov", volume: 1100 },
    { name: "Dec", volume: 950 }
];

export default function ActivityChart() {
    const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "six" | "year">("day");

    let chartData;
    switch (timeframe) {
        case "day":
            chartData = dayData;
            break;
        case "week":
            chartData = weekData;
            break;
        case "month":
            chartData = monthData;
            break;
        case "six":
            chartData = halfYearData;
            break;
        case "year":
            chartData = yearData;
            break;
        default:
            chartData = dayData;
    }

    return (
        <div className={styles.chartContainer}>
            <div className={styles.timeframeSelector}>
                <button onClick={() => setTimeframe("day")} className={timeframe === "day" ? styles.active : ""}>1D</button>
                <button onClick={() => setTimeframe("week")} className={timeframe === "week" ? styles.active : ""}>1W</button>
                <button onClick={() => setTimeframe("month")} className={timeframe === "month" ? styles.active : ""}>1M</button>
                <button onClick={() => setTimeframe("six")} className={timeframe === "six" ? styles.active : ""}>6M</button>
                <button onClick={() => setTimeframe("year")} className={timeframe === "year" ? styles.active : ""}>1Y</button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={chartData}
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
