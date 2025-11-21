-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
