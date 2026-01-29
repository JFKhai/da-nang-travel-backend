const {
  sequelize,
  User,
  Category,
  Place,
  PlaceImage,
  PlaceCategory,
  PlaceReview,
  Favorite,
} = require("./models");
const { faker } = require("@faker-js/faker/locale/vi");
const bcrypt = require("bcryptjs");

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection established successfully.");
    console.log("Syncing database schema (Dropping old tables)...");
    await sequelize.sync({ force: true });

    // 1.SEED USERS
    console.log("Seeding Users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    // Create Admin User
    const admin = await User.create({
      full_name: "Khai",
      email: "admin@travel.com",
      password: hashedPassword,
      role: "admin",
      avatar_url:
        "https://ui-avatars.com/api/?name=Khai&background=0D8ABC&color=fff",
    });

    // Create Normal Users
    const users = [];
    users.push(admin);

    for (let i = 0; i < 5; i++) {
      const user = await User.create({
        full_name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: "user",
        avatar_url: faker.image.avatar(),
      });
      users.push(user);
    }

    // 2.SEED CATEGORIES
    console.log("Seeding Categories...");
    const categoryData = [
      { name: "Cà phê & Trà", slug: "coffee-tea", icon: "coffee" },
      { name: "Ẩm thực", slug: "food", icon: "utensils" },
      { name: "Khách sạn", slug: "hotel", icon: "hotel" },
      { name: "Check-in", slug: "check-in", icon: "camera" },
      { name: "Lịch sử", slug: "history", icon: "landmark" },
      { name: "Vui chơi", slug: "entertainment", icon: "gamepad" },
    ];

    const categories = [];
    for (const cat of categoryData) {
      const category = await Category.create(cat);
      categories.push(category);
    }

    // 3.SEED PLACES & RELATED DATA
    console.log("Seeding Places...");
    // Create 15 random places
    for (let i = 0; i < 15; i++) {
      const randomOwner = users[Math.floor(Math.random() * users.length)];
      const placeName = faker.company.name();

      // Step 1: Create Place
      const place = await Place.create({
        name: placeName,
        slug:
          faker.helpers.slugify(placeName).toLowerCase() +
          "-" +
          faker.number.int({ min: 1000, max: 9999 }),
        short_description: faker.lorem.paragraph(),
        address: faker.location.streetAddress() + ", Đà Nẵng",
        lat: 16.0544 + (Math.random() - 0.5) * 0.05,
        lng: 108.2022 + (Math.random() - 0.5) * 0.05,
        user_id: randomOwner.id,
        phone: faker.phone.number(),
        website: faker.internet.url(),
        opening_hours: "08:00 - 22:00",
        cover_image_id: null,
      });

      // Step 2: Create Images
      const images = [];
      for (let j = 0; j < 3; j++) {
        const image = await PlaceImage.create({
          place_id: place.id,
          url: faker.image.urlLoremFlickr({
            category: "city",
            width: 640,
            height: 480,
          }),
          caption: faker.lorem.sentence(),
          public_id: `seed_img_${place.id}_${j}`,
        });
        images.push(image);
      }

      // Step 3: Update Place Cover Image
      if (images.length > 0) {
        await place.update({ cover_image_id: images[0].id });
      }

      // Step 4: Assign Category
      const randomCategory =
        categories[Math.floor(Math.random() * categories.length)];
      await PlaceCategory.create({
        place_id: place.id,
        category_id: randomCategory.id,
      });

      // Step 5: Create Reviews
      for (let k = 0; k < 2; k++) {
        const randomReviewer = users[Math.floor(Math.random() * users.length)];
        await PlaceReview.create({
          user_id: randomReviewer.id,
          place_id: place.id,
          stars: faker.number.int({ min: 3, max: 5 }),
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
        });
      }

      // Step 6: Create Favorites
      for (const userItem of users) {
        // Random 30% chance to favorite
        if (Math.random() > 0.7) {
          const existingFav = await Favorite.findOne({
            where: { user_id: userItem.id, place_id: place.id },
          });

          if (!existingFav) {
            await Favorite.create({
              user_id: userItem.id,
              place_id: place.id,
            });
          }
        }
      }
    }

    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("FATAL ERROR DURING SEEDING:", error);
    process.exit(1);
  }
};

seedDatabase();
