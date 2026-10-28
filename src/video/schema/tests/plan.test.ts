import { expect, test } from "vitest";
import footagePlan from "../../../../fixtures/plan.footage.json" with { type: "json" };
import textPlan from "../../../../fixtures/plan.text.json" with { type: "json" };
import { PlanSchema } from "../plan";

const question = {
  id: "q1",
  text: "How should the video end?",
  options: ["Try it free", "Book a demo"],
  defaultOption: "Try it free",
};

test("fixture plans are valid", () => {
  expect(() => PlanSchema.parse(footagePlan)).not.toThrow();
  expect(() => PlanSchema.parse(textPlan)).not.toThrow();
});

test("beats must add up to lengthMs within 200 ms", () => {
  const broken = { ...footagePlan, lengthMs: footagePlan.lengthMs + 1000 };
  expect(PlanSchema.safeParse(broken).success).toBe(false);
});

test("a difference of 200 ms is tolerated and 201 ms is not", () => {
  const within = { ...footagePlan, lengthMs: footagePlan.lengthMs + 200 };
  const beyond = { ...footagePlan, lengthMs: footagePlan.lengthMs + 201 };
  expect(PlanSchema.safeParse(within).success).toBe(true);
  expect(PlanSchema.safeParse(beyond).success).toBe(false);
});

test("defaultOption must be one of options", () => {
  const broken = {
    ...footagePlan,
    questions: [{ ...question, defaultOption: "Something else" }],
  };
  expect(PlanSchema.safeParse(broken).success).toBe(false);
});

test("beat ids must be unique", () => {
  const broken = {
    ...footagePlan,
    beats: footagePlan.beats.map((beat) => ({ ...beat, id: "same" })),
  };
  expect(PlanSchema.safeParse(broken).success).toBe(false);
});

test("a plan needs at least one beat", () => {
  const broken = { ...footagePlan, lengthMs: 0, beats: [] };
  expect(PlanSchema.safeParse(broken).success).toBe(false);
});

test.each([
  { count: 3, valid: true },
  { count: 4, valid: false },
])("a plan with $count questions is valid: $valid", ({ count, valid }) => {
  const questions = Array.from({ length: count }, (_, index) => ({
    ...question,
    id: `q${index}`,
  }));
  expect(PlanSchema.safeParse({ ...footagePlan, questions }).success).toBe(valid);
});

test.each([
  { count: 1, valid: false },
  { count: 2, valid: true },
  { count: 4, valid: true },
  { count: 5, valid: false },
])("a question with $count options is valid: $valid", ({ count, valid }) => {
  const options = Array.from({ length: count }, (_, index) => `Option ${index + 1}`);
  const plan = {
    ...footagePlan,
    questions: [{ ...question, options, defaultOption: "Option 1" }],
  };
  expect(PlanSchema.safeParse(plan).success).toBe(valid);
});

test.each([
  { intensity: 0, valid: true },
  { intensity: 1, valid: true },
  { intensity: 1.01, valid: false },
  { intensity: -0.1, valid: false },
])("camera intensity $intensity is valid: $valid", ({ intensity, valid }) => {
  const camera = { kind: "push", intensity };
  const plan = {
    ...footagePlan,
    beats: footagePlan.beats.map((beat) => ({ ...beat, camera })),
  };
  expect(PlanSchema.safeParse(plan).success).toBe(valid);
});
