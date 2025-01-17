new webpack.optimize.DedupePlugin(),
new webpack.optimize.UglifyJsPlugin(),
new webpack.optimize.AggressiveMergingPlugin(),
new CompressionPlugin({
    asset: "[path].gz[query]",
    algorithm: "gzip",
    test: /\.js$|\.css$|\.html$/,
    threshold: 10240,
    minRatio: 0.8
})