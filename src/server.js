const os = require('os');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const printNetworkAddresses = () => {
    const interfaces = os.networkInterfaces();
    const addresses = Object.entries(interfaces).flatMap(([name, infos]) =>
        infos
            .filter((iface) => iface.family === 'IPv4' && !iface.internal)
            .map((iface) => ({ name, address: iface.address }))
    );

    if (addresses.length === 0) {
        console.log('No external network interfaces detected.');
        return;
    }

    console.log('Server accessible at:');
    addresses.forEach(({ name, address }) => {
        console.log(`  http://${address}:${PORT} (${name})`);
    });
};

connectDB()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
            printNetworkAddresses();
            console.log('\nAPI Endpoints:');
            console.log(`  http://localhost:${PORT}/api/products`);
            console.log(`  http://localhost:${PORT}/api/products/{customerType}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server due to database error:', error.message);
        process.exit(1);
    });
