const MATCH = "match";

const HIGHER = "higher";

const LOWER = "lower";

const MISMATCH = "mismatch";

function compareEquality(guessValue, mysteryValue) {
    return guessValue === mysteryValue ? MATCH : MISMATCH;
}

function compareOrderable(guessValue, mysteryValue) {
    if (guessValue === mysteryValue) return MATCH;
    return mysteryValue > guessValue ? HIGHER : LOWER;
}

const ATTRIBUTE_SCHEMA = [ {
    key: "gender",
    label: "Gender",
    type: "equality"
}, {
    key: "role",
    label: "Role",
    type: "equality"
}, {
    key: "side",
    label: "Side",
    type: "equality"
}, {
    key: "speed",
    label: "Speed",
    type: "orderable"
}, {
    key: "armor",
    label: "Armor",
    type: "orderable"
}, {
    key: "releaseYear",
    label: "Year",
    type: "orderable"
} ];

function compareOperators(guessOp, mysteryOp) {
    const isCorrect = guessOp.name === mysteryOp.name;
    const results = ATTRIBUTE_SCHEMA.map(attr => {
        const guessValue = guessOp[attr.key];
        const mysteryValue = mysteryOp[attr.key];
        const state = attr.type === "equality" ? compareEquality(guessValue, mysteryValue) : compareOrderable(guessValue, mysteryValue);
        return {
            key: attr.key,
            label: attr.label,
            type: attr.type,
            state: state,
            guessValue: guessValue,
            mysteryValue: mysteryValue
        };
    });
    return {
        isCorrect: isCorrect,
        results: results
    };
}
