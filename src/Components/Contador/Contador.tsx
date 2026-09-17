import React, { useEffect, useState, useRef } from "react";

interface CounterProps {
  target: number;
  duration?: number;
  prefix?: string;
}

export const Contador: React.FC<CounterProps> = ({ target, duration = 2000, prefix = "+" }) => {
  const [count, setCount] = useState<number>(0);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const hasAnimated = useRef<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          let startTime: number | null = null;

          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            const easeOutProgress = 1 - Math.pow(1 - progress, 3);

            setCount(Math.floor(easeOutProgress * target));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={elementRef}>
      {prefix}
      {count.toLocaleString()}
    </span>
  );
};