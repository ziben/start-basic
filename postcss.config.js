export default {
  plugins: {
    'postcss-preset-env': {
      stage: 2,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
      },
      // 使用 .browserslistrc 文件中的配置
      env: process.env.BROWSERSLIST_ENV || 'modern',
    },
    '@tailwindcss/postcss': {},
    'postcss-discard-duplicates': {},
    'postcss-discard-empty': {},
  },
}
