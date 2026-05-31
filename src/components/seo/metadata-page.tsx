'use client'

import { AnimatedText, SectionContainer } from '@/components/ui'

interface Props {
  title: string
  content: string
}

export function MetadataPage({ title, content }: Props) {
  return (
    <SectionContainer size="xs">
      <AnimatedText as="h1" direction="up" className="text-3xl md:text-4xl font-display text-gold-premium">
        {title}
      </AnimatedText>
      <AnimatedText direction="up" delay={200} className="mt-6 text-text-muted leading-relaxed whitespace-pre-line">
        {content}
      </AnimatedText>
    </SectionContainer>
  )
}
