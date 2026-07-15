-- === SEED: Home page sections ===
-- HOME page ID: cae9f9ec-6fd9-457c-a4c5-79df832e95eb
-- Adds 4 sections: hero, testimonials-ref, cta, contact-form

-- 1. Hero section
INSERT INTO page_sections (id, page_id, key, type, enabled, sort_order, settings_json)
VALUES (
  '00000000-0000-4000-a000-000000000001',
  'cae9f9ec-6fd9-457c-a4c5-79df832e95eb',
  'hero',
  'hero',
  1,
  0,
  NULL
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  'ru',
  '{"title": "Ваш внутренний мир заслуживает внимания", "subtitle": "Гипнотерапия и глубинная психология для тех, кто готов к настоящим изменениям", "cta": "Записаться на консультацию"}'
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000002',
  '00000000-0000-4000-a000-000000000001',
  'uk',
  '{"title": "Ваш внутрішній світ заслуговує на увагу", "subtitle": "Гіпнотерапія та глибинна психологія для тих, хто готовий до справжніх змін", "cta": "Записатися на консультацію"}'
);

-- 2. Testimonials reference section
INSERT INTO page_sections (id, page_id, key, type, enabled, sort_order, settings_json)
VALUES (
  '00000000-0000-4000-a000-000000000002',
  'cae9f9ec-6fd9-457c-a4c5-79df832e95eb',
  'testimonials',
  'testimonials-ref',
  1,
  1,
  NULL
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000003',
  '00000000-0000-4000-a000-000000000002',
  'ru',
  '{"title": "Реальные результаты моих клиентов"}'
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000004',
  '00000000-0000-4000-a000-000000000002',
  'uk',
  '{"title": "Реальні результати моїх клієнтів"}'
);

-- 3. CTA section
INSERT INTO page_sections (id, page_id, key, type, enabled, sort_order, settings_json)
VALUES (
  '00000000-0000-4000-a000-000000000003',
  'cae9f9ec-6fd9-457c-a4c5-79df832e95eb',
  'cta',
  'cta',
  1,
  2,
  NULL
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000005',
  '00000000-0000-4000-a000-000000000003',
  'ru',
  '{"title": "Готовы начать?", "subtitle": "Запишитесь на бесплатную 15-минутную консультацию, чтобы обсудить ваш запрос и понять, подходит ли вам этот метод.", "buttonText": "Записаться", "buttonLink": "/ru/kontakty"}'
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000006',
  '00000000-0000-4000-a000-000000000003',
  'uk',
  '{"title": "Готові почати?", "subtitle": "Запишіться на безкоштовну 15-хвилинну консультацію, щоб обговорити ваш запит і зрозуміти, чи підходить вам цей метод.", "buttonText": "Записатися", "buttonLink": "/uk/kontakty"}'
);

-- 4. Contact form section
INSERT INTO page_sections (id, page_id, key, type, enabled, sort_order, settings_json)
VALUES (
  '00000000-0000-4000-a000-000000000004',
  'cae9f9ec-6fd9-457c-a4c5-79df832e95eb',
  'contact',
  'contact-form',
  1,
  3,
  NULL
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000007',
  '00000000-0000-4000-a000-000000000004',
  'ru',
  '{"title": "Свяжитесь со мной"}'
);

INSERT INTO page_section_translations (id, section_id, locale, content_json)
VALUES (
  '00000000-0000-4000-b000-000000000008',
  '00000000-0000-4000-a000-000000000004',
  'uk',
  '{"title": "Зв\'яжіться зі мною"}'
);

-- Done.
