/*
  Warnings:

  - The values [LIGHTING] on the enum `PokemonType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PokemonType_new" AS ENUM ('GRASS', 'FIRE', 'WATER', 'LIGHTNING', 'PSYCHIC', 'DARKNESS', 'METAL', 'COLORLESS', 'FIGHTING', 'DRAGON', 'OTHER');
ALTER TABLE "cards" ALTER COLUMN "pokemon_type" TYPE "PokemonType_new" USING ("pokemon_type"::text::"PokemonType_new");
ALTER TYPE "PokemonType" RENAME TO "PokemonType_old";
ALTER TYPE "PokemonType_new" RENAME TO "PokemonType";
DROP TYPE "PokemonType_old";
COMMIT;
