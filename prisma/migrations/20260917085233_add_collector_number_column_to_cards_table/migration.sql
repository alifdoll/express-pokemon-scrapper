/*
  Warnings:

  - Added the required column `collector_code` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "collector_code" TEXT NOT NULL;
