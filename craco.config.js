const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          util: require.resolve("util/"),
          assert: require.resolve("assert/"),
          stream: require.resolve("stream-browserify"),
          zlib: require.resolve("browserify-zlib"),
          crypto: require.resolve("crypto-browserify"),
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      ],
    },
  },
};
