/**
 * Server Actions — єдина точка експорту.
 */

// Core
export { ok, okVoid, fail, isOk, isFail, unwrap } from './result'
export type { ActionResult } from './result'

// Guards
export { withAuth, withRole, withCanPublish, withCanDelete, withCanManageUsers, withCanManageSettings, withCanViewLeads, withCanUploadMedia, withCanViewAuditLog } from './guard'

// Action modules
export { getServices, getService, createService, updateService, deleteService, publishService } from './services'
export { getBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost, updateBlogPostStatus } from './blog'
export { getFaqItems, getFaqItem, createFaqItem, updateFaqItem, deleteFaqItem } from './faq'
export { getTestimonials, getTestimonial, createTestimonial, updateTestimonial, deleteTestimonial, publishTestimonial } from './testimonials'
export { getLeads, getLead, updateLeadStatus, addLeadNote, deleteLead } from './leads'
export { getMediaAssets, getMediaAsset, updateMediaMeta, deleteMediaAsset } from './media'
export { getPages, getPage, updatePageStatus, togglePageSection } from './pages'
export { getNavigationItems, createNavItem, updateNavItem, deleteNavItem } from './navigation'
export { getSiteSettings, updateSiteSetting } from './settings'
export { getRedirects, createRedirect, updateRedirect, deleteRedirect } from './redirects'
