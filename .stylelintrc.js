module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'no-empty-source': null,
    'selector-class-pattern': '.*',
    'selector-pseudo-class-no-unknown': null,
    'no-descending-specificity': null,
    'function-no-unknown': null,
    'custom-property-pattern': null,
    'selector-pseudo-element-no-unknown': null,
  },
  overrides: [
    {
      files: '**/*.less',
      customSyntax: 'postcss-less',
    },
  ],
}
