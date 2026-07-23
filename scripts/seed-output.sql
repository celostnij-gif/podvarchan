-- Podvarchan Full Database Seed — 2026-07-21T17:16:38.654Z
-- Idempotent: INSERT OR IGNORE on all tables
-- For FRESH databases only (or run after TRUNCATE)
-- FK constraints disabled during seed for safety

PRAGMA foreign_keys = OFF;

-- USERS
INSERT OR IGNORE INTO users (id,email,password_hash,name,role,is_active,created_at,updated_at) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','celostnij@gmail.com','$2b$10$placeholder','Костянтин','OWNER',1,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z');

-- SITE_SETTINGS
INSERT OR IGNORE INTO site_settings (key,value_json,updated_by_id,updated_at) VALUES
('site_name','{"ru":"Подварчан","uk":"Подварчан"}','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('site_description','{"ru":"Гипнотерапия онлайн","uk":"Гіпнотерапія онлайн"}','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('site_tagline','{"ru":"Избавьтесь от тревоги и верните спокойствие","uk":"Позбавтеся тривоги та поверніть спокій"}','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('logo_alt','{"ru":"Подварчан — гипнотерапия онлайн","uk":"Подварчан — гіпнотерапія онлайн"}','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('og_default_image','null','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('schema_org_json','{"@type":"MedicalBusiness","name":"Подварчан"}','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('analytics_id','null','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('yandex_metrika_id','null','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('facebook_pixel_id','null','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('email_from','noreply@podvarchan.com','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('phone','+380XXYYYZZZZ','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('working_hours','{"ru":"Пн-Пт 10:00-20:00","uk":"Пн-Пт 10:00-20:00"}','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z'),
('currency','USD','a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','2026-07-21T17:16:38.655Z');

-- CONTACT_CHANNELS
INSERT OR IGNORE INTO contact_channels (id,type,label,value,url,is_primary,is_enabled,sort_order) VALUES
('ch-tg','TELEGRAM','Telegram','@podvarchan','https://t.me/podvarchan',1,1,0),
('ch-wa','WHATSAPP','WhatsApp','+380XXYYYZZZZ','https://wa.me/380XXYYYZZZZ',0,1,1),
('ch-em','EMAIL','Email','celostnij@gmail.com','mailto:celostnij@gmail.com',0,1,2);

-- NAVIGATION_ITEMS
INSERT OR IGNORE INTO navigation_items (id,location,parent_id,href,label_ru,label_uk,is_enabled,sort_order) VALUES
('n-home','HEADER',NULL,'/','Главная','Головна',1,0),
('n-svc','HEADER',NULL,'/uslugi','Услуги','Послуги',1,1),
('n-method','HEADER',NULL,'/metod','Метод','Метод',1,2),
('n-about','HEADER',NULL,'/ob-avtore','Об авторе','Про автора',1,3),
('n-blog','HEADER',NULL,'/blog','Блог','Блог',1,4),
('n-faq','HEADER',NULL,'/faq','FAQ','FAQ',1,5),
('n-price','HEADER',NULL,'/tseny','Цены','Ціни',1,6),
('n-contacts','HEADER',NULL,'/kontakty','Контакти','Контакти',1,7),
('n-home-f','FOOTER',NULL,'/','Главная','Головна',1,0),
('n-svc-f','FOOTER',NULL,'/uslugi','Услуги','Послуги',1,1),
('n-blog-f','FOOTER',NULL,'/blog','Блог','Блог',1,2),
('n-ct-f','FOOTER',NULL,'/kontakty','Контакти','Контакти',1,3);

-- PAGES
INSERT OR IGNORE INTO pages (id,type,status,sort_order,published_at,created_at,updated_at) VALUES
('cae9f9ec-6fd9-457c-a4c5-79df832e95eb','HOME','PUBLISHED',0,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('806b5d28-b788-4836-bdd6-952302a2284a','ABOUT','PUBLISHED',1,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('7df7aadb-b4f2-4f1c-8722-decda9379aa3','METHOD','PUBLISHED',2,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('c7c7cc41-527f-48cb-b31c-77aa87793d8c','FAQ','PUBLISHED',3,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('46cae533-e67c-4cc1-b16f-b6dfa951b116','CONTACTS','PUBLISHED',4,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('cd4a1923-eeba-4e26-8fc4-8358640eac4d','PRIVACY','PUBLISHED',5,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('2fea5355-3b2c-4d83-9b67-1bd41ad080ae','DISCLAIMER','PUBLISHED',6,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('41f764f7-54e5-41d7-b092-f4bcae43ae28','PRICING','PUBLISHED',7,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z');

INSERT OR IGNORE INTO page_translations (id,page_id,locale,slug,title,excerpt,content_json,seo_meta_id) VALUES
('pt-home-ru','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','ru','/','Гипнотерапия онлайн — избавьтесь от тревоги и верните спокойствие','Гипнотерапия онлайн от сертифицированного специалиста. Мягкая работа с тревогой, паническими атаками, самосаботажем и подсознанием через эриксоновский гипноз.',NULL,NULL),
('pt-home-uk','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','uk','/','Гіпнотерапія онлайн — позбавтеся тривоги та поверніть спокій','Гипнотерапия онлайн от сертифицированного специалиста. Мягкая работа с тревогой, паническими атаками, самосаботажем и подсознанием через эриксоновский гипноз.',NULL,NULL),
('pt-about-ru','806b5d28-b788-4836-bdd6-952302a2284a','ru','ob-avtore','Гипнотерапевт онлайн','Сертифицированный гипнотерапевт онлайн, основатель школы «Пробудология».',NULL,NULL),
('pt-about-uk','806b5d28-b788-4836-bdd6-952302a2284a','uk','ob-avtore','Гіпнотерапевт онлайн','Сертифицированный гипнотерапевт онлайн, основатель школы «Пробудология».',NULL,NULL),
('pt-method-ru','7df7aadb-b4f2-4f1c-8722-decda9379aa3','ru','metod','Авторский метод','Авторский метод гипнотерапии: эриксоновский гипноз, регрессия, КПТ.',NULL,NULL),
('pt-method-uk','7df7aadb-b4f2-4f1c-8722-decda9379aa3','uk','metod','Авторський метод','Авторский метод гипнотерапии: эриксоновский гипноз, регрессия, КПТ.',NULL,NULL),
('pt-faq-ru','c7c7cc41-527f-48cb-b31c-77aa87793d8c','ru','faq','FAQ — вопросы и ответы о гипнотерапии','Ответы на частые вопросы о гипнотерапии онлайн.',NULL,NULL),
('pt-faq-uk','c7c7cc41-527f-48cb-b31c-77aa87793d8c','uk','faq','FAQ — питання та відповіді про гіпнотерапію','Ответы на частые вопросы о гипнотерапии онлайн.',NULL,NULL),
('pt-contacts-ru','46cae533-e67c-4cc1-b16f-b6dfa951b116','ru','kontakty','Контакти','Запись на сессию гипнотерапии онлайн. Бесплатная 15-минутная диагностическая консультация.',NULL,NULL),
('pt-contacts-uk','46cae533-e67c-4cc1-b16f-b6dfa951b116','uk','kontakty','Контакти','Запись на сессию гипнотерапии онлайн. Бесплатная 15-минутная диагностическая консультация.',NULL,NULL),
('pt-privacy-ru','cd4a1923-eeba-4e26-8fc4-8358640eac4d','ru','politika-konfidentsialnosti','Политика конфиденциальности','Политика конфиденциальности и обработки персональных данных.',NULL,NULL),
('pt-privacy-uk','cd4a1923-eeba-4e26-8fc4-8358640eac4d','uk','politika-konfidentsialnosti','Політика конфіденційності','Политика конфиденциальности и обработки персональных данных.',NULL,NULL),
('pt-disclaimer-ru','2fea5355-3b2c-4d83-9b67-1bd41ad080ae','ru','disclaimer','Дисклеймер','Юридическое уведомление: гипнотерапия онлайн — немедицинский метод.',NULL,NULL),
('pt-disclaimer-uk','2fea5355-3b2c-4d83-9b67-1bd41ad080ae','uk','disclaimer','Дисклеймер','Юридическое уведомление: гипнотерапия онлайн — немедицинский метод.',NULL,NULL),
('pt-pricing-ru','41f764f7-54e5-41d7-b092-f4bcae43ae28','ru','tseny','Стоимость гипнотерапии онлайн — цены на сессии','Стоимость сессий гипнотерапии онлайн от 50$.',NULL,NULL),
('pt-pricing-uk','41f764f7-54e5-41d7-b092-f4bcae43ae28','uk','tseny','Вартість гіпнотерапії онлайн — ціни на сесії','Стоимость сессий гипнотерапии онлайн от 50$.',NULL,NULL);


-- PAGE_SECTIONS
INSERT OR IGNORE INTO page_sections (id,page_id,key,type,enabled,sort_order,settings_json) VALUES
('ps-home-hero','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','hero','hero',1,0,NULL),
('ps-home-test','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','testimonials','testimonials-ref',1,1,NULL),
('ps-home-cta','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','cta','cta',1,2,NULL),
('ps-home-ct','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','contact','contact-form',1,3,NULL),
('ps-about-hero','806b5d28-b788-4836-bdd6-952302a2284a','hero','hero',1,0,NULL),
('ps-about-text','806b5d28-b788-4836-bdd6-952302a2284a','about-text','text-block',1,1,NULL),
('ps-meth-hero','7df7aadb-b4f2-4f1c-8722-decda9379aa3','hero','hero',1,0,NULL),
('ps-meth-text','7df7aadb-b4f2-4f1c-8722-decda9379aa3','method-text','text-block',1,1,NULL),
('ps-ct-hero','46cae533-e67c-4cc1-b16f-b6dfa951b116','hero','hero',1,0,NULL),
('ps-ct-form','46cae533-e67c-4cc1-b16f-b6dfa951b116','contact','contact-form',1,1,NULL),
('ps-pr-hero','41f764f7-54e5-41d7-b092-f4bcae43ae28','hero','hero',1,0,NULL),
('ps-pr-text','41f764f7-54e5-41d7-b092-f4bcae43ae28','pricing-text','text-block',1,1,NULL),
('ps-faq-hero','c7c7cc41-527f-48cb-b31c-77aa87793d8c','hero','hero',1,0,NULL),
('ps-faq-list','c7c7cc41-527f-48cb-b31c-77aa87793d8c','faq-list','faq-group-ref',1,1,NULL);

INSERT OR IGNORE INTO page_section_translations (id,section_id,locale,content_json) VALUES
('ps-home-hero-ru','ps-home-hero','ru','{"ru":"Гипнотерапия онлайн — избавьтесь от тревоги","uk":"Гіпнотерапія онлайн — позбавтеся тривоги"}'),
('ps-home-hero-uk','ps-home-hero','uk','{"ru":"<p>Сертифицированный гипнотерапевт. Бесплатная диагностика 15 мин.</p>","uk":"<p>Сертифікований гіпнотерапевт. Безкоштовна діагностика 15 хв.</p>"}'),
('ps-home-test-ru','ps-home-test','ru',NULL),
('ps-home-test-uk','ps-home-test','uk',NULL),
('ps-home-cta-ru','ps-home-cta','ru','{"ru":"Запишитесь на бесплатную диагностику","uk":"Запишіться на безкоштовну діагностику"}'),
('ps-home-cta-uk','ps-home-cta','uk','{"ru":"<p>15 минут — и мы поймём, с чем работать.</p>","uk":"<p>15 хвилин — і ми зрозуміємо, з чим працювати.</p>"}'),
('ps-home-ct-ru','ps-home-ct','ru',NULL),
('ps-home-ct-uk','ps-home-ct','uk',NULL),
('ps-about-hero-ru','ps-about-hero','ru','{"ru":"Об авторе — Подварчан","uk":"Про автора — Подварчан"}'),
('ps-about-hero-uk','ps-about-hero','uk','{"ru":"<p>Сертифицированный гипнотерапевт, основатель школы «Пробудология».</p>","uk":"<p>Сертифікований гіпнотерапевт, засновник школи «Пробудологія».</p>"}'),
('ps-about-text-ru','ps-about-text','ru','{"ru":"Мой путь в гипнотерапии","uk":"Мій шлях у гіпнотерапії"}'),
('ps-about-text-uk','ps-about-text','uk','{"ru":"<p>Помогаю людям избавиться от тревоги через эриксоновский гипноз.</p>","uk":"<p>Допомагаю людям позбутися тривоги через еріксонівський гіпноз.</p>"}'),
('ps-meth-hero-ru','ps-meth-hero','ru','{"ru":"Авторский метод","uk":"Авторський метод"}'),
('ps-meth-hero-uk','ps-meth-hero','uk','{"ru":"<p>Эриксоновский гипноз + регрессия + КПТ.</p>","uk":"<p>Еріксонівський гіпноз + регресія + КПТ.</p>"}'),
('ps-meth-text-ru','ps-meth-text','ru','{"ru":"Три направления","uk":"Три напрямки"}'),
('ps-meth-text-uk','ps-meth-text','uk','{"ru":"<p>Гипноз, регрессия, когнитивно-поведенческие техники.</p>","uk":"<p>Гіпноз, регресія, когнітивно-поведінкові техніки.</p>"}'),
('ps-ct-hero-ru','ps-ct-hero','ru','{"ru":"Контакти","uk":"Контакти"}'),
('ps-ct-hero-uk','ps-ct-hero','uk','{"ru":"<p>Свяжитесь удобным способом.</p>","uk":"<p>Зв''яжіться зручним способом.</p>"}'),
('ps-ct-form-ru','ps-ct-form','ru',NULL),
('ps-ct-form-uk','ps-ct-form','uk',NULL),
('ps-pr-hero-ru','ps-pr-hero','ru','{"ru":"Стоимость","uk":"Вартість"}'),
('ps-pr-hero-uk','ps-pr-hero','uk','{"ru":"<p>Сессии от 50$. Диагностика бесплатно.</p>","uk":"<p>Сесії від 50$. Діагностика безкоштовно.</p>"}'),
('ps-pr-text-ru','ps-pr-text','ru','{"ru":"Цены","uk":"Ціни"}'),
('ps-pr-text-uk','ps-pr-text','uk','{"ru":"<p>Индивидуальные сессии — от 50$.</p>","uk":"<p>Індивідуальні сесії — від 50$.</p>"}'),
('ps-faq-hero-ru','ps-faq-hero','ru','{"ru":"FAQ","uk":"FAQ"}'),
('ps-faq-hero-uk','ps-faq-hero','uk','{"ru":"<p>Ответы на частые вопросы.</p>","uk":"<p>Відповіді на часті питання.</p>"}'),
('ps-faq-list-ru','ps-faq-list','ru',NULL),
('ps-faq-list-uk','ps-faq-list','uk',NULL);

-- SERVICES
INSERT OR IGNORE INTO services (id,slug_base,icon,category,priority,status,featured,sort_order,created_at,updated_at) VALUES
('faef4e9a-0456-4565-ae0f-55895dded08a','gipnoterapiya-onlayn','Brain','core',19,'PUBLISHED',1,0,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('db6bfe35-5c70-4765-8673-6ea8d894f1c7','onlajn-konsultaciya-psyhologa','Heart','core',18,'PUBLISHED',1,1,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('29323703-899a-429b-a2b1-fecb80df9595','psyholog-bioenergetyk','Zap','core',17,'PUBLISHED',1,2,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('f9fd52ff-7d68-4181-954a-f290887cfbf0','trevoga-i-panicheskiye-ataki','AlertTriangle','trevoga',16,'PUBLISHED',0,3,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('2ba12c5f-17b3-44eb-8920-dd24a029ed71','rabota-s-podsoznaniem','Eye','core',15,'PUBLISHED',0,4,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('1ed63afd-b02c-43d3-a7ef-924528ae9de2','samosabotazh-i-bloki','ShieldOff','core',14,'PUBLISHED',0,5,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('5be03dea-c042-4c9c-a669-50855dd74674','emotsionalnoye-vygoraniye','Flame','core',13,'PUBLISHED',0,6,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('df37035c-5d2b-4075-bda7-7bc9b176e7bb','neyverennost-i-strakh-provala','UserX','core',12,'PUBLISHED',0,7,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('aa146d45-97ab-4dd6-857a-6d6fee5c273e','psikhosomatika','Activity','core',11,'PUBLISHED',0,8,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('4526d523-7a9a-4057-9eda-d0f9832f3a37','lichnostnyy-krizis','Compass','core',10,'PUBLISHED',0,9,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('fedc832c-de4c-43be-b8ce-81c9da33a82f','kak-izbavitsya-ot-trevogi','Sunrise','trevoga',9,'PUBLISHED',0,10,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('12a935bf-6f40-4302-9c1e-edaab575f98d','postoyannaya-trevoga-bez-prichiny','CloudRain','trevoga',8,'PUBLISHED',0,11,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('2b6bbcce-cdeb-40a0-b244-413203a17789','utrennyaya-trevoga','Sun','trevoga',7,'PUBLISHED',0,12,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('f947832e-2d7f-4897-a943-9aa3631e7a36','trevoga-pered-snom','Moon','trevoga',6,'PUBLISHED',0,13,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('f9958e0b-9e16-47a4-94b9-cd4c09a00812','trevoga-posle-stressa','HeartCrack','trevoga',5,'PUBLISHED',0,14,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('e2975198-4a6a-480b-bfbf-1bc1b9ee103b','vnutrenneye-napryazheniye','Gauge','core',4,'PUBLISHED',0,15,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('e18ae8e5-7d07-40a8-a907-326f6c40a734','navyazchivye-mysli','Repeat','core',3,'PUBLISHED',0,16,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('feee6236-4b38-437c-83a0-14589bd9683c','strakh-budushchego','CalendarClock','core',2,'PUBLISHED',0,17,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z'),
('cd442495-e194-4d1e-8376-f7b883adbaf8','tsifrovoy-detoks-i-gadzhet-zavisimost','Smartphone','core',1,'PUBLISHED',0,18,'2026-07-21T17:16:38.655Z','2026-07-21T17:16:38.655Z');

INSERT OR IGNORE INTO service_translations (id,service_id,locale,slug,title,short_title,description,hero_title,hero_subtitle,symptoms_json,process_json,benefits_json,faq_json,cta_text,seo_meta_id) VALUES
('gipnoterapiya-onlayn-ru','faef4e9a-0456-4565-ae0f-55895dded08a','ru','gipnoterapiya-onlayn','Гипнотерапия онлайн','Гипнотерапия онлайн','Сеансы эриксоновского гипноза онлайн для работы с подсознанием, тревогой, страхами.','Гипнотерапия онлайн',NULL,'["Постоянная тревога","Панические атаки","Страхи","Ограничивающие убеждения"]',NULL,NULL,NULL,'Записаться',NULL),
('gipnoterapiya-onlayn-uk','faef4e9a-0456-4565-ae0f-55895dded08a','uk','gipnoterapiya-onlayn','Гіпнотерапія онлайн','Гіпнотерапія онлайн','Сеанси еріксонівського гіпнозу онлайн для роботи з підсвідомістю, тривогою, страхами.','Гіпнотерапія онлайн',NULL,'["Постоянная тревога","Панические атаки","Страхи","Ограничивающие убеждения"]',NULL,NULL,NULL,'Записатися',NULL),
('onlajn-konsultaciya-psyhologa-ru','db6bfe35-5c70-4765-8673-6ea8d894f1c7','ru','onlajn-konsultaciya-psyhologa','Психолог онлайн','Психолог онлайн','Индивидуальные онлайн-консультации психолога. Бережный подход.','Психолог онлайн',NULL,'["Тревожность","Депрессия","Кризис","Выгорание"]',NULL,NULL,NULL,'Записаться',NULL),
('onlajn-konsultaciya-psyhologa-uk','db6bfe35-5c70-4765-8673-6ea8d894f1c7','uk','onlajn-konsultaciya-psyhologa','Консультація психолога онлайн','Консультація психолога онлайн','Індивідуальні онлайн-консультації психолога. Бережний підхід.','Консультація психолога онлайн',NULL,'["Тревожность","Депрессия","Кризис","Выгорание"]',NULL,NULL,NULL,'Записатися',NULL),
('psyholog-bioenergetyk-ru','29323703-899a-429b-a2b1-fecb80df9595','ru','psyholog-bioenergetyk','Психолог-биоэнергетик','Психолог-биоэнергетик','Синергия психотерапии и биоэнергетических практик.','Психолог-биоэнергетик',NULL,'["Выгорание","Хроническая усталость","Стресс"]',NULL,NULL,NULL,'Записаться',NULL),
('psyholog-bioenergetyk-uk','29323703-899a-429b-a2b1-fecb80df9595','uk','psyholog-bioenergetyk','Психолог-біоенергетик','Психолог-біоенергетик','Синергія психотерапії та біоенергетичних практик.','Психолог-біоенергетик',NULL,'["Выгорание","Хроническая усталость","Стресс"]',NULL,NULL,NULL,'Записатися',NULL),
('trevoga-i-panicheskiye-ataki-ru','f9fd52ff-7d68-4181-954a-f290887cfbf0','ru','trevoga-i-panicheskiye-ataki','Тревога и панические атаки','Тревога и панические атаки','Гипнотерапия тревоги и панических атак. Работа с первопричиной.','Тревога и панические атаки',NULL,'["Панические атаки","Хроническая тревога","Страх смерти"]',NULL,NULL,NULL,'Записаться',NULL),
('trevoga-i-panicheskiye-ataki-uk','f9fd52ff-7d68-4181-954a-f290887cfbf0','uk','trevoga-i-panicheskiye-ataki','Тривога та панічні атаки','Тривога та панічні атаки','Гіпнотерапія тривоги та панічних атак. Робота з першопричиною.','Тривога та панічні атаки',NULL,'["Панические атаки","Хроническая тревога","Страх смерти"]',NULL,NULL,NULL,'Записатися',NULL),
('rabota-s-podsoznaniem-ru','2ba12c5f-17b3-44eb-8920-dd24a029ed71','ru','rabota-s-podsoznaniem','Работа с подсознанием','Работа с подсознанием','Гипноз для проработки подсознания: убираем блоки.','Работа с подсознанием',NULL,'["Ограничивающие убеждения","Денежные блоки","Самосаботаж"]',NULL,NULL,NULL,'Записаться',NULL),
('rabota-s-podsoznaniem-uk','2ba12c5f-17b3-44eb-8920-dd24a029ed71','uk','rabota-s-podsoznaniem','Робота з підсвідомістю','Робота з підсвідомістю','Гіпноз для опрацювання підсвідомості: прибираємо блоки.','Робота з підсвідомістю',NULL,'["Ограничивающие убеждения","Денежные блоки","Самосаботаж"]',NULL,NULL,NULL,'Записатися',NULL),
('samosabotazh-i-bloki-ru','1ed63afd-b02c-43d3-a7ef-924528ae9de2','ru','samosabotazh-i-bloki','Самосаботаж и блоки','Самосаботаж и блоки','Избавление от самосаботажа и прокрастинации через гипнотерапию.','Самосаботаж и блоки',NULL,'["Прокрастинация","Страх успеха","Внутренний критик"]',NULL,NULL,NULL,'Записаться',NULL),
('samosabotazh-i-bloki-uk','1ed63afd-b02c-43d3-a7ef-924528ae9de2','uk','samosabotazh-i-bloki','Самосаботаж і блоки','Самосаботаж і блоки','Позбавлення від самосаботажу та прокрастинації через гіпнотерапію.','Самосаботаж і блоки',NULL,'["Прокрастинация","Страх успеха","Внутренний критик"]',NULL,NULL,NULL,'Записатися',NULL),
('emotsionalnoye-vygoraniye-ru','5be03dea-c042-4c9c-a669-50855dd74674','ru','emotsionalnoye-vygoraniye','Эмоциональное выгорание','Эмоциональное выгорание','Восстановление энергии и ресурса после выгорания.','Эмоциональное выгорание',NULL,'["Истощение","Цинизм","Потеря смысла"]',NULL,NULL,NULL,'Записаться',NULL),
('emotsionalnoye-vygoraniye-uk','5be03dea-c042-4c9c-a669-50855dd74674','uk','emotsionalnoye-vygoraniye','Емоційне вигорання','Емоційне вигорання','Відновлення енергії та ресурсу після вигорання.','Емоційне вигорання',NULL,'["Истощение","Цинизм","Потеря смысла"]',NULL,NULL,NULL,'Записатися',NULL),
('neyverennost-i-strakh-provala-ru','df37035c-5d2b-4075-bda7-7bc9b176e7bb','ru','neyverennost-i-strakh-provala','Неуверенность и страх провала','Неуверенность и страх провала','Преодолейте неуверенность и синдром самозванца.','Неуверенность и страх провала',NULL,'["Синдром самозванца","Перфекционизм","Сравнение"]',NULL,NULL,NULL,'Записаться',NULL),
('neyverennost-i-strakh-provala-uk','df37035c-5d2b-4075-bda7-7bc9b176e7bb','uk','neyverennost-i-strakh-provala','Невпевненість і страх невдачі','Невпевненість і страх невдачі','Подолайте невпевненість та синдром самозванця.','Невпевненість і страх невдачі',NULL,'["Синдром самозванца","Перфекционизм","Сравнение"]',NULL,NULL,NULL,'Записатися',NULL),
('psikhosomatika-ru','aa146d45-97ab-4dd6-857a-6d6fee5c273e','ru','psikhosomatika','Психосоматика','Психосоматика','Снятие телесных симптомов стресса через гипнотерапию.','Психосоматика',NULL,'["Головные боли","Боли в спине","Бессонница"]',NULL,NULL,NULL,'Записаться',NULL),
('psikhosomatika-uk','aa146d45-97ab-4dd6-857a-6d6fee5c273e','uk','psikhosomatika','Психосоматика','Психосоматика','Зняття тілесних симптомів стресу через гіпнотерапію.','Психосоматика',NULL,'["Головные боли","Боли в спине","Бессонница"]',NULL,NULL,NULL,'Записатися',NULL),
('lichnostnyy-krizis-ru','4526d523-7a9a-4057-9eda-d0f9832f3a37','ru','lichnostnyy-krizis','Личностный кризис','Личностный кризис','Поиск себя, новых смыслов и направления в жизни.','Личностный кризис',NULL,'["Потеря смысла","Экзистенциальный кризис","Пустота"]',NULL,NULL,NULL,'Записаться',NULL),
('lichnostnyy-krizis-uk','4526d523-7a9a-4057-9eda-d0f9832f3a37','uk','lichnostnyy-krizis','Особистісна криза','Особистісна криза','Пошук себе, нових сенсів і напрямку в житті.','Особистісна криза',NULL,'["Потеря смысла","Экзистенциальный кризис","Пустота"]',NULL,NULL,NULL,'Записатися',NULL),
('kak-izbavitsya-ot-trevogi-ru','fedc832c-de4c-43be-b8ce-81c9da33a82f','ru','kak-izbavitsya-ot-trevogi','Как избавиться от тревоги','Как избавиться от тревоги','Гипнотерапия убирает внутреннюю причину тревоги.','Как избавиться от тревоги',NULL,'["Постоянная тревога","Тревожные мысли","Бессонница"]',NULL,NULL,NULL,'Записаться',NULL),
('kak-izbavitsya-ot-trevogi-uk','fedc832c-de4c-43be-b8ce-81c9da33a82f','uk','kak-izbavitsya-ot-trevogi','Як позбутися тривоги','Як позбутися тривоги','Гіпнотерапія усуває внутрішню причину тривоги.','Як позбутися тривоги',NULL,'["Постоянная тревога","Тревожные мысли","Бессонница"]',NULL,NULL,NULL,'Записатися',NULL),
('postoyannaya-trevoga-bez-prichiny-ru','12a935bf-6f40-4302-9c1e-edaab575f98d','ru','postoyannaya-trevoga-bez-prichiny','Постоянная тревога без причины','Постоянная тревога без причины','Сигнал подсознания о скрытом конфликте.','Постоянная тревога без причины',NULL,'["Беспричинная тревога","Ожидание беды","Напряжение"]',NULL,NULL,NULL,'Записаться',NULL),
('postoyannaya-trevoga-bez-prichiny-uk','12a935bf-6f40-4302-9c1e-edaab575f98d','uk','postoyannaya-trevoga-bez-prichiny','Постійна тривога без причини','Постійна тривога без причини','Сигнал підсвідомості про прихований конфлікт.','Постійна тривога без причини',NULL,'["Беспричинная тревога","Ожидание беды","Напряжение"]',NULL,NULL,NULL,'Записатися',NULL),
('utrennyaya-trevoga-ru','2b6bbcce-cdeb-40a0-b244-413203a17789','ru','utrennyaya-trevoga','Утренняя тревога','Утренняя тревога','Гипнотерапия убирает кортизоловый скачок.','Утренняя тревога',NULL,'["Тревога при пробуждении","Учащённое сердцебиение","Страх"]',NULL,NULL,NULL,'Записаться',NULL),
('utrennyaya-trevoga-uk','2b6bbcce-cdeb-40a0-b244-413203a17789','uk','utrennyaya-trevoga','Ранкова тривога','Ранкова тривога','Гіпнотерапія знижує рівень кортизолу вранці.','Ранкова тривога',NULL,'["Тревога при пробуждении","Учащённое сердцебиение","Страх"]',NULL,NULL,NULL,'Записатися',NULL),
('trevoga-pered-snom-ru','f947832e-2d7f-4897-a943-9aa3631e7a36','ru','trevoga-pered-snom','Тревога перед сном','Тревога перед сном','Гипнотерапия успокаивает ум и возвращает здоровый сон.','Тревога перед сном',NULL,'["Бессонница","Ночные кошмары","Страх засыпания"]',NULL,NULL,NULL,'Записаться',NULL),
('trevoga-pered-snom-uk','f947832e-2d7f-4897-a943-9aa3631e7a36','uk','trevoga-pered-snom','Тривога перед сном','Тривога перед сном','Гіпнотерапія заспокоює і допомагає повернути здоровий сон.','Тривога перед сном',NULL,'["Бессонница","Ночные кошмары","Страх засыпания"]',NULL,NULL,NULL,'Записатися',NULL),
('trevoga-posle-stressa-ru','f9958e0b-9e16-47a4-94b9-cd4c09a00812','ru','trevoga-posle-stressa','Тревога после стресса','Тревога после стресса','Гипнотерапия мягко снимает постстрессовое напряжение.','Тревога после стресса',NULL,'["Постстрессовая тревога","Гипервозбудимость","Вздрагивания"]',NULL,NULL,NULL,'Записаться',NULL),
('trevoga-posle-stressa-uk','f9958e0b-9e16-47a4-94b9-cd4c09a00812','uk','trevoga-posle-stressa','Тривога після стресу','Тривога після стресу','Гіпнотерапія знімає наслідки стресу.','Тривога після стресу',NULL,'["Постстрессовая тревога","Гипервозбудимость","Вздрагивания"]',NULL,NULL,NULL,'Записатися',NULL),
('vnutrenneye-napryazheniye-ru','e2975198-4a6a-480b-bfbf-1bc1b9ee103b','ru','vnutrenneye-napryazheniye','Внутреннее напряжение','Внутреннее напряжение','Гипнотерапия снимает глубинные зажимы.','Внутреннее напряжение',NULL,'["Хроническое напряжение","Мышечные зажимы","Головные боли"]',NULL,NULL,NULL,'Записаться',NULL),
('vnutrenneye-napryazheniye-uk','e2975198-4a6a-480b-bfbf-1bc1b9ee103b','uk','vnutrenneye-napryazheniye','Внутрішня напруга','Внутрішня напруга','Гіпнотерапія знімає глибинні затискачі.','Внутрішня напруга',NULL,'["Хроническое напряжение","Мышечные зажимы","Головные боли"]',NULL,NULL,NULL,'Записатися',NULL),
('navyazchivye-mysli-ru','e18ae8e5-7d07-40a8-a907-326f6c40a734','ru','navyazchivye-mysli','Навязчивые мысли','Навязчивые мысли','Гипнотерапия останавливает ментальную жвачку.','Навязчивые мысли',NULL,'["Навязчивые мысли","Ментальная жвачка","Бессонница"]',NULL,NULL,NULL,'Записаться',NULL),
('navyazchivye-mysli-uk','e18ae8e5-7d07-40a8-a907-326f6c40a734','uk','navyazchivye-mysli','Нав''язливі думки','Нав''язливі думки','Гіпнотерапія зупиняє ментальну жуйку.','Нав''язливі думки',NULL,'["Навязчивые мысли","Ментальная жвачка","Бессонница"]',NULL,NULL,NULL,'Записатися',NULL),
('strakh-budushchego-ru','feee6236-4b38-437c-83a0-14589bd9683c','ru','strakh-budushchego','Страх будущего','Страх будущего','Гипнотерапия убирает тревожное ожидание.','Страх будущего',NULL,'["Тревога о будущем","Катастрофизация","Страх неизвестности"]',NULL,NULL,NULL,'Записаться',NULL),
('strakh-budushchego-uk','feee6236-4b38-437c-83a0-14589bd9683c','uk','strakh-budushchego','Страх майбутнього','Страх майбутнього','Гіпнотерапія усуває тривожне очікування.','Страх майбутнього',NULL,'["Тревога о будущем","Катастрофизация","Страх неизвестности"]',NULL,NULL,NULL,'Записатися',NULL),
('tsifrovoy-detoks-i-gadzhet-zavisimost-ru','cd442495-e194-4d1e-8376-f7b883adbaf8','ru','tsifrovoy-detoks-i-gadzhet-zavisimost','Цифровой детокс','Цифровой детокс','Работа с гаджетозависимостью через гипнотерапию.','Цифровой детокс',NULL,'["Гаджетозависимость","Думскроллинг","Потеря времени"]',NULL,NULL,NULL,'Записаться',NULL),
('tsifrovoy-detoks-i-gadzhet-zavisimost-uk','cd442495-e194-4d1e-8376-f7b883adbaf8','uk','tsifrovoy-detoks-i-gadzhet-zavisimost','Цифровий детокс','Цифровий детокс','Робота з гаджетозалежністю через гіпнотерапію.','Цифровий детокс',NULL,'["Гаджетозависимость","Думскроллинг","Потеря времени"]',NULL,NULL,NULL,'Записатися',NULL);

-- BLOG_CATEGORIES
INSERT OR IGNORE INTO blog_categories (id,slug_base,service_id,sort_order,status) VALUES
('bc-trevoga','trevoga',NULL,0,'PUBLISHED'),
('bc-gipno','gipnoterapiya',NULL,1,'PUBLISHED'),
('bc-samo','samosabotazh',NULL,2,'PUBLISHED'),
('bc-podsoz','podsoznanie',NULL,3,'PUBLISHED'),
('bc-psiko','psikhosomatika',NULL,4,'PUBLISHED'),
('bc-never','neyverennost',NULL,5,'PUBLISHED'),
('bc-detoks','tsifrovoy-detoks',NULL,6,'PUBLISHED'),
('bc-vigoran','vygoraniye',NULL,7,'PUBLISHED'),
('bc-krizis','krizis',NULL,8,'PUBLISHED'),
('bc-ptsr','ptsr',NULL,9,'PUBLISHED');

INSERT OR IGNORE INTO blog_category_translations (id,category_id,locale,slug,name,description,seo_meta_id) VALUES
('bc-trevoga-ru','bc-trevoga','ru','trevoga','Тревога','Статьи о тревоге, панических атаках и способах работы с ними.',NULL),
('bc-trevoga-uk','bc-trevoga','uk','trevoga','Тривога','Статьи о тревоге, панических атаках и способах работы с ними.',NULL),
('bc-gipno-ru','bc-gipno','ru','gipnoterapiya','Гипнотерапия','Всё о гипнотерапии: методы, техники, безопасность.',NULL),
('bc-gipno-uk','bc-gipno','uk','gipnoterapiya','Гіпнотерапія','Всё о гипнотерапии: методы, техники, безопасность.',NULL),
('bc-samo-ru','bc-samo','ru','samosabotazh','Самосаботаж','Почему мы саботируем свои цели и как с этим работать.',NULL),
('bc-samo-uk','bc-samo','uk','samosabotazh','Самосаботаж','Почему мы саботируем свои цели и как с этим работать.',NULL),
('bc-podsoz-ru','bc-podsoz','ru','podsoznanie','Подсознание','Как работает подсознание и ограничивающие убеждения.',NULL),
('bc-podsoz-uk','bc-podsoz','uk','podsoznanie','Підсвідомість','Как работает подсознание и ограничивающие убеждения.',NULL),
('bc-psiko-ru','bc-psiko','ru','psikhosomatika','Психосоматика','Как эмоции и стресс влияют на тело.',NULL),
('bc-psiko-uk','bc-psiko','uk','psikhosomatika','Психосоматика','Как эмоции и стресс влияют на тело.',NULL),
('bc-never-ru','bc-never','ru','neyverennost','Неуверенность','Как побороть неуверенность и синдром самозванца.',NULL),
('bc-never-uk','bc-never','uk','neyverennost','Невпевненість','Как побороть неуверенность и синдром самозванца.',NULL),
('bc-detoks-ru','bc-detoks','ru','tsifrovoy-detoks','Цифровой детокс','Как провести цифровой детокс.',NULL),
('bc-detoks-uk','bc-detoks','uk','tsifrovoy-detoks','Цифровий детокс','Как провести цифровой детокс.',NULL),
('bc-vigoran-ru','bc-vigoran','ru','vygoraniye','Выгорание','Об эмоциональном выгорании: признаки и восстановление.',NULL),
('bc-vigoran-uk','bc-vigoran','uk','vygoraniye','Вигорання','Об эмоциональном выгорании: признаки и восстановление.',NULL),
('bc-krizis-ru','bc-krizis','ru','krizis','Кризис','О личностных кризисах и экзистенциальных вопросах.',NULL),
('bc-krizis-uk','bc-krizis','uk','krizis','Криза','О личностных кризисах и экзистенциальных вопросах.',NULL),
('bc-ptsr-ru','bc-ptsr','ru','ptsr','ПТСР','О посттравматическом стрессовом расстройстве.',NULL),
('bc-ptsr-uk','bc-ptsr','uk','ptsr','ПТСР','О посттравматическом стрессовом расстройстве.',NULL);

-- BLOG_POSTS
INSERT OR IGNORE INTO blog_posts (id,category_id,author_id,status,cover_image_id,reading_minutes,published_at,scheduled_at,created_at,updated_at) VALUES
('bp-01','bc-gipno',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-02','bc-gipno',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-03','bc-trevoga',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-04','bc-trevoga',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-05','bc-trevoga',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-06','bc-samo',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-07','bc-samo',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-08','bc-vigoran',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-09','bc-psiko',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('bp-10','bc-never',NULL,'PUBLISHED',NULL,0,'2026-07-21T17:16:38.656Z',NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z');

INSERT OR IGNORE INTO blog_post_translations (id,post_id,locale,slug,title,excerpt,content_json,content_html,table_of_contents_json,faq_json,seo_meta_id) VALUES
('bp-01-ru','bp-01','ru','chto-takoe-gipnoterapiya','Что такое гипнотерапия','Подробный разбор метода: как работает гипнотерапия.',NULL,'<p>Подробный разбор метода: как работает гипнотерапия.</p>',NULL,NULL,NULL),
('bp-01-uk','bp-01','uk','chto-takoe-gipnoterapiya','Що таке гіпнотерапія','Детальний розбір методу: як працює гіпнотерапія.',NULL,'<p>Детальний розбір методу: як працює гіпнотерапія.</p>',NULL,NULL,NULL),
('bp-02-ru','bp-02','ru','kak-rabotaet-gipnoz','Как работает гипноз','Научный взгляд на гипноз и транс.',NULL,'<p>Научный взгляд на гипноз и транс.</p>',NULL,NULL,NULL),
('bp-02-uk','bp-02','uk','kak-rabotaet-gipnoz','Як працює гіпноз','Науковий погляд на гіпноз та транс.',NULL,'<p>Науковий погляд на гіпноз та транс.</p>',NULL,NULL,NULL),
('bp-03-ru','bp-03','ru','trevoga-prichiny-i-simptomy','Тревога: причины и симптомы','Откуда берётся тревога и как она проявляется.',NULL,'<p>Откуда берётся тревога и как она проявляется.</p>',NULL,NULL,NULL),
('bp-03-uk','bp-03','uk','trevoga-prichiny-i-simptomy','Тривога: причини та симптоми','Звідки береться тривога і як вона проявляється.',NULL,'<p>Звідки береться тривога і як вона проявляється.</p>',NULL,NULL,NULL),
('bp-04-ru','bp-04','ru','kak-spravitsya-s-trevogoy','Как справиться с тревогой','Практические советы по работе с тревогой.',NULL,'<p>Практические советы по работе с тревогой.</p>',NULL,NULL,NULL),
('bp-04-uk','bp-04','uk','kak-spravitsya-s-trevogoy','Як впоратися з тривогою','Практичні поради з роботи з тривогою.',NULL,'<p>Практичні поради з роботи з тривогою.</p>',NULL,NULL,NULL),
('bp-05-ru','bp-05','ru','panicheskiye-ataki-chto-delat','Панические атаки: что делать','Что происходит во время панической атаки.',NULL,'<p>Что происходит во время панической атаки.</p>',NULL,NULL,NULL),
('bp-05-uk','bp-05','uk','panicheskiye-ataki-chto-delat','Панічні атаки: що робити','Що відбувається під час панічної атаки.',NULL,'<p>Що відбувається під час панічної атаки.</p>',NULL,NULL,NULL),
('bp-06-ru','bp-06','ru','chto-takoe-samosabotazh','Что такое самосаботаж','Механизмы самосаботажа.',NULL,'<p>Механизмы самосаботажа.</p>',NULL,NULL,NULL),
('bp-06-uk','bp-06','uk','chto-takoe-samosabotazh','Що таке самосаботаж','Механізми самосаботажу.',NULL,'<p>Механізми самосаботажу.</p>',NULL,NULL,NULL),
('bp-07-ru','bp-07','ru','samosabotazh-prichiny','Самосаботаж: глубинные причины','Что стоит за самосаботажем на уровне подсознания.',NULL,'<p>Что стоит за самосаботажем на уровне подсознания.</p>',NULL,NULL,NULL),
('bp-07-uk','bp-07','uk','samosabotazh-prichiny','Самосаботаж: глибинні причини','Що стоїть за самосаботажем на рівні підсвідомості.',NULL,'<p>Що стоїть за самосаботажем на рівні підсвідомості.</p>',NULL,NULL,NULL),
('bp-08-ru','bp-08','ru','emotsionalnoye-vygoraniye-simptomy','Эмоциональное выгорание: симптомы','Как распознать выгорание на ранней стадии.',NULL,'<p>Как распознать выгорание на ранней стадии.</p>',NULL,NULL,NULL),
('bp-08-uk','bp-08','uk','emotsionalnoye-vygoraniye-simptomy','Емоційне вигорання: симптоми','Як розпізнати вигорання на ранній стадії.',NULL,'<p>Як розпізнати вигорання на ранній стадії.</p>',NULL,NULL,NULL),
('bp-09-ru','bp-09','ru','psikhosomatika-chto-eto','Психосоматика: что это такое','Как эмоции превращаются в телесные симптомы.',NULL,'<p>Как эмоции превращаются в телесные симптомы.</p>',NULL,NULL,NULL),
('bp-09-uk','bp-09','uk','psikhosomatika-chto-eto','Психосоматика: що це таке','Як емоції перетворюються на тілесні симптоми.',NULL,'<p>Як емоції перетворюються на тілесні симптоми.</p>',NULL,NULL,NULL),
('bp-10-ru','bp-10','ru','neyverennost-kak-preodolet','Неуверенность: как преодолеть','Практические шаги для преодоления неуверенности.',NULL,'<p>Практические шаги для преодоления неуверенности.</p>',NULL,NULL,NULL),
('bp-10-uk','bp-10','uk','neyverennost-kak-preodolet','Невпевненість: як подолати','Практичні кроки для подолання невпевненості.',NULL,'<p>Практичні кроки для подолання невпевненості.</p>',NULL,NULL,NULL);

-- FAQ_ITEMS
INSERT OR IGNORE INTO faq_items (id,[group],service_id,status,sort_order) VALUES
('faq-01','HOME',NULL,'PUBLISHED',0),
('faq-02','HOME',NULL,'PUBLISHED',1),
('faq-03','HOME',NULL,'PUBLISHED',2),
('faq-04','HOME',NULL,'PUBLISHED',3),
('faq-05','GENERAL',NULL,'PUBLISHED',4),
('faq-06','GENERAL',NULL,'PUBLISHED',5),
('faq-07','GENERAL',NULL,'PUBLISHED',6),
('faq-08','GENERAL',NULL,'PUBLISHED',7),
('faq-09','CONTACTS',NULL,'PUBLISHED',8),
('faq-10','CONTACTS',NULL,'PUBLISHED',9);

INSERT OR IGNORE INTO faq_item_translations (id,faq_item_id,locale,question,answer) VALUES
('faq-01-ru','faq-01','ru','Что такое гипнотерапия?','Гипнотерапия — метод помощи, работающий с подсознанием через расслабленное состояние.'),
('faq-01-uk','faq-01','uk','Що таке гіпнотерапія?','Гіпнотерапія — метод допомоги, що працює з підсвідомістю через розслаблений стан.'),
('faq-02-ru','faq-02','ru','Это безопасно?','Да, гипнотерапия абсолютно безопасна. Вы остаётесь в сознании.'),
('faq-02-uk','faq-02','uk','Це безпечно?','Так, гіпнотерапія абсолютно безпечна. Ви залишаєтеся у свідомості.'),
('faq-03-ru','faq-03','ru','Сколько сессий нужно?','В среднем 4-8 сессий. На бесплатной диагностике определим план.'),
('faq-03-uk','faq-03','uk','Скільки сесій потрібно?','В середньому 4-8 сесій. На безкоштовній діагностиці визначимо план.'),
('faq-04-ru','faq-04','ru','Помогает ли гипноз при тревоге?','Да, эффективно работает с тревожными расстройствами.'),
('faq-04-uk','faq-04','uk','Чи допомагає гіпноз при тривозі?','Так, ефективно працює з тривожними розладами.'),
('faq-05-ru','faq-05','ru','Как проходит сеанс онлайн?','Через видеосвязь. Вы удобно сидите, я направляю словами.'),
('faq-05-uk','faq-05','uk','Як проходить сеанс онлайн?','Через відеозв''язок. Ви зручно сидите, я направляю словами.'),
('faq-06-ru','faq-06','ru','Нужно ли готовиться?','За час до сеанса — не употреблять алкоголь, выпить воды.'),
('faq-06-uk','faq-06','uk','Потрібно готуватися?','За год до сеансу — не вживати алкоголь, випити води.'),
('faq-07-ru','faq-07','ru','Что такое эриксоновский гипноз?','Мягкий подход через метафоры. Клиент в сознании.'),
('faq-07-uk','faq-07','uk','Що таке еріксонівський гіпноз?','М''який підхід через метафори. Клієнт у свідомості.'),
('faq-08-ru','faq-08','ru','Гипноз vs гипнотерапия?','Гипноз — широкое понятие. Гипнотерапия — терапия.'),
('faq-08-uk','faq-08','uk','Гіпноз vs гіпнотерапія?','Гіпноз — широке поняття. Гіпнотерапія — терапія.'),
('faq-09-ru','faq-09','ru','Как записаться?','Через Telegram, WhatsApp или форму на сайте.'),
('faq-09-uk','faq-09','uk','Як записатися?','Через Telegram, WhatsApp або форму на сайті.'),
('faq-10-ru','faq-10','ru','Сколько стоит?','От 50$. Первая консультация 15 мин — бесплатно.'),
('faq-10-uk','faq-10','uk','Скільки коштує?','Від 50$. Перша консультація 15 хв — безкоштовно.');

-- TESTIMONIALS
INSERT OR IGNORE INTO testimonials (id,status,client_name,client_age,avatar_initials,rating,source,consent_confirmed,published_at,sort_order,created_at) VALUES
('tm-01','PUBLISHED','Анна',32,'АН',5,'Telegram',1,'2026-07-21T17:16:38.656Z',0,'2026-07-21T17:16:38.656Z'),
('tm-02','PUBLISHED','Сергій',45,'СЕ',5,'Instagram',1,'2026-07-21T17:16:38.656Z',1,'2026-07-21T17:16:38.656Z'),
('tm-03','PUBLISHED','Олена',28,'ОЛ',5,'Рекомендація',1,'2026-07-21T17:16:38.656Z',2,'2026-07-21T17:16:38.656Z'),
('tm-04','PUBLISHED','Михайло',38,'МИ',5,'Telegram',1,'2026-07-21T17:16:38.656Z',3,'2026-07-21T17:16:38.656Z'),
('tm-05','PUBLISHED','Катерина',25,'КА',5,'Сайт',1,'2026-07-21T17:16:38.656Z',4,'2026-07-21T17:16:38.656Z');

INSERT OR IGNORE INTO testimonial_translations (id,testimonial_id,locale,problem,result,text) VALUES
('tm-01-ru','tm-01','ru','Тревога','Спокойный сон','После 4 сеансов я спокойно засыпаю.'),
('tm-01-uk','tm-01','uk','Тревога','Спокойный сон','Після 4 сеансів я спокійно засинаю.'),
('tm-02-ru','tm-02','ru','Панические атаки','Нет атак 3 месяца','Атаки ушли полностью.'),
('tm-02-uk','tm-02','uk','Панические атаки','Нет атак 3 месяца','Атаки пішли повністю.'),
('tm-03-ru','tm-03','ru','Самосаботаж','Запустила проєкт','Гипнотерапия помогла разобраться в корне.'),
('tm-03-uk','tm-03','uk','Самосаботаж','Запустила проєкт','Гіпнотерапія допомогла розібратися в корені.'),
('tm-04-ru','tm-04','ru','Выгорание','Вернулся к работе','Вернул интерес и энергию.'),
('tm-04-uk','tm-04','uk','Выгорание','Вернулся к работе','Повернув інтерес та енергію.'),
('tm-05-ru','tm-05','ru','Неуверенность','Получила повышение','Теперь уверенно беру новые задачі.'),
('tm-05-uk','tm-05','uk','Неуверенность','Получила повышение','Тепер впевнено беру нові завдання.');

-- SEO_META
INSERT OR IGNORE INTO seo_meta (id,entity_type,entity_id,locale,title,description,keywords,canonical_path,og_title,og_description,og_image_id,robots_index,robots_follow,schema_type,created_at,updated_at) VALUES
('seo-p-cae9f9ec-ru','page','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','ru','HOME','Гипнотерапия онлайн — избавьтесь от тревоги и верните спокойствие','гипнотерапия, онлайн','/ru/','HOME','Гипнотерапия онлайн — избавьтесь от тревоги и верните спокойствие',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-cae9f9ec-uk','page','cae9f9ec-6fd9-457c-a4c5-79df832e95eb','uk','/','Гіпнотерапія онлайн — позбавтеся тривоги та поверніть спокій','гіпнотерапія, онлайн','/uk/','/','Гіпнотерапія онлайн — позбавтеся тривоги та поверніть спокій',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-806b5d28-ru','page','806b5d28-b788-4836-bdd6-952302a2284a','ru','ABOUT','Гипнотерапевт онлайн','гипнотерапия, онлайн','/ru/','ABOUT','Гипнотерапевт онлайн',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-806b5d28-uk','page','806b5d28-b788-4836-bdd6-952302a2284a','uk','ob-avtore','Гіпнотерапевт онлайн','гіпнотерапія, онлайн','/uk/','ob-avtore','Гіпнотерапевт онлайн',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-7df7aadb-ru','page','7df7aadb-b4f2-4f1c-8722-decda9379aa3','ru','METHOD','Авторский метод','гипнотерапия, онлайн','/ru/','METHOD','Авторский метод',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-7df7aadb-uk','page','7df7aadb-b4f2-4f1c-8722-decda9379aa3','uk','metod','Авторський метод','гіпнотерапія, онлайн','/uk/','metod','Авторський метод',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-c7c7cc41-ru','page','c7c7cc41-527f-48cb-b31c-77aa87793d8c','ru','FAQ','FAQ — вопросы и ответы о гипнотерапии','гипнотерапия, онлайн','/ru/','FAQ','FAQ — вопросы и ответы о гипнотерапии',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-c7c7cc41-uk','page','c7c7cc41-527f-48cb-b31c-77aa87793d8c','uk','faq','FAQ — питання та відповіді про гіпнотерапію','гіпнотерапія, онлайн','/uk/','faq','FAQ — питання та відповіді про гіпнотерапію',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-46cae533-ru','page','46cae533-e67c-4cc1-b16f-b6dfa951b116','ru','CONTACTS','Контакти','гипнотерапия, онлайн','/ru/','CONTACTS','Контакти',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-46cae533-uk','page','46cae533-e67c-4cc1-b16f-b6dfa951b116','uk','kontakty','Контакти','гіпнотерапія, онлайн','/uk/','kontakty','Контакти',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-cd4a1923-ru','page','cd4a1923-eeba-4e26-8fc4-8358640eac4d','ru','PRIVACY','Политика конфиденциальности','гипнотерапия, онлайн','/ru/','PRIVACY','Политика конфиденциальности',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-cd4a1923-uk','page','cd4a1923-eeba-4e26-8fc4-8358640eac4d','uk','politika-konfidentsialnosti','Політика конфіденційності','гіпнотерапія, онлайн','/uk/','politika-konfidentsialnosti','Політика конфіденційності',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-2fea5355-ru','page','2fea5355-3b2c-4d83-9b67-1bd41ad080ae','ru','DISCLAIMER','Дисклеймер','гипнотерапия, онлайн','/ru/','DISCLAIMER','Дисклеймер',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-2fea5355-uk','page','2fea5355-3b2c-4d83-9b67-1bd41ad080ae','uk','disclaimer','Дисклеймер','гіпнотерапія, онлайн','/uk/','disclaimer','Дисклеймер',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-41f764f7-ru','page','41f764f7-54e5-41d7-b092-f4bcae43ae28','ru','PRICING','Стоимость гипнотерапии онлайн — цены на сессии','гипнотерапия, онлайн','/ru/','PRICING','Стоимость гипнотерапии онлайн — цены на сессии',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-p-41f764f7-uk','page','41f764f7-54e5-41d7-b092-f4bcae43ae28','uk','tseny','Вартість гіпнотерапії онлайн — ціни на сесії','гіпнотерапія, онлайн','/uk/','tseny','Вартість гіпнотерапії онлайн — ціни на сесії',NULL,1,1,'WebPage','2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-faef4e9a-ru','service','faef4e9a-0456-4565-ae0f-55895dded08a','ru','Гипнотерапия онлайн','Сеансы эриксоновского гипноза онлайн для работы с подсознанием, тревогой, страхами.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-faef4e9a-uk','service','faef4e9a-0456-4565-ae0f-55895dded08a','uk','Гіпнотерапія онлайн','Сеанси еріксонівського гіпнозу онлайн для роботи з підсвідомістю, тривогою, страхами.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-db6bfe35-ru','service','db6bfe35-5c70-4765-8673-6ea8d894f1c7','ru','Психолог онлайн','Индивидуальные онлайн-консультации психолога. Бережный подход.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-db6bfe35-uk','service','db6bfe35-5c70-4765-8673-6ea8d894f1c7','uk','Консультація психолога онлайн','Індивідуальні онлайн-консультації психолога. Бережний підхід.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-29323703-ru','service','29323703-899a-429b-a2b1-fecb80df9595','ru','Психолог-биоэнергетик','Синергия психотерапии и биоэнергетических практик.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-29323703-uk','service','29323703-899a-429b-a2b1-fecb80df9595','uk','Психолог-біоенергетик','Синергія психотерапії та біоенергетичних практик.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-f9fd52ff-ru','service','f9fd52ff-7d68-4181-954a-f290887cfbf0','ru','Тревога и панические атаки','Гипнотерапия тревоги и панических атак. Работа с первопричиной.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-f9fd52ff-uk','service','f9fd52ff-7d68-4181-954a-f290887cfbf0','uk','Тривога та панічні атаки','Гіпнотерапія тривоги та панічних атак. Робота з першопричиною.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-2ba12c5f-ru','service','2ba12c5f-17b3-44eb-8920-dd24a029ed71','ru','Работа с подсознанием','Гипноз для проработки подсознания: убираем блоки.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-2ba12c5f-uk','service','2ba12c5f-17b3-44eb-8920-dd24a029ed71','uk','Робота з підсвідомістю','Гіпноз для опрацювання підсвідомості: прибираємо блоки.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-1ed63afd-ru','service','1ed63afd-b02c-43d3-a7ef-924528ae9de2','ru','Самосаботаж и блоки','Избавление от самосаботажа и прокрастинации через гипнотерапию.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-1ed63afd-uk','service','1ed63afd-b02c-43d3-a7ef-924528ae9de2','uk','Самосаботаж і блоки','Позбавлення від самосаботажу та прокрастинації через гіпнотерапію.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-5be03dea-ru','service','5be03dea-c042-4c9c-a669-50855dd74674','ru','Эмоциональное выгорание','Восстановление энергии и ресурса после выгорания.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-5be03dea-uk','service','5be03dea-c042-4c9c-a669-50855dd74674','uk','Емоційне вигорання','Відновлення енергії та ресурсу після вигорання.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-df37035c-ru','service','df37035c-5d2b-4075-bda7-7bc9b176e7bb','ru','Неуверенность и страх провала','Преодолейте неуверенность и синдром самозванца.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-df37035c-uk','service','df37035c-5d2b-4075-bda7-7bc9b176e7bb','uk','Невпевненість і страх невдачі','Подолайте невпевненість та синдром самозванця.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-aa146d45-ru','service','aa146d45-97ab-4dd6-857a-6d6fee5c273e','ru','Психосоматика','Снятие телесных симптомов стресса через гипнотерапию.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-aa146d45-uk','service','aa146d45-97ab-4dd6-857a-6d6fee5c273e','uk','Психосоматика','Зняття тілесних симптомів стресу через гіпнотерапію.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-4526d523-ru','service','4526d523-7a9a-4057-9eda-d0f9832f3a37','ru','Личностный кризис','Поиск себя, новых смыслов и направления в жизни.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-4526d523-uk','service','4526d523-7a9a-4057-9eda-d0f9832f3a37','uk','Особистісна криза','Пошук себе, нових сенсів і напрямку в житті.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-fedc832c-ru','service','fedc832c-de4c-43be-b8ce-81c9da33a82f','ru','Как избавиться от тревоги','Гипнотерапия убирает внутреннюю причину тревоги.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-fedc832c-uk','service','fedc832c-de4c-43be-b8ce-81c9da33a82f','uk','Як позбутися тривоги','Гіпнотерапія усуває внутрішню причину тривоги.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-12a935bf-ru','service','12a935bf-6f40-4302-9c1e-edaab575f98d','ru','Постоянная тревога без причины','Сигнал подсознания о скрытом конфликте.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-12a935bf-uk','service','12a935bf-6f40-4302-9c1e-edaab575f98d','uk','Постійна тривога без причини','Сигнал підсвідомості про прихований конфлікт.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-2b6bbcce-ru','service','2b6bbcce-cdeb-40a0-b244-413203a17789','ru','Утренняя тревога','Гипнотерапия убирает кортизоловый скачок.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-2b6bbcce-uk','service','2b6bbcce-cdeb-40a0-b244-413203a17789','uk','Ранкова тривога','Гіпнотерапія знижує рівень кортизолу вранці.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-f947832e-ru','service','f947832e-2d7f-4897-a943-9aa3631e7a36','ru','Тревога перед сном','Гипнотерапия успокаивает ум и возвращает здоровый сон.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-f947832e-uk','service','f947832e-2d7f-4897-a943-9aa3631e7a36','uk','Тривога перед сном','Гіпнотерапія заспокоює і допомагає повернути здоровий сон.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-f9958e0b-ru','service','f9958e0b-9e16-47a4-94b9-cd4c09a00812','ru','Тревога после стресса','Гипнотерапия мягко снимает постстрессовое напряжение.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-f9958e0b-uk','service','f9958e0b-9e16-47a4-94b9-cd4c09a00812','uk','Тривога після стресу','Гіпнотерапія знімає наслідки стресу.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-e2975198-ru','service','e2975198-4a6a-480b-bfbf-1bc1b9ee103b','ru','Внутреннее напряжение','Гипнотерапия снимает глубинные зажимы.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-e2975198-uk','service','e2975198-4a6a-480b-bfbf-1bc1b9ee103b','uk','Внутрішня напруга','Гіпнотерапія знімає глибинні затискачі.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-e18ae8e5-ru','service','e18ae8e5-7d07-40a8-a907-326f6c40a734','ru','Навязчивые мысли','Гипнотерапия останавливает ментальную жвачку.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-e18ae8e5-uk','service','e18ae8e5-7d07-40a8-a907-326f6c40a734','uk','Нав''язливі думки','Гіпнотерапія зупиняє ментальну жуйку.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-feee6236-ru','service','feee6236-4b38-437c-83a0-14589bd9683c','ru','Страх будущего','Гипнотерапия убирает тревожное ожидание.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-feee6236-uk','service','feee6236-4b38-437c-83a0-14589bd9683c','uk','Страх майбутнього','Гіпнотерапія усуває тривожне очікування.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-cd442495-ru','service','cd442495-e194-4d1e-8376-f7b883adbaf8','ru','Цифровой детокс','Работа с гаджетозависимостью через гипнотерапию.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z'),
('seo-s-cd442495-uk','service','cd442495-e194-4d1e-8376-f7b883adbaf8','uk','Цифровий детокс','Робота з гаджетозалежністю через гіпнотерапію.','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'2026-07-21T17:16:38.656Z','2026-07-21T17:16:38.656Z');


PRAGMA foreign_keys = ON;
