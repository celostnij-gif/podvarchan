-- Fix HOME hero typo: "Ибавится" → "Избавьтесь"
UPDATE page_section_translations
SET content_json = '{"title":"Избавьтесь от <gold>тревоги</gold>  и <em>вернуть</em> себе <gold>спокойствие</gold>","subtitle":"<em>Мягкая</em> работа с подсознанием через <gold>эриксоновский гипноз</gold>. Без медикаментов, без страха — в комфортной обстановке у вас дома."}'
WHERE section_id = '00000000-0000-4000-a000-000000000001' AND locale = 'ru';
