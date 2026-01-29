const { success } = require('../utils/response.util');
const adminService = require('../services/admin.service');

exports.getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();

        return res.status(200).json(
            success(stats, 'Lấy thống kê thành công!')
        );
    } catch (err) {
        next(err);
    }
};