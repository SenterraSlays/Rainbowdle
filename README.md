# 🌈 Rainbowdle

**Rainbowdle** is a Rainbow Six Siege-inspired operator guessing game where you try to identify the mystery operator using clues from their attributes, loadout, and role.

> 🎮 **Play Rainbowdle:** [SenterraSlays.github.io/Rainbowdle](https://SenterraSlays.github.io/Rainbowdle/)

## 🎯 Game Modes

### Classic
Play unlimited random rounds. You get **10 guesses** to identify the mystery operator.

### 📅 Daily Challenge
Everyone gets the same mystery operator for the day. Complete the challenge and build your daily streak.

### 🎓 Learning Mode
Explore the operator roster without the pressure of guessing. Browse operator information, loadouts, stats, roles, and more.

Learning Mode also includes an interactive quiz for testing your Rainbow Six knowledge.

### 🎮 Multiplayer
Create or join a room and race your friends to identify the same mystery operator.

### 🏆 Leaderboard
Compare your results and performance with other Rainbowdle players.

## 🧩 How Classic Mode Works

1. Choose an operator from the search box.
2. Submit your guess.
3. Rainbowdle compares your guess with the mystery operator.
4. Use the results to narrow down the possibilities.
5. You have a maximum of **10 guesses**.
6. Guess correctly to win!

The game provides additional hints as you make more guesses:

- **4 guesses:** Secondary Gadgets
- **6 guesses:** Secondary Weapons
- **8 guesses:** Primary Weapons

## 📊 Guess Results

Each guess provides information about several operator attributes:

| Attribute | What it tells you |
| --- | --- |
| Operator | The operator you guessed |
| Gender | Whether the operator's gender matches |
| Role | Their operator role |
| Side | Attacker or Defender |
| Speed | Speed rating |
| Armor | Armor rating |
| Year | Operator release year |

Results can indicate an exact match, a mismatch, or whether the mystery operator's numeric value is higher or lower.

## 💾 Local Progress

Rainbowdle saves game information in your browser using `localStorage`. This includes:

- Classic game progress
- Daily challenge progress
- Game statistics
- Win and loss streaks
- Best streaks
- Settings
- Learning-mode quiz statistics

No account is required for the basic game experience.

## 🛠️ Tech Stack

Rainbowdle is built as a lightweight web application using:

- **HTML5** — page structure
- **CSS3** — styling and responsive UI
- **JavaScript** — game logic, UI, operator comparisons, quizzes, and storage
- **Supabase** — online features such as accounts, multiplayer, and leaderboards
- **GitHub Pages** — web hosting

The project is primarily JavaScript-based and runs directly in the browser without a traditional backend server for the core game.

## 📁 Project Structure

```text
Rainbowdle/
├── index.html          # Main application and UI
├── style.css           # Main styling
├── script.js           # Application initialization
├── game.js             # Core Rainbowdle game logic
├── comparison.js       # Operator comparison logic
├── operators.js        # Operator roster/data
├── ui.js                # UI and screen management
├── quiz.js              # Learning-mode quiz
├── storage.js           # Local save data and statistics
├── pngs/                # Operator images/assets
├── js/                  # Additional JavaScript resources
└── supabase/
    └── schema.sql      # Supabase database schema
```

## 🚀 Running Locally

Rainbowdle is a client-side web project, so there is no complicated build process required.

### Option 1 — Open locally

Clone the repository and open `index.html` in a browser.

```bash
git clone https://github.com/SenterraSlays/Rainbowdle.git
cd Rainbowdle
```

For the best results, especially when testing online functionality, use a local web server instead of opening the HTML file directly.

### Option 2 — VS Code Live Server

If you use Visual Studio Code, install the **Live Server** extension and launch `index.html` with Live Server.

## 🌐 Deployment

The project can be hosted for free using **GitHub Pages**.

1. Push the project to GitHub.
2. Open the repository's **Settings**.
3. Go to **Pages**.
4. Set the source to the `main` branch.
5. Save the settings.
6. GitHub will publish the site.

## ☁️ Supabase

The `supabase/schema.sql` file contains the database schema used by Rainbowdle's online functionality.

If you are setting up the online features yourself, create a Supabase project and run the schema in the Supabase SQL editor. Configure the application's Supabase connection using the appropriate project URL and public client key.

**Never put a Supabase service-role key or other private server credentials in the browser code.**

## 🤝 Contributing

Suggestions, bug reports, and improvements are welcome!

If you find a problem, open an issue with:

- What happened
- What you expected to happen
- Steps to reproduce the issue
- Browser/device information if relevant

## ⚠️ Disclaimer

Rainbowdle is a fan-made project inspired by **Tom Clancy's Rainbow Six Siege**. It is not affiliated with, endorsed by, or sponsored by Ubisoft.

Rainbow Six Siege, its operators, names, imagery, and related intellectual property belong to their respective owners.

## 👤 Creator

Created by **SenterraSlays**.

⭐ If you enjoy the project, consider starring the repository!
