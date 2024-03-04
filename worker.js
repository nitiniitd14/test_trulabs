const { parentPort } = require('worker_threads');
const config = require('./config');

function getRandom(max) {
    return Math.floor(Math.random() * max);
}


function getRandomMax(array){
    let randomMax = 1;
    for (let i = 0; i < array.length; i++){
        randomMax *= array[i].length;   
    }
    return randomMax
}


function generateBoard(numRows, numReels, reels) {
    const randomNumber = Math.floor(Math.random() * getRandomMax(reels)) // We will use only one random seed and generate stops for all reels
    let tempNumber = randomNumber;
    let board = [];
    for (let i = 0; i < numReels; i++) {
        const reel = reels[i]
        const reelLength = reel.length;
        const idx = tempNumber % reelLength;
        let stops = [];
        for (let j = 0; j < numRows; j++) {
            stops.push(reel[(idx + j) % reelLength]);
        }
        board.push(stops);
        tempNumber = Math.floor(tempNumber / reelLength);
    }
    return board 
}

function evaluateGrid(grid, lines, paytable) {
    let data = {
        winlines: [],
        totalWin: 0
    };
    const wild = config.wildCode;
    for (const line of lines) {
        let sym = grid[0][line[0]];
        let oak = 1;
        let wild_oak = 1;
        let win = 0;
        let winline = {
            line: line.join()
        }
        for (let i = 1; i < line.length; i++){
            let newSym = grid[i][line[i]];
            if (sym == wild){
                if (newSym === wild) {
                    wild_oak += 1;
                }
                else {
                    sym = newSym;
                    oak += 1
                }
            }
            else if (newSym === sym || newSym === wild){
                oak += 1;
            }
            else{
                break;
            }
        }
        const wildPay = paytable[wild][wild_oak];
        const symPay = paytable[sym][oak]
        if (wildPay >= symPay){
            win += wildPay;
            oak = wild_oak;
            sym = wild;
        }
        else {
            win += symPay;
        }
        winline.symbol = sym;
        winline.oak = oak;
        winline.win = win;
        data.winlines.push(winline)
        data.totalWin += win;
    }
    return data
}


function Round() {
    let roundData = {
        gameBoard: [],
        totalWin: 0
    }
    const board = generateBoard(config.numRows, config.numReels, config.reels);
    const evalResults = evaluateGrid(board, config.lines, config.paytable);
    roundData.gameBoard = board;
    roundData.winlines = evalResults.winlines;
    roundData.totalWin = evalResults.totalWin;
    return roundData;
}


parentPort.once('message', (task) => {
    const { simCount, winCombinations } = task; // Receive pre-calculated winCombinations
    payCombinations = winCombinations; // Directly use the received data
    let totalOut = 0;
    let totalIn = 0;
    for (let i = 0; i < task.simCount; i++) {
        const roundResult = Round();
        totalIn += config.coinRatio;
        totalOut += roundResult.totalWin;
    }
    parentPort.postMessage({ totalOut, totalIn }); // Correctly send back calculated values
});