// eslint-disable-next-line no-undef
module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
        "@typescript-eslint/no-empty-function": "off",
        "no-constant-condition": [
            "error",
            {
                checkLoops: false
            }
        ],
        semi: ["error", "always"]
    },
    root: true
};
