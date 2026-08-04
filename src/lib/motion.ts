export const springTransition = { type: 'spring', stiffness: 300, damping: 30 } as const;
export const fadeTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as const;
export const fastTransition = { duration: 0.15, ease: [0.16, 1, 0.3, 1] } as const;
