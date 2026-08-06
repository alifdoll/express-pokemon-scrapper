-- CreateEnum
CREATE TYPE "EvolutionType" AS ENUM ('BASIC', 'STAGE_1', 'STAGE_2');

-- CreateEnum
CREATE TYPE "PokemonType" AS ENUM ('GRASS', 'FIRE', 'WATER', 'LIGHTING', 'PSYCHIC', 'DARKNESS', 'METAL', 'COLORLESS');

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "evo_type" "EvolutionType" NOT NULL,
    "health_point" INTEGER NOT NULL,
    "type" "PokemonType" NOT NULL,
    "has_ability" BOOLEAN NOT NULL DEFAULT false,
    "expansion_code" TEXT NOT NULL,
    "regulation_code" TEXT NOT NULL,
    "release_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_images" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_images_pkey" PRIMARY KEY ("id")
);
