const Coord = function(xParam, yParam) {
    var x = xParam;
    var y = yParam;
    var update = function(a, b) {
        x = a;
        y = b;
    };
    var toString = function() {
        return 'o0(' + x + ',' + y + ')0o        ';
    };
    var getX = function() {
        return x;
    };
    var getY = function() {
        return y;
    };
    return {
        getX: getX,
        getY: getY,
        update: update,
        toString: toString,
    }
};
export default Coord;