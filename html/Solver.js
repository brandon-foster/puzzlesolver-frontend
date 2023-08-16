const Solver = function(pathTypeP, queueStrategyP) {
    var pathType = pathTypeP;
    var queueStrategy = queueStrategyP;
    var toString = function() {
        string = 'Solver:\n';
        string += 'pathType: ' + pathType + '\n';
        string += 'queueStrategy: ' + queueStrategy + '\n';
        return string;
    }
    var setPathType = function(pt) {
        pathType = pt;
    };
    var setQueueStrategy = function(qs) {
        queueStrategy = qs;
    }
    var requestSteps = function(stateString) {
        return new Promise(function(resolve) {
            var queryParamValue = pathType + ',' + queueStrategy + ',' + 'Q' + ',' + stateString;
            var url = '/psapi/puzzlesolver';
            var data = {
                'initial-state': queryParamValue,
            };
            function success(data) {
                var directionList = [];
                var lines = data.path.split('\n');
                for (var i = 1; i < lines.length; i++) {
                    var step = lines[i];
                    var pieces = step.split(' ');
                    if (pieces[2] != null) {
                        var direction = pieces[2];
                        directionList.push(direction);
                    }
                }
                resolve(directionList);
            }
            var dataType = 'json';
            $.ajax({
                url: url,
                data: data,
                success: success,
                dataType: dataType,
            });    
        });
    };
    var requestIsSolvable = function(stateString) {
        return new Promise(function(resolve) {
            var queryParamValue = pathType + ',' + queueStrategy + ',' + 'Q' + ',' + stateString;
            var url = '/psapi/puzzle-is-solvable';
            var data = {
                'initial-state': queryParamValue,
            };
            function successFn(data) {
                console.log('stateString: ' + stateString);
                console.log('solvable? ' + data);
                resolve(data);
            }
            function errorFn(xhr, status) {
                $('#spinner').css('visibility', 'hidden');
                var message = 'requestIsSolvable ajax failed: ' + status;
                $('#alert-solvability').addClass('alert-danger');
                $('#alert-solvability').html(message);
            }
            var dataType = 'json';
            $.ajax({
                url: url,
                data: data,
                success: successFn,
                error: errorFn,
                dataType: dataType,
            });
        });
    }
    var performStateTransition = function(swapDirection, viaSolve) {
        if (viaSolve != null && viaSolve === true) {
            return new Promise(function(resolve) {
                resolve(swapDirection);
            });    
        }
    };
    var doStep = function(i, grid, directionList) {
        performStateTransition(directionList[i], true).then(function(swapDirection) {
            i++;
            if (i < directionList.length) {
                doStep(i, grid, directionList);
            }
        });
    }
    var retrieveSteps = async function(grid) {
        var stateString = grid.getStateString();
        return requestSteps(stateString)
            .then(function(directionList) {
                return directionList;
            });
    };
    var retrieveIsSolvable = async function(stateString) {
        return requestIsSolvable(stateString).then(function(data) {
            return data;
        })
    }
    return {
        toString: toString,
        setPathType: setPathType,
        setQueueStrategy: setQueueStrategy,
        retrieveSteps: retrieveSteps,
        retrieveIsSolvable: retrieveIsSolvable,
    }
};
export default Solver;