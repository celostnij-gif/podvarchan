'use client'

import { useMessages } from 'next-intl'
import { motion } from 'framer-motion'
import { Link } from '@/i18n/routing'
import { SERVICE_ICONS } from '@/constants'
import { AnimatedSection, AnimatedText, SectionContainer, MedicalDisclaimer, TiltCard, FaqAccordion } from '@/components/ui'
import { useSetBreadcrumbs, useRegisterSchemas } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'

interface ServiceData {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
}

interface Props {
  service: ServiceData
  locale: string
  schemas?: Record<string, unknown>[]
}

/* ── Service-specific symptoms ── */

const SYMPTOMS: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
  'gipnoterapiya-onlayn': [
    { icon: '😰', title: 'Постоянное напряжение', desc: 'Вы чувствуете тревогу даже в спокойные моменты, тело сковано, расслабиться не получается.' },
    { icon: '🫢', title: 'Страх и беспокойство', desc: 'Хотите избавиться от страхов, фобий и навязчивых мыслей, которые мешают жить.' },
    { icon: '🔄', title: 'Повторяющиеся сценарии', desc: 'Замечаете, что одни и те же проблемы повторяются — в отношениях, работе, финансах.' },
    { icon: '🧠', title: 'Внутренние блоки', desc: 'Чувствуете, что внутри есть что-то, что мешает двигаться вперёд и реализовывать желания.' },
    { icon: '🌙', title: 'Нарушение сна', desc: 'Тревога мешает спать, мысли крутятся в голове, утром встаёте уже уставшим.' },
    { icon: '💭', title: 'Потеря контакта с собой', desc: 'Перестали понимать, чего хотите на самом деле, потеряли внутренний ориентир.' },
  ],
  'trevoga-i-panicheskiye-ataki': [
    { icon: '💓', title: 'Внезапные приступы страха', desc: 'Сердце начинает бешено биться без причины, накрывает волна ужаса, трудно дышать.' },
    { icon: '😰', title: 'Постоянная тревога', desc: 'Чувство, что должно случиться что-то плохое. Не можете расслабиться даже дома.' },
    { icon: '🏠', title: 'Избегание мест и ситуаций', desc: 'Начинаете избегать мест, где случилась паническая атака. Круг сужается.' },
    { icon: '😴', title: 'Нарушение сна из-за страха', desc: 'Страшно засыпать, просыпаетесь от кошмаров или с чувством ужаса.' },
    { icon: '🫁', title: 'Ощущение нехватки воздуха', desc: 'Чувствуете ком в горле, трудно сделать глубокий вдох, головокружение.' },
    { icon: '🤯', title: 'Страх потери контроля', desc: 'Боитесь сойти с ума, потерять контроль над собой или упасть в обморок.' },
  ],
  'rabota-s-podsoznaniem': [
    { icon: '🔄', title: 'Повторяющиеся сценарии', desc: 'Всё время попадаете в одни и те же ситуации — в отношениях, деньгах, карьере.' },
    { icon: '🚫', title: 'Ограничивающие убеждения', desc: 'Внутри звучат фразы: «я не достоин», «у меня не получится», «это не для меня».' },
    { icon: '💰', title: 'Денежные блоки', desc: 'Зарабатываете, но деньги не держатся. Или не можете зарабатывать столько, сколько хотите.' },
    { icon: '🧱', title: 'Внутренние барьеры', desc: 'Чувствуете, что стоите на месте. Знаете, что хотите изменить, но не можете сдвинуться.' },
    { icon: '🎭', title: 'Чужие сценарии', desc: 'Осознаёте, что живёте по чужим правилам и ожиданиям — родителей, общества.' },
    { icon: '🌪️', title: 'Эмоциональные качели', desc: 'Реакции сильнее, чем хотелось бы. Вспышки гнева, слёзы или апатия без видимой причины.' },
  ],
  'samosabotazh-i-bloki': [
    { icon: '⏰', title: 'Хроническая прокрастинация', desc: 'Откладываете важные дела до последнего. Знаете, что надо сделать, но не можете начать.' },
    { icon: '🎯', title: 'Срыв целей', desc: 'Ставите цели, но внутри что-то саботирует их достижение. Бросаете на полпути.' },
    { icon: '🗣️', title: 'Внутренний критик', desc: 'В голове постоянный голос: «ты недостаточно хорош», «у тебя не получится».' },
    { icon: '😤', title: 'Страх неудачи', desc: 'Лучше не начинать, чем провалиться. Перфекционизм парализует решение.' },
    { icon: '🫣', title: 'Синдром самозванца', desc: 'Думаете, что ваши успехи — случайность, и в любой момент все увидят, что вы «ненастоящий».' },
    { icon: '😵', title: 'Потеря энергии на старте', desc: 'Только начинаете что-то делать — и уже чувствуете усталость.' },
  ],
  'emotsionalnoye-vygoraniye': [
    { icon: '🫠', title: 'Усталость по утрам', desc: 'Просыпаетесь уже уставшим. Никакое количество сна не приносит бодрости.' },
    { icon: '😐', title: 'Потеря интереса', desc: 'То, что раньше радовало, перестало вызывать эмоции. Всё кажется серым и безвкусным.' },
    { icon: '⚡', title: 'Дефицит энергии', desc: 'Нет сил ни на что. Даже простые бытовые дела требуют огромного напряжения.' },
    { icon: '😤', title: 'Раздражительность', desc: 'Всё бесит. Люди, обстоятельства, мелочи. Срываетесь на близких.' },
    { icon: '🧠', title: 'Туман в голове', desc: 'Трудно сосредоточиться, забываете важные вещи, рассеянное внимание.' },
    { icon: '💔', title: 'Потеря смысла', desc: 'Не понимаете, зачем всё это. Работа, обязанности, жизнь — всё кажется бессмысленным.' },
  ],
  'neyverennost-i-strakh-provala': [
    { icon: '😟', title: 'Страх ошибки', desc: 'Любое решение даётся с трудом. Боитесь сделать неверный выбор.' },
    { icon: '🤫', title: 'Неумение отстаивать границы', desc: 'Говорите «да», когда хотите сказать «нет». Не можете отказать.' },
    { icon: '🎭', title: 'Синдром самозванца', desc: 'Чувствуете, что не заслуживаете своего положения. Боитесь, что вас «раскроют».' },
    { icon: '👥', title: 'Зависимость от чужого мнения', desc: 'Постоянно оглядываетесь на то, что подумают другие.' },
    { icon: '🫣', title: 'Избегание внимания', desc: 'Стараетесь быть незаметным. Боитесь выступать, заявлять о себе.' },
    { icon: '🔄', title: 'Сравнение с другими', desc: 'Постоянно сравниваете себя с окружающими не в свою пользу.' },
  ],
  'psikhosomatika': [
    { icon: '🤕', title: 'Головные боли', desc: 'Регулярные головные боли напряжения. Врачи не находят физических причин.' },
    { icon: '🫁', title: 'Ком в горле', desc: 'Ощущение сдавленности в горле, трудно глотать. Анализы в норме.' },
    { icon: '🔄', title: 'Нарушения ЖКТ', desc: 'Боли в животе, тошнота, расстройства в стрессовых ситуациях.' },
    { icon: '💪', title: 'Мышечное напряжение', desc: 'Хроническое напряжение в шее, плечах, спине. Не отпускает даже после массажа.' },
    { icon: '🫀', title: 'Боли в груди', desc: 'Давящие боли в груди, учащённое сердцебиение. Кардиолог говорит: «вы здоровы».' },
    { icon: '😴', title: 'Хроническая усталость', desc: 'Усталость, которая не проходит после отдыха. Тело постоянно в напряжении.' },
  ],
  'lichnostnyy-krizis': [
    { icon: '❓', title: 'Потеря смысла', desc: 'Не понимаете, куда двигаться дальше. Всё, что раньше было важно, потеряло ценность.' },
    { icon: '🫥', title: 'Ощущение пустоты', desc: 'Внутренняя пустота, которую ничем не заполнить. Всё кажется бессмысленным.' },
    { icon: '🎭', title: 'Чувство «не своей жизни»', desc: 'Осознаёте, что живёте не так, как хотели. Чужие цели, чужие мечты.' },
    { icon: '🔄', title: 'Кризис возраста', desc: '30, 40, 50 лет — подводите итоги и понимаете, что хотели бы всё изменить.' },
    { icon: '🗺️', title: 'Потеря направления', desc: 'Не знаете, чего хотите. Потеряны ориентиры и понимание, куда идти.' },
    { icon: '💔', title: 'Разочарование', desc: 'Разочаровались в карьере, отношениях или образе жизни. Хотите перемен.' },
  ],
  'tsifrovoy-detoks-i-gadzhet-zavisimost': [
    { icon: '📱', title: 'Постоянная проверка телефона', desc: 'Проверяете телефон каждые 5–10 минут без реальной необходимости. Рука сама тянется к экрану.' },
    { icon: '🔄', title: 'Думскроллинг', desc: 'Бесконечно листаете ленту, хотя понимаете, что это не приносит пользы. Остановиться сложно.' },
    { icon: '😰', title: 'Тревога без телефона', desc: 'Когда телефон не под рукой, чувствуете беспокойство, страх что-то пропустить (FOMO).' },
    { icon: '📊', title: 'Потеря времени', desc: 'Проводите 4–6+ часов в день в соцсетях и приложениях. Планировали на 15 минут — очнулись через 2 часа.' },
    { icon: '😴', title: 'Нарушение сна', desc: 'Перед сном листаете телефон. Качество сна ухудшилось, чувствуете разбитость по утрам.' },
    { icon: '🧠', title: 'Снижение концентрации', desc: 'Не можете сосредоточиться на одной задаче дольше 10 минут. Мозг привык к постоянной смене стимулов.' },
  ],
  'kak-izbavitsya-ot-trevogi': [
    { icon: '💓', title: 'Учащённое сердцебиение', desc: 'Сердце начинает биться быстрее без видимой причины. Организм постоянно в режиме «бей или беги».' },
    { icon: '😰', title: 'Чувство беспокойства', desc: 'Не можете расслабиться даже в безопасной обстановке. Внутреннее напряжение не отпускает.' },
    { icon: '🫁', title: 'Поверхностное дыхание', desc: 'Дышите часто и поверхностно. Не хватает воздуха, чувствуете сдавленность в груди.' },
    { icon: '🔄', title: 'Навязчивые мысли', desc: 'В голове крутятся одни и те же тревожные мысли. Остановить этот поток сложно.' },
    { icon: '😴', title: 'Нарушение сна', desc: 'Тревога мешает уснуть, просыпаетесь среди ночи и не можете заснуть снова.' },
    { icon: '🤯', title: 'Страх потери контроля', desc: 'Боитесь, что не справитесь с ситуацией, что тревога станет невыносимой.' },
  ],
  'postoyannaya-trevoga-bez-prichiny': [
    { icon: '🌫️', title: 'Фоновое беспокойство', desc: 'Тревога не приходит волнами — она просто фоном присутствует всегда. Даже когда всё хорошо.' },
    { icon: '😟', title: 'Предчувствие беды', desc: 'Кажется, что должно случиться что-то плохое. Рациональных причин нет, но чувство не отпускает.' },
    { icon: '💪', title: 'Хроническое напряжение', desc: 'Мышцы постоянно напряжены, особенно плечи и шея. Расслабиться не получается.' },
    { icon: '🫀', title: 'Телесные симптомы', desc: 'Без причины болит голова, желудок, сердце. Врачи говорят: «вы здоровы».' },
    { icon: '😤', title: 'Раздражительность', desc: 'Любая мелочь может вывести из себя. Устали от собственной реакции на происходящее.' },
    { icon: '🧠', title: 'Туман в голове', desc: 'Сложно сосредоточиться, мысли путаются, память ухудшилась. Чувствуете «кашу» в голове.' },
  ],
  'utrennyaya-trevoga': [
    { icon: '🌅', title: 'Тревога сразу после пробуждения', desc: 'Открываете глаза — и сердце уже колотится. Тревога накрывает ещё до того, как вы осознали день.' },
    { icon: '🫠', title: 'Разбитость по утрам', desc: 'Просыпаетесь уже уставшим. Сон не приносит восстановления.' },
    { icon: '🤢', title: 'Тошнота по утрам', desc: 'Утренняя тошнота от тревоги. Пропадает аппетит, трудно завтракать.' },
    { icon: '⚡', title: 'Сердцебиение утром', desc: 'Первая мысль после пробуждения — и сердце уже начинает бешено биться.' },
    { icon: '😰', title: 'Страх предстоящего дня', desc: 'Ещё не начали день, а уже чувствуете тревогу о том, что нужно делать.' },
    { icon: '🔄', title: 'Утренний туман в голове', desc: 'Мысли путаются, сложно собраться и начать день. Утро — самое тяжёлое время.' },
  ],
  'trevoga-pered-snom': [
    { icon: '🌙', title: 'Страх засыпания', desc: 'Когда ложитесь в кровать, тревога усиливается. Мозг начинает прокручивать всё подряд.' },
    { icon: '🔄', title: 'Мыслительный поток', desc: 'Только закрываете глаза — мысли начинают бежать с удвоенной силой. Остановить невозможно.' },
    { icon: '💓', title: 'Ночное сердцебиение', desc: 'Слышите своё сердцебиение в тишине. Тревога усиливается от ощущения собственного пульса.' },
    { icon: '😰', title: 'Страх не уснуть', desc: 'Чем сильнее хотите уснуть, тем хуже получается. Тревога по поводу сна усиливает бессонницу.' },
    { icon: '😴', title: 'Поверхностный сон', desc: 'Спите чутко, просыпаетесь от любого шума. Утром не чувствуете себя отдохнувшим.' },
    { icon: '🌃', title: 'Ночные пробуждения', desc: 'Просыпаетесь в 2-3 часа ночи с чувством тревоги и не можете заснуть до утра.' },
  ],
  'trevoga-posle-stressa': [
    { icon: '🌊', title: 'Остаточная тревога', desc: 'Стрессовая ситуация прошла, но тревога осталась. Организм не может переключиться в спокойный режим.' },
    { icon: '⚡', title: 'Реакция на триггеры', desc: 'Любое напоминание о стрессе снова запускает тревогу, даже если угрозы давно нет.' },
    { icon: '😰', title: 'Ожидание повторения', desc: 'Живёте в постоянном ожидании, что стрессовая ситуация повторится. Не можете расслабиться.' },
    { icon: '💪', title: 'Телесные зажимы', desc: 'Тело остаётся напряжённым даже в спокойной обстановке. Стресс «застрял» в теле.' },
    { icon: '🧠', title: 'Нарушение концентрации', desc: 'После стресса сложно вернуться к обычным делам. Внимание рассеивается.' },
    { icon: '😴', title: 'Нарушение сна после стресса', desc: 'После стрессового события сон становится чутким и поверхностным. Тревога возвращается ночью.' },
  ],
  'vnutrenneye-napryazheniye': [
    { icon: '⚡', title: 'Постоянное напряжение', desc: 'Внутри будто натянутая струна. Не можете расслабиться даже когда есть время отдохнуть.' },
    { icon: '😤', title: 'Вспышки раздражения', desc: 'Малейшая помеха вызывает сильное раздражение. Срываетесь на близких, потом корите себя.' },
    { icon: '💪', title: 'Мышечные блоки', desc: 'Плечи подняты, челюсть сжата, спина напряжена. Тело привыкло к состоянию «боеготовности».' },
    { icon: '🫁', title: 'Поверхностное дыхание', desc: 'Дышите не глубоко, а верхней частью грудной клетки. Организму не хватает кислорода.' },
    { icon: '😴', title: 'Усталость от напряжения', desc: 'Даже после отдыха чувствуете себя уставшим. Поддержание напряжения отнимает все силы.' },
    { icon: '🧠', title: 'Невозможность отключиться', desc: 'Мозг продолжает работать даже в выходные. Не можете перестать думать о делах.' },
  ],
  'navyazchivye-mysli': [
    { icon: '🌀', title: 'Круговорот мыслей', desc: 'Одна и та же мысль крутится в голове снова и снова. Не можете остановить этот поток.' },
    { icon: '😰', title: 'Тревожные сценарии', desc: 'Прокручиваете в голове худшие сценарии развития событий. Остановить фантазии сложно.' },
    { icon: '🔄', title: 'Мысленная жвачка', desc: 'Возвращаетесь к одним и тем же мыслям, но решения не находится. Это выматывает.' },
    { icon: '🤯', title: 'Навязчивые «что если»', desc: 'Постоянные вопросы «а что если?» — страх, что всё пойдёт не так.' },
    { icon: '😴', title: 'Мысли мешают спать', desc: 'Ночью мысли становятся особенно активными. Ложитесь — и начинается внутренний диалог.' },
    { icon: '💭', title: 'Невозможность переключиться', desc: 'Не можете переключить внимание на что-то другое. Навязчивые мысли занимают всё пространство.' },
  ],
  'strakh-budushchego': [
    { icon: '🌄', title: 'Страх неопределённости', desc: 'Не знаете, что будет завтра — и это вызывает сильную тревогу. Хочется гарантий.' },
    { icon: '😰', title: 'Катастрофизация', desc: 'Рисуете в голове самые мрачные сценарии будущего. От этого тревога только растёт.' },
    { icon: '🔄', title: 'Страх перемен', desc: 'Хотите перемен, но боитесь их. Лучше оставить всё как есть, чем рисковать.' },
    { icon: '⚡', title: 'Ощущение безвыходности', desc: 'Кажется, что будущее предопределено, и вы ничего не можете изменить.' },
    { icon: '❓', title: 'Потеря ориентиров', desc: 'Не знаете, куда двигаться дальше. Отсутствие целей и планов усиливает страх.' },
    { icon: '💔', title: 'Страх разочарования', desc: 'Боитесь, что будущее не оправдает ожиданий. Лучше не надеяться, чем разочароваться.' },
  ],
}

/* ── Service-specific FAQs ── */

const FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  'gipnoterapiya-onlayn': [
    { question: 'Как проходит онлайн-сессия гипнотерапии?', answer: 'Сессия длится 50–60 минут через видеосвязь. Вам нужен только компьютер или телефон с камерой в тихом помещении. Вы сохраняете полный контроль и слышите всё, что происходит.' },
    { question: 'Безопасен ли онлайн-гипноз?', answer: 'Да. Вы находитесь в привычной обстановке, полностью контролируете процесс. Сессии проходят через защищённое видеосоединение. Гипнотерапевт работает только голосом и техниками.' },
    { question: 'Сколько сессий нужно для результата?', answer: 'Всё индивидуально. Некоторые замечают изменения после 1–2 сессий. Для глубинной проработки обычно рекомендуется курс из 5–10 сессий.' },
    { question: 'Что такое гипноз на самом деле?', answer: 'Гипноз — это естественное состояние повышенной фокусировки, похожее на те моменты, когда вы глубоко задумались или «улетели» за рулём. Вы не теряете контроль, не спите — вы становитесь более сконцентрированным и открытым к изменениям.' },
    { question: 'Сколько стоит и как записаться?', answer: 'Первая диагностическая консультация — бесплатная. На ней мы определяем ваш запрос и выбираем формат работы. Запись через форму на странице контактов или Telegram.' },
  ],
}

/* ── All other services get FAQ template if not specified ── */

const DEFAULT_FAQS = [
  { question: 'Сколько сессий нужно для результата?', answer: 'Всё индивидуально и зависит от запроса. Некоторые отмечают изменения после 1–2 сессий. Для глубинной проработки обычно рекомендуется курс из 5–10 сессий.' },
  { question: 'Как проходит онлайн-сессия?', answer: 'Сессия длится 50–60 минут через видеосвязь в спокойной обстановке. Через голос и дыхательные техники я мягко ввожу вас в трансовое состояние — вы сохраняете полный контроль.' },
  { question: 'Подходит ли этот метод, если я никогда не пробовал(а) гипноз?', answer: 'Да. Многие мои клиенты приходят с опасениями впервые. Я объясняю каждый шаг, и после первой же сессии страхи уходят. Гипноз — это естественное и безопасное состояние.' },
  { question: 'Работаете ли вы без гипноза?', answer: 'Основной инструмент — гипнотерапия. Но я комбинирую её с элементами КПТ и регрессивными техниками. На первой консультации мы обсудим все варианты.' },
  { question: 'Как записаться на первую встречу?', answer: 'Заполните форму на странице контактов или напишите в Telegram. Первая диагностическая консультация — бесплатная и ни к чему вас не обязывает.' },
]

/* ── Related services mapping ── */

const RELATED_SERVICES: Record<string, string[]> = {
  'gipnoterapiya-onlayn': ['trevoga-i-panicheskiye-ataki', 'rabota-s-podsoznaniem', 'samosabotazh-i-bloki'],
  'trevoga-i-panicheskiye-ataki': ['gipnoterapiya-onlayn', 'psikhosomatika', 'lichnostnyy-krizis'],
  'rabota-s-podsoznaniem': ['gipnoterapiya-onlayn', 'samosabotazh-i-bloki', 'lichnostnyy-krizis'],
  'samosabotazh-i-bloki': ['neyverennost-i-strakh-provala', 'rabota-s-podsoznaniem', 'gipnoterapiya-onlayn'],
  'emotsionalnoye-vygoraniye': ['lichnostnyy-krizis', 'gipnoterapiya-onlayn', 'psikhosomatika'],
  'neyverennost-i-strakh-provala': ['samosabotazh-i-bloki', 'gipnoterapiya-onlayn', 'rabota-s-podsoznaniem'],
  'psikhosomatika': ['gipnoterapiya-onlayn', 'trevoga-i-panicheskiye-ataki', 'lichnostnyy-krizis'],
  'lichnostnyy-krizis': ['gipnoterapiya-onlayn', 'rabota-s-podsoznaniem', 'emotsionalnoye-vygoraniye'],
  'tsifrovoy-detoks-i-gadzhet-zavisimost': ['gipnoterapiya-onlayn', 'samosabotazh-i-bloki', 'lichnostnyy-krizis'],
  'kak-izbavitsya-ot-trevogi': ['trevoga-i-panicheskiye-ataki', 'gipnoterapiya-onlayn', 'postoyannaya-trevoga-bez-prichiny'],
  'postoyannaya-trevoga-bez-prichiny': ['trevoga-i-panicheskiye-ataki', 'kak-izbavitsya-ot-trevogi', 'vnutrenneye-napryazheniye'],
  'utrennyaya-trevoga': ['trevoga-i-panicheskiye-ataki', 'trevoga-pered-snom', 'gipnoterapiya-onlayn'],
  'trevoga-pered-snom': ['trevoga-i-panicheskiye-ataki', 'utrennyaya-trevoga', 'navyazchivye-mysli'],
  'trevoga-posle-stressa': ['trevoga-i-panicheskiye-ataki', 'vnutrenneye-napryazheniye', 'gipnoterapiya-onlayn'],
  'vnutrenneye-napryazheniye': ['trevoga-i-panicheskiye-ataki', 'postoyannaya-trevoga-bez-prichiny', 'psikhosomatika'],
  'navyazchivye-mysli': ['trevoga-i-panicheskiye-ataki', 'strakh-budushchego', 'trevoga-pered-snom'],
  'strakh-budushchego': ['trevoga-i-panicheskiye-ataki', 'navyazchivye-mysli', 'kak-izbavitsya-ot-trevogi'],
}

/* ── Animation Variants ── */

const cardUp = (i: number) => ({
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  },
})

const faqItem = (i: number) => ({
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0, 1] as const },
  },
})

/* ── Hero Section ── */

function HeroSection({ service }: { service: ServiceData }) {
  useSetBreadcrumbs([
    { label: 'Главная', href: '/' },
    { label: 'Услуги', href: '/uslugi/' },
    { label: service.shortTitle },
  ])

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 w-full max-w-container mx-auto px-gutter pt-16 pb-10 md:pt-20 md:pb-14 text-left">
        <div className="max-w-3xl">
          {/* Breadcrumbs */}
          <HeroBreadcrumbs />
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
            className="inline-flex items-center gap-3"
          >
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
              {service.shortTitle}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.25, 0.1, 0, 1] }}
            className="mt-6 text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight tracking-tight"
          >
            {service.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
            className="mt-4 text-lg text-text-secondary leading-relaxed max-w-2xl"
          >
            {service.description}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0, 1] }}
            className="mt-8 flex flex-col sm:flex-row items-start gap-4"
          >
            <Link
              href="/kontakty/"
              data-analytics-booking={`service-${service.slug}-hero`}
              className="group relative inline-flex items-center justify-center px-7 py-3.5 rounded-full
                         text-sm font-semibold tracking-wide overflow-hidden
                         bg-gradient-to-r from-gold to-gold-light text-bg-deep
                         shadow-[0_0_25px_rgba(201,169,110,0.15)]
                         hover:shadow-[0_0_40px_rgba(201,169,110,0.25)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-400"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                               transition-transform duration-700 bg-gradient-to-r
                               from-transparent via-white/20 to-transparent" aria-hidden="true" />
              <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
                {service.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <span className="text-xs text-text-muted">
              {'Первая консультация — бесплатно'}
            </span>
          </motion.div>

          {/* Medical Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <MedicalDisclaimer className="mt-6" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── Symptoms Section ── */

function SymptomsSection({ service }: { service: ServiceData }) {
  const symptoms = SYMPTOMS[service.slug] || SYMPTOMS['gipnoterapiya-onlayn']

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label="Признаки и симптомы">
      <SectionContainer size="md" background="default">
        <AnimatedText direction="up" as="div" className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">Вам знакомо?</span>
            <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
          </div>
        </AnimatedText>
        <AnimatedText direction="up" delay={150} as="h2" className="mt-4 text-3xl md:text-4xl lg:text-5xl font-display text-text-primary leading-tight text-center">
          Признаки, с которыми{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
            я работаю
          </span>
        </AnimatedText>
        <AnimatedText direction="up" delay={250} as="p" className="mt-4 text-base text-text-secondary max-w-xl mx-auto text-center">
          Если вы узнаёте себя в этих состояниях — вы пришли по адресу
        </AnimatedText>

        <div className="mt-10 md:mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {symptoms.map((symptom, i) => (
            <TiltCard key={i} tiltDegree={4} scale={1.015} className="rounded-2xl h-full">
              <motion.div
                variants={cardUp(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative p-5 md:p-6 bg-white/[0.02] border border-white/[0.05]
                           hover:bg-white/[0.04] hover:border-gold/20
                           hover:shadow-[0_0_30px_rgba(201,169,110,0.04)]
                           transition-all duration-500 rounded-2xl h-full flex flex-col"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                                 ${i % 2 === 0 ? 'bg-gold/[0.08]' : 'bg-green/[0.08]'}
                                 group-hover:scale-110 transition-transform duration-400`}>
                  <span className="leading-none" role="img" aria-hidden="true">{symptom.icon}</span>
                </div>
                <h3 className="mt-3 text-base font-display text-text-primary">{symptom.title}</h3>
                <p className="mt-1.5 text-sm text-text-muted leading-relaxed flex-1">{symptom.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Method Section ── */

function MethodSection({ service }: { service: ServiceData }) {
  const label = service.shortTitle?.toLowerCase() || service.slug

  const steps = [
    {
      num: '01',
      title: 'Диагностика и ваш запрос',
      desc: `Начинаем с бесплатной 15-минутной консультации. Вы рассказываете о своей ситуации, я задаю вопросы, чтобы понять корень проблемы. Вместе определяем, подходит ли вам гипнотерапия.`,
    },
    {
      num: '02',
      title: 'Сессия гипнотерапии',
      desc: `В комфортной онлайн-обстановке через голос и дыхание я мягко ввожу вас в трансовое состояние. Работаем с первопричиной на уровне подсознания. Вы сохраняете полный контроль.`,
    },
    {
      num: '03',
      title: 'Курс и интеграция',
      desc: `Для устойчивого результата рекомендую курс 5–10 сессий. Между встречами вы получаете индивидуальные аудио-программы для закрепления изменений.`,
    },
    {
      num: '04',
      title: 'Устойчивый результат',
      desc: `Новые нейронные связи, изменение реакций, выход из старых сценариев. Не временное облегчение — а реальные изменения в жизни.`,
    },
  ]

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label="Как я работаю">
      <SectionContainer size="md" background="surface">
        <AnimatedText direction="up" as="h2" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary leading-tight text-center">
          Как я работаю с{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
            {label}
          </span>
        </AnimatedText>
        <AnimatedText direction="up" delay={150} as="p" className="mt-4 text-base text-text-secondary max-w-2xl mx-auto text-center">
          Процесс одинаково эффективен для всех направлений — меняются только акценты
        </AnimatedText>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <TiltCard key={i} tiltDegree={4} scale={1.015} className="rounded-xl h-full">
              <motion.div
                variants={cardUp(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative p-6 bg-bg-surface border border-border-base
                           hover:border-gold/20 transition-all duration-400 rounded-xl h-full flex flex-col"
              >
                <span className="text-4xl font-display text-gold/20 group-hover:text-gold/40 transition-colors duration-300"
                      aria-hidden="true">
                  {step.num}
                </span>
                <h3 className="mt-3 text-lg font-display text-text-primary group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed flex-1">
                  {step.desc}
                </p>
              </motion.div>
            </TiltCard>
          ))}
        </div>

        {/* Online badge */}
        <AnimatedText direction="up" delay={250} as="div" className="mt-10 p-5 rounded-xl bg-bg-elevated/50 border border-border-base text-center">
          <p className="text-sm text-text-muted">
            Онлайн — так же эффективно, как и очные сессии. Нужен только компьютер или телефон с камерой.
          </p>
        </AnimatedText>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── FAQ Section ── */

function FAQSection({ service }: { service: ServiceData }) {
  const faqs = FAQS[service.slug] || DEFAULT_FAQS

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label="Часто задаваемые вопросы">
      <SectionContainer size="md" background="transparent">
        <AnimatedText direction="up" as="h2" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary text-center">
          Часто задаваемые вопросы
        </AnimatedText>

        <div className="mt-10 max-w-2xl mx-auto space-y-3" role="list">
          {faqs.slice(0, 5).map((item, index) => (
            <motion.div
              key={index}
              variants={faqItem(index)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <FaqAccordion question={item.question} answer={item.answer} />
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── CTA Section ── */

function CTASection({ service }: { service: ServiceData }) {
  return (
    <AnimatedSection as="div" variant="fadeUp">
      <SectionContainer size="md" background="deep">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

          <AnimatedText as="h2" direction="up" className="relative text-3xl md:text-4xl font-display text-text-primary leading-tight">
            Запишитесь на{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              бесплатную консультацию
            </span>
          </AnimatedText>

          <AnimatedText as="p" direction="up" delay={150} className="relative mt-6 text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
            На первой встрече мы познакомимся, обсудим ваш запрос, и вы поймёте, подходит ли вам этот метод.
            Никаких обязательств.
          </AnimatedText>

          <AnimatedText direction="up" delay={250} className="relative mt-8">
            <Link
              href="/kontakty/"
              data-analytics-booking={`service-${service.slug}-cta`}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 rounded-full
                         text-sm md:text-base font-semibold tracking-wide overflow-hidden
                         bg-gradient-to-r from-gold to-gold-light text-bg-deep
                         shadow-[0_0_25px_rgba(201,169,110,0.15)]
                         hover:shadow-[0_0_40px_rgba(201,169,110,0.25)]
                         hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-400"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                               transition-transform duration-700 bg-gradient-to-r
                               from-transparent via-white/20 to-transparent" aria-hidden="true" />
              <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(5,5,8,0.5)]">
                {service.cta}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </AnimatedText>
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Related Services Section ── */

function RelatedServicesSection({ service, allServices }: { service: ServiceData; allServices: ServiceData[] }) {
  const relatedSlugs = RELATED_SERVICES[service.slug] || []
  const related = allServices.filter(s => relatedSlugs.includes(s.slug)).slice(0, 3)

  if (related.length === 0) return null

  return (
    <AnimatedSection as="section" variant="fadeUp" aria-label="Похожие услуги">
      <SectionContainer size="md" background="default">
        <AnimatedText direction="up" as="h2" className="text-3xl md:text-4xl lg:text-5xl font-display text-text-primary text-center">
          Похожие направления
        </AnimatedText>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item, i) => (
            <motion.div
              key={item.slug}
              variants={faqItem(i)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <TiltCard tiltDegree={4} scale={1.015} className="rounded-xl h-full">
                <Link
                  href={`/uslugi/${item.slug}/`}
                  className="group block p-6 bg-bg-surface border border-border-base h-full
                             hover:bg-bg-elevated hover:border-gold/30 hover:-translate-y-0.5
                             hover:shadow-glow-gold transition-all duration-400 rounded-xl"
                >
                  <span className="text-2xl" role="img" aria-hidden="true">{SERVICE_ICONS[item.slug] || '✨'}</span>
                  <h3 className="mt-2 text-lg font-display text-gold group-hover:text-gold-light transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">{item.shortTitle}</p>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    </AnimatedSection>
  )
}

/* ── Main Component ── */

export function ClientServicePage({ service, schemas }: Props) {
  const messages = useMessages()
  const allServices = (messages?.servicesData as ServiceData[]) ?? []

  useRegisterSchemas(schemas ?? [])

  return (
    <>
      <HeroSection service={service} />
      <SymptomsSection service={service} />
      <MethodSection service={service} />
      <FAQSection service={service} />
      <CTASection service={service} />
      <RelatedServicesSection service={service} allServices={allServices} />
    </>
  )
}
