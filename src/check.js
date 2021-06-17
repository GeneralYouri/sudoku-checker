const assert = require('assert').strict;

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

    getValues(...indices) {
        return indices.map((x, y) => this.grid[y][x].value);
    }

    setValue(x, y, value) {
        this.grid[y][x].value = value;
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
        return this.#cells.map(cell => (cell instanceof Cell ? cell.value : cell.map(c => c.value)));
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
class RuleRegion extends RuleBase {
    name = 'region';
    isUniques = true;

    constructor(cells, size) {
        assert.ok(cells.length === size, 'A Region must contain all used symbols once each; to use an Incomplete Region, use a Killer Cage instead');
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
        assert.ok(cells.length >= 2, 'A sandwich requires at least two cells for the crust, even if the contents are empty');
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

// A clone must have identical cell values identical positions to its counterpart clone(s)
class RuleClone extends RuleBase {
    name = 'clone';

    constructor(cells) {
        assert.ok(cells.length > 1 && cells.every(clone => clone.length === cells[0].length), 'A clone is defined as multiple separate groups of cells, all of the same size');
        super(cells);
    }

    check() {
        return this.cellValues.every(clone => clone.every((cell, i) => cell === this.cellValues[0][i]));
    }
}

// An arrow's circle cell value must contain the sum of its arrow cell values
class RuleArrow extends RuleBase {
    name = 'arrow';
    isSum = true;
    sum = n => n === 2 * this.cellValues[0];

    constructor(cells) {
        super(cells);
    }
}

// A between line's circle values must contain both a value higher than, and a value lower than all cells on the line itself
class RuleBetweenLine extends RuleBase {
    name = 'between-line';

    constructor(cells) {
        assert.ok(cells.length >= 2, 'A between line requires at least two cells for the delimiter circles, line itself is empty');
        super(cells);
    }

    check() {
        const left = this.cellValues[0];
        const right = this.cellValues[this.cellValues.length - 1];
        return this.cellValues.slice(1, -1).every((cell, i) => Math.min(left, right) < cell && cell < Math.max(left, right));
    }
}

// A minimum cell value is smaller than all related cells
class RuleMinimum extends RuleBase {
    name = 'minimum';

    constructor(cells) {
        super(cells);
    }

    check() {
        return this.cellValues.slice(1).every(cell => this.cellValues[0] < cell);
    }
}

// A maximum cell value is larger than all related cells
class RuleMaximum extends RuleBase {
    name = 'maximum';

    constructor(cells) {
        super(cells);
    }

    check() {
        return this.cellValues.slice(1).every(cell => this.cellValues[0] > cell);
    }
}

// An XV clue between two cells indicates the exact sum of the two cell values
class RuleXV extends RuleBase {
    name = 'xv';
    isSum = true;

    constructor(cells, sum) {
        super(cells);
        this.sum = sum;
    }
}

// A quadruple must contain the given quadruple values in at least one of its relevant cells
class RuleQuadruple extends RuleBase {
    name = 'quadruple';

    constructor(cells, quadruple) {
        assert.ok(cells.length <= 4 && quadruple.length <= cells.length, 'By design, a quadruple can only span up to four cells and cannot contain more digits than it spans cells');
        super(cells);
        this.quadruple = quadruple;
    }

    check() {
        return this.quadruple.every(quad => this.cellValues.includes(quad));
    }
}

module.exports = Puzzle;



/** Test */
const size = 9;
const puzzle = new Puzzle(size);

// Normal sudoku rules
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
    puzzle.addRules(new RuleRegion(row, puzzle.size), new RuleRegion(col, puzzle.size), new RuleRegion(box, puzzle.size));
}

// Variant rules
puzzle.addRules(new RuleOdd([cells[2][3]])); // 1
puzzle.addRules(new RuleEven([cells[2][4]])); // 2
puzzle.addRules(new RuleThermometer([cells[1][1], cells[1][2], cells[2][1], cells[2][2]])); // 5689
puzzle.addRules(new RulePalindrome([cells[1][2], cells[2][3], cells[3][4]])); // 611
puzzle.addRules(new RuleKillerCage([cells[2][3], cells[2][4]], 3)); // 12
puzzle.addRules(new RuleLittleKiller([cells[0][3], cells[1][2], cells[2][1], cells[3][0]], 20)); // 4682
puzzle.addRules(new RuleSandwich([cells[0][2], cells[1][2], cells[2][2], cells[3][2], cells[4][2], cells[5][2], cells[6][2], cells[7][2], cells[8][2]], 1, 9, 11)); // 9471
puzzle.addRules(new RuleDifference([cells[2][3], cells[3][4]], 5)); // 61
puzzle.addRules(new RuleRatio([cells[2][1], cells[3][2]], 2)); // 84
puzzle.addRules(new RuleClone([[cells[1][2], cells[1][3], cells[2][3]], [cells[3][4], cells[3][5], cells[4][5]]])); // 671
puzzle.addRules(new RuleArrow([cells[2][2], cells[1][2], cells[0][1], cells[0][0]])); // 9621
puzzle.addRules(new RuleBetweenLine([cells[2][4], cells[2][5], cells[3][4], cells[3][3], cells[4][2]])); // 23657
puzzle.addRules(new RuleMinimum([cells[2][4], cells[1][4], cells[2][5], cells[3][4]])); // 2836
puzzle.addRules(new RuleMaximum([cells[2][1], cells[1][1], cells[2][0], cells[3][1]])); // 8573
puzzle.addRules(new RuleXV([cells[1][4], cells[2][4]], 10)); // 82
puzzle.addRules(new RuleQuadruple([cells[1][2], cells[1][3], cells[2][2], cells[2][3]], [9, 6])); // 6791



// Input sample grid
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
        puzzle.setValue(x, y, solution[y][x]);
    }
}

console.log(puzzle.check(puzzle));
