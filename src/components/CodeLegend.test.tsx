import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CodeLegend } from "./CodeLegend";
it.each([
  ["JNFP", ["J · 卷", "N · 社牛", "F · 干饭", "P · 计划"]],
  ["TKYS", ["T · 躺", "K · 社恐", "Y · 养生", "S · 随缘"]],
] as const)("explains all four letters for %s", (code, labels) => {
  const html = renderToStaticMarkup(<CodeLegend code={code} />);
  for (const label of labels) expect(html).toContain(label);
});
