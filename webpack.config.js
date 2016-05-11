var webpack = require('webpack');
module.exports = {
    entry: './test/worker.js',
    output: {
        filename: 'worker-browser.bundle.js'
    },
    module: {
        loaders: [{
            test: /\.coffee$/,
            loader: 'coffee-loader'
        }, {
            test: /\.css$/,
            loader: "css-loader"
        }, {
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
                presets: ['es2015']
            }
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
           'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
        })
    ]
};
