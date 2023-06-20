import { p } from './utils.js';
import { DELIMETER_FOR_REQUEST_ARG, PATH_TYPE_SOLUTION, QUEUE_STRATEGY_PRIORITY_QUEUE } from './constants.js';
import Square from './Square.js';
import Coord from './Coord.js';
import Solver from './Solver.js';
import World from './World.js';
$(function() {
    var makeRandomState = function() {
        var nums = [];
        for (var i = 0; i < 16; i++) {
            nums.push(i);
        }
        var stateArray = [];
        for (var i = 0; i < 16; i++) {
            var randIndex = Math.floor(Math.random() * (16 - i));
            var selectedNum = nums[randIndex];
            stateArray.push(selectedNum);
            var removedElem = nums.splice(randIndex, 1);
        }
        return stateArray;
    };
    var setUpKeydownListener = function(world) {
        $(document).keydown(world.handleKey);
    }
    function swapTwoElements(arr) {
        var newArray = [];
        for (var i = 0; i < arr.length; i++) {
            newArray[i] = arr[i];
        }
        newArray[0] = arr[1];
        newArray[1] = arr[0];
        return newArray;
    }
    var setUpGenerateRandomStateButtonListener = function(world) {
        $('#generateRandomState').click(function clickGenerateRandomStateButton() {
            var stateArray = makeRandomState();
            // $('#stateString').val(stateArray.join(','));
            world.performUpdate(stateArray);
        });
    };
    var setUpSolveButtonListener = function(world) {
        $('#solve').click(function clickSolveButton() {
            world.isSolvable().then(function(solvable) {
                world.solve().then(function(i) {
                    var num = i + 1;
                    $('#alert-solvability').css('visibility', 'visible');
                    $('#generateRandomState').prop('disabled', false);
                    $('#alert-solvability').removeClass('alert-warning');
                    $('#alert-solvability').removeClass('alert-primary');
                    $('#alert-solvability').addClass('alert-success');
                    $('#alert-solvability').html('<p>Completed in ' + num + ' steps.</p>');
                    $('#alert-solvability').attr('hidden', false);
                });
            });
        });
    };
    function Grid() {
        var stateString = 'empty state string';
        var gridArray = [];
        var hole = null;
        initializeGridArray();
        function initializeGridArray() {
            for (var i = 0; i < 4; i++) {
                gridArray[i] = [];
                for (var j = 0; j < 4; j++) {
                    gridArray[i][j] = 0;
                }
            }
        }
        var toString = function() {
            var tiles = this.getTiles();
            var string = '';
            var counter = 0;
            for (var i = 0; i < tiles.length; i++) {
                string += tiles[i].toString()
                if (counter == 3) {
                    string += '\n';
                    counter = 0;
                }
                else {
                    counter++;
                }
            }
            return string;
        };
        var getStateString = function() {
            var tiles = this.getTiles();
            var stateString = '';
            for (var i = 0; i < tiles.length; i++) {
                if (i == tiles.length - 1) {
                    stateString += tiles[i].getId();
                }
                else {
                    stateString += tiles[i].getId() + ',';
                }
            }
            return stateString;
        };
        var setStateString = function(stateStringP) {
            stateString = stateStringP;
            var nums = stateString.split(DELIMETER_FOR_REQUEST_ARG);
            if (nums != null && nums.length == 16) {
                var numsIndex = 0;
                for (var i = 0; i < 4; i++) {
                    for (var j = 0; j < 4; j++) {
                        var s = new Square(nums[numsIndex], j, i);
                        installSquare(s, s.getCoord().getX(), s.getCoord().getY());
                        if (s.getId() == 0) {
                            hole = s;
                        }
                        numsIndex++;    
                    }
                }
            }
        };
        function getHole() {
            return hole;
        }
        function installSquare(squareParam, xParam, yParam) {
            gridArray[xParam][yParam] = squareParam;
        };
        var getTiles = function() {
            var squares = [];
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    squares.push(gridArray[j][i]);
                }
            }
            return squares;
        };
        function setSquareToNewLocation(square, x, y) {
            square.getCoord().update(x, y);
            gridArray[x][y] = square;
        }
        function isWithinBoundary(coord) {
            if (coord.getX() >= 0 && coord.getX() <= 3) {
                if (coord.getY() >= 0 && coord.getY() <= 3) {
                    return true;
                }
            }
            return false;
        }
        function getCoordOfNeighborToThe(direction) {
            var hX = getHole().getCoord().getX();
            var hY = getHole().getCoord().getY();
            var coord = new Coord(null, null);
            switch (direction) {
                case 'left':
                    coord.update(hX - 1, hY);
                    break;
                case 'up':
                    coord.update(hX, hY - 1);
                    break;
                case 'right':
                    coord.update(hX + 1, hY);
                    break;
                case 'down':
                    coord.update(hX, hY + 1);
                    break;
                default:
                    return null;
            }
            if (isWithinBoundary(coord)) {
                return coord;
            }
            else {
                return null;
            }
        }
        var getSquareById = function(id) {
            for (var i = 0; i < gridArray.length; i++) {
                for (var j = 0; j < gridArray[i].length; j++) {
                    var s = gridArray[i][j];
                    if (s.getId() == id) {
                        return s;
                    }
                }
            }
        }
        var swapSquares = function(id1, id2) {
            var s1 = getSquareById(id1);
            var s2 = getSquareById(id2);
            var s1x = s1.getCoord().getX();
            var s1y = s1.getCoord().getY();
            setSquareToNewLocation(s1, s2.getCoord().getX(), s2.getCoord().getY());
            setSquareToNewLocation(s2, s1x, s1y);
            return new Promise(function(resolve) {
                var squares = { s1, s2 };
                resolve(squares);
            });
        }
        function fillHoleWithTheSquareToThe(direction, resolve) {
            var selectedNeighborCoord = getCoordOfNeighborToThe(direction);
            if (selectedNeighborCoord != null) {
                var selectedSquare = gridArray[selectedNeighborCoord.getX()][selectedNeighborCoord.getY()];
                setSquareToNewLocation(selectedSquare, getHole().getCoord().getX(), getHole().getCoord().getY());
                setSquareToNewLocation(getHole(), selectedNeighborCoord.getX(), selectedNeighborCoord.getY())
                resolve(selectedSquare);
            }
        }
        var transitionHole = function(direction) {
            return new Promise(function(resolve) {
                fillHoleWithTheSquareToThe(direction, resolve);
            });
        };
        return {
            toString: toString,
            getStateString: getStateString,
            setStateString: setStateString,
            getTiles: getTiles,
            transitionHole: transitionHole,
            getHole: getHole,
            getSquareById: getSquareById,
            swapSquares: swapSquares,
        };
    }
    $(document).ready(function() {
        var pathType = PATH_TYPE_SOLUTION;
        var queueStrategy = QUEUE_STRATEGY_PRIORITY_QUEUE;
        var randomState = makeRandomState();
        var randomStateString = randomState.join(',');
        var solver = new Solver(pathType, queueStrategy);
        solver.retrieveIsSolvable(randomStateString)
            .then(function(isSolvable) {
                if (!isSolvable) {
                    console.log('not solvable: ' + randomStateString);
                    randomState = swapTwoElements(randomState);
                    randomStateString = randomState.join(',');
                    console.log('new state string: ' + randomStateString);
                    console.log('outer new state string: ' + randomStateString);
                    console.log(randomState);
                    console.log(randomStateString);      
                }
                var grid = new Grid();
                var world = new World(grid, solver);
                world.configure(randomStateString, pathType, queueStrategy);
                world.drawGrid();
                setUpKeydownListener(world);
                setUpGenerateRandomStateButtonListener(world);
                setUpSolveButtonListener(world);
                $('#generateRandomState').focus();
                $('#spinner').css('visibility', 'hidden');
            });
    });
});