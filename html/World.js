import { p } from './utils.js';
import { ANIMATION_DURATION, ANIMATION_DURATION_FOR_SWAP } from './constants.js';
const World = function(gridP, solverP) {
    var grid = gridP;
    var solver = solverP;
    var setUpSwapTilesClickListener = function() {
        var $firstSquare = null;
        var $secondSquare = null;
        $('.square').on('click', function clickSquare() {
            var $square = $(this);
            $square.addClass('highlighted-square');
            if ($firstSquare == null) {
                $firstSquare = $(this);
            }
            else {
                $secondSquare = $(this);
                swapSquares($firstSquare.attr('data-square-id'), $secondSquare.attr('data-square-id'))
                    .then(function(message) {
                        $firstSquare.removeClass('highlighted-square');
                        $secondSquare.removeClass('highlighted-square');
                        $firstSquare = null;
                        $secondSquare = null;
                        isSolvable();
                        // solver.determineIsSolvable(grid);
                    });
            }
        });
    }
    function appendTile(square) {
        if (square.getId() != 0) {
            $('#lot #tile-container').append('<div id="' + square.getId() + '" class="square text-center" data-square-id=' + square.getId() + ' ><span class="square-text">' + square.getId() + '</span></div>');
        }
    }
    function completedMoveSquareVisually(id, resolve) {
        resolve(id);
    }
    function moveSquareVisually(id, x, y, animate, duration = null) {
        return new Promise(function(resolve) {
            var newTop = y * 42;
            var newLeft = x * 42;
            var durationVal = ANIMATION_DURATION;
            if (duration != null) {
                durationVal = duration;
            }
            if (animate == true) {
                $('#' + id).animate({
                    'top': newTop,
                    'left': newLeft,
                }, {
                    duration: durationVal,
                    easing: 'linear',
                    queue: true,
                    complete: function() {
                        completedMoveSquareVisually(id, resolve);
                    }
                });    
            }
            else {
                $('#' + id).css({
                    'top': newTop,
                    'left': newLeft,
                });
            }
        });
    }
    var toString = function() {
        string = 'World:\n';
        string += '----grid:----\n';
        string += grid.toString();
        string += '----solver:----\n';
        string += solver.toString();
        return string;
    };
    var drawGrid = function() {
        $('#lot #tile-container').html('');
        var squares = grid.getTiles();
        for (var i = 0; i < squares.length; i++) {
            var s = squares[i];
            appendTile(s);
            moveSquareVisually(s.getId(), s.getCoord().getX(), s.getCoord().getY(), false);
        }
        setUpSwapTilesClickListener();
    };
    var configure = function(stateStringP, pathTypeP, queueStrategyP) {
        grid.setStateString(stateStringP);
        solver.setPathType(pathTypeP);
        solver.setQueueStrategy(queueStrategyP);
    };
    function delay(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    }
    var swapSquares = function(s1, s2) {
        return new Promise(function(resolve) {
            grid.swapSquares(s1, s2)
                .then(function(squares) {
                    var newS1 = squares.s1;
                    var newS2 = squares.s2;
                    const prom1 = moveSquareVisually(newS1.getId(), newS1.getCoord().getX(), newS1.getCoord().getY(), true, ANIMATION_DURATION_FOR_SWAP);
                    const prom2 = moveSquareVisually(newS2.getId(), newS2.getCoord().getX(), newS2.getCoord().getY(), true, ANIMATION_DURATION_FOR_SWAP);
                    Promise.all([prom1, prom2])
                        .then(function() {
                            delay(200)
                                .then(function() {
                                    resolve('swapping visually is completed');
                                });    
                        });
                });
        });
    };
    function doTransitionAt(i, list, resolve) {
        var size = list.length;
        grid.transitionHole(list[i]).then(function(squareToMove) {
            moveSquareVisually(squareToMove.getId(), squareToMove.getCoord().getX(), squareToMove.getCoord().getY(), true)
                .then(function() {
                    return new Promise(function(res) {
                        setProgress((i + 1)/size * 100, res);
                    });
                })
                .then(function() {
                    i++;
                    if (i < list.length) {
                        doTransitionAt(i, list, resolve);
                    }
                    else {
                        resolve(i);
                    }
                });
        });
    }
    function performSolve() {
        return new Promise(function(resolve) {
            solver.retrieveSteps(grid)
                .then(function(directionList) {
                    doTransitionAt(0, directionList, resolve);
                });
        });
    }
    var solve = function() {
        $('#solve').prop('disabled', true);
        return new Promise(function(resolve) {
            performSolve()
                .then(function(count) {
                    console.log('done with doTransition()ing');
                    resolve(count);
                });
        });
    };
    var performUpdate = function(stateArray) {
        setProgress(0);
        grid.setStateString(stateArray.join(','));
        isSolvable()
            .then(function() {
                drawGrid();
            });
    };
    function doTask(fn) {
        return new Promise(function(resolve) {
            fn(resolve);
        });
    }
    var setProgress = function(percent, resolve) {
        if (!$('#progress-bar').hasClass('progress-bar-animated')) {
            $('#progress-bar').addClass('progress-bar-animated');
        }
        doTask(function(res) {
            $('#progress-bar').css('width', percent + '%');
            res('width set to ' + percent);
        }).then(function() {
                doTask(function(res) {
                    $('#progress-bar').attr('aria-valuenow', percent);
                    res('aria-valuenow set to ' + percent);
                });
            })
            .then(function() {
                if (percent == 100) {
                    $('#progress-bar').removeClass('progress-bar-animated');
                }
                if (resolve !== undefined) {
                    resolve(percent);    
                }
            });
    }
    function updateSolveButton(isSolvable) {
        $('#solve').prop('disabled', !isSolvable);
    }
    function updateUiAlert(isSolvable) {
        var $alertElem = $('#alert-solvability');
        var htmlText = isSolvable ? '<p>Solvable.</p>' : '<p>Generated an unsolvable puzzle.</p><p><strong>Tap any two values to make it solvable.</strong><p class="emoji text-center">&#128515;</p></p>';
        var classesToRemove = [];
        var classToAdd = '';
        if (isSolvable === true) {
            classesToRemove = ['alert-warning', 'alert-success'];
            classToAdd = 'alert-primary';
        }
        else {
            classesToRemove = ['alert-primary', 'alert-success'];
            classToAdd = 'alert-warning';
        }
        for (var i = 0; i < classesToRemove.length; i++) {
            $alertElem.removeClass(classesToRemove[i]);
        }
        $alertElem.addClass(classToAdd);
        $alertElem.html(htmlText);
        $alertElem.css('visibility', 'visible');
    }
    function doUiThings(isSolvable) {
        updateUiAlert(isSolvable);
        $('#spinner').css('visibility', 'hidden');
        $('#tile-container').css('visibility', 'visible');
        $('#generateRandomState').prop('disabled', false);
        updateSolveButton(isSolvable);
    }
    var  isSolvable = async function() {
        $('#alert-solvability').css('visibility', 'hidden');
        $('#tile-container').css('visibility', 'hidden');
        $('#spinner').css('visibility', 'visible');
        $('#generateRandomState').prop('disabled', true);
        $('#solve').prop('disabled', true);

        return new Promise(function (resolve) {
            solver.retrieveIsSolvable(grid.getStateString())
                .then(function(data) {
                    doUiThings(data);
                    resolve(data);
                });    
        });
    };
    function handleKey(event) {
        function isArrowKey(key) {
            return (key >= 37) && (key <= 40);
        }
        function isSolveKey(key) {
            return key == 83;
        }
        function isConfigureKey(key) {
            return key == 67;
        }
        function getArrowDirection(key) {
            var arrowDirection = '';
            switch (key) {
                case 37:
                    arrowDirection = 'left';
                    break;
                case 38:
                    arrowDirection = 'up';
                    break;
                case 39:
                    arrowDirection = 'right';
                    break;
                case 40:
                    arrowDirection = 'down';
                    break;
                default:
                    arrowDirection = 'not an arrow key';
                    break;
            }
            return arrowDirection;
        }
        function getOppositeDirection(arrowDirection) {
            var holeDirection = '';
            switch (arrowDirection) {
                case 'left':
                    holeDirection = 'right';
                    break;
                case 'up':
                    holeDirection = 'down';
                    break;
                case 'right':
                    holeDirection = 'left';
                    break;
                case 'down':
                    holeDirection = 'up';
                    break;
                default:
                    holeDirection = 'not an arrow direction';
            }
            return holeDirection;
        }
        switch(true) {
            case isArrowKey(event.which):
                var arrowDirection = getArrowDirection(event.which);
                var directionToMoveHole = getOppositeDirection(arrowDirection);
                var directionList = [directionToMoveHole];
                doTransitionAt(0, directionList)
                break;
            case isSolveKey(event.which):
                break;
            case isConfigureKey(event.which):
                break;
            default:
                break;
        }
    }
    setUpSwapTilesClickListener();
    return {
        toString: toString,
        drawGrid: drawGrid,
        configure: configure,
        solve: solve,
        handleKey: handleKey,
        swapSquares: swapSquares,
        setUpSwapTilesClickListener: setUpSwapTilesClickListener,
        performUpdate: performUpdate,
        setProgress: setProgress,
        isSolvable: isSolvable,
    }
};
export default World;