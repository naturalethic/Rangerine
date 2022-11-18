/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.tsx", "./kit/**/*.tsx"],
    theme: {
        extend: {
            fontFamily: {
                sacramento: "Sacramento",
                iosevka: "Iosevka",
            },
        },
    },
    variants: {
        extend: {
            visibility: ["group-hover"],
        },
    },
};
