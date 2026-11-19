-- CreateTable
CREATE TABLE "Experience" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'full-time',
    "location" TEXT NOT NULL DEFAULT '',
    "start" TEXT NOT NULL,
    "end" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);
