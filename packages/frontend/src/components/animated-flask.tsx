"use client"

import { motion } from "framer-motion"

export default function AnimatedFlask() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M35 20H65V40C65 40 75 60 75 70C75 80 65 85 50 85C35 85 25 80 25 70C25 60 35 40 35 40V20Z"
        stroke="black"
        strokeWidth="2"
        fill="transparent"
      />
      <motion.path d="M35 40H65" stroke="black" strokeWidth="2" />
      <motion.path d="M40 15H60V25" stroke="black" strokeWidth="2" fill="transparent" />
      <motion.rect
        initial={{ y: 70, height: 15 }}
        animate={{
          y: [70, 65, 70, 65, 70],
          height: [15, 20, 15, 20, 15],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
        x="35"
        width="30"
        fill="#4263EB" // Puedes ajustar este color si es necesario
        rx="2"
      />
    </svg>
  )
}
