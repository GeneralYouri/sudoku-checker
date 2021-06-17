
/** Main Puzzle class, controls the grid and all relevant rule instances */
class Puzzle {
    size;
    grid;
    rules;

    constructor(size) {
        this.size = size;
        this.grid = Array.from(Array(this.size)).map(() => Array.from(Array(this.size)).map(() => new Cell()));
        this.rules = [];
    }

    addRules(...rules) {
        this.rules.push(...rules);
    }

    check() {
        return this.rules.every(rule => {
            console.log(rule.name, rule.check(puzzle.grid));
            return rule.check(puzzle.grid);
        });
    }
}

// Wrapper for cell values to allow passing by reference
class Cell {
    value = undefined;
}

//
class RuleBase {
    name = '';

    // Rule properties
    isUniques = false;
    isSum = false;
    isRelation = false;

    // Cells
    #cells;
    get cellCount() {
        return this.#cells.length;
    }
    get cellValues() {
        return this.#cells.map(cell => cell.value);
    }

    constructor(cells) {
        this.#cells = cells;
    }

    // Perform enabled property checks
    check() {
        if (this.isUniques && !this.checkUniques()) {
            return false;
        }
        if (this.isSum !== false && !this.checkSum()) {
            return false;
        }
        if (this.isRelation !== false && !this.checkRelation()) {
            return false;
        }
        return true;
    }

    // Check whether all cells have unique values
    checkUniques() {
        const values = new Set(this.cellValues);
        return values.size === this.cellCount;
    }

    // Check whether the cell values sum to the given number
    checkSum() {
        const sum = this.cellValues.reduce((acc, cell) => acc + cell, 0);
        return (this.sum instanceof Function ? this.sum(sum) : sum === this.sum);
    }

    // Check whether the given relation holds between every pair of cell values
    checkRelation() {
        return this.cellValues.every((value, i) => i === 0 || this.relation(this.cellValues[i - 1], value));
    }
}

// A region must contain exactly one of each symbol used in the puzzle
// TODO: Add a construction check that the number of cells is correct, which depends on the puzzle and not the solution
class RuleRegion extends RuleBase {
    name = 'region';
    isUniques = true;

    constructor(cells) {
        super(cells);
    }
}

// An odd cell must contain an odd value
class RuleOdd extends RuleBase {
    name = 'odd';
    isSum = true;
    sum = n => n % 2 === 1;

    constructor(cells) {
        super(cells);
    }
}

// An even cell must contain an even value
class RuleEven extends RuleBase {
    name = 'even';
    isSum = true;
    sum = n => n % 2 === 0;

    constructor(cells) {
        super(cells);
    }
}

// A thermometer's cell values must strictly increase along the thermometer
class RuleThermometer extends RuleBase {
    name = 'thermometer';
    isRelation;
    relation = (a, b) => a < b;

    constructor(cells) {
        super(cells);
    }
}

// A palindrome must have identical first and last cell values, identical second and second-to-last cell values, etc
class RulePalindrome extends RuleBase {
    name = 'palindrome';

    constructor(cells) {
        super(cells);
    }

    check() {
        return this.cellValues.every((value, i) => value === this.cellValues[this.cellValues.length - 1 - i]);
    }
}

// A killer cage must contain unique values, and its values must sum to the given number
class RuleKillerCage extends RuleBase {
    name = 'killer-cage';
    isUniques = true;
    isSum = true;
    sum;

    constructor(cells, sum) {
        super(cells);
        this.sum = sum;
    }
}

// A little killer diagonal's values must sum to the given number
class RuleLittleKiller extends RuleBase {
    name = 'little-killer';
    isSum = true;
    sum;

    constructor(cells, sum) {
        super(cells);
        this.sum = sum;
    }
}

// A sandwich looks at the lowest and highest cell value, the values between these extremities must sum to the given number
class RuleSandwich extends RuleBase {
    name = 'sandwich';
    minSymbol = undefined;
    maxSymbol = undefined;
    sum;

    constructor(cells, minSymbol, maxSymbol, sum) {
        super(cells);
        this.minSymbol = minSymbol;
        this.maxSymbol = maxSymbol;
        this.sum = sum;
    }

    check() {
        const min = this.cellValues.indexOf(this.minSymbol);
        const max = this.cellValues.indexOf(this.maxSymbol);
        const sum = this.cellValues.slice(Math.min(min, max) + 1, Math.max(min, max)).reduce((acc, cell) => acc + cell, 0);
        return sum === this.sum;
    }
}

// A difference clue between two cells indicates the exact absolute value difference between the two cell values
class RuleDifference extends RuleBase {
    name = 'difference';
    isRelation = true;
    relation = (a, b) => a - b === this.difference || b - a === this.difference;
    difference;

    constructor(cells, difference) {
        super(cells);
        this.difference = difference;
    }
}

// A ratio clue between two cells indicates the exact absolute value ratio between the two cell values
class RuleRatio extends RuleBase {
    name = 'ratio';
    isRelation = true;
    relation = (a, b) => a * this.ratio === b || b * this.ratio === a;
    ratio;

    constructor(cells, difference) {
        super(cells);
        this.ratio = difference;
    }
}

// A ratio clue between two cells indicates the exact absolute value ratio between the two cell values
class RuleRatio extends RuleBase {
    name = 'ratio';
    isRelation = true;
    relation = (a, b) => a * this.ratio === b || b * this.ratio === a;
    ratio;

    constructor(cells, difference) {
        super(cells);
        this.ratio = difference;
    }
}

module.exports = Puzzle;



/** Test */
const puzzle = new Puzzle(9);

const cells = puzzle.grid;
for (let y = 0; y < puzzle.size; y += 1) {
    const row = [];
    const col = [];
    const box = [];
    for (let x = 0; x < puzzle.size; x += 1) {
        row.push(cells[y][x]);
        col.push(cells[x][y]);
        box.push(cells[3 * Math.floor(y / 3) + Math.floor(x / 3)][(3 * y) % 9 + x % 3]);
    }
    puzzle.addRules(new RuleRegion(row), new RuleRegion(col), new RuleRegion(box));
}
puzzle.addRules(new RuleOdd([cells[2][3]])); // 1
puzzle.addRules(new RuleEven([cells[2][4]])); // 2
puzzle.addRules(new RuleThermometer([cells[1][1], cells[1][2], cells[2][1], cells[2][2]])); // 5689
puzzle.addRules(new RulePalindrome([cells[1][2], cells[2][3], cells[3][4]])); // 611
puzzle.addRules(new RuleKillerCage([cells[2][3], cells[2][4]], 3)); // 12
puzzle.addRules(new RuleLittleKiller([cells[0][3], cells[1][2], cells[2][1], cells[3][0]], 20)); // 4682
puzzle.addRules(new RuleSandwich([cells[0][2], cells[1][2], cells[2][2], cells[3][2], cells[4][2], cells[5][2], cells[6][2], cells[7][2], cells[8][2]], 1, 9, 11)); // 9471
puzzle.addRules(new RuleDifference([cells[2][3], cells[3][4]], 5)); // 61
puzzle.addRules(new RuleRatio([cells[2][1], cells[3][2]], 2)); // 84



const solution = [
    [1,2,3,4,5,6,7,8,9],
    [4,5,6,7,8,9,1,2,3],
    [7,8,9,1,2,3,4,5,6],
    [2,3,4,5,6,7,8,9,1],
    [5,6,7,8,9,1,2,3,4],
    [8,9,1,2,3,4,5,6,7],
    [3,4,5,6,7,8,9,1,2],
    [6,7,8,9,1,2,3,4,5],
    [9,1,2,3,4,5,6,7,8],
];

for (let y = 0; y < puzzle.size; y += 1) {
    for (let x = 0; x < puzzle.size; x += 1) {
        puzzle.grid[y][x].value = solution[y][x];
    }
}

console.log(puzzle.check(puzzle));
