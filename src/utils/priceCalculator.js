const calculatePrice = (basePrice, customerType) => {
    let discount = 0;

    switch (customerType) {
        case 'regular':
            discount = 0;
            break;
        case 'premium':
            discount = 0.1; // 10% discount
            break;
        case 'wholesale':
            discount = 0.2; // 20% discount
            break;
        default:
            throw new Error('Invalid customer type');
    }

    return basePrice * (1 - discount);
};

const calculateBulkPrice = (basePrice, quantity, customerType) => {
    let price = calculatePrice(basePrice, customerType);

    if (quantity > 10) {
        price *= 0.9; // Additional 10% discount for bulk orders
    }

    return price * quantity;
};

module.exports = {
    calculatePrice,
    calculateBulkPrice,
};