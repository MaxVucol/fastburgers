// Russian and English copy for the demo catalog. The database stays the single source of
// truth in Romanian (admins edit it in Romanian); these entries translate it by slug.
// Anything without a translation (e.g. a product added later in /admin) falls back to Romanian.

import { pizzamaniaRu } from "./catalog-pizzamania";

type ProductCopy = { short: string; description: string; ingredients: string[] };
type CategoryCopy = { name: string; description: string };

export type CatalogCopy = {
  categories: Record<string, CategoryCopy>;
  products: Record<string, ProductCopy>;
  /** Keyed by the Romanian value stored in the database. */
  allergens: Record<string, string>;
  /** Keyed by the Romanian option name (also used for cart and order snapshots). */
  options: Record<string, string>;
  /** Words replaced in free-text location hours, e.g. "Zilnic 11:00 – 23:00". */
  hoursWords: Record<string, string>;
};

const ru: CatalogCopy = {
  categories: {
    burgeri: { name: "Бургеры", description: "Смэш-бургеры из говядины Ангус и хрустящей курицы в обжаренной булочке бриошь." },
    pizza: { name: "Пицца", description: "Тесто 48-часовой выдержки, выпекаем при 400 °C с итальянскими продуктами." },
    chicken: { name: "Курица", description: "Курица, 12 часов маринованная в пахте и обжаренная до хруста." },
    wraps: { name: "Врапы", description: "Тёплая тортилья, плотно свёрнутая, удобно взять с собой." },
    cartofi: { name: "Картофель", description: "Режем каждый день и жарим дважды. Классика или с начинкой." },
    combo: { name: "Комбо", description: "Бургер, картофель и напиток по более выгодной цене." },
    deserturi: { name: "Десерты", description: "Печём сами каждое утро." },
    bauturi: { name: "Напитки", description: "Холодные напитки, домашний лимонад и милкшейки." },
    gustari: { name: "Закуски", description: "Луковые кольца, моцарелла-стики и другие хрустящие закуски, чтобы разделить на компанию." },
  },
  products: {
    "classic-smash": {
      short: "Две смэш-котлеты из говядины Ангус, расплавленный чеддер, маринованные огурцы и фирменный соус.",
      description:
        "Две котлеты из говядины Ангус, прижатые к раскалённой плите до карамельной корочки, американский чеддер, мелко рубленный белый лук, маринованные по нашему рецепту огурцы и фирменный соус в обжаренной на сливочном масле булочке бриошь.",
      ingredients: ["Булочка бриошь", "Говядина Ангус 2 × 80 г", "Американский чеддер", "Белый лук", "Маринованные огурцы", "Фирменный соус"],
    },
    "double-cheese": {
      short: "Две толстые котлеты из говядины, четыре ломтика выдержанного чеддера и майонез с дижонской горчицей.",
      description:
        "Две толстые котлеты из говядины Ангус по 120 г, четыре ломтика чеддера 12-месячной выдержки, спелые томаты, салат айсберг, красный лук и майонез с дижонской горчицей в подрумяненной булочке с кунжутом.",
      ingredients: ["Булочка с кунжутом", "Говядина Ангус 2 × 120 г", "Выдержанный чеддер", "Томаты", "Салат айсберг", "Красный лук", "Майонез с дижоном"],
    },
    "bbq-bacon": {
      short: "Говядина Ангус, хрустящий копчёный бекон, луковые кольца и соус BBQ с патокой.",
      description:
        "Котлета из говядины Ангус 180 г, бекон, копчённый на буковой щепе и обжаренный до хруста, чеддер, луковые кольца в пивном кляре и соус BBQ с патокой и копчёной паприкой в мягкой булочке бриошь.",
      ingredients: ["Булочка бриошь", "Говядина Ангус 180 г", "Копчёный бекон", "Чеддер", "Луковые кольца", "Соус BBQ с патокой"],
    },
    "crispy-chicken": {
      short: "Куриное бедро в двойной панировке, коул-слоу из красной капусты и майонез со шрирачей.",
      description:
        "Куриное бедро без кости, 12 часов маринованное в пахте со специями, в двойной панировке, обжаренное до золотистого цвета. С коул-слоу из красной капусты, маринованными огурцами и майонезом со шрирачей в булочке бриошь.",
      ingredients: ["Булочка бриошь", "Куриное бедро 160 г", "Пряная панировка", "Коул-слоу", "Маринованные огурцы", "Майонез со шрирачей"],
    },
    margherita: {
      short: "Томаты Сан-Марцано, моцарелла фьор ди латте и свежий базилик.",
      description:
        "Тесто 48-часовой выдержки, выпеченное при 400 °C, с соусом из томатов Сан-Марцано, моцареллой фьор ди латте, свежим базиликом и каплей оливкового масла экстра вирджин. Просто, как в Неаполе.",
      ingredients: ["Тесто на закваске", "Томаты Сан-Марцано", "Моцарелла фьор ди латте", "Базилик", "Оливковое масло экстра вирджин"],
    },
    pepperoni: {
      short: "Толсто нарезанная пепперони, которая запекается хрустящими чашечками, и мёд с чили.",
      description:
        "Томатный соус с орегано, тёртая моцарелла и толсто нарезанная колбаса пепперони, которая в печи сворачивается хрустящими чашечками. В конце добавляем немного мёда с чили для сладко-острого контраста.",
      ingredients: ["Тесто на закваске", "Томатный соус", "Моцарелла", "Пепперони", "Орегано", "Мёд с чили"],
    },
    "bbq-chicken-pizza": {
      short: "Курица гриль на соусе BBQ, красный лук, печёный перец и кинза.",
      description:
        "Вместо томатов основа из копчёного соуса BBQ. Сверху куриная грудка гриль, моцарелла, тонко нарезанный красный лук, печёный перец и свежая кинза, которую добавляем сразу после печи.",
      ingredients: ["Тесто на закваске", "Соус BBQ", "Куриная грудка гриль", "Моцарелла", "Красный лук", "Печёный перец", "Кинза"],
    },
    "four-cheese": {
      short: "Моцарелла, горгонзола, выдержанный пармезан и копчёная скаморца на белой основе.",
      description:
        "Белая пицца на сливочной основе с моцареллой, сладкой горгонзолой, пармиджано реджано 24-месячной выдержки и копчёной скаморцей, со свежемолотым чёрным перцем.",
      ingredients: ["Тесто на закваске", "Сливочный соус", "Моцарелла", "Горгонзола", "Пармиджано реджано", "Копчёная скаморца"],
    },
    "crispy-tenders": {
      short: "5 стрипсов из куриной грудки в хрустящей панировке с чесночным соусом и травами.",
      description:
        "Пять полосок куриной грудки, маринованных в пахте, обваленных в пряной муке и обжаренных до золотистой хрустящей корочки. Подаём с чесночным соусом и свежими травами.",
      ingredients: ["Куриная грудка", "Пахта", "Пряная мука", "Чесночный соус"],
    },
    "hot-wings": {
      short: "Острые крылышки баффало, 8 штук, с соусом из голубого сыра.",
      description:
        "Восемь куриных крылышек, сначала запечённых, потом обжаренных и покрытых соусом баффало со сливочным маслом и кайенским перцем. Баланс дают палочки сельдерея и сливочный соус из голубого сыра.",
      ingredients: ["Куриные крылышки", "Соус баффало", "Сливочное масло", "Кайенский перец", "Сельдерей", "Соус из голубого сыра"],
    },
    "chicken-box": {
      short: "6 кусочков хрустящей курицы, большой картофель, коул-слоу и два соуса. Чтобы поделиться.",
      description:
        "Чтобы поделиться: шесть кусочков курицы на кости, бёдра и крылья в хрустящей панировке с 11 специями, большая порция картофеля фри, свежий коул-слоу и два соуса на выбор.",
      ingredients: ["Курица на кости 6 шт.", "Панировка с 11 специями", "Картофель фри", "Коул-слоу", "2 соуса"],
    },
    "crispy-chicken-wrap": {
      short: "Тёплая тортилья с хрустящей курицей, салатом романо, чеддером и соусом ранч с укропом.",
      description:
        "Пшеничная тортилья, подрумяненная на плите, с полосками хрустящей курицы, салатом романо, томатами, красной капустой, чеддером и соусом ранч с укропом. Плотно свёрнута и разрезана пополам.",
      ingredients: ["Пшеничная тортилья", "Хрустящая курица", "Салат романо", "Томаты", "Красная капуста", "Чеддер", "Соус ранч"],
    },
    "bbq-beef-wrap": {
      short: "Говядина 10-часового томления, соус BBQ пери-пери, печёный перец и молодой шпинат.",
      description:
        "Говядина, томлённая 10 часов и разобранная на волокна, соус BBQ пери-пери, печёный перец, молодой шпинат, маринованный лук и йогуртовый соус с лимоном в шпинатной тортилье.",
      ingredients: ["Шпинатная тортилья", "Рваная говядина", "Соус BBQ пери-пери", "Печёный перец", "Молодой шпинат", "Маринованный лук", "Йогуртовый соус"],
    },
    "classic-combo": {
      short: "Classic Smash, классический картофель и напиток 0,33 л на выбор.",
      description:
        "Меню, с которого нас узнали: Classic Smash, порция картофеля, нарезанного утром и обжаренного дважды, и прохладительный напиток в банке. Напишите любимый напиток в комментарии.",
      ingredients: ["Classic Smash", "Классический картофель", "Напиток 0,33 л"],
    },
    "double-burger-combo": {
      short: "Два бургера Classic Smash, большой картофель и два напитка. Меню на двоих.",
      description:
        "На двоих: два бургера Classic Smash, большая порция классического картофеля с морской солью и два напитка в банке. Лучшее соотношение цены и сытости в меню.",
      ingredients: ["2 × Classic Smash", "Большой картофель", "2 × Напиток 0,33 л"],
    },
    "chicken-combo": {
      short: "Бургер Crispy Chicken, классический картофель и прохладительный напиток.",
      description:
        "Бургер Crispy Chicken с куриным бедром в двойной панировке, порция классического картофеля и прохладительный напиток 0,33 л. Любите поострее — добавьте острый соус.",
      ingredients: ["Crispy Chicken", "Классический картофель", "Напиток 0,33 л"],
    },
    "classic-fries": {
      short: "Картофель, нарезанный утром и обжаренный дважды, с хлопьями морской соли.",
      description:
        "Румынский картофель, который мы чистим и режем каждое утро, жарим дважды ради хрустящей корочки и мягкой середины и приправляем хлопьями морской соли.",
      ingredients: ["Картофель", "Подсолнечное масло", "Морская соль"],
    },
    "cheesy-fries": {
      short: "Хрустящий картофель с горячим сырным соусом чеддер, моцареллой, зелёным луком и чили.",
      description:
        "Щедрая порция хрустящего картофеля под горячим соусом из выдержанного чеддера, запечённой моцареллой, зелёным луком и хлопьями чили для лёгкой остроты.",
      ingredients: ["Картофель", "Соус чеддер", "Моцарелла", "Зелёный лук", "Хлопья чили"],
    },
    "loaded-fries": {
      short: "Картофель с хрустящим беконом, белым сырным соусом, жареными грибами и петрушкой.",
      description:
        "По мотивам путина: картофель двойной обжарки, белый сырный соус, хрустящий копчёный бекон, грибы, обжаренные с чесноком, шпинат и свежая петрушка. По сути, полноценный обед.",
      ingredients: ["Картофель", "Белый сырный соус", "Копчёный бекон", "Грибы", "Шпинат", "Петрушка"],
    },
    "chocolate-brownie": {
      short: "Плотный брауни на бельгийском шоколаде 70%, подаём тёплым с шоколадным соусом.",
      description:
        "Домашний брауни на бельгийском шоколаде 70%, сливочном масле и тростниковом сахаре: хрустящий сверху и тающий внутри. Подаём тёплым, политым шоколадным соусом.",
      ingredients: ["Бельгийский шоколад 70%", "Сливочное масло", "Тростниковый сахар", "Яйца", "Мука"],
    },
    cheesecake: {
      short: "Нью-йоркский чизкейк на песочной основе с конфитюром из дикой черники.",
      description:
        "Нью-йоркский чизкейк медленного запекания со сливочным сыром и ванилью Бурбон на основе из сливочного печенья, покрытый конфитюром из дикой черники.",
      ingredients: ["Сливочный сыр", "Ваниль Бурбон", "Сливочное печенье", "Дикая черника"],
    },
    cookie: {
      short: "Печенье 120 г с кусочками тёмного шоколада и хлопьями морской соли.",
      description:
        "Печенье 120 г с хрустящими краями и мягким центром, с кусочками тёмного и молочного шоколада и хлопьями морской соли. Печём каждый день.",
      ingredients: ["Мука", "Сливочное масло", "Тёмный шоколад", "Молочный шоколад", "Морская соль"],
    },
    "coca-cola": {
      short: "Coca-Cola Original Taste в банке 330 мл, подаём холодной.",
      description:
        "Coca-Cola Original Taste в банке 330 мл, хранится в холоде, по желанию со льдом. Классика, которая подходит к любому бургеру.",
      ingredients: ["Газированный безалкогольный напиток"],
    },
    fanta: {
      short: "Fanta Orange в банке 330 мл с ярким апельсиновым вкусом.",
      description:
        "Fanta Orange в банке 330 мл, со вкусом апельсина и мелкими пузырьками. Есть вариант Zero Sugar по той же цене.",
      ingredients: ["Газированный безалкогольный напиток с апельсиновым соком"],
    },
    sprite: {
      short: "Sprite с лимоном и лаймом, 330 мл, без кофеина, очень холодный.",
      description:
        "Sprite со вкусом лимона и лайма в банке 330 мл: освежает, без кофеина, идеально к острым крылышкам.",
      ingredients: ["Газированный безалкогольный напиток со вкусом лимона и лайма"],
    },
    lemonade: {
      short: "Лимонад, выжатый при заказе, с лимоном, лаймом и свежей мятой, 500 мл.",
      description:
        "Выжимаем при заказе из лимонов и лаймов, слегка подслащиваем тростниковым сиропом и подаём со свежей мятой и большим количеством льда. 500 мл.",
      ingredients: ["Лимон", "Лайм", "Свежая мята", "Тростниковый сироп", "Лёд"],
    },
    milkshake: {
      short: "Ванильное мороженое ручной работы и свежая клубника со сливками. 400 мл.",
      description:
        "Ванильное мороженое ручной работы, взбитое с цельным молоком и свежей клубникой, со взбитыми сливками и целой ягодой сверху. 400 мл удовольствия.",
      ingredients: ["Ванильное мороженое", "Цельное молоко", "Клубника", "Взбитые сливки"],
    },
    "cheeseburger": {
      short: "Одна смэш-котлета из говядины Ангус, чеддер, маринованные огурцы, лук, кетчуп и горчица.",
      description: "Самый простой бургер в меню: одна хрустящая смэш-котлета из говядины Ангус, расплавленный чеддер, маринованные огурцы, рубленый белый лук, кетчуп и горчица в обжаренной булочке бриошь.",
      ingredients: ["Булочка бриошь", "Говядина Ангус 1 × 90 г", "Чеддер", "Маринованные огурцы", "Белый лук", "Кетчуп", "Горчица"],
    },
    "mushroom-swiss": {
      short: "Две смэш-котлеты из говядины, швейцарский сыр, жареные шампиньоны и чесночный майонез.",
      description: "Две смэш-котлеты из говядины Ангус с расплавленным швейцарским сыром, шампиньонами, обжаренными на сливочном масле с тимьяном, карамелизированным луком и чесночным майонезом в булочке бриошь.",
      ingredients: ["Булочка бриошь", "Говядина Ангус 2 × 80 г", "Швейцарский сыр", "Шампиньоны", "Карамелизированный лук", "Чесночный майонез"],
    },
    "spicy-chicken-burger": {
      short: "Хрустящее куриное бедро в острой панировке, халапеньо, коул-слоу и майонез чипотле.",
      description: "Куриное бедро, маринованное в пахте с острым перцем, в пряной панировке, обжаренное до хруста, с халапеньо, коул-слоу и майонезом чипотле в булочке бриошь.",
      ingredients: ["Булочка бриошь", "Куриное бедро 160 г", "Острая панировка", "Халапеньо", "Коул-слоу", "Майонез чипотле"],
    },
    "chicken-nuggets": {
      short: "Девять кусочков куриной грудки в хрустящей панировке и соус на выбор.",
      description: "Крупно рубленная куриная грудка в форме наггетсов, в хрустящей панировке, обжаренная до золотистого цвета. Девять штук и соус на выбор.",
      ingredients: ["Куриная грудка", "Хрустящая панировка", "Соус на выбор"],
    },
    "chicken-caesar-wrap": {
      short: "Курица гриль, салат романо, пармезан, гренки и соус «Цезарь» в тортилье.",
      description: "Нарезанная куриная грудка гриль, салат романо, тёртый пармезан, гренки и соус «Цезарь», плотно свёрнутые в тёплую пшеничную тортилью.",
      ingredients: ["Тортилья", "Куриная грудка гриль", "Салат романо", "Пармезан", "Гренки", "Соус «Цезарь»"],
    },
    "spicy-chicken-wrap": {
      short: "Хрустящие полоски курицы в острой панировке, халапеньо, салат, томаты и майонез чипотле.",
      description: "Хрустящие полоски курицы в острой панировке, салат айсберг, томаты, халапеньо и майонез чипотле, свёрнутые в тёплую тортилью.",
      ingredients: ["Тортилья", "Полоски курицы в острой панировке", "Салат айсберг", "Томаты", "Халапеньо", "Майонез чипотле"],
    },
    "diavola": {
      short: "Острая салями, моцарелла, томатный соус и масло с чили.",
      description: "Тесто 48-часовой выдержки, томатный соус, моцарелла и острая салями, а после печи — немного масла с чили.",
      ingredients: ["Тесто на закваске", "Томатный соус", "Моцарелла", "Острая салями", "Масло с чили"],
    },
    "potato-wedges": {
      short: "Толстые дольки картофеля с кожурой, со специями, запечённые до хруста.",
      description: "Картофель, нарезанный толстыми дольками с кожурой, с копчёной паприкой и чесноком, обжаренный до хрустящей корочки и мягкий внутри.",
      ingredients: ["Картофель", "Копчёная паприка", "Гранулированный чеснок", "Соль"],
    },
    "onion-rings": {
      short: "Луковые кольца в хрустящем кляре с соусом BBQ.",
      description: "Толстые кольца сладкого лука в хрустящем кляре, обжаренные до золотистого цвета. Подаём с соусом BBQ.",
      ingredients: ["Лук", "Хрустящий кляр", "Соус BBQ"],
    },
    "mozzarella-sticks": {
      short: "Палочки моцареллы в панировке с соусом маринара.",
      description: "Палочки моцареллы в пряной панировке, обжаренные так, что сыр внутри тянется. Подаём с соусом маринара.",
      ingredients: ["Моцарелла", "Пряная панировка", "Соус маринара"],
    },
    "combo-for-two": {
      short: "Два Classic Smash, две порции классического картофеля и два напитка по 0,33 л.",
      description: "Для вечера вдвоём: два бургера Classic Smash, две порции классического картофеля и два напитка по 0,33 л на выбор.",
      ingredients: ["2 × Classic Smash", "2 × Классический картофель", "2 × Напиток 0,33 л"],
    },
    "family-box": {
      short: "Четыре бургера (2 Classic Smash, 2 Crispy Chicken), четыре порции картофеля и четыре напитка.",
      description: "Для всей семьи: два Classic Smash, два Crispy Chicken, четыре порции классического картофеля и четыре напитка по 0,33 л на выбор.",
      ingredients: ["2 × Classic Smash", "2 × Crispy Chicken", "4 × Классический картофель", "4 × Напиток 0,33 л"],
    },
    "chocolate-cake": {
      short: "Кусочек торта с какао-бисквитом, шоколадным кремом и глазурью.",
      description: "Кусочек торта с какао-бисквитом, кремом из тёмного шоколада и глянцевой глазурью, со свежими ягодами.",
      ingredients: ["Какао-бисквит", "Крем из тёмного шоколада", "Шоколадная глазурь", "Ягоды"],
    },
    "iced-tea": {
      short: "Домашний чёрный чай холодного заваривания с персиком и лимоном.",
      description: "Чёрный чай, заваренный холодным способом за ночь, с пюре из персика, лимоном и небольшим количеством сахара. Делаем сами, подаём со льдом.",
      ingredients: ["Чёрный чай", "Пюре из персика", "Лимон", "Сахар", "Лёд"],
    },
    "still-water": {
      short: "Негазированная минеральная вода, 0,5 л.",
      description: "Негазированная минеральная вода в бутылке 0,5 л, подаём охлаждённой.",
      ingredients: ["Минеральная вода без газа 0,5 л"],
    },
  },
  allergens: {
    Gluten: "Глютен",
    Lapte: "Молоко",
    Ouă: "Яйца",
    Muștar: "Горчица",
    Susan: "Кунжут",
    Țelină: "Сельдерей",
    Soia: "Соя",
  },
  options: {
    "Extra cheddar": "Дополнительный чеддер",
    "Extra bacon": "Дополнительный бекон",
    "Sos picant": "Острый соус",
    "Sosul casei": "Фирменный соус",
    "Porție de cartofi": "Порция картофеля",
    "Băutură 0,33 l": "Напиток 0,33 л",
    "Extra mozzarella": "Дополнительная моцарелла",
    "Margine umplută cu brânză": "Бортик с сыром",
    Jalapeño: "Халапеньо",
    "Ulei picant cu chili": "Острое масло с чили",
    "Sos BBQ afumat": "Копчёный соус BBQ",
    "Sos de usturoi": "Чесночный соус",
    "Porție dublă de carne": "Двойная порция мяса",
    "Upgrade la Cheesy Fries": "Замена на Cheesy Fries",
    "Upgrade la milkshake": "Замена напитка на милкшейк",
    "Sos extra la alegere": "Дополнительный соус на выбор",
    "Sos de cheddar": "Соус чеддер",
    Ketchup: "Кетчуп",
    Maioneză: "Майонез",
    "Bilă de înghețată de vanilie": "Шарик ванильного мороженого",
    "Varianta Zero Sugar": "Вариант Zero Sugar",
    "Cu ghimbir proaspăt": "Со свежим имбирём",
    "Fără zahăr": "Без сахара",
    "Frișcă extra": "Дополнительные сливки",
    "Topping de biscuiți Oreo": "Топпинг из печенья Oreo",
  },
  hoursWords: { Zilnic: "Ежедневно" },
};

const en: CatalogCopy = {
  categories: {
    burgeri: { name: "Burgers", description: "Angus smash burgers and crispy chicken in a toasted brioche bun." },
    pizza: { name: "Pizza", description: "Dough proofed for 48 hours, baked at 400 °C with Italian ingredients." },
    chicken: { name: "Chicken", description: "Chicken marinated for 12 hours in buttermilk and fried until crisp." },
    wraps: { name: "Wraps", description: "A warm tortilla, rolled tight, made for eating on the go." },
    cartofi: { name: "Fries", description: "Cut daily and fried twice. Plain or loaded." },
    combo: { name: "Combos", description: "Burger, fries and a drink, for a better price." },
    deserturi: { name: "Desserts", description: "Baked in-house every morning." },
    bauturi: { name: "Drinks", description: "Cold soft drinks, house lemonade and milkshakes." },
    gustari: { name: "Snacks", description: "Onion rings, mozzarella sticks and other crunchy snacks to share." },
  },
  products: {
    "classic-smash": {
      short: "Two Angus smash patties, melted cheddar, pickles and our house sauce.",
      description:
        "Two Angus beef patties smashed on a scorching griddle until they form a caramelised crust, American cheddar, finely diced white onion, house-pickled cucumbers and our special sauce, in a butter-toasted brioche bun.",
      ingredients: ["Brioche bun", "Angus beef 2 × 80 g", "American cheddar", "White onion", "Pickles", "House sauce"],
    },
    "double-cheese": {
      short: "Two thick beef patties, four slices of aged cheddar and Dijon mayo.",
      description:
        "Two thick 120 g Angus beef patties, four slices of 12-month aged cheddar, ripe tomato, iceberg lettuce, red onion and Dijon mustard mayo, in a griddle-toasted sesame bun.",
      ingredients: ["Sesame bun", "Angus beef 2 × 120 g", "Aged cheddar", "Tomato", "Iceberg lettuce", "Red onion", "Dijon mayo"],
    },
    "bbq-bacon": {
      short: "Angus beef, crispy smoked bacon, onion rings and molasses BBQ sauce.",
      description:
        "A 180 g Angus beef patty, beechwood-smoked bacon fried until crisp, cheddar, beer-battered onion rings and a BBQ sauce with molasses and smoked paprika, served in a soft brioche bun.",
      ingredients: ["Brioche bun", "Angus beef 180 g", "Smoked bacon", "Cheddar", "Onion rings", "Molasses BBQ sauce"],
    },
    "crispy-chicken": {
      short: "Double-breaded chicken thigh, red cabbage slaw and sriracha mayo.",
      description:
        "Boneless chicken thigh marinated for 12 hours in spiced buttermilk, double-breaded and fried until golden. It comes with red cabbage slaw, pickles and sriracha mayo in a brioche bun.",
      ingredients: ["Brioche bun", "Chicken thigh 160 g", "Spiced breading", "Coleslaw", "Pickles", "Sriracha mayo"],
    },
    margherita: {
      short: "San Marzano tomatoes, fior di latte mozzarella and fresh basil.",
      description:
        "Dough proofed for 48 hours and baked at 400 °C, with San Marzano tomato sauce, fior di latte mozzarella, fresh basil and a drizzle of extra virgin olive oil. Simple, just like in Naples.",
      ingredients: ["Sourdough base", "San Marzano tomatoes", "Fior di latte mozzarella", "Basil", "Extra virgin olive oil"],
    },
    pepperoni: {
      short: "Thick-cut pepperoni that crisps into little cups, finished with chilli honey.",
      description:
        "Tomato sauce with oregano, grated mozzarella and thick-cut pepperoni that curls into crispy cups in the oven. We finish it with a drizzle of chilli honey for a sweet-and-hot contrast.",
      ingredients: ["Sourdough base", "Tomato sauce", "Mozzarella", "Pepperoni", "Oregano", "Chilli honey"],
    },
    "bbq-chicken-pizza": {
      short: "Grilled chicken on a BBQ sauce base, red onion, roasted pepper and coriander.",
      description:
        "Instead of tomato, the base is a smoky BBQ sauce. On top: grilled chicken breast, mozzarella, thinly sliced red onion, roasted pepper and fresh coriander added straight out of the oven.",
      ingredients: ["Sourdough base", "BBQ sauce", "Grilled chicken breast", "Mozzarella", "Red onion", "Roasted pepper", "Coriander"],
    },
    "four-cheese": {
      short: "Mozzarella, gorgonzola, aged parmesan and smoked scamorza on a white base.",
      description:
        "A pizza bianca with a cream base, mozzarella, gorgonzola dolce, 24-month Parmigiano Reggiano and smoked scamorza, finished with freshly ground black pepper.",
      ingredients: ["Sourdough base", "Cream", "Mozzarella", "Gorgonzola", "Parmigiano Reggiano", "Smoked scamorza"],
    },
    "crispy-tenders": {
      short: "5 crispy breaded chicken breast strips with garlic and herb dip.",
      description:
        "Five strips of chicken breast marinated in buttermilk, dredged in seasoned flour and fried until golden and crunchy. Served with a garlic and fresh herb dip.",
      ingredients: ["Chicken breast", "Buttermilk", "Seasoned flour", "Garlic dip"],
    },
    "hot-wings": {
      short: "8 wings glazed in hot buffalo sauce, with blue cheese dip.",
      description:
        "Eight chicken wings, baked and then fried, glazed in a buffalo sauce with butter and cayenne. We balance them with celery sticks and a creamy blue cheese dip.",
      ingredients: ["Chicken wings", "Buffalo sauce", "Butter", "Cayenne pepper", "Celery", "Blue cheese dip"],
    },
    "chicken-box": {
      short: "6 pieces of crispy chicken, large fries, coleslaw and two dips. Made for sharing.",
      description:
        "For sharing: six pieces of bone-in chicken, thighs and wings in a crunchy 11-spice coating, a large portion of fries, fresh coleslaw and two dips of your choice.",
      ingredients: ["Bone-in chicken × 6", "11-spice coating", "Fries", "Coleslaw", "2 dips"],
    },
    "crispy-chicken-wrap": {
      short: "Warm tortilla with crispy chicken, romaine, cheddar and dill ranch.",
      description:
        "A wheat tortilla toasted on the griddle and filled with crispy chicken strips, romaine lettuce, tomato, red cabbage, cheddar and dill ranch, rolled tight and cut in half.",
      ingredients: ["Wheat tortilla", "Crispy chicken", "Romaine lettuce", "Tomato", "Red cabbage", "Cheddar", "Ranch sauce"],
    },
    "bbq-beef-wrap": {
      short: "Beef slow-cooked for 10 hours, peri-peri BBQ sauce, roasted peppers and baby spinach.",
      description:
        "Beef slow-cooked for 10 hours and pulled, peri-peri BBQ sauce, roasted peppers, baby spinach, pickled onion and a lemon yoghurt sauce, in a spinach tortilla.",
      ingredients: ["Spinach tortilla", "Pulled beef", "Peri-peri BBQ sauce", "Roasted peppers", "Baby spinach", "Pickled onion", "Yoghurt sauce"],
    },
    "classic-combo": {
      short: "Classic Smash, classic fries and a 0.33 l drink of your choice.",
      description:
        "The meal that made our name: a Classic Smash, a portion of fries cut daily and fried twice, plus a canned soft drink. Tell us your favourite drink in the order notes.",
      ingredients: ["Classic Smash", "Classic fries", "Drink 0.33 l"],
    },
    "double-burger-combo": {
      short: "Two Classic Smash burgers, large fries and two drinks. The meal for two.",
      description:
        "For two: two Classic Smash burgers, a large portion of classic fries with sea salt and two canned drinks. The best value-for-hunger deal on the menu.",
      ingredients: ["2 × Classic Smash", "Large fries", "2 × Drink 0.33 l"],
    },
    "chicken-combo": {
      short: "Crispy Chicken burger, classic fries and a soft drink.",
      description:
        "The Crispy Chicken burger with double-breaded chicken thigh, alongside classic fries and a 0.33 l soft drink. Add hot sauce if you like it spicy.",
      ingredients: ["Crispy Chicken", "Classic fries", "Drink 0.33 l"],
    },
    "classic-fries": {
      short: "Cut daily, fried twice, finished with sea salt flakes.",
      description:
        "Romanian potatoes peeled and cut every morning, fried twice for a crisp outside and a fluffy middle, then seasoned with sea salt flakes.",
      ingredients: ["Potatoes", "Sunflower oil", "Sea salt"],
    },
    "cheesy-fries": {
      short: "Crispy fries with warm cheddar sauce, mozzarella, spring onion and chilli.",
      description:
        "A generous portion of crispy fries covered in warm aged-cheddar sauce, melted mozzarella, spring onion and chilli flakes for a gentle kick.",
      ingredients: ["Potatoes", "Cheddar sauce", "Mozzarella", "Spring onion", "Chilli flakes"],
    },
    "loaded-fries": {
      short: "Fries with crispy bacon, white cheese sauce, sautéed mushrooms and parsley.",
      description:
        "Inspired by poutine: twice-fried potatoes, white cheese sauce, crispy smoked bacon, garlic-sautéed mushrooms, spinach and fresh parsley. Basically a full meal.",
      ingredients: ["Potatoes", "White cheese sauce", "Smoked bacon", "Mushrooms", "Spinach", "Parsley"],
    },
    "chocolate-brownie": {
      short: "Dense brownie with 70% Belgian chocolate, served warm with chocolate sauce.",
      description:
        "A house-baked brownie made with 70% Belgian chocolate, butter and brown sugar: crisp on top, fudgy in the middle. Served warm with chocolate sauce.",
      ingredients: ["70% Belgian chocolate", "Butter", "Brown sugar", "Eggs", "Flour"],
    },
    cheesecake: {
      short: "New York cheesecake on a biscuit base with wild blueberry compote.",
      description:
        "A slow-baked New York cheesecake with cream cheese and Bourbon vanilla on a buttery biscuit base, topped with wild blueberry compote.",
      ingredients: ["Cream cheese", "Bourbon vanilla", "Butter biscuits", "Wild blueberries"],
    },
    cookie: {
      short: "A 120 g cookie with dark chocolate chunks and sea salt flakes.",
      description:
        "A 120 g cookie with crisp edges and a soft centre, packed with dark and milk chocolate chunks and finished with sea salt flakes. Baked every day.",
      ingredients: ["Flour", "Butter", "Dark chocolate", "Milk chocolate", "Sea salt"],
    },
    "coca-cola": {
      short: "Coca-Cola Original Taste, 330 ml can, served cold.",
      description:
        "Coca-Cola Original Taste in a 330 ml can, kept cold and served with ice on request. The classic that goes with any burger.",
      ingredients: ["Carbonated soft drink"],
    },
    fanta: {
      short: "Fanta Orange, 330 ml can, with a bright orange flavour.",
      description:
        "Fanta Orange in a 330 ml can, with orange flavour and fine bubbles. Also available as Zero Sugar at the same price.",
      ingredients: ["Carbonated soft drink with orange juice"],
    },
    sprite: {
      short: "Sprite lemon and lime, 330 ml, caffeine-free and ice cold.",
      description:
        "Lemon and lime flavoured Sprite in a 330 ml can: refreshing, caffeine-free and perfect next to spicy wings.",
      ingredients: ["Lemon and lime flavoured carbonated soft drink"],
    },
    lemonade: {
      short: "Lemonade squeezed to order with lemon, lime and fresh mint, 500 ml.",
      description:
        "Squeezed to order from lemons and limes, lightly sweetened with cane syrup and served with fresh mint and plenty of ice. 500 ml.",
      ingredients: ["Lemon", "Lime", "Fresh mint", "Cane syrup", "Ice"],
    },
    milkshake: {
      short: "Artisan vanilla ice cream and fresh strawberries, topped with cream. 400 ml.",
      description:
        "Artisan vanilla ice cream blended with whole milk and fresh strawberries, topped with whipped cream and a whole strawberry. 400 ml of treat.",
      ingredients: ["Vanilla ice cream", "Whole milk", "Strawberries", "Whipped cream"],
    },
    "cheeseburger": {
      short: "One Angus smash patty, cheddar, pickles, onion, ketchup and mustard.",
      description: "The simplest burger on the menu: one crispy Angus smash patty, melted cheddar, pickles, chopped white onion, ketchup and mustard in a toasted brioche bun.",
      ingredients: ["Brioche bun", "Angus beef 1 × 90 g", "Cheddar", "Pickles", "White onion", "Ketchup", "Mustard"],
    },
    "mushroom-swiss": {
      short: "Two beef smash patties, Swiss cheese, pan-fried mushrooms and garlic mayo.",
      description: "Two Angus smash patties with melted Swiss cheese, button mushrooms pan-fried in butter and thyme, caramelised onion and garlic mayo in a brioche bun.",
      ingredients: ["Brioche bun", "Angus beef 2 × 80 g", "Swiss cheese", "Button mushrooms", "Caramelised onion", "Garlic mayo"],
    },
    "spicy-chicken-burger": {
      short: "Crispy chicken thigh in a spicy coating, jalapeño, slaw and chipotle mayo.",
      description: "Chicken thigh marinated in buttermilk and chilli, dredged in a spiced coating and fried crisp, with jalapeño, slaw and chipotle mayo in a brioche bun.",
      ingredients: ["Brioche bun", "Chicken thigh 160 g", "Spicy coating", "Jalapeño", "Coleslaw", "Chipotle mayo"],
    },
    "chicken-nuggets": {
      short: "Nine pieces of chicken breast in a crispy coating, with a dip of your choice.",
      description: "Coarsely chopped chicken breast shaped into nuggets, coated and fried golden. Nine pieces, served with a dip of your choice.",
      ingredients: ["Chicken breast", "Crispy coating", "Dip of your choice"],
    },
    "chicken-caesar-wrap": {
      short: "Grilled chicken, romaine, Parmesan, croutons and Caesar dressing in a tortilla.",
      description: "Sliced grilled chicken breast, romaine lettuce, grated Parmesan, croutons and Caesar dressing, rolled tight in a warm wheat tortilla.",
      ingredients: ["Tortilla", "Grilled chicken breast", "Romaine lettuce", "Parmesan", "Croutons", "Caesar dressing"],
    },
    "spicy-chicken-wrap": {
      short: "Crispy spicy chicken strips, jalapeño, lettuce, tomato and chipotle mayo.",
      description: "Crispy chicken strips in a spicy coating, iceberg lettuce, tomato, jalapeño and chipotle mayo, rolled in a warm tortilla.",
      ingredients: ["Tortilla", "Spicy chicken strips", "Iceberg lettuce", "Tomato", "Jalapeño", "Chipotle mayo"],
    },
    "diavola": {
      short: "Spicy salami, mozzarella, tomato sauce and chilli oil.",
      description: "48-hour dough, tomato sauce, mozzarella and spicy salami, finished with a drizzle of chilli oil after the oven.",
      ingredients: ["Sourdough base", "Tomato sauce", "Mozzarella", "Spicy salami", "Chilli oil"],
    },
    "potato-wedges": {
      short: "Thick skin-on potato wedges, seasoned and baked crisp.",
      description: "Potatoes cut into thick skin-on wedges, seasoned with smoked paprika and garlic, fried crisp outside and soft inside.",
      ingredients: ["Potatoes", "Smoked paprika", "Granulated garlic", "Salt"],
    },
    "onion-rings": {
      short: "Onion rings in a crispy batter, with BBQ sauce.",
      description: "Thick rings of sweet onion in a crispy batter, fried golden. Served with BBQ sauce.",
      ingredients: ["Onion", "Crispy batter", "BBQ sauce"],
    },
    "mozzarella-sticks": {
      short: "Breaded mozzarella sticks with marinara sauce.",
      description: "Mozzarella sticks in seasoned breadcrumbs, fried until the cheese melts inside. Served with marinara sauce.",
      ingredients: ["Mozzarella", "Seasoned breadcrumbs", "Marinara sauce"],
    },
    "combo-for-two": {
      short: "Two Classic Smash, two classic fries and two 0.33 l drinks.",
      description: "For a night in for two: two Classic Smash burgers, two portions of classic fries and two 0.33 l drinks of your choice.",
      ingredients: ["2 × Classic Smash", "2 × Classic fries", "2 × Drink 0.33 l"],
    },
    "family-box": {
      short: "Four burgers (2 Classic Smash, 2 Crispy Chicken), four fries and four drinks.",
      description: "For the whole family: two Classic Smash, two Crispy Chicken, four portions of classic fries and four 0.33 l drinks of your choice.",
      ingredients: ["2 × Classic Smash", "2 × Crispy Chicken", "4 × Classic fries", "4 × Drink 0.33 l"],
    },
    "chocolate-cake": {
      short: "A slice of cake with cocoa sponge, chocolate cream and glaze.",
      description: "A slice of cake with cocoa sponge, dark chocolate cream and a glossy glaze, with fresh berries.",
      ingredients: ["Cocoa sponge", "Dark chocolate cream", "Chocolate glaze", "Berries"],
    },
    "iced-tea": {
      short: "House-made cold-brew black tea with peach and lemon.",
      description: "Black tea cold-brewed overnight with peach purée, lemon and a little sugar. Made in house, served over ice.",
      ingredients: ["Black tea", "Peach purée", "Lemon", "Sugar", "Ice"],
    },
    "still-water": {
      short: "Still mineral water, 0.5 l.",
      description: "Still mineral water in a 0.5 l bottle, served cold.",
      ingredients: ["Still mineral water 0.5 l"],
    },
  },
  allergens: {
    Gluten: "Gluten",
    Lapte: "Milk",
    Ouă: "Eggs",
    Muștar: "Mustard",
    Susan: "Sesame",
    Țelină: "Celery",
    Soia: "Soy",
  },
  options: {
    "Extra cheddar": "Extra cheddar",
    "Extra bacon": "Extra bacon",
    "Sos picant": "Hot sauce",
    "Sosul casei": "House sauce",
    "Porție de cartofi": "Side of fries",
    "Băutură 0,33 l": "Drink 0.33 l",
    "Extra mozzarella": "Extra mozzarella",
    "Margine umplută cu brânză": "Cheese-stuffed crust",
    Jalapeño: "Jalapeño",
    "Ulei picant cu chili": "Chilli oil",
    "Sos BBQ afumat": "Smoky BBQ sauce",
    "Sos de usturoi": "Garlic sauce",
    "Porție dublă de carne": "Double meat",
    "Upgrade la Cheesy Fries": "Upgrade to Cheesy Fries",
    "Upgrade la milkshake": "Upgrade to a milkshake",
    "Sos extra la alegere": "Extra dip of your choice",
    "Sos de cheddar": "Cheddar sauce",
    Ketchup: "Ketchup",
    Maioneză: "Mayonnaise",
    "Bilă de înghețată de vanilie": "Scoop of vanilla ice cream",
    "Varianta Zero Sugar": "Zero Sugar",
    "Cu ghimbir proaspăt": "With fresh ginger",
    "Fără zahăr": "No sugar",
    "Frișcă extra": "Extra whipped cream",
    "Topping de biscuiți Oreo": "Oreo cookie topping",
  },
  hoursWords: { Zilnic: "Daily" },
};

// Catalogue imported from the previous brand menu: Russian copy exists, English does not (it falls back to Romanian).
Object.assign(ru.categories, pizzamaniaRu.categories);
Object.assign(ru.products, pizzamaniaRu.products);

export const catalogCopy: Record<"ru" | "en", CatalogCopy> = { ru, en };
