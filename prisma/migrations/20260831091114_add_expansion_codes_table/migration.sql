-- CreateTable
CREATE TABLE "expansion_codes" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "release_date" TIMESTAMP(3),
    "scrapped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expansion_codes_pkey" PRIMARY KEY ("id")
);
