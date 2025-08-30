// components/Timer.tsx
"use client";

import React from 'react';

const Timer = ({ seconds }: { seconds: number }) => {
    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    return (
        <div className="text-5xl sm:text-6xl font-bold text-gray-900 tabular-nums">
            {formatTime(seconds)}
        </div>
    );
};

export default Timer;