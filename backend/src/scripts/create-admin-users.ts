import "dotenv/config";
import {
  prisma,
  connectDatabase,
  disconnectDatabase,
} from "../config/database.config";
import { hashPassword } from "../utils/password";
import { logger } from "../config/logger.config";

async function createAdminUsers() {
  try {
    await connectDatabase();
    logger.info("=== Creating Admin Users ===\n");

    const superAdminEmail = "tiwari.ankit3105@gmail.com";
    const adminEmail = "m24ankit@gmail.com";
    const defaultPassword = "Admin@123456";

    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (existingSuperAdmin) {
      logger.warn("SUPER_ADMIN already exists", { email: superAdminEmail });
    } else {
      const hashedPassword = await hashPassword(defaultPassword);
      const superAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          firstName: "Ankit",
          lastName: "Tiwari",
          phoneNumber: "+919519412446",
          role: "SUPER_ADMIN",
          isActive: true,
          isEmailVerified: true,
        },
      });

      logger.info("✅ SUPER_ADMIN created successfully", {
        id: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role,
      });
      console.log("\n=================================");
      console.log("SUPER_ADMIN Credentials:");
      console.log("=================================");
      console.log(`Email: ${superAdminEmail}`);
      console.log(`Password: ${defaultPassword}`);
      console.log("=================================\n");
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      logger.warn("ADMIN already exists", { email: adminEmail });
    } else {
      const hashedPassword = await hashPassword(defaultPassword);
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          phoneNumber: "+917318263928",
          role: "ADMIN",
          isActive: true,
          isEmailVerified: true,
        },
      });

      logger.info("✅ ADMIN created successfully", {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });
      console.log("=================================");
      console.log("ADMIN Credentials:");
      console.log("=================================");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${defaultPassword}`);
      console.log("=================================\n");
    }

    logger.info("✅ Admin user creation completed!\n");

    await disconnectDatabase();
    process.exit(0);
  } catch (error: any) {
    logger.error("❌ Failed to create admin users", {
      error: error.message,
      stack: error.stack,
    });
    await disconnectDatabase();
    process.exit(1);
  }
}

createAdminUsers();
