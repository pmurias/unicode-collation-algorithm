module.exports = {
	root: true,
	env: {
		node: true,
	},
	extends: [
		"airbnb-base",
	],
	plugins: [
		"@typescript-eslint",
	],
	settings: {
		"import/resolver": {
			"node": {
				"extensions": [
					".ts",
				],
			},
		},
	},
	rules: {
		"no-console": process.env.NODE_ENV === "production" ? "error" : "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": "error",
		"semi": "off",
		"@typescript-eslint/semi": ["error"],
		quotes: ["error", "double"],
		indent: ["error", "tab"],
		"max-len": ["error", { code: 160 }],
		"no-tabs": ["error", { allowIndentationTabs: true }],
		"no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
		"class-methods-use-this": "off",
		"max-classes-per-file": "off",
		"import/prefer-default-export": "off",
		"no-continue": "off",
		"no-dupe-class-members": "off",
		"no-underscore-dangle": ["error", {"allowAfterThis": true}],
		"no-plusplus": "off",
		"no-bitwise": "off",
	},
	parser: "@typescript-eslint/parser",
	parserOptions: {
		parser: "@typescript-eslint/parser",
		sourceType: "module",
		project: "./tsconfig.json",
	},
};

