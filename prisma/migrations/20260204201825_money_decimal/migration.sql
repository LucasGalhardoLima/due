/*
  Warnings:

  - You are about to alter the column `limit` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - You are about to alter the column `amount` on the `Installment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "color" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'migration_temp';

-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "budget" DECIMAL(14,2),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'migration_temp',
ALTER COLUMN "limit" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Installment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'migration_temp';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isSubscription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastProcessedDate" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'migration_temp',
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);
