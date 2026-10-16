import type { OrderStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";

/** Statuses the customer gets an e-mail about (the others are small steps they need not hear of). */
export const EMAILED_STATUSES = ["CONFIRMED", "READY", "OUT_FOR_DELIVERY", "CANCELLED"] as const satisfies readonly OrderStatus[];
export type EmailedStatus = (typeof EMAILED_STATUSES)[number];

export type MailStrings = {
  footer: string;
  emailChange: { subject: string; heading: string; intro: string; button: string; outro: string };
  emailChangeNotice: { subject: string; heading: string; intro: string; outro: string };
  googleLinked: { subject: string; heading: string; intro: string; outro: string };
  order: {
    subject: string;
    heading: string;
    intro: string;
    number: string;
    method: string;
    address: string;
    restaurant: string;
    payment: string;
    subtotal: string;
    delivery: string;
    free: string;
    total: string;
    items: string;
    track: string;
    onlinePending: string;
  };
  status: { subject: string; track: string } & Record<EmailedStatus, { heading: string; text: string }>;
};

export const mailStrings: Record<Locale, MailStrings> = {
  ro: {
    footer: "Ai primit acest e-mail automat de la BUNIQ. Nu răspunde la el; pentru întrebări sună-ne sau scrie-ne de pe site.",
    emailChange: {
      subject: "Confirmă noua adresă de e-mail BUNIQ",
      heading: "Confirmă noua adresă",
      intro: "Ai cerut ca această adresă să devină e-mailul contului tău BUNIQ. Linkul este valabil o oră și funcționează o singură dată.",
      button: "Confirmă adresa",
      outro: "Dacă nu ai cerut tu schimbarea, ignoră acest e-mail: contul rămâne neschimbat.",
    },
    emailChangeNotice: {
      subject: "Schimbarea e-mailului contului BUNIQ",
      heading: "S-a cerut schimbarea e-mailului",
      intro: "Cineva conectat la contul tău BUNIQ a cerut schimbarea adresei de e-mail. Schimbarea are loc doar după confirmarea din noua adresă.",
      outro: "Dacă nu ai fost tu, schimbă-ți parola și folosește „Ieși de pe toate dispozitivele” din setările contului.",
    },
    googleLinked: {
      subject: "Contul Google a fost conectat la BUNIQ",
      heading: "Autentificare cu Google activată",
      intro: "La contul tău BUNIQ a fost conectat contul Google {email}. De acum te poți autentifica și cu Google.",
      outro: "Dacă nu ai fost tu, schimbă-ți parola, deconectează contul Google din profil și folosește „Ieși de pe toate dispozitivele”.",
    },
    order: {
      subject: "Comanda {number} a fost primită",
      heading: "Mulțumim, {name}! Am primit comanda.",
      intro: "Te vom contacta dacă trebuie să clarificăm ceva. Starea comenzii o vezi oricând pe site.",
      number: "Număr comandă",
      method: "Primire",
      address: "Adresă",
      restaurant: "Restaurant",
      payment: "Plată",
      subtotal: "Produse",
      delivery: "Livrare",
      free: "gratuit",
      total: "Total",
      items: "Ce ai comandat",
      track: "Urmărește comanda",
      onlinePending: "Plata online: operatorul te va contacta și îți va trimite linkul de plată.",
    },
    status: {
      subject: "Comanda {number}: {status}",
      track: "Vezi comanda",
      CONFIRMED: { heading: "Comanda {number} este confirmată", text: "Am confirmat comanda și începem pregătirea." },
      READY: { heading: "Comanda {number} te așteaptă", text: "Comanda este gata și te așteaptă în restaurant." },
      OUT_FOR_DELIVERY: { heading: "Comanda {number} e pe drum", text: "Curierul a plecat spre tine și te sună când ajunge." },
      CANCELLED: { heading: "Comanda {number} a fost anulată", text: "Comanda a fost anulată. Sună-ne dacă vrei detalii." },
    },
  },
  ru: {
    footer: "Это автоматическое письмо BUNIQ, отвечать на него не нужно. Вопросы задавайте по телефону или через сайт.",
    emailChange: {
      subject: "Подтвердите новый email для BUNIQ",
      heading: "Подтвердите новый адрес",
      intro: "Вы попросили сделать этот адрес email вашего аккаунта BUNIQ. Ссылка действует один час и сработает только один раз.",
      button: "Подтвердить адрес",
      outro: "Если вы не просили о смене, просто проигнорируйте письмо: аккаунт останется без изменений.",
    },
    emailChangeNotice: {
      subject: "Смена email аккаунта BUNIQ",
      heading: "Запрошена смена email",
      intro: "Из вашего аккаунта BUNIQ запросили смену адреса email. Адрес изменится только после подтверждения с нового адреса.",
      outro: "Если это были не вы, смените пароль и нажмите «Выйти на всех устройствах» в настройках аккаунта.",
    },
    googleLinked: {
      subject: "Google-аккаунт привязан к BUNIQ",
      heading: "Вход через Google включён",
      intro: "К вашему аккаунту BUNIQ привязан Google-аккаунт {email}. Теперь можно входить и через Google.",
      outro: "Если это были не вы, смените пароль, отвяжите Google в профиле и нажмите «Выйти на всех устройствах».",
    },
    order: {
      subject: "Заказ {number} принят",
      heading: "Спасибо, {name}! Заказ принят.",
      intro: "Мы свяжемся с вами, если нужно что-то уточнить. Статус заказа всегда виден на сайте.",
      number: "Номер заказа",
      method: "Получение",
      address: "Адрес",
      restaurant: "Ресторан",
      payment: "Оплата",
      subtotal: "Блюда",
      delivery: "Доставка",
      free: "бесплатно",
      total: "Итого",
      items: "Состав заказа",
      track: "Следить за заказом",
      onlinePending: "Оплата онлайн: оператор свяжется с вами и пришлёт ссылку на оплату.",
    },
    status: {
      subject: "Заказ {number}: {status}",
      track: "Открыть заказ",
      CONFIRMED: { heading: "Заказ {number} подтверждён", text: "Мы подтвердили заказ и начинаем готовить." },
      READY: { heading: "Заказ {number} ждёт вас", text: "Заказ готов и ждёт вас в ресторане." },
      OUT_FOR_DELIVERY: { heading: "Заказ {number} в пути", text: "Курьер выехал и позвонит, когда приедет." },
      CANCELLED: { heading: "Заказ {number} отменён", text: "Заказ отменён. Позвоните нам, чтобы узнать подробности." },
    },
  },
  en: {
    footer: "This is an automatic e-mail from BUNIQ; please do not reply. For questions, call us or write to us from the website.",
    emailChange: {
      subject: "Confirm your new BUNIQ e-mail address",
      heading: "Confirm your new address",
      intro: "You asked to make this address the e-mail of your BUNIQ account. The link is valid for one hour and works only once.",
      button: "Confirm address",
      outro: "If you did not ask for this, just ignore this e-mail: your account stays as it is.",
    },
    emailChangeNotice: {
      subject: "BUNIQ account e-mail change",
      heading: "An e-mail change was requested",
      intro: "Someone signed in to your BUNIQ account asked to change its e-mail address. It changes only after confirmation from the new address.",
      outro: "If this was not you, change your password and use “Sign out on all devices” in the account settings.",
    },
    googleLinked: {
      subject: "Google account connected to BUNIQ",
      heading: "Sign-in with Google is on",
      intro: "The Google account {email} was connected to your BUNIQ account. You can now also sign in with Google.",
      outro: "If this was not you, change your password, disconnect Google in your profile and use “Sign out on all devices”.",
    },
    order: {
      subject: "Order {number} received",
      heading: "Thank you, {name}! We have your order.",
      intro: "We will contact you if anything needs clarifying. You can check the order status on the website any time.",
      number: "Order number",
      method: "Fulfilment",
      address: "Address",
      restaurant: "Restaurant",
      payment: "Payment",
      subtotal: "Items",
      delivery: "Delivery",
      free: "free",
      total: "Total",
      items: "Your order",
      track: "Track your order",
      onlinePending: "Online payment: our operator will contact you and send a payment link.",
    },
    status: {
      subject: "Order {number}: {status}",
      track: "View order",
      CONFIRMED: { heading: "Order {number} is confirmed", text: "We have confirmed your order and are starting on it." },
      READY: { heading: "Order {number} is ready", text: "Your order is ready and waiting for you at the restaurant." },
      OUT_FOR_DELIVERY: { heading: "Order {number} is on its way", text: "The courier is on the way and will call when they arrive." },
      CANCELLED: { heading: "Order {number} was cancelled", text: "Your order was cancelled. Call us if you would like to know more." },
    },
  },
};
