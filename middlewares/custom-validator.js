const validator = require('express-validator');

const expressValidator = validator();

module.exports = expressValidator({
customValidators: {
    isImage: function(value, filename) {

        const extension = (path.extname(filename)).toLowerCase();
        switch (extension) {
            case '.jpg':
                return '.jpg';
            case '.jpeg':
                return '.jpeg';
            case  '.png':
                return '.png';
            default:
                return false;
        }
    }
}});