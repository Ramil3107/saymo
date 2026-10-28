import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Saymo",
    description:
      "Документация Saymo: видео или текст в готовый ролик для соцсетей",
    lang: "ru-RU",
    appearance: "dark",
    srcExclude: ["design/screens/html/**"],
    themeConfig: {
      sidebar: [
        { text: "Обзор", link: "/overview" },
        { text: "Путь пользователя", link: "/user-flow" },
        { text: "Архитектура", link: "/architecture" },
        { text: "Конвейер", link: "/pipeline" },
        { text: "Схема ролика", link: "/video-schema" },
        { text: "Словарь", link: "/vocabulary" },
        { text: "Решения", link: "/product/decisions" },
        { text: "Уроки", link: "/learnings" },
        {
          text: "Инструкции",
          items: [
            { text: "Окружение", link: "/runbooks/setup" },
            { text: "Remotion Lambda", link: "/runbooks/lambda" },
          ],
        },
        { text: "Спайк", link: "/spike-results" },
        {
          text: "Спека",
          link: "/superpowers/specs/2026-10-28-saymo-v1-design",
        },
      ],
    },
  }),
);
