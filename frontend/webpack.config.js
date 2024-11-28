const path = require('path');

module.exports = {
    mode: 'production', // or 'development'
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'public'), // Output to the public directory
        filename: 'bundle.js', // This is the file referenced in index.html
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/, // Handle .js and .jsx files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.css$/, // Handle .css files
                use: ['style-loader', 'css-loader'], // Use style-loader and css-loader
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'], // Allow importing without specifying extensions
    },
    devtool: 'source-map', // Optional: for easier debugging
};