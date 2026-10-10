import { vi } from "vitest";

/**
 * Minimal in-memory stand-in for the Prisma calls the domain layer makes.
 * $transaction runs the callback against the same object, and snapshots/restores
 * state on throw so rollback behaviour is observable in tests.
 *
 * This verifies domain logic, not Prisma or Postgres behaviour. Constraint
 * enforcement (unique keys) is simulated only where a test needs it.
 */
type Row = Record<string, unknown> & { id: string };

export function createFakePrisma() {
  const db = {
    applications: new Map<string, Row>(),
    customers: new Map<string, Row>(),
    activity: [] as Row[],
    stripeEvents: new Map<string, Row>(),
  };

  const matches = (row: Row, where: Record<string, unknown>) =>
    Object.entries(where).every(([k, v]) => row[k] === v);

  const client = {
    application: {
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
        const row = db.applications.get(where.id);
        if (!row) throw new Error("No Application found");
        return { ...row };
      }),
      updateMany: vi.fn(
        async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          let count = 0;
          for (const row of db.applications.values()) {
            if (matches(row, where)) {
              Object.assign(row, data);
              count++;
            }
          }
          return { count };
        }
      ),
    },
    customer: {
      findUnique: vi.fn(async ({ where }: { where: { userId: string } }) => {
        return [...db.customers.values()].find((c) => c.userId === where.userId) ?? null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `cust_${db.customers.size + 1}`, ...data };
        db.customers.set(row.id, row);
        return row;
      }),
    },
    activityLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `log_${db.activity.length + 1}`, ...data };
        db.activity.push(row);
        return row;
      }),
    },
    processedStripeEvent: {
      create: vi.fn(async ({ data }: { data: { id: string; type: string } }) => {
        if (db.stripeEvents.has(data.id)) {
          const { Prisma } = await import("@prisma/client");
          throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
            code: "P2002",
            clientVersion: "test",
          });
        }
        db.stripeEvents.set(data.id, { ...data });
        return data;
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const snapshot = {
        applications: new Map([...db.applications].map(([k, v]) => [k, { ...v }])),
        customers: new Map(db.customers),
        activity: [...db.activity],
        stripeEvents: new Map(db.stripeEvents),
      };
      try {
        return await fn(client);
      } catch (err) {
        Object.assign(db, snapshot);
        throw err;
      }
    }),
  };

  return { client, db };
}
