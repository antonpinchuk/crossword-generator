const { readFileSync } = require('fs');
const clc = require("cli-color");

if (process.argv[2] == null || process.argv[3] == null || process.argv[4] == null) {
    console.log("Usage:");
    console.log("> node generate.js [words_number] [width] [height]");
    console.log("");
    process.exit(1);
}

const COLOR_CODES = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 108, 174, 222, 186, 44, 215, 69, 229];
const COLOR_BG = 0;
const COLOR_TEXT = 15;
const COLOR_TEXT_GREY = 8;

// Load dictionary
const dictionary = readFileSync('words_ru.txt').toString().replace(/\r\n/g,'\n').split('\n');

const fieldW = parseInt(process.argv[3]);
const fieldH = parseInt(process.argv[4]);
const wordCount = Math.min(parseInt(process.argv[2]), dictionary.length, fieldW, fieldH);
const maxWordLength = Math.min(fieldW-2, fieldH-2);

// Build field
const field = Array(fieldH).fill(null).map(() => Array(fieldW).fill(' '));
const fieldColor = Array(fieldH).fill(null).map(() => Array(fieldW).fill(null));

// Random words
const words = [];
const wordsColor = [];
for (let i = 0; i < dictionary.length * 10; i++) {
    const word = dictionary[random(0, dictionary.length-1)];
    // select words that are not longer than field size-1 (otherwise words will not fit into the field)
    if (word.length <= maxWordLength) {
        // make sure we not selected the same word twice
        if (words.filter(s => s.includes(word)).length === 0) {
            words[words.length] = word;
            wordsColor[wordsColor.length] = clc.xterm(COLOR_CODES[wordsColor.length % COLOR_CODES.length]).bgXterm(COLOR_BG);
        }
    }
    if (words.length >= wordCount) {
        break;
    }
}

// Place words on the field
const INTERCEPT_COLOR_FUNC = clc.xterm(COLOR_TEXT).bgXterm(COLOR_BG);
const directions = [ [1, 0], [1, 1], [0, 1] ];
let filledCount = 0;
for (let i = 0; i < words.length; ) {
    // random position and direction
    const direction = directions[random(0, 2)];
    const rX = random(0, fieldW - words[i].length);
    const rY = random(0, fieldH - words[i].length);
    if (rX < 0 || rY < 0) {
        continue;
    }
    // check field availability (no intersection with other words)
    // TODO: encourage words to intercept more often
    let x = rX, y = rY;
    let isIntersect = false;
    for (let j = 0; j < words[i].length; j++) {
        if (field[y][x] !== ' ' && field[y][x] !== words[i].charAt(j)) {
            isIntersect = true;
            break;
        }
        x += direction[0];
        y += direction[1];
    }
    if (isIntersect) {
        continue;
    }
    // place word
    x = rX; y = rY;
    for (let j = 0; j < words[i].length; j++) {
        field[y][x] = words[i].charAt(j);
        fieldColor[y][x] = fieldColor[y][x] === null ? wordsColor[i] : INTERCEPT_COLOR_FUNC;
        filledCount++;
        x += direction[0];
        y += direction[1];
    }
    i++;
}

// Fill the rest of the field with random letters
// bellow code fills remain gaps on the field, but leave `fieldW` number of cells empty
// because random() function takes time to find a single gap on a huge filled field
while (filledCount <= fieldW * (fieldH-1)) {
    const word = dictionary[random(0, dictionary.length-1)];
    for (let i = 0; i < word.length; i++) {
        let x, y;
        do {
            x = random(0, fieldW-1);
            y = random(0, fieldH-1);
        } while (field[y][x] !== ' ');
        field[y][x] = word.charAt(i);
        filledCount++;
    }
}
// fill remain `fieldW` number of cells
let lastWord = "";
do {
    lastWord += dictionary[random(0, dictionary.length-1)];
} while (lastWord.length <= fieldW);
for (let y = 0, i = 0; y < field.length; y++) {
    for (let x = 0; x < field[y].length; x++) {
        if (field[y][x] === ' ') {
            field[y][x] = lastWord.charAt(i++);
            filledCount++;
        }
    }
}

// Print field
printField(false);

// Press any key
const stdin = process.stdin;
stdin.setRawMode( true );
stdin.resume();
stdin.on('data', function(key) {
    // Print suggestions and exit
    printField(true);
    process.exit();
});


function printField(showSuggestion) {
    const DEFAULT_COLOR_FUNC = showSuggestion ?
            clc.xterm(COLOR_TEXT_GREY).bgXterm(COLOR_BG) :
            clc.xterm(COLOR_TEXT).bgXterm(COLOR_BG);
    process.stdout.write(clc.erase.screen);
    for (let y = 0, i = 0; y < field.length; y++) {
        for (let x = 0; x < field[y].length; x++) {
            const color = showSuggestion && fieldColor[y][x] !== null ? fieldColor[y][x] : DEFAULT_COLOR_FUNC;
            process.stdout.write(color("  "));
            process.stdout.write(color(field[y][x].toUpperCase()));
        }
        if (words[y]) {
            const color = showSuggestion ? wordsColor[y] : DEFAULT_COLOR_FUNC;
            process.stdout.write("        ");
            process.stdout.write(color(words[y].toUpperCase()));
        }
        process.stdout.write('\n');
    }
}

function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}