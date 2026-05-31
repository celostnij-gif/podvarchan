'use client'

import Hero from '@/components/sections/Hero'
import ProblemsSection from '@/components/sections/ProblemsSection'
import MethodSection from '@/components/sections/MethodSection'
import ServicesSection from '@/components/sections/ServicesSection'
import AuthorPreviewSection from '@/components/sections/AuthorPreviewSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import FAQSection from '@/components/sections/FAQSection'
import { AnimatedText, SectionContainer } from '@/components/ui'

export default function HomeClient() {
  return (
    <>
      {/* ── Hero ── */}
      <Hero />

      {/* ── Проблемы ── */}
      <ProblemsSection />

      {/* ── Метод ── */}
      <MethodSection />

      {/* ── Услуги ── */}
      <ServicesSection />

      {/* ── Об авторе ── */}
      <AuthorPreviewSection />

      {/* ── Отзывы ── */}
      <TestimonialsSection />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA ── */}
      <SectionContainer background="deep" className="text-center">
        <AnimatedText as="h2" direction="up" className="text-3xl md:text-4xl font-display text-text-primary">
          Готовы начать?
        </AnimatedText>
        <AnimatedText as="p" direction="up" delay={200} className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
          Запишитесь на бесплатную 15-минутную консультацию онлайн,
          чтобы обсудить ваш запрос и выбрать подходящий формат работы.
        </AnimatedText>
        <AnimatedText direction="up" delay={400} className="mt-8">
          <a
            href="/kontakty/"
            data-analytics-booking="home-cta"
            className="inline-flex items-center justify-center px-7 py-3 md:px-9 md:py-3.5 rounded-full
                       bg-gold text-bg-deep font-semibold shadow-glow-gold
                       hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5
                       active:brightness-95 active:translate-y-0
                       transition-all duration-400 text-sm md:text-base gap-2.5"
          >
            Записаться на консультацию
          </a>
        </AnimatedText>
      </SectionContainer>
    </>
  )
}
