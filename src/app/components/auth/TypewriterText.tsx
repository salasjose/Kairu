'use client';

import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function TypewriterText({ text, className, delay = 0 }: TypewriterTextProps) {
  const textVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.05 + delay,
        duration: 0.05,
      },
    }),
  };

  return (
    <p className={className}>
      {text.split('').map((char, i) => (
        <motion.span key={`${char}-${i}`} custom={i} variants={textVariants} initial="hidden" animate="visible">
          {char}
        </motion.span>
      ))}
    </p>
  );
}
