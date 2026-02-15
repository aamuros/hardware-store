import { useState, useEffect } from 'react';

/**
 * A hook that animates a number from 0 to a specified end value.
 * 
 * @param {number} end - The final value to count up to.
 * @param {number} duration - The duration of the animation in milliseconds.
 * @param {boolean} start - Whether to start the animation.
 * @returns {number} The current value of the count.
 */
export const useCountUp = (end, duration = 2000, start = true) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!start) return;

        let startTime = null;
        let animationFrameId;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            const percentage = Math.min(progress / duration, 1);

            // Easing function (easeOutExpo) for smoother animation
            // 1 - Math.pow(2, -10 * t)
            const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

            const currentCount = Math.floor(easeOut * end);

            setCount(currentCount);

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [end, duration, start]);

    return count;
};
