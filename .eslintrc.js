module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
  },
  extends: ['prettier'],
  plugins: ['react', 'react-hooks'],
  settings: {
    next: {
      rootDir: ['apps/*/'],
    },
  },
  rules: {
    'react-hooks/rules-of-hooks': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    // 允许 console.log，适用于开发阶段
    'no-console': 'off',
    // 允许空函数体
    'no-empty-function': 'off',
    // 允许没有使用的变量，减少警告
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // 允许隐式类型转换（例如将字符串转换为数字）
    'no-implicit-coercion': 'off',
    // 允许使用 var 进行声明
    'no-var': 'off',
    // 对换行符宽松
    'linebreak-style': ['off'],
    // 允许函数声明方式
    'func-style': ['off'],
    // 对缩进宽松
    indent: ['warn', 2],
    // 放宽空格规则
    'space-infix-ops': 'off',
    // 不强制使用分号
    semi: ['warn', 'never'],
    // 不强制箭头函数始终在圆括号内使用
    'arrow-parens': ['warn', 'as-needed'],
    // 对类中的成员排序放松
    'class-methods-use-this': 'off',
    // 对 React 中 propTypes 和 defaultProps 放松检查
    'react/prop-types': 'off',
    'react/default-props-match-prop-types': 'off',
  },
}
