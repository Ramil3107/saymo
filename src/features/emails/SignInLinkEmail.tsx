import type { CSSProperties } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "react-email";

export type SignInLinkCopy = {
  brand: string;
  preview: string;
  title: string;
  body: string;
  button: string;
  fallback: string;
  ignore: string;
};

// Email clients do not read the app's CSS, so these are the design-token values as literals.
const colors = {
  page: "#f4f4f6",
  card: "#ffffff",
  ink: "#08080b",
  accent: "#ff4a1c",
  muted: "#a3a3ad",
  mutedText: "#5c5c66",
};

const styles = {
  body: {
    backgroundColor: colors.page,
    margin: 0,
    padding: "32px 0",
    fontFamily: "Helvetica, Arial, sans-serif",
  },
  container: { backgroundColor: colors.card, borderRadius: 12, maxWidth: 480, padding: "32px" },
  logoDot: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    display: "inline-block",
    height: 12,
    width: 12,
  },
  logoName: {
    color: colors.ink,
    display: "inline-block",
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 0 8px",
  },
  title: { color: colors.ink, fontSize: 24, margin: "24px 0 8px" },
  text: { color: colors.ink, fontSize: 16, lineHeight: "24px", margin: "0 0 24px" },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    color: colors.ink,
    display: "inline-block",
    fontSize: 16,
    fontWeight: 700,
    padding: "12px 24px",
    textDecoration: "none",
  },
  rule: { borderColor: colors.muted, margin: "32px 0 16px", opacity: 0.4 },
  small: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: "20px",
    margin: "0 0 8px",
    wordBreak: "break-all",
  },
} satisfies Record<string, CSSProperties>;

export function SignInLinkEmail({ url, copy }: { url: string; copy: SignInLinkCopy }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <span style={styles.logoDot} />
            <Text style={styles.logoName}>{copy.brand}</Text>
          </Section>
          <Heading as="h1" style={styles.title}>
            {copy.title}
          </Heading>
          <Text style={styles.text}>{copy.body}</Text>
          <Button href={url} style={styles.button}>
            {copy.button}
          </Button>
          <Hr style={styles.rule} />
          <Text style={styles.small}>{copy.fallback}</Text>
          <Link href={url} style={styles.small}>
            {url}
          </Link>
          <Text style={styles.small}>{copy.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}
