// eslint-disable-next-line no-undef
module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "react-hooks"],
    rules: {
        "@typescript-eslint/no-empty-function": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
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
