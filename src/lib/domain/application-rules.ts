/**
 * Pure rules for the customer Approval Engine (Mode A). No database access, so the
 * rules are unit-testable and shared by every caller.
 *
 * A customer may approve or send back an application only while it is waiting on
 * them. Anything else (already approved, submitted, closed) is a stale button
 * click or a forged request and must not move the application.
 */

export const MAX_COMMENT_LENGTH = 2000;

export class ApprovalNotAllowedError extends Error {
  constructor(status: string, approvalStatus: string) {
    super(
      `Application is ${status} / ${approvalStatus}; approval actions require WAITING_APPROVAL / PENDING`
    );
    this.name = "ApprovalNotAllowedError";
  }
}

export class InvalidCommentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCommentError";
  }
}

export function isAwaitingCustomerApproval(app: { status: string; approvalStatus: string }): boolean {
  return app.status === "WAITING_APPROVAL" && app.approvalStatus === "PENDING";
}

export function assertAwaitingCustomerApproval(app: { status: string; approvalStatus: string }): void {
  if (!isAwaitingCustomerApproval(app)) {
    throw new ApprovalNotAllowedError(app.status, app.approvalStatus);
  }
}

export function normaliseComment(comment: string): string {
  const trimmed = comment.trim();
  if (trimmed.length === 0) throw new InvalidCommentError("A comment is required when requesting changes");
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new InvalidCommentError(`Comment must be at most ${MAX_COMMENT_LENGTH} characters`);
  }
  return trimmed;
}
