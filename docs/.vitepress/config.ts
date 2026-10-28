import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Saymo",
    description:
      "Saymo documentation: from a recording or text to a ready-to-post social video",
    lang: "en-US",
    appearance: "dark",
    srcExclude: ["design/screens/html/**"],
    // HTML labels render clipped inside the default theme, SVG labels do not
    mermaid: { htmlLabels: false },
    vite: {
      optimizeDeps: {
        // under pnpm mermaid CommonJS dependencies stay unbundled, which blanks docs:dev
        include: ["mermaid"],
      },
    },
    themeConfig: {
      sidebar: [
        { text: "Overview", link: "/overview" },
        { text: "User flow", link: "/user-flow" },
        { text: "Architecture", link: "/architecture" },
        { text: "Pipeline", link: "/pipeline" },
        { text: "Video schema", link: "/video-schema" },
        { text: "Vocabulary", link: "/vocabulary" },
        { text: "Decisions", link: "/product/decisions" },
        { text: "Learnings", link: "/learnings" },
        {
          text: "Runbooks",
          items: [
            { text: "Setup", link: "/runbooks/setup" },
            { text: "Remotion Lambda", link: "/runbooks/lambda" },
          ],
        },
        { text: "Spike results", link: "/spike-results" },
        {
          text: "Design spec",
          link: "/superpowers/specs/2026-10-28-saymo-v1-design",
        },
      ],
    },
  }),
);
