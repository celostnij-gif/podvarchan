'use client'

import { AnimatedText, SectionContainer, PageHero } from '@/components/ui'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs'

interface Props {
  title: string
  content: string
  breadcrumbItems?: BreadcrumbItem[]
  clean?: boolean
}

export function MetadataPage({ title, content, breadcrumbItems, clean }: Props) {
  return (
    <>
      <PageHero title={title} breadcrumbItems={breadcrumbItems} clean={clean} />

      {/* ────── Content ────── */}
      <SectionContainer size="xs">
        <div className="max-w-3xl mx-auto">
          <AnimatedText direction="up" className="text-text-muted leading-relaxed whitespace-pre-line">
            {content}
          </AnimatedText>
        </div>
      </SectionContainer>
    </>
  )
}
