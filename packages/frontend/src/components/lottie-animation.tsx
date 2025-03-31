"use client"

import { useState } from "react"
import Lottie from "react-lottie-player"

// JSON de animación simple para demostración
const defaultAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 512,
  h: 512,
  nm: "Simple Animation",
  ddd: 0,
  assets: [],
  layers: [
    {
      ty: 4,
      nm: "Shape Layer",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], e: [360] },
            { t: 60, s: [360] },
          ],
        },
        p: { a: 0, k: [256, 256] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [150, 150] },
        },
        {
          ty: "st",
          c: { a: 0, k: [0, 0.4, 0.65, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 20 },
        },
        {
          ty: "fl",
          c: { a: 0, k: [0, 0.4, 0.65, 1] },
          o: { a: 0, k: 100 },
        },
      ],
    },
  ],
}

export default function LottieAnimation() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [animationData, setAnimationData] = useState(defaultAnimationData)

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Lottie
        loop={true}
        animationData={animationData}
        play={isPlaying}
        style={{ width: "100%", height: "100%" }}
        onComplete={() => setIsPlaying(false)}
        onClick={() => setIsPlaying(!isPlaying)}
      />
    </div>
  )
}

