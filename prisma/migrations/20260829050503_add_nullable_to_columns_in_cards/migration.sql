-- AlterTable
ALTER TABLE "cards" ALTER COLUMN "evo_type" DROP NOT NULL,
ALTER COLUMN "health_point" DROP NOT NULL,
ALTER COLUMN "pokemon_type" DROP NOT NULL,
ALTER COLUMN "has_ability" DROP NOT NULL;
