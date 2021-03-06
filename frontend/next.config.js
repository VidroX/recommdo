const { i18n } = require('./next-i18next.config')

module.exports = {
  i18n,
  future: {
    webpack5: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: [{
        loader: 'svg-sprite-loader',
        options: {
          symbolId: 'icon-[name]'
        }
      }]
    });

    return config;
  },
};