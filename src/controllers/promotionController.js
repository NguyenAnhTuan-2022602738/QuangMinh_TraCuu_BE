const PromotionBanner = require('../models/PromotionBanner');

const buildDefaultBanner = () => ({
    title: 'Ưu đãi khuyến mãi đặc biệt',
    subtitle: 'Giảm ngay 15% cho toàn bộ đơn hàng từ 5 triệu đồng trở lên khi đặt hàng trong tháng này.',
    backgroundImageUrl: '',
    isActive: true,
    overlayOpacity: 0.55,
    textAlignment: 'left',
    primaryAction: {
        label: 'Xem sản phẩm ưu đãi',
        link: '/catalog'
    },
    secondaryAction: {
        label: 'Tra cứu mã giảm giá',
        link: '/search'
    },
    badgeText: 'Hot Deal',
    highlightValue: '15%',
    highlightNote: 'Giảm trực tiếp'
});

// Retrieves the latest promotion banner configuration.
exports.getPromotion = async (req, res, next) => {
    try {
        const promotion = await PromotionBanner.findOne({}).sort({ updatedAt: -1 }).lean();

        if (!promotion) {
            return res.json({ ...buildDefaultBanner(), isDefault: true });
        }

        return res.json(promotion);
    } catch (error) {
        return next(error);
    }
};

// Creates or updates the promotion banner configuration.
exports.upsertPromotion = async (req, res, next) => {
    try {
        const {
            title,
            subtitle,
            backgroundImageUrl,
            isActive = true,
            overlayOpacity = 0.55,
            textAlignment = 'left',
            primaryAction = {},
            secondaryAction = {},
            badgeText,
            highlightValue,
            highlightNote
        } = req.body || {};

        if (!title || !subtitle) {
            return res.status(400).json({ message: 'Tiêu đề và mô tả khuyến mãi là bắt buộc' });
        }

        const normalizedOverlay = Math.min(Math.max(Number(overlayOpacity) || 0.55, 0), 1);
        const normalizedTextAlign = ['left', 'center', 'right'].includes(textAlignment) ? textAlignment : 'left';

        const payload = {
            title,
            subtitle,
            backgroundImageUrl: backgroundImageUrl || '',
            isActive: Boolean(isActive),
            overlayOpacity: normalizedOverlay,
            textAlignment: normalizedTextAlign,
            primaryAction: {
                label: primaryAction.label || '',
                link: primaryAction.link || ''
            },
            secondaryAction: {
                label: secondaryAction.label || '',
                link: secondaryAction.link || ''
            },
            badgeText: badgeText || 'Hot Deal',
            highlightValue: highlightValue || '15%',
            highlightNote: highlightNote || 'Giảm trực tiếp',
            lastUpdatedBy: 'admin'
        };

        const promotion = await PromotionBanner.findOneAndUpdate(
            {},
            payload,
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        return res.json({ message: 'Cập nhật banner khuyến mãi thành công', promotion });
    } catch (error) {
        return next(error);
    }
};
