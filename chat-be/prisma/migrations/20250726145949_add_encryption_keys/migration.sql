/*
  Warnings:

  - Added the required column `receiverEncryptedKey` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderEncryptedKey` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "receiverEncryptedKey" TEXT NOT NULL,
ADD COLUMN     "senderEncryptedKey" TEXT NOT NULL;
