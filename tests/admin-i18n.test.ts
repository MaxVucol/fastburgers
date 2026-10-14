// Admin panel language: messages produced in Romanian by shared validation / services are shown in
// the panel's language; Romanian and unknown texts pass through unchanged.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { adminDictionaries, resolveAdminLocale, translateAdminMessage, translateFieldErrors } from "@/lib/i18n/admin";

const { ro, ru, en } = adminDictionaries;

describe("admin panel messages", () => {
  test("Romanian and unknown messages are left as they are", () => {
    assert.equal(translateAdminMessage(ro, "Preț invalid"), "Preț invalid");
    assert.equal(translateAdminMessage(ru, "Some new message"), "Some new message");
  });

  test("exact messages are translated", () => {
    assert.equal(translateAdminMessage(ru, "Imaginea depășește 8 MB."), "Изображение больше 8 МБ.");
    assert.equal(translateAdminMessage(en, "Doar litere mici, cifre și cratime"), "Lowercase letters, digits and hyphens only");
  });

  test("line-numbered CSV import messages keep the line and translate each part", () => {
    assert.equal(translateAdminMessage(ru, "Rândul 7: Preț invalid; URL invalid"), "Строка 7: Неверная цена; Неверная ссылка");
    assert.equal(translateAdminMessage(en, "Rândul 3: produsul BUNIQ „x-burger” nu există."), "Row 3: the BUNIQ product “x-burger” does not exist.");
    assert.equal(translateAdminMessage(en, "Lipsesc coloanele: price_mdl, item"), "Missing columns: price_mdl, item");
    assert.equal(
      translateAdminMessage(ru, "Prețul s-a schimbat între timp (acum 32,90 lei). Verifică din nou."),
      "Цена уже изменилась (сейчас 32,90 lei). Проверьте ещё раз.",
    );
  });

  test("field errors are translated per field", () => {
    assert.deepEqual(translateFieldErrors(en, { name: "Numele este obligatoriu", price: undefined }), { name: "The name is required", price: undefined });
  });

  test("unknown cookie values fall back to Romanian", () => {
    assert.equal(resolveAdminLocale("ru"), "ru");
    assert.equal(resolveAdminLocale("de"), "ro");
    assert.equal(resolveAdminLocale(undefined), "ro");
  });
});
