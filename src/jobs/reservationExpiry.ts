import cron from "node-cron";
import prisma from "../lib/prisma";

/**
 * Cron job: Reservation Expiry
 * Runs every minute to expire reservations and restore stock
 */
export const startReservationExpiryJob = (): void => {
  cron.schedule("* * * * *", async () => {
    console.log("Running reservation expiry job...");

    try {
      const expiredReservations = await prisma.reservation.findMany({
        where: {
          status: "pending",
          expires_at: { lt: new Date() },
        },
      });

      for (const reservation of expiredReservations) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.$transaction(async (tx: any) => {
          // Restore stock
          const product = await tx.product.update({
            where: { id: reservation.product_id },
            data: { stock: { increment: reservation.quantity } },
          });

          // Mark reservation as expired
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "expired" },
          });

          // Log the stock restoration
          await tx.inventoryLog.create({
            data: {
              product_id: reservation.product_id,
              change: reservation.quantity,
              reason: "expired",
              reservation_id: reservation.id,
              stock_before: product.stock - reservation.quantity,
              stock_after: product.stock,
            },
          });
        });
      }

      console.log(`Expired ${expiredReservations.length} reservations`);
    } catch (error) {
      console.error("Error in expiry job:", error);
    }
  });
};
