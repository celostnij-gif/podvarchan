import { relations } from 'drizzle-orm'
import { users, auditLogs } from './auth'
import { services, serviceTranslations } from './services'
import { blogCategories, blogCategoryTranslations, blogPosts, blogPostTranslations } from './blog'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from './pages'
import { faqItems, faqItemTranslations } from './faq'
import { testimonials, testimonialTranslations } from './testimonials'
import { contactLeads, leadEvents } from './leads'

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}))

export const servicesRelations = relations(services, ({ many }) => ({
  translations: many(serviceTranslations),
}))

export const serviceTranslationsRelations = relations(serviceTranslations, ({ one }) => ({
  service: one(services, { fields: [serviceTranslations.serviceId], references: [services.id] }),
}))

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  translations: many(blogCategoryTranslations),
  posts: many(blogPosts),
}))

export const blogCategoryTranslationsRelations = relations(blogCategoryTranslations, ({ one }) => ({
  category: one(blogCategories, { fields: [blogCategoryTranslations.categoryId], references: [blogCategories.id] }),
}))

export const blogPostsRelations = relations(blogPosts, ({ many, one }) => ({
  translations: many(blogPostTranslations),
  category: one(blogCategories, { fields: [blogPosts.categoryId], references: [blogCategories.id] }),
}))

export const blogPostTranslationsRelations = relations(blogPostTranslations, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostTranslations.postId], references: [blogPosts.id] }),
}))

export const pagesRelations = relations(pages, ({ many }) => ({
  translations: many(pageTranslations),
  sections: many(pageSections),
}))

export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
  page: one(pages, { fields: [pageTranslations.pageId], references: [pages.id] }),
}))

export const pageSectionsRelations = relations(pageSections, ({ many, one }) => ({
  translations: many(pageSectionTranslations),
  page: one(pages, { fields: [pageSections.pageId], references: [pages.id] }),
}))

export const pageSectionTranslationsRelations = relations(pageSectionTranslations, ({ one }) => ({
  section: one(pageSections, { fields: [pageSectionTranslations.sectionId], references: [pageSections.id] }),
}))

export const faqItemsRelations = relations(faqItems, ({ many }) => ({
  translations: many(faqItemTranslations),
}))

export const faqItemTranslationsRelations = relations(faqItemTranslations, ({ one }) => ({
  item: one(faqItems, { fields: [faqItemTranslations.faqItemId], references: [faqItems.id] }),
}))

export const testimonialsRelations = relations(testimonials, ({ many }) => ({
  translations: many(testimonialTranslations),
}))

export const testimonialTranslationsRelations = relations(testimonialTranslations, ({ one }) => ({
  testimonial: one(testimonials, { fields: [testimonialTranslations.testimonialId], references: [testimonials.id] }),
}))

export const contactLeadsRelations = relations(contactLeads, ({ many }) => ({
  events: many(leadEvents),
}))

export const leadEventsRelations = relations(leadEvents, ({ one }) => ({
  lead: one(contactLeads, { fields: [leadEvents.leadId], references: [contactLeads.id] }),
}))
