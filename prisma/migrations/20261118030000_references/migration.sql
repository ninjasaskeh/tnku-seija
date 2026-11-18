-- CreateTable
CREATE TABLE "Reference" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'public',
    "names" TEXT[],
    "note" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

