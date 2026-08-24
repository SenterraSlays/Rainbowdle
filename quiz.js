const QUIZ_ATTRIBUTES = [ {
    key: "gender",
    label: "Gender",
    valueOf: op => op.gender,
    prompt: value => `Which character is ${value}?`
}, {
    key: "role",
    label: "Role",
    valueOf: op => op.role,
    prompt: value => `Which operator's role is "${value}"?`
}, {
    key: "side",
    label: "Side",
    valueOf: op => op.side,
    prompt: value => `Which operator is on the ${value} side?`
}, {
    key: "speed",
    label: "Speed",
    valueOf: op => op.speed,
    prompt: value => `Which operator has ${value} speed?`,
    displayValue: value => `${value} (${"●".repeat(value)}${"○".repeat(3 - value)})`
}, {
    key: "armor",
    label: "Armor",
    valueOf: op => op.armor,
    prompt: value => `Which operator has ${value} armor?`,
    displayValue: value => `${value} (${"●".repeat(value)}${"○".repeat(3 - value)})`
}, {
    key: "releaseYear",
    label: "Release Year",
    valueOf: op => op.releaseYear,
    prompt: value => `Which operator was released in ${value}?`
} ];

function quizShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [ a[j], a[i] ];
    }
    return a;
}

function quizPickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateQuizQuestion(pool, categoryKeys, optionCount = 4) {
    const attrs = QUIZ_ATTRIBUTES.filter(a => categoryKeys.has(a.key));
    if (!attrs.length || pool.length < optionCount) return null;
    for (const attr of quizShuffle(attrs)) {
        const values = quizShuffle([ ...new Set(pool.map(op => attr.valueOf(op))) ]);
        for (const value of values) {
            const matches = pool.filter(op => attr.valueOf(op) === value);
            const nonMatches = pool.filter(op => attr.valueOf(op) !== value);
            if (matches.length < 1 || nonMatches.length < optionCount - 1) continue;
            const correct = quizPickRandom(matches);
            const distractors = quizShuffle(nonMatches).slice(0, optionCount - 1);
            const options = quizShuffle([ correct, ...distractors ]);
            const displayValue = attr.displayValue ? attr.displayValue(value) : value;
            return {
                attributeKey: attr.key,
                attributeLabel: attr.label,
                value: value,
                prompt: attr.prompt(displayValue),
                correctName: correct.name,
                options: options.map(op => ({
                    name: op.name,
                    image: op.image
                }))
            };
        }
    }
    return null;
}
