require("dotenv").config();
const mysql = require("mysql2/promise");
const { faker } = require("@faker-js/faker/locale/vi");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "da_nang_travel",
  port: process.env.DB_PORT || 3306,
};

async function seed() {
  let connection;
  try {
    console.log(`Connecting to database: ${dbConfig.database}...`);
    connection = await mysql.createConnection(dbConfig);
    console.log("Connection established.");

    // 1. CLEAN UP OLD DATA
    console.log("Cleaning up old data...");

    // Disable foreign key checks to allow deletion in any order
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // List of tables to clean
    const tables = [
      "Favorites",
      "PlaceReviews",
      "PlaceImages",
      "PlaceCategories",
      "Places",
      "Categories",
      "Users",
    ];

    for (const table of tables) {
      // Delete all records
      await connection.query(`DELETE FROM ${table}`);
      // Reset auto-increment index to 1
      await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    // 2. CREATE USERS
    console.log("Seeding Users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt); // Default password

    // 2.1. Create Admin User
    const [adminRes] = await connection.execute(
      `INSERT INTO Users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      ["Leader Khai", "admin@travel.com", hashedPassword, "admin"]
    );
    const adminId = adminRes.insertId;

    // 2.2. Create 5 Standard Users for reviews
    const userIds = [adminId];
    for (let i = 0; i < 5; i++) {
      const [uRes] = await connection.execute(
        `INSERT INTO Users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          faker.person.fullName(),
          faker.internet.email(),
          hashedPassword,
          "user",
        ]
      );
      userIds.push(uRes.insertId);
    }

    // 3. CREATE CATEGORIES
    console.log("Seeding Categories...");
    const categoriesList = [
      { name: "Cà phê & Trà", slug: "coffee-tea" },
      { name: "Ẩm thực địa phương", slug: "local-food" },
      { name: "Check-in sống ảo", slug: "check-in" },
      { name: "Di tích lịch sử", slug: "history" },
      { name: "Khu vui chơi", slug: "entertainment" },
    ];

    const categoryIds = [];
    for (const cat of categoriesList) {
      const [cRes] = await connection.execute(
        `INSERT INTO Categories (name, slug, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
        [cat.name, cat.slug]
      );
      categoryIds.push(cRes.insertId);
    }

    // 4. CREATE PLACES (With Relations)
    console.log("Seeding Places and related data...");

    // Create 15 dummy places
    for (let i = 0; i < 15; i++) {
      // Pick a random user as the creator
      const randomOwnerId = userIds[Math.floor(Math.random() * userIds.length)];

      // 4.1. Insert into Places table
      const [placeRes] = await connection.execute(
        `INSERT INTO Places (name, description, address, lat, lng, user_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          faker.company.name() +
            (Math.random() > 0.5 ? " Coffee" : " Restaurant"),
          faker.lorem.paragraphs(2), // Description
          faker.location.streetAddress() + ", Đà Nẵng",
          16.0544 + (Math.random() - 0.5) * 0.05, // Random lat near Da Nang
          108.2022 + (Math.random() - 0.5) * 0.05, // Random lng near Da Nang
          randomOwnerId,
        ]
      );
      const placeId = placeRes.insertId;

      // 4.2. Assign Category (Insert into PlaceCategories junction table)
      // Pick a random category
      const randomCatId =
        categoryIds[Math.floor(Math.random() * categoryIds.length)];

      await connection.execute(
        `INSERT INTO PlaceCategories (place_id, category_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
        [placeId, randomCatId]
      );

      // 4.3. Create Images (PlaceImages table)
      // Create 3 images per place
      for (let j = 0; j < 3; j++) {
        await connection.execute(
          `INSERT INTO PlaceImages (place_id, url, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
          [placeId, faker.image.urlLoremFlickr({ category: "food" })]
        );
      }

      // 4.4. Create Reviews (PlaceReviews table)
      // Create 2 random reviews per place
      for (let k = 0; k < 2; k++) {
        const randomReviewer =
          userIds[Math.floor(Math.random() * userIds.length)];
        await connection.execute(
          `INSERT INTO PlaceReviews (user_id, place_id, rating, comment, created_at, updated_at) 
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            randomReviewer,
            placeId,
            faker.number.int({ min: 3, max: 5 }), // Rating 3-5
            faker.lorem.sentence(),
          ]
        );
      }
    }

    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("Admin Account: admin@travel.com | Pass: 123456");
  } catch (error) {
    console.error("ERROR SEEDING DATA:", error.message);
    if (error.code === "ER_NO_SUCH_TABLE") {
      console.log(
        "Hint: Table names in DB might differ (e.g., Places vs Place). Please check MySQL Workbench."
      );
    }
  } finally {
    if (connection) connection.end();
  }
}

seed();
