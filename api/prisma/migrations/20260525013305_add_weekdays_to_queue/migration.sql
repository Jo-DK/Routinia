-- AlterTable
ALTER TABLE "Queue" ADD COLUMN     "weekDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
