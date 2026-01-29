// src/services/admin.service.js
const { User, Place, PlaceReview, Category, Favorite } = require('../models');
const { Sequelize, Op } = require('sequelize');
const AppError = require('../utils/AppError.util');

class AdminService {
    async getGrowthStats(Model) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const data = await Model.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
                [Sequelize.fn('COUNT', '*'), 'count']
            ],
            where: {
                created_at: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
            raw: true
        });
        return data;
    }

    async getDashboardStats() {
        try {
            const [totalUsers, totalPlaces, totalReviews, totalCategories, totalFavorites] = await Promise.all([
                User.count(),
                Place.count(),
                PlaceReview.count(),
                Category.count(),
                Favorite.count()
            ]);

            const [userChart, placeChart, reviewChart] = await Promise.all([
                this.getGrowthStats(User),
                this.getGrowthStats(Place),
                this.getGrowthStats(PlaceReview)
            ]);

            const avgData = await PlaceReview.findOne({
                attributes: [[Sequelize.fn('AVG', Sequelize.col('stars')), 'averageStars']]
            });
            const rawRating = avgData?.dataValues?.averageStars;
            const averageRating = rawRating ? parseFloat(rawRating).toFixed(1) : 0;

            return {
                summary: {
                    totalUsers,
                    totalPlaces,
                    totalReviews,
                    totalCategories,
                    totalFavorites,
                    averageRating
                },
                charts: {
                    userChart,
                    placeChart,
                    reviewChart
                }
            };

        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw new AppError('Lỗi khi lấy thống kê Dashboard', 500);
        }
    }
}

module.exports = new AdminService();