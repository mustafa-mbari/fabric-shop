import { Font } from "@react-pdf/renderer";
import path from "path";

Font.register({
  family: "Cairo",
  fonts: [
    {
      src: path.join(
        process.cwd(),
        "node_modules/@fontsource/cairo/files/cairo-arabic-400-normal.woff"
      ),
      fontWeight: 400,
    },
    {
      src: path.join(
        process.cwd(),
        "node_modules/@fontsource/cairo/files/cairo-arabic-700-normal.woff"
      ),
      fontWeight: 700,
    },
  ],
});

Font.registerHyphenationCallback((word) => [word]);
