'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, type ElementType } from 'react';

export interface ITypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  el?: ElementType;
}

export default function TypewriterText({
  text,
  delay = 0,
  speed = 0.02,
  className,
  el: Wrapper = 'p',
}: ITypewriterTextProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => text.slice(0, latest));

  useEffect(() => {
    const controls = animate(count, text.length, {
      type: 'tween',
      delay: delay,
      duration: text.length * speed,
      ease: 'linear',
    });
    return controls.stop;
  }, [text, delay, speed, count]);

  return (
    <Wrapper className={className}>
      <motion.span>{displayText}</motion.span>
    </Wrapper>
  );
}
