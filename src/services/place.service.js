const axios = require('axios');
const {
  Place,
  PlaceImage,
  PlaceCategory,
  Category,
  User,
  PlaceReview,
} = require('../models');
const AppError = require('../utils/AppError.util');
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require('../utils/cloudinaryUpload.util');
const sequelize = require('../config/database');

const GOONG_API_KEY = process.env.GOONG_API_KEY;

if (!GOONG_API_KEY)
  throw new Error('Missing GOONG_API_KEY in environment variables');

const GOONG_API_URL = 'https://rsapi.goong.io';

async function autocomplete(keyword) {
  if (!keyword) return [];
  if (!GOONG_API_KEY) {
    throw new Error('Missing GOONG_API_KEY in environment variables');
  }

  try {
    const response = await axios.get(GOONG_API_URL + '/Place/AutoComplete', {
      params: {
        input: keyword,
        api_key: GOONG_API_KEY,
        radius: 5000,
      },
      timeout: 10000,
    });

    console.log('Goong Autocomplete Response:', response.data);

    const predictions = response?.data?.predictions || [];

    return predictions.map((item) => ({
      placeId: item.place_id ?? item.reference,
      description: item.description,
      mainText: item.structured_formatting?.main_text,
      secondaryText: item.structured_formatting?.secondary_text,
    }));
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    throw new Error(
      `Goong autocomplete failed${status ? ` (HTTP ${status})` : ''}: ${
        data ? JSON.stringify(data) : err.message
      }`
    );
  }
}

async function getPlaceCoordinates(placeId) {
  if (!placeId) throw new Error('Missing placeId');
  if (!GOONG_API_KEY) {
    throw new Error('Missing GOONG_API_KEY in environment variables');
  }

  try {
    const response = await axios.get(GOONG_API_URL + '/Place/Detail', {
      params: {
        place_id: placeId,
        api_key: GOONG_API_KEY,
      },
      timeout: 10000,
    });

    const location = response?.data?.result?.geometry?.location;
    if (!location || location.lat == null || location.lng == null) {
      throw new Error(`No coordinates found for placeId: ${placeId}`);
    }

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: response?.data?.result?.formatted_address,
    };
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    throw new Error(
      `Goong place detail failed${status ? ` (HTTP ${status})` : ''}: ${
        data ? JSON.stringify(data) : err.message
      }`
    );
  }
}

exports.getPlaces = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = query;

  // Validate pagination params
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    throw new AppError('Page phải là số nguyên dương', 400);
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new AppError('Limit phải từ 1 đến 100', 400);
  }

  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where = { deleted_at: null };

  // Search by name or address
  if (search && search.trim() !== '') {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { name: { [Op.like]: `%${search.trim()}%` } },
      { address: { [Op.like]: `%${search.trim()}%` } },
      { short_description: { [Op.like]: `%${search.trim()}%` } },
    ];
  }

  // Build include clause
  const include = [
    {
      model: Category,
      as: 'categories',
      attributes: ['id', 'name', 'slug'],
      through: { attributes: [] },
    },
    {
      model: PlaceImage,
      as: 'images',
      attributes: ['id', 'url', 'public_id', 'caption', 'sort_order'],
      separate: true,
      order: [['sort_order', 'ASC']],
    },
    {
      model: PlaceImage,
      as: 'coverImage',
      attributes: ['id', 'url'],
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'full_name', 'email'],
    },
  ];

  // Filter by category (support multiple categories)
  if (category) {
    const { Op } = require('sequelize');

    // Parse category - can be string or array
    let categorySlugs = Array.isArray(category) ? category : category.split(",");

    // Filter out empty strings and trim
    categorySlugs = categorySlugs
      .map((slug) => String(slug).trim())
      .filter((slug) => slug !== '');

    if (categorySlugs.length > 0) {
      // Find all matching categories
      const categoryRecords = await Category.findAll({
        where: { slug: { [Op.in]: categorySlugs } },
        attributes: ['id', 'slug'],
      });

      if (categoryRecords.length === 0) {
        throw new AppError('Không tìm thấy danh mục nào phù hợp', 404);
      }

      // Check if all requested categories exist
      const foundSlugs = categoryRecords.map((cat) => cat.slug);
      const notFoundSlugs = categorySlugs.filter(
        (slug) => !foundSlugs.includes(slug)
      );

      if (notFoundSlugs.length > 0) {
        throw new AppError(
          `Danh mục không tồn tại: ${notFoundSlugs.join(', ')}`,
          404
        );
      }

      // Add category filter - places must have at least one of these categories
      const categoryIds = categoryRecords.map((cat) => cat.id);
      include[0].where = { id: { [Op.in]: categoryIds } };
      include[0].required = true; // Inner join
    }
  }

  // Validate sort options
  const validSortFields = ['created_at', 'updated_at', 'name', 'id'];
  const validSortOrders = ['ASC', 'DESC'];

  if (!validSortFields.includes(sortBy)) {
    throw new AppError(
      `SortBy phải là một trong: ${validSortFields.join(', ')}`,
      400
    );
  }

  if (!validSortOrders.includes(sortOrder.toUpperCase())) {
    throw new AppError('SortOrder phải là ASC hoặc DESC', 400);
  }

  // Get total count first
  const totalCount = await Place.count({
    where,
    include: category ? [include[0]] : [],
    distinct: true,
  });

  // Fetch places
  const places = await Place.findAll({
    where,
    include,
    limit: limitNum,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true,
  });

  // Add review stats to each place
  const placesWithStats = await Promise.all(
    places.map(async (place) => {
      const reviewStats = await PlaceReview.findOne({
        where: { place_id: place.id },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
          [
            sequelize.fn(
              'COALESCE',
              sequelize.fn('AVG', sequelize.col('stars')),
              0
            ),
            'averageRating',
          ],
        ],
        raw: true,
      });

      const placeJson = place.toJSON();
      placeJson.reviewCount = parseInt(reviewStats?.reviewCount || 0);
      placeJson.averageRating = parseFloat(reviewStats?.averageRating || 0);

      return placeJson;
    })
  );

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  return {
    places: placesWithStats,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limitNum,
      hasNextPage,
      hasPrevPage,
    },
  };
};

exports.getPlaceById = async (placeId) => {
  // Validate placeId
  const id = parseInt(placeId);
  if (isNaN(id) || id < 1) {
    throw new AppError('ID địa điểm không hợp lệ', 400);
  }

  const place = await Place.findOne({
    where: {
      id,
      deleted_at: null,
    },
    include: [
      {
        model: Category,
        as: 'categories',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
      },
      {
        model: PlaceImage,
        as: 'images',
        attributes: ['id', 'url', 'public_id', 'caption', 'sort_order'],
        order: [['sort_order', 'ASC']],
      },
      {
        model: PlaceImage,
        as: 'coverImage',
        attributes: ['id', 'url'],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'full_name', 'email'],
      },
    ],
  });

  if (!place) {
    throw new AppError('Địa điểm không tồn tại hoặc đã bị xóa', 404);
  }

  // Get review stats separately
  const reviewStats = await PlaceReview.findOne({
    where: { place_id: id },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
      [
        sequelize.fn(
          'COALESCE',
          sequelize.fn('AVG', sequelize.col('stars')),
          0
        ),
        'averageRating',
      ],
    ],
    raw: true,
  });

  // Add review stats to place object
  const placeWithStats = place.toJSON();
  placeWithStats.reviewCount = parseInt(reviewStats?.reviewCount || 0);
  placeWithStats.averageRating = parseFloat(reviewStats?.averageRating || 0);

  return placeWithStats;
};

exports.createPlace = async ({ userId, body, files }) => {
  const transaction = await sequelize.transaction();
  const uploadedPublicIds = []; // Tracking để rollback

  try {
    const {
      name,
      slug,
      short_description,
      address,
      phone,
      website,
      opening_hours,
      lat,
      lng,
      categories,
    } = body;

    // Validate required fields
    if (!name || !slug) {
      throw new AppError('Tên và slug là bắt buộc', 400);
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new AppError(
        'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
        400
      );
    }

    // Validate và parse categories
    let categoryIds = categories;
    if (typeof categories === 'string') {
      categoryIds = [categories];
    }
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw new AppError('Phải có ít nhất một danh mục', 400);
    }

    // Validate location: must have EITHER address OR (lat & lng)
    const hasAddress = address && String(address).trim() !== '';
    const hasLat = lat && String(lat).trim() !== '';
    const hasLng = lng && String(lng).trim() !== '';

    // Check if lat/lng are provided together
    if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
      throw new AppError('Phải cung cấp đầy đủ cả vĩ độ và kinh độ', 400);
    }

    const hasCoordinates = hasLat && hasLng;

    // Must have at least one: address OR coordinates
    if (!hasAddress && !hasCoordinates) {
      throw new AppError(
        'Phải cung cấp địa chỉ hoặc tọa độ (vĩ độ và kinh độ)',
        400
      );
    }

    let latNum = null;
    let lngNum = null;

    if (hasCoordinates) {
      latNum = parseFloat(lat);
      lngNum = parseFloat(lng);

      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        throw new AppError('Vĩ độ và kinh độ phải là số hợp lệ', 400);
      }

      if (latNum < -90 || latNum > 90) {
        throw new AppError('Vĩ độ phải nằm trong khoảng -90 đến 90', 400);
      }

      if (lngNum < -180 || lngNum > 180) {
        throw new AppError('Kinh độ phải nằm trong khoảng -180 đến 180', 400);
      }
    }

    // Validate images
    if (!files || files.length === 0) {
      throw new AppError('Phải có ít nhất một hình ảnh', 400);
    }
    if (files.length > 5) {
      throw new AppError('Tối đa 5 hình ảnh', 400);
    }

    // Check if slug already exists
    const existingPlace = await Place.findOne({
      where: { slug, deleted_at: null },
    });
    if (existingPlace) {
      throw new AppError('Slug đã tồn tại', 400);
    }

    // Create place
    const place = await Place.create(
      {
        name,
        slug,
        short_description,
        address: hasAddress ? address : null,
        phone,
        website,
        opening_hours,
        lat: hasCoordinates ? latNum : null,
        lng: hasCoordinates ? lngNum : null,
        user_id: userId,
      },
      { transaction }
    );

    // Handle categories
    const parsedCategoryIds = categoryIds.map((id) => parseInt(id));

    // Validate parsed IDs
    const validIds = parsedCategoryIds.filter((id) => !isNaN(id) && id > 0);
    if (validIds.length !== parsedCategoryIds.length) {
      throw new AppError('Category IDs không hợp lệ', 400);
    }

    // Verify categories exist
    const existingCategories = await Category.findAll({
      where: { id: validIds },
    });

    if (existingCategories.length !== validIds.length) {
      throw new AppError('Một hoặc nhiều danh mục không tồn tại', 400);
    }

    // Create place-category associations
    await PlaceCategory.bulkCreate(
      validIds.map((categoryId) => ({
        place_id: place.id,
        category_id: categoryId,
      })),
      { transaction }
    );

    // Handle image uploads
    const imageUploadPromises = files.map(async (file, index) => {
      const uploadResult = await uploadBufferToCloudinary(
        file.buffer,
        'places'
      );
      uploadedPublicIds.push(uploadResult.public_id); // Track để rollback
      return {
        place_id: place.id,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        sort_order: index,
      };
    });

    const imageData = await Promise.all(imageUploadPromises);
    const createdImages = await PlaceImage.bulkCreate(imageData, {
      transaction,
    });

    // Set first image as cover image
    if (createdImages.length > 0) {
      await place.update(
        { cover_image_id: createdImages[0].id },
        { transaction }
      );
    }

    await transaction.commit();

    // Fetch complete place data with associations
    const completePlace = await Place.findByPk(place.id, {
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] },
        },
        {
          model: PlaceImage,
          as: 'images',
          attributes: ['id', 'url', 'public_id', 'caption', 'sort_order'],
        },
        {
          model: PlaceImage,
          as: 'coverImage',
          attributes: ['id', 'url'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    return completePlace;
  } catch (err) {
    await transaction.rollback();

    // Rollback Cloudinary uploads
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map((publicId) => deleteFromCloudinary(publicId))
      );
    }

    throw err;
  }
};

exports.updatePlace = async ({ placeId, userId, userRole, body, files }) => {
  const transaction = await sequelize.transaction();
  const uploadedPublicIds = []; // Track new uploads for rollback
  const deletedPublicIds = []; // Track old images to delete

  try {
    const {
      name,
      slug,
      short_description,
      address,
      phone,
      website,
      opening_hours,
      lat,
      lng,
      categories,
      deleteImages, // Array of image IDs to delete
    } = body;

    // Find the place
    const place = await Place.findByPk(placeId, {
      include: [
        {
          model: PlaceImage,
          as: 'images',
        },
      ],
    });

    if (!place) {
      throw new AppError('Địa điểm không tồn tại', 404);
    }

    // Check authorization - only creator or admin can update
    if (place.user_id !== userId && userRole !== 'admin') {
      throw new AppError('Bạn không có quyền chỉnh sửa địa điểm này', 403);
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new AppError(
        'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
        400
      );
    }

    // Validate slug if changed
    if (slug && slug !== place.slug) {
      const existingPlace = await Place.findOne({
        where: { slug, deleted_at: null },
      });
      if (existingPlace) {
        throw new AppError('Slug đã tồn tại', 400);
      }
    }

    // Validate location if provided
    if (lat !== undefined || lng !== undefined || address !== undefined) {
      const newLat = lat !== undefined ? lat : place.lat;
      const newLng = lng !== undefined ? lng : place.lng;
      const newAddress = address !== undefined ? address : place.address;

      const hasAddress = newAddress && String(newAddress).trim() !== '';
      const hasLat = newLat && String(newLat).trim() !== '';
      const hasLng = newLng && String(newLng).trim() !== '';

      // Check if lat/lng are provided together
      if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
        throw new AppError('Phải cung cấp đầy đủ cả vĩ độ và kinh độ', 400);
      }

      const hasCoordinates = hasLat && hasLng;

      // Must have at least one: address OR coordinates
      if (!hasAddress && !hasCoordinates) {
        throw new AppError(
          'Phải cung cấp địa chỉ hoặc tọa độ (vĩ độ và kinh độ)',
          400
        );
      }

      if (hasCoordinates) {
        const latNum = parseFloat(newLat);
        const lngNum = parseFloat(newLng);

        if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
          throw new AppError('Vĩ độ và kinh độ phải là số hợp lệ', 400);
        }

        if (latNum < -90 || latNum > 90) {
          throw new AppError('Vĩ độ phải nằm trong khoảng -90 đến 90', 400);
        }

        if (lngNum < -180 || lngNum > 180) {
          throw new AppError('Kinh độ phải nằm trong khoảng -180 đến 180', 400);
        }
      }
    }

    // Update basic fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (short_description !== undefined)
      updateData.short_description = short_description;
    if (address !== undefined)
      updateData.address =
        address && String(address).trim() !== '' ? address : null;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (opening_hours !== undefined) updateData.opening_hours = opening_hours;
    if (lat !== undefined)
      updateData.lat =
        lat && String(lat).trim() !== '' ? parseFloat(lat) : null;
    if (lng !== undefined)
      updateData.lng =
        lng && String(lng).trim() !== '' ? parseFloat(lng) : null;

    await place.update(updateData, { transaction });

    // Handle categories update
    if (categories !== undefined) {
      let categoryIds = categories;
      if (typeof categories === 'string') {
        categoryIds = [categories];
      }

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Phải có ít nhất một danh mục', 400);
      }

      const parsedCategoryIds = categoryIds.map((id) => parseInt(id));
      const validIds = parsedCategoryIds.filter((id) => !isNaN(id) && id > 0);

      if (validIds.length !== parsedCategoryIds.length) {
        throw new AppError('Category IDs không hợp lệ', 400);
      }

      // Verify categories exist
      const existingCategories = await Category.findAll({
        where: { id: validIds },
      });

      if (existingCategories.length !== validIds.length) {
        throw new AppError('Một hoặc nhiều danh mục không tồn tại', 400);
      }

      // Delete existing associations and create new ones
      await PlaceCategory.destroy({
        where: { place_id: placeId },
        transaction,
      });

      await PlaceCategory.bulkCreate(
        validIds.map((categoryId) => ({
          place_id: placeId,
          category_id: categoryId,
        })),
        { transaction }
      );
    }

    // Handle image deletion
    let imageIdsToDelete = [];
    if (deleteImages) {
      // Validate and parse deleteImages
      imageIdsToDelete = Array.isArray(deleteImages)
        ? deleteImages
        : [deleteImages];
      imageIdsToDelete = imageIdsToDelete
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id) && id > 0);
    }

    // Calculate final image count after deletion and new uploads
    const currentImageCount = await PlaceImage.count({
      where: { place_id: placeId },
      transaction,
    });
    const newFilesCount = files ? files.length : 0;
    const finalImageCount =
      currentImageCount - imageIdsToDelete.length + newFilesCount;

    // Validate minimum and maximum image count
    if (finalImageCount < 1) {
      throw new AppError('Địa điểm phải có ít nhất 1 hình ảnh', 400);
    }
    if (finalImageCount > 5) {
      throw new AppError(
        `Tối đa 5 hình ảnh. Hiện có ${currentImageCount} ảnh, bạn đang xóa ${imageIdsToDelete.length} ảnh và thêm ${newFilesCount} ảnh mới`,
        400
      );
    }

    if (imageIdsToDelete.length > 0) {
      const imagesToDelete = await PlaceImage.findAll({
        where: {
          id: imageIdsToDelete,
          place_id: placeId,
        },
      });

      for (const image of imagesToDelete) {
        // Use stored public_id if available, otherwise extract from URL
        if (image.public_id) {
          deletedPublicIds.push(image.public_id);
        } else {
          // Fallback: Extract public_id from URL
          const urlParts = image.url.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = `places/${filename.split('.')[0]}`;
          deletedPublicIds.push(publicId);
        }
      }

      // If cover image is being deleted, need to set new cover later
      if (imageIdsToDelete.includes(place.cover_image_id)) {
        // Find the image with the lowest sort_order not being deleted
        const { Op } = require('sequelize');
        const candidateImages = await PlaceImage.findAll({
          where: {
            place_id: placeId,
            id: { [Op.notIn]: imageIdsToDelete },
          },
          order: [['sort_order', 'ASC']],
          transaction,
        });

        let newCoverId = null;
        if (candidateImages.length > 0) {
          newCoverId = candidateImages[0].id;
        }

        // Temporarily set new cover image
        await place.update({ cover_image_id: newCoverId }, { transaction });
      }

      // Delete images from Cloudinary BEFORE transaction commit
      if (deletedPublicIds.length > 0) {
        await Promise.all(
          deletedPublicIds.map((publicId) => deleteFromCloudinary(publicId))
        );
      }

      await PlaceImage.destroy({
        where: {
          id: imageIdsToDelete,
          place_id: placeId,
        },
        transaction,
      });
    }

    // Handle new image uploads
    if (files && files.length > 0) {
      const maxSortOrder = await PlaceImage.max('sort_order', {
        where: { place_id: placeId },
        transaction,
      });

      const nextSortOrder = maxSortOrder !== null ? maxSortOrder + 1 : 0;

      const imageUploadPromises = files.map(async (file, index) => {
        const uploadResult = await uploadBufferToCloudinary(
          file.buffer,
          'places'
        );
        uploadedPublicIds.push(uploadResult.public_id);
        return {
          place_id: placeId,
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          sort_order: nextSortOrder + index,
        };
      });

      const imageData = await Promise.all(imageUploadPromises);
      const createdImages = await PlaceImage.bulkCreate(imageData, {
        transaction,
      });

      // If no cover image exists, set first new image as cover
      if (!place.cover_image_id && createdImages.length > 0) {
        await place.update(
          { cover_image_id: createdImages[0].id },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Fetch complete updated place data
    const updatedPlace = await Place.findByPk(placeId, {
      include: [
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'slug'],
          through: { attributes: [] },
        },
        {
          model: PlaceImage,
          as: 'images',
          attributes: ['id', 'url', 'public_id', 'caption', 'sort_order'],
        },
        {
          model: PlaceImage,
          as: 'coverImage',
          attributes: ['id', 'url'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    return updatedPlace;
  } catch (err) {
    await transaction.rollback();

    // Rollback new Cloudinary uploads
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map((publicId) => deleteFromCloudinary(publicId))
      );
    }

    throw err;
  }
};

exports.softDeletePlace = async ({ placeId, userId, userRole }) => {
  const place = await Place.findByPk(placeId);

  if (!place) {
    throw new AppError('Địa điểm không tồn tại', 404);
  }

  // Check authorization - only creator or admin can delete
  if (place.user_id !== userId && userRole !== 'admin') {
    throw new AppError('Bạn không có quyền xóa địa điểm này', 403);
  }

  // Soft delete using Sequelize paranoid mode
  await place.destroy();

  return { message: 'Xóa địa điểm thành công' };
};

// Export all functions
exports.autocomplete = autocomplete;
exports.getPlaceCoordinates = getPlaceCoordinates;
