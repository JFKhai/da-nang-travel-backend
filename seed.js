require("dotenv").config();
const mysql = require("mysql2/promise");
const { faker } = require("@faker-js/faker/locale/vi");
const bcrypt = require("bcrypt");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "da_nang_travel",
  port: process.env.DB_PORT || 3306,
};

// Helper function to create slug from string
const createSlug = (str) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

async function seed() {
  let connection;
  try {
    console.log(`Connecting to database: ${dbConfig.database}...`);
    connection = await mysql.createConnection(dbConfig);
    console.log("Connection established.");

    // 1.CLEAN UP OLD DATA
    console.log("Cleaning up old data...");

    // Disable foreign key checks to allow truncation
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    const tables = [
      "favorites",
      "place_reviews",
      "place_images",
      "place_categories",
      "places",
      "categories",
      "users",
    ];

    for (const table of tables) {
      try {
        await connection.query(`DELETE FROM ${table}`);
        await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`   - Cleared table: ${table}`);
      } catch (err) {
        console.warn(`   Warning: Table '${table}' not found.`);
      }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    // 2.SEED USERS
    console.log("Seeding Users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    const insertUserQuery = `INSERT INTO users (full_name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`;

    // Create Admin User
    const [adminRes] = await connection.execute(insertUserQuery, [
      "Khai",
      "admin@travel.com",
      hashedPassword,
      "admin",
    ]);
    const adminId = adminRes.insertId;

    // Create Normal Users
    const userIds = [adminId];
    for (let i = 0; i < 5; i++) {
      const [uRes] = await connection.execute(insertUserQuery, [
        faker.person.fullName(),
        faker.internet.email(),
        hashedPassword,
        "user",
      ]);
      userIds.push(uRes.insertId);
    }

    // 3.SEED CATEGORIES
    console.log("Seeding Categories...");
    const categoriesList = [
      { name: "Cà phê & Trà", slug: "coffee-tea" },
      { name: "Ẩm thực", slug: "food" },
      { name: "Check-in", slug: "check-in" },
      { name: "Lịch sử", slug: "history" },
      { name: "Vui chơi", slug: "entertainment" },
    ];
    const categoryIds = [];

    for (const cat of categoriesList) {
      const [cRes] = await connection.execute(
        `INSERT INTO categories (name, slug, icon, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
        [
          cat.name,
          cat.slug,
          faker.image.urlLoremFlickr({ category: "abstract" }),
        ]
      );
      categoryIds.push(cRes.insertId);
    }

    // 4. SEED PLACES & RELATED DATA
    console.log("Seeding Places...");
    const placeIds = [];

    for (let i = 0; i < 15; i++) {
      const randomOwner = userIds[Math.floor(Math.random() * userIds.length)];
      const placeName = faker.company.name();
      // Generate unique slug
      const placeSlug =
        createSlug(placeName) +
        "-" +
        faker.number.int({ min: 1000, max: 9999 });

      // STEP 1: INSERT PLACE
      const [placeRes] = await connection.execute(
        `INSERT INTO places (name, slug, short_description, address, lat, lng, user_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          placeName,
          placeSlug,
          faker.lorem.paragraph(),
          faker.location.streetAddress() + ", Đà Nẵng",
          16.0544 + (Math.random() - 0.5) * 0.05,
          108.2022 + (Math.random() - 0.5) * 0.05,
          randomOwner,
        ]
      );
      const placeId = placeRes.insertId;
      placeIds.push(placeId);

      // STEP 2: INSERT PLACE IMAGES
      const imageIds = [];
      for (let img = 0; img < 3; img++) {
        const [imgRes] = await connection.execute(
          `INSERT INTO place_images (place_id, url, caption, created_at) VALUES (?, ?, ?, NOW())`,
          [
            placeId,
            faker.image.urlLoremFlickr({ category: "city" }),
            faker.lorem.sentence(),
          ]
        );
        imageIds.push(imgRes.insertId);
      }

      // STEP 3: UPDATE PLACE WITH COVER IMAGE
      if (imageIds.length > 0) {
        await connection.execute(
          `UPDATE places SET cover_image_id = ? WHERE id = ?`,
          [imageIds[0], placeId]
        );
      }

      // STEP 4: PLACE CATEGORIES (Relation)
      const randomCat =
        categoryIds[Math.floor(Math.random() * categoryIds.length)];
      await connection.execute(
        `INSERT INTO place_categories (place_id, category_id) VALUES (?, ?)`,
        [placeId, randomCat]
      );

      // STEP 5: PLACE REVIEWS
      for (let k = 0; k < 2; k++) {
        const reviewer = userIds[Math.floor(Math.random() * userIds.length)];
        await connection.execute(
          `INSERT INTO place_reviews (user_id, place_id, stars, title, content, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            reviewer,
            placeId,
            faker.number.int({ min: 3, max: 5 }),
            faker.lorem.sentence(5),
            faker.lorem.paragraph(),
          ]
        );
      }
    }

    // 5.SEED FAVORITES
    console.log("Seeding Favorites...");
    for (const uid of userIds) {
      const randomPlace = placeIds[Math.floor(Math.random() * placeIds.length)];

      try {
        await connection.execute(
          `INSERT INTO favorites (user_id, place_id, created_at) VALUES (?, ?, NOW())`,
          [uid, randomPlace]
        );
      } catch (e) {
        // Ignore duplicate entry error
      }
    }

    console.log("SEED COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("FATAL ERROR DETAILS:", error);
    if (error.code === "ER_BAD_DB_ERROR") {
      console.error(
        "HINT: Database 'da_nang_travel' does not exist. Please create it in MySQL Workbench."
      );
    }
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(
        "HINT: Access denied. Check DB_USER and DB_PASSWORD in .env file."
      );
    }
  } finally {
    if (connection) connection.end();
  }
}

seed();
