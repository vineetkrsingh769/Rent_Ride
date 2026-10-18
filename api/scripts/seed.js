import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const { db, client } = await import("../src/lib/db.js");
const { bookings, pricingCategories, users, vehicles } = await import(
  "../src/lib/schema.js"
);

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Set seed credentials in .env before running npm run seed.`
    );
  }
  return value;
}

// `npm run seed -- --if-empty` is what the deploy build uses. Seeding wipes
// every table below, so on an already-populated database it must do nothing
// rather than destroy live bookings on each redeploy.
async function alreadySeeded() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  return existing.length > 0;
}

async function seed() {
  if (process.argv.includes("--if-empty") && (await alreadySeeded())) {
    console.log("Database already has users — skipping seed (--if-empty).");
    return;
  }

  const adminEmail = requireEnv("SEED_ADMIN_EMAIL");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const agencyEmail = requireEnv("SEED_AGENCY_EMAIL");
  const agencyPassword = requireEnv("SEED_AGENCY_PASSWORD");
  const customerEmail = requireEnv("SEED_CUSTOMER_EMAIL");
  const customerPassword = requireEnv("SEED_CUSTOMER_PASSWORD");

  await db.delete(bookings);
  await db.delete(vehicles);
  await db.delete(pricingCategories);
  await db.delete(users);

  const [adminPass, agencyPass, customerPass] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(agencyPassword, 10),
    bcrypt.hash(customerPassword, 10),
  ]);

  const [admin] = await db
    .insert(users)
    .values({
      name: "System Admin",
      email: adminEmail.toLowerCase(),
      password: adminPass,
      role: "admin",
      isActive: true,
    })
    .returning();

  const [agency] = await db
    .insert(users)
    .values({
      name: "Speed Rentals",
      email: agencyEmail.toLowerCase(),
      password: agencyPass,
      role: "agency",
      agencyName: "Speed Rentals",
      isActive: true,
    })
    .returning();

  await db.insert(users).values({
    name: "John Doe",
    email: customerEmail.toLowerCase(),
    password: customerPass,
    role: "customer",
    phone: "9876543210",
    isActive: true,
  });

await db.insert(pricingCategories).values([
    { name: "Economy 2W", vehicleType: "2W", baseDailyRate: 300, baseWeeklyRate: 1800, baseMonthlyRate: 6000, description: "Standard two-wheelers" },
    { name: "Premium 2W", vehicleType: "2W", baseDailyRate: 500, baseWeeklyRate: 3000, baseMonthlyRate: 10000, description: "Premium bikes and scooters" },
    { name: "Economy 4W", vehicleType: "4W", baseDailyRate: 1200, baseWeeklyRate: 7000, baseMonthlyRate: 25000, description: "Hatchbacks and sedans" },
    { name: "Premium 4W", vehicleType: "4W", baseDailyRate: 2500, baseWeeklyRate: 15000, baseMonthlyRate: 50000, description: "SUVs and luxury cars" },
  ]);

  await db.insert(vehicles).values([
    {
      vehicleNumber: "MH-01-AB-1234",
      name: "Honda Activa 6G",
      brand: "Honda",
      vehicleModel: "Activa 6G",
      type: "2W",
      modelYear: 2023,
      fuelType: "petrol",
      transmission: "automatic",
      mileage: "45 km/l",
      images: ["/vehicles/honda-honda-activa-6g.jpg"],
      description: "Reliable scooter for city commuting",
      priceDaily: 350,
      priceWeekly: 2000,
      priceMonthly: 7000,
status: "available",
      ownerId: agency.id,
      location: "Mumbai",
      isApproved: true,
    },
    {
      vehicleNumber: "MH-01-CD-5678",
      name: "Royal Enfield Classic 350",
      brand: "Royal Enfield",
      vehicleModel: "Classic 350",
      type: "2W",
      modelYear: 2024,
      fuelType: "petrol",
      transmission: "manual",
      mileage: "35 km/l",
      images: ["/vehicles/royal-enfield-royal-enfield-classic-350.jpg"],
      description: "Iconic cruiser bike for long rides",
      priceDaily: 600,
      priceWeekly: 3500,
      priceMonthly: 12000,
status: "available",
      ownerId: agency.id,
      location: "Mumbai",
      isApproved: true,
    },
    {
      vehicleNumber: "KA-01-EF-9012",
      name: "Maruti Swift",
      brand: "Maruti",
      vehicleModel: "Swift",
      type: "4W",
      modelYear: 2023,
      fuelType: "petrol",
      transmission: "manual",
      seats: 5,
      mileage: "22 km/l",
      images: ["/vehicles/maruti-maruti-swift.jpg"],
      description: "Compact hatchback, perfect for city drives",
      priceDaily: 1200,
      priceWeekly: 7000,
      priceMonthly: 25000,
status: "available",
      ownerId: agency.id,
      location: "Bangalore",
      isApproved: true,
    },
    {
      vehicleNumber: "KA-01-GH-3456",
      name: "Hyundai Creta",
      brand: "Hyundai",
      vehicleModel: "Creta",
      type: "4W",
      modelYear: 2024,
      fuelType: "diesel",
      transmission: "automatic",
      seats: 5,
      mileage: "18 km/l",
      images: ["/vehicles/hyundai-hyundai-creta.jpg"],
      description: "Premium SUV with spacious interiors",
      priceDaily: 2500,
      priceWeekly: 15000,
      priceMonthly: 50000,
status: "available",
      ownerId: agency.id,
      location: "Bangalore",
      isApproved: true,
    },
    {
      vehicleNumber: "DL-01-IJ-7890",
      name: "Tata Nexon EV",
      brand: "Tata",
      vehicleModel: "Nexon EV",
      type: "4W",
      modelYear: 2024,
      fuelType: "electric",
      transmission: "automatic",
      seats: 5,
      mileage: "300 km range",
      images: ["/vehicles/tata-tata-nexon-ev.jpg"],
      description: "Eco-friendly electric SUV",
      priceDaily: 2000,
      priceWeekly: 12000,
      priceMonthly: 40000,
status: "available",
      ownerId: agency.id,
      location: "Delhi",
      isApproved: true,
    },
    {
      vehicleNumber: "DL-04-TF-4567",
      name: "Toyota Fortuner Legender",
      brand: "Toyota",
      vehicleModel: "Fortuner",
      type: "4W",
      modelYear: 2024,
      fuelType: "diesel",
      transmission: "automatic",
      seats: 7,
      mileage: "12 km/l",
      images: ["/vehicles/toyota-toyota-fortuner-legender.jpg"],
      description: "Premium SUV with absolute power and style",
      priceDaily: 6999,
      priceWeekly: 41999,
      priceMonthly: 149999,
status: "available",
      ownerId: agency.id,
      location: "Delhi",
      isApproved: true,
    },
    {
      vehicleNumber: "MH-12-PL-0033",
      name: "Pulsar NS200",
      brand: "Bajaj",
      vehicleModel: "Pulsar NS200",
      type: "2W",
      modelYear: 2024,
      fuelType: "petrol",
      transmission: "manual",
      seats: 2,
      mileage: "35 km/l",
      images: ["/vehicles/bajaj-pulsar-ns200.jpg"],
      description: "Aggressive naked sports bike for adrenaline rushes",
      priceDaily: 899,
      priceWeekly: 4999,
      priceMonthly: 17999,
status: "available",
      ownerId: agency.id,
      location: "Bangalore",
      isApproved: true,
    },
    {
      vehicleNumber: "TS-09-SC-7788",
      name: "Scorpio-N Z8",
      brand: "Mahindra",
      vehicleModel: "Scorpio-N",
      type: "4W",
      modelYear: 2024,
      fuelType: "diesel",
      transmission: "automatic",
      seats: 7,
      mileage: "14 km/l",
      images: ["/vehicles/mahindra-scorpio-n-z8.jpg"],
      description: "Big Daddy of SUVs, robust build and modern tech",
      priceDaily: 4499,
      priceWeekly: 26999,
      priceMonthly: 94999,
status: "available",
      ownerId: agency.id,
      location: "Mumbai",
      isApproved: true,
    },
    {
      vehicleNumber: "RJ-14-JW-4242",
      name: "Jawa 42",
      brand: "Jawa",
      vehicleModel: "42",
      type: "2W",
      modelYear: 2024,
      fuelType: "petrol",
      transmission: "manual",
      seats: 2,
      mileage: "30 km/l",
      images: ["/vehicles/jawa-jawa-42.jpg"],
      description: "Retro modern classic cruiser",
      priceDaily: 999,
      priceWeekly: 5499,
      priceMonthly: 18999,
status: "available",
      ownerId: agency.id,
      location: "Mumbai",
      isApproved: true,
    },
    {
      vehicleNumber: "KL-07-IN-5566",
      name: "Innova Crysta",
      brand: "Toyota",
      vehicleModel: "Innova Crysta",
      type: "4W",
      modelYear: 2023,
      fuelType: "diesel",
      transmission: "manual",
      seats: 7,
      mileage: "15 km/l",
      images: ["/vehicles/toyota-innova-crysta.jpg"],
      description: "Unmatched highway comfort and space",
      priceDaily: 3499,
      priceWeekly: 20999,
      priceMonthly: 74999,
status: "available",
      ownerId: agency.id,
      location: "Delhi",
      isApproved: true,
    },
    {
      vehicleNumber: "MH-02-RY-4567",
      name: "Yamaha YZF R15 V4",
      brand: "Yamaha",
      vehicleModel: "R15 V4",
      type: "2W",
      modelYear: 2024,
      fuelType: "petrol",
      transmission: "manual",
      seats: 2,
      mileage: "40 km/l",
      images: ["/vehicles/yamaha-yamaha-yzf-r15-v4.jpg"],
      description: "Track-bred sports bike with premium styling",
      priceDaily: 1199,
      priceWeekly: 6999,
      priceMonthly: 23999,
status: "available",
      ownerId: agency.id,
      location: "Mumbai",
      isApproved: true,
    },
    {
      vehicleNumber: "MH-03-AC-7890",
      name: "Suzuki Access 125",
      brand: "Suzuki",
      vehicleModel: "Access 125",
      type: "2W",
      modelYear: 2023,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 2,
      mileage: "50 km/l",
      images: ["/vehicles/suzuki-suzuki-access-125.jpg"],
      description: "Elegant and comfortable 125cc scooter",
      priceDaily: 449,
      priceWeekly: 2499,
      priceMonthly: 8499,
status: "available",
      ownerId: agency.id,
      location: "Mumbai",
      isApproved: true,
    },
    {
      vehicleNumber: "KA-03-DK-2233",
      name: "KTM Duke 390",
      brand: "KTM",
      vehicleModel: "Duke 390",
      type: "2W",
      modelYear: 2024,
      fuelType: "petrol",
      transmission: "manual",
      seats: 2,
      mileage: "28 km/l",
      images: ["/vehicles/ktm-ktm-duke-390.jpg"],
      description: "High-performance streetfighter bike",
      priceDaily: 1499,
      priceWeekly: 8999,
      priceMonthly: 29999,
status: "available",
      ownerId: agency.id,
      location: "Bangalore",
      isApproved: true,
    },
    {
      vehicleNumber: "KA-04-JP-8899",
      name: "TVS Jupiter",
      brand: "TVS",
      vehicleModel: "Jupiter",
      type: "2W",
      modelYear: 2023,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 2,
      mileage: "52 km/l",
      images: ["/vehicles/tvs-tvs-jupiter.jpg"],
      description: "Smooth and highly fuel-efficient family scooter",
      priceDaily: 379,
      priceWeekly: 2199,
      priceMonthly: 7499,
status: "available",
      ownerId: agency.id,
      location: "Bangalore",
      isApproved: true,
    },
    {
      vehicleNumber: "DL-03-AT-9090",
      name: "Ather 450X",
      brand: "Ather",
      vehicleModel: "450X",
      type: "2W",
      modelYear: 2024,
      fuelType: "electric",
      transmission: "automatic",
      seats: 2,
      mileage: "110 km range",
      images: ["/vehicles/ather-ather-450x.jpg"],
      description: "Smart electric scooter with warp speed acceleration",
      priceDaily: 599,
      priceWeekly: 3499,
      priceMonthly: 11999,
status: "available",
      ownerId: agency.id,
      location: "Delhi",
      isApproved: true,
    },
    {
      vehicleNumber: "DL-05-SP-1122",
      name: "Hero Splendor Plus",
      brand: "Hero",
      vehicleModel: "Splendor Plus",
      type: "2W",
      modelYear: 2023,
      fuelType: "petrol",
      transmission: "manual",
      seats: 2,
      mileage: "65 km/l",
      images: ["/vehicles/hero-hero-splendor-plus.jpg"],
      description: "The most trusted commuter motorcycle in India",
      priceDaily: 299,
      priceWeekly: 1799,
      priceMonthly: 5999,
status: "available",
      ownerId: agency.id,
      location: "Delhi",
      isApproved: true,
    },
  ]);

  void admin;
  console.log("Seed completed successfully.");
  console.log("Demo users were created from SEED_* values in your local .env (not printed).");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
