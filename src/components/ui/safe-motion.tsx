"use client"

import { motion, MotionProps } from "framer-motion"
import { useEffect, useState, ReactNode } from "react"

interface SafeMotionProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function SafeMotion({ children, ...props }: SafeMotionProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true)
  }, [])

  // On server, render without motion
  if (!isClient) {
    return <div className={props.className}>{children}</div>
  }

  // On client, render with motion
  return <motion.div {...props}>{children}</motion.div>
}