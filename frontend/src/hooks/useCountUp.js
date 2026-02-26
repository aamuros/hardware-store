import { useState, useEffect } from 'react';

/**
 * A custom React hook that animates a numerical value from 0 to a specified end value
 * over a given duration. Useful for statistics or dashboard counters.
 * 
 * @param {number} end - The final value to count up to.
 * @param {number} duration - The duration of the animation in milliseconds (default: 2000ms).
 * @param {boolean} start - A flag to trigger the animation to begin (default: true).
 * @returns {number} The current interpolated value of the count during the animation.
 */
export const useCountUp = (end, duration = 2000, start = true) => {
    // State to hold the current animated number
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Do not animate if the start flag is false
        if (!start) return;

        let startTime = null;
        let animationFrameId;

        /**
         * The core animation loop handled by requestAnimationFrame
         * @param {DOMHighResTimeStamp} timestamp - The current time in milliseconds provided by the browser
         */
        const animate = (timestamp) => {
            // Initialize the start time on the first frame
            if (!startTime) startTime = timestamp;

            // Calculate how much time has passed since the animation started
            const progress = timestamp - startTime;

            // Determine the percentage of completion (capped at 1.0 or 100%)
            const percentage = Math.min(progress / duration, 1);

            // Easing function (easeOutExpo) for smoother, non-linear animation
            // This makes the counting start fast and decelerate near the end.
            // Formula: 1 - Math.pow(2, -10 * t)
            const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

            // Calculate the current number to display based on progress and easing curve
            const currentCount = Math.floor(easeOut * end);

            setCount(currentCount);

            // If the duration hasn't elapsed, request the next animation frame
            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // Ensure the final value perfectly matches the target 'end' value
                setCount(end);
            }
        };

        // Kick off the animation sequence
        animationFrameId = requestAnimationFrame(animate);

        // Cleanup function:
        // Cancels any pending animation frames if the component unmounts
        // or if the dependency array triggers a re-run while animating.
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [end, duration, start]);

    return count;
};
