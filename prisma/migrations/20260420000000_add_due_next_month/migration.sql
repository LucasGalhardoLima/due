-- Add a flag on CreditCard to model whether the dueDate falls in the same
-- calendar month as the closing date or in the next one.
-- Default is TRUE because that is the standard behaviour of all major Brazilian
-- issuers today (Itaú, Nubank, Bradesco, Inter, C6, Santander). Existing rows
-- are backfilled with TRUE — users on same-month cycles (rare) can opt out
-- from the card edit form.

ALTER TABLE "CreditCard"
ADD COLUMN "dueNextMonth" BOOLEAN NOT NULL DEFAULT true;
