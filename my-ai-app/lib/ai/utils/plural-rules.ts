export function getPluralQueryVariationCategory(
  count: number,
  locale: Intl.LocalesArgument
): string {
  const cardinalRules = new Intl.PluralRules(locale, { type: "cardinal" });
  const pluralization = cardinalRules.select(count);
  console.log(`Count: ${count}, Pluralization: ${pluralization}`);

  type allowedCategories = Extract<Intl.LDMLPluralRule, "one" | "other">;

  const rules: Record<allowedCategories, string> = {
    one: "query variation",
    other: "query variations",
  };
  console.log(`Rules: ${rules[pluralization as allowedCategories] || "other"}`);
  return rules[pluralization as allowedCategories] || "other";
}
