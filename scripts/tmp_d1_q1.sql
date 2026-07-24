SELECT p.id, p.status, pt.locale, pt.slug, pt.title, pt.excerpt, length(pt.content_json) AS cj_len, pt.seo_meta_id FROM pages p JOIN page_translations pt ON pt.page_id = p.id WHERE p.type = 'HOME';  
