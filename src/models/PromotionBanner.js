const mongoose = require('mongoose');

const ctaSchema = new mongoose.Schema({
    label: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    }
}, { _id: false });

const promotionBannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    backgroundImageUrl: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    overlayOpacity: {
        type: Number,
        default: 0.55,
        min: 0,
        max: 1
    },
    textAlignment: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'left'
    },
    primaryAction: {
        type: ctaSchema,
        default: () => ({})
    },
    secondaryAction: {
        type: ctaSchema,
        default: () => ({})
    },
    badgeText: {
        type: String,
        default: 'Hot Deal'
    },
    highlightValue: {
        type: String,
        default: '15%'
    },
    highlightNote: {
        type: String,
        default: 'Giảm trực tiếp'
    },
    lastUpdatedBy: {
        type: String,
        default: 'admin'
    }
}, { timestamps: true });

const PromotionBanner = mongoose.model('PromotionBanner', promotionBannerSchema);

module.exports = PromotionBanner;
