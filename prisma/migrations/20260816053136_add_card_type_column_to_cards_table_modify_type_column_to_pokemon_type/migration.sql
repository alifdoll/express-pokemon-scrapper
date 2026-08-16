/*
  Warnings:

  - You are about to drop the column `type` on the `cards` table. All the data in the column will be lost.
  - Added the required column `card_type` to the `cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pokemon_type` to the `cards` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('POKEMON', 'SUPPORTER', 'ITEM', 'ENERGY');

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "type",
ADD COLUMN     "card_type" "CardType" NOT NULL,
ADD COLUMN     "description" TEXT DEFAULT '',
ADD COLUMN     "pokemon_type" "PokemonType" NOT NULL;
