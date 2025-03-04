"use client";

import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
    targetDate: Date | string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState("00:00");

    useEffect(() => {
        const targetTime = new Date(targetDate).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetTime - now;

            if (difference <= 0) {
                setTimeRemaining("00:00");
                return;
            }

            const totalSeconds = Math.floor(difference / 1000);
            // const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            // const displayHours = String(hours).padStart(2, "0");
            const displayMinutes = String(minutes).padStart(2, "0");
            const displaySeconds = String(seconds).padStart(2, "0");

            setTimeRemaining(`${displayMinutes}:${displaySeconds}`);
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [targetDate]);

    return (
        <div>
            {timeRemaining}
        </div>
    );
}
