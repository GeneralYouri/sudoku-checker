
class RuleBase {
    name = ''

    // Rule properties
    uniques = false
    sum = false

    // Cells
    #cells
    get cellCount() {
        return this.#cells.length;
    }

    constructor(cells) {
        this.#cells = cells;
    }

    // Iterate cell values
    forEachCell(callback) {
        for (let i = 0; i < this.#cells.length; i += 1) {
            const [x, y] = this.#cells[i];
            const cell = solution[y][x];
            callback(cell, [x, y]);
        }
    }

    // Perform enabled property checks
    check(solution) {
        if (this.uniques && !this.checkUniques(solution)) {
            return false;
        }
        if (this.sum !== false && !this.checkSum(solution)) {
            return false;
        }
        return true;
    }

    // Check whether all cells have unique values
    checkUniques(solution) {
        const values = new Set();
        this.forEachCell(cell => values.add(cell));
        return values.size === this.cellCount;
    }

    // Check whether the cell values sum to the given number
    checkSum(solution) {
        let sum = 0;
        this.forEachCell(cell => sum += cell);
        return typeof(this.sum) === 'function' ? this.sum(sum) : sum === this.sum;
    }
}

// A region must contain exactly one of each symbol used in the puzzle
// TODO: Add a construction check that the number of cells is correct, which depends on the puzzle and not the solution
class RuleRegion extends RuleBase {
    name = 'region'
    uniques = true

    constructor(cells) {
        super(cells);
    }
}

// An odd cell must contain an odd value
class RuleOdd extends RuleBase {
    name = 'odd'
    sum = n => n % 2 === 1

    constructor(cells) {
        super(cells);
    }
}

// An even cell must contain an even value
class RuleEven extends RuleBase {
    name = 'even'
    sum = n => n % 2 === 0

    constructor(cells) {
        super(cells);
    }
}

// A Thermometer's cell values must strictly increase along the thermometer
class RuleThermometer extends RuleBase {
    name = 'thermometer'

    constructor(cells) {
        super(cells);
    }

    check(solution) {
        const values = [0];
        this.forEachCell(cell => values.push(cell));
        return values.every((value, i) => value === 0 || values[i - 1] < value);
    }
}

// A palindrome's cells must read the same way forwards and backwards
// So the first and last digit must be the same, the second and second-to-last digit must be the same, etc.
class RulePalindrome extends RuleBase {
    name = 'palindrome'

    constructor(cells) {
        super(cells);
    }

    check(solution) {
        let result = true;
        // this.forEachCell((cell, i) => cell ===);
        return result;
    }
}

// A killer cage must contain unique values, and its values must sum to the given number
class RuleKillerCage extends RuleBase {
    name = 'killer-cage'
    uniques = true
    sum = true

    constructor(cells, sum) {
        super(cells);
        this.sum = sum;
    }
}

const check = (puzzle, solution) => {
    return puzzle.rules.every(rule => rule.check(solution));
};

module.exports = check;



const puzzle = {
    size: 9,
};

const rules = [];
for (let y = 0; y < puzzle.size; y += 1) {
    const row = [];
    const col = [];
    const box = [];
    for (let x = 0; x < puzzle.size; x += 1) {
        row.push([x, y]);
        col.push([y, x]);
        box.push([(3 * y) % 9 + x % 3, 3 * Math.floor(y / 3) + Math.floor(x / 3)]);
    }
    rules.push(new RuleRegion(row), new RuleRegion(col), new RuleRegion(box));
}
rules.push(new RuleOdd([[0,0]]));
rules.push(new RuleKillerCage([[0,0],[1,0]], 3));
puzzle.rules = rules;

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

console.log(check(puzzle, solution));
