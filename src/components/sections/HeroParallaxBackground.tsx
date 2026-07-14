'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'

/**
 * Микро-клиентский компонент только для параллакс-эффекта фона Hero.
 * Остальная Hero-секция — серверный компонент со статическим HTML и CSS-анимациями.
 */
export default function HeroParallaxBackground() {
  const { scrollY } = useScroll()
  const imgY = useTransform(scrollY, [0, 800], [0, 150])

  return (
    <motion.div
      style={{ y: imgY }}
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative w-full h-full">
        <Image
          src="/images/hero-bg.webp"
          alt="Спокійна атмосфера онлайн-сесії гіпнотерапії"
          fill
          className="object-cover object-center"
          priority
          fetchPriority="high"
          sizes="100vw"
        />
      </div>
      {/* Dark gradient overlays for readability — static, not parallax */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/80 via-bg-deep/50 to-bg-deep/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-deep/60 via-transparent to-bg-deep/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />
    </motion.div>
  )
}
