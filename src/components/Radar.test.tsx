import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Radar } from "./Radar";
it("shows true zero values but draws a visible minimum shape", () => {
  const html = renderToStaticMarkup(
    <Radar values={{ J: 0, N: 0, F: 0, P: 0, night: 0 }} />,
  );
  expect(html).toContain("卷度 0");
  expect(html).toContain("夜猫值 0");
  const points = html.match(/class="radar-value" points="([^"]+)"/)?.[1];
  expect(points).toBeDefined();
  expect(new Set(points!.split(" ")).size).toBe(5);
  expect(html).not.toContain("NaN");
});
