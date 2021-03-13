const { readFileSync } = require('fs');
const clc = require("cli-color");

if (process.argv[2] == null || process.argv[3] == null || process.argv[4] == null) {
    console.log("Usage:");
    console.log("> node generate.js [words_number] [width] [height]");
    console.log("");
    process.exit(1);
}

const dictionary = readFileSync('words_ru.txt').toString().replace(/\r\n/g,'\n').split('\n');

const fieldW = parseInt(process.argv[3]);
const fieldH = parseInt(process.argv[4]);
const wordCount = Math.min(parseInt(process.argv[2]), dictionary.length, fieldW, fieldH);
const maxWordLength = Math.min(fieldW-2, fieldH-2);

// Load dictionary
const field = Array(fieldH).fill(' ').map(() => Array(fieldW).fill(' '));

// Random words
const words = [];
for (let i = 0; i < dictionary.length * 10; i++) {
    const word = dictionary[random(0, dictionary.length-1)];
    // select words that are not longer than field size-1 (otherwise words will not fit into the field)
    if (word.length <= maxWordLength) {
        // make sure we not selected the same word twice
        if (words.filter(s => s.includes(word)).length === 0) {
            words[words.length] = word;
        }
    }
    if (words.length >= wordCount) {
        break;
    }
}

// Place words on the field
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
printField(field);

function printField(field) {
    process.stdout.write(clc.erase.screen);
    for (let y = 0, i = 0; y < field.length; y++) {
        for (let x = 0; x < field[y].length; x++) {
            process.stdout.write("  " + field[y][x].toUpperCase());
        }
        process.stdout.write("        ");
        process.stdout.write(words[y] ? words[y].toUpperCase() : '');
        process.stdout.write('\n');
    }
}

function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}