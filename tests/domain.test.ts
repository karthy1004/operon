import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakePrisma } from "./fake-prisma";

const fake = vi.hoisted(() => ({ current: null as ReturnType<typeof createFakePrisma> | null }));
vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return fake.current?.client;
  },
}));

import {
  ApprovalNotAllowedError,
  InvalidCommentError,
  MAX_COMMENT_LENGTH,
  isAwaitingCustomerApproval,
  normaliseComment,
} from "@/lib/domain/application-rules";
import { approveApplication, requestApplicationChanges } from "@/lib/domain/application";
import { COLLAPSED_FUNNEL_STATES, completeSelfServeSignup } from "@/lib/domain/customer";
import { processStripeEventOnce } from "@/lib/domain/stripe-events";

beforeEach(() => {
  fake.current = createFakePrisma();
});

const db = () => {
  if (!fake.current) throw new Error("fake not initialised");
  return fake.current.db;
};

function seedApplication(overrides: Record<string, unknown> = {}) {
  db().applications.set("app_1", {
    id: "app_1",
    customerId: "cust_1",
    status: "WAITING_APPROVAL",
    approvalStatus: "PENDING",
    ...overrides,
  });
}

describe("approval rules", () => {
  it("only WAITING_APPROVAL + PENDING is actionable", () => {
    expect(isAwaitingCustomerApproval({ status: "WAITING_APPROVAL", approvalStatus: "PENDING" })).toBe(true);
    expect(isAwaitingCustomerApproval({ status: "WAITING_APPROVAL", approvalStatus: "APPROVED" })).toBe(false);
    expect(isAwaitingCustomerApproval({ status: "SUBMITTED", approvalStatus: "PENDING" })).toBe(false);
  });

  it("requires a non-empty, bounded comment", () => {
    expect(normaliseComment("  Please use the fintech resume  ")).toBe("Please use the fintech resume");
    expect(() => normaliseComment("   ")).toThrow(InvalidCommentError);
    expect(() => normaliseComment("x".repeat(MAX_COMMENT_LENGTH + 1))).toThrow(InvalidCommentError);
  });
});

describe("approveApplication", () => {
  it("moves a waiting application to READY_FOR_SUBMISSION and logs it", async () => {
    seedApplication();
    const result = await approveApplication("app_1", "user_1");
    expect(result).toMatchObject({ status: "READY_FOR_SUBMISSION", approvalStatus: "APPROVED" });
    expect(db().activity).toEqual([
      expect.objectContaining({
        action: "APPLICATION_APPROVED",
        previousState: "WAITING_APPROVAL",
        newState: "READY_FOR_SUBMISSION",
        userId: "user_1",
        actorLabel: "CUSTOMER",
      }),
    ]);
  });

  it.each([
    ["already approved", { status: "READY_FOR_SUBMISSION", approvalStatus: "APPROVED" }],
    ["already submitted", { status: "SUBMITTED", approvalStatus: "APPROVED" }],
    ["sent back earlier", { status: "PREPARING", approvalStatus: "CHANGES_REQUESTED" }],
  ])("refuses when %s, and changes nothing", async (_name, state) => {
    seedApplication(state);
    await expect(approveApplication("app_1", "user_1")).rejects.toBeInstanceOf(ApprovalNotAllowedError);
    expect(db().applications.get("app_1")).toMatchObject(state);
    expect(db().activity).toHaveLength(0);
  });

  it("is safe against a double click: the second call is refused", async () => {
    seedApplication();
    await approveApplication("app_1", "user_1");
    await expect(approveApplication("app_1", "user_1")).rejects.toBeInstanceOf(ApprovalNotAllowedError);
    expect(db().activity).toHaveLength(1);
  });
});

describe("requestApplicationChanges", () => {
  it("sends the application back to PREPARING with the trimmed comment", async () => {
    seedApplication();
    const result = await requestApplicationChanges("app_1", "user_1", "  Use the growth resume ");
    expect(result).toMatchObject({
      status: "PREPARING",
      approvalStatus: "CHANGES_REQUESTED",
      customerComments: "Use the growth resume",
    });
    expect(db().activity[0]).toMatchObject({ action: "APPLICATION_CHANGES_REQUESTED", notes: "Use the growth resume" });
  });

  it("rejects an empty comment before touching the database", async () => {
    seedApplication();
    await expect(requestApplicationChanges("app_1", "user_1", " ")).rejects.toBeInstanceOf(InvalidCommentError);
    expect(fake.current?.client.$transaction).not.toHaveBeenCalled();
  });
});

describe("completeSelfServeSignup (collapsed funnel)", () => {
  const params = { userId: "user_9", tier: 1, stripeCustomerId: "cus_x", stripeSubscriptionId: "sub_x" };

  it("creates the customer and records every documented funnel state in order", async () => {
    const customer = await completeSelfServeSignup(params);
    expect(customer).toMatchObject({ status: "ACCOUNT_CREATED", activeServicePlanTier: 1 });
    const transitions = db().activity.map((a) => [a.previousState, a.newState]);
    expect(transitions).toHaveLength(COLLAPSED_FUNNEL_STATES.length);
    expect(transitions[0]).toEqual([null, "LEAD"]);
    expect(transitions.at(-1)).toEqual(["PAYMENT_RECEIVED", "ACCOUNT_CREATED"]);
  });

  it("is idempotent: a replay returns the existing customer and writes nothing", async () => {
    const first = await completeSelfServeSignup(params);
    const logs = db().activity.length;
    const second = await completeSelfServeSignup(params);
    expect(second.id).toBe(first.id);
    expect(db().customers.size).toBe(1);
    expect(db().activity).toHaveLength(logs);
  });
});

describe("processStripeEventOnce", () => {
  const event = { id: "evt_123", type: "checkout.session.completed" };

  it("applies an event once and reports the redelivery as a duplicate", async () => {
    const apply = vi.fn(async () => {});
    expect(await processStripeEventOnce(event, apply)).toBe("processed");
    expect(await processStripeEventOnce(event, apply)).toBe("duplicate");
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("rolls back the marker when apply fails, so Stripe's retry runs it again", async () => {
    await expect(
      processStripeEventOnce(event, async () => {
        throw new Error("db blip");
      })
    ).rejects.toThrow("db blip");
    expect(db().stripeEvents.has("evt_123")).toBe(false);

    const apply = vi.fn(async () => {});
    expect(await processStripeEventOnce(event, apply)).toBe("processed");
    expect(apply).toHaveBeenCalledTimes(1);
  });
});
