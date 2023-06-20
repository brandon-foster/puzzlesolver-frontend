import Coord from './Coord.js';
const Square = function(idParam, xParam, yParam) {
    var id = idParam;
    var coord = new Coord(xParam, yParam);
    var getId = function() {
        return id;
    };
    var getCoord = function() {
        return coord;
    };
    var toString = function() {
        return id + '[' + getCoord().getX() + '.' + getCoord().getY() + ']        ';
    }
    return {
        getId: getId,
        getCoord: getCoord,
        toString: toString,
    }
};
export default Square;