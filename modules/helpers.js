const moment = require('moment');

const or = function (a,b) {
    return a || b;
};

const eq = function (a, b) {
    return a === b;
};

const gt = function (a, b) {
    return a > b;
};

const and = function(a,b) {
    return a && b;
}

const compareIds = function (a, b) {
    if (!a || !b) return false;
    return a.toString() === b.toString();
};

const neq = function (a, b) {
    return a != b;
};

const inc = function (a) {
    return a + 1;
};

const dec = function (a) {
    return a - 1;
};

const formatDate = function (date) {
    if (!date) return '';
    return moment(date).format('DD-MM-YYYY');
};

const formatTime = function (timestamp) {
    if (!timestamp) return '';
    return moment(timestamp).format('D MMM YYYY [at] h:mm A');
};

const browserDate = function (dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const resizeCloudinaryUrl = function (url, template) {
    if (!url) return '/static/images/no-image-placement.png';
    return url.replace('/upload/', `/upload/${template}/`);
};

const capitalizeFirstLetter = function (str) {
    if (typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const lowerCaseFirstLetter = function (str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
};

const findInArray = function (array, item) {
    if (array && Array.isArray(array) && array.includes(item)) {
        return true;
    } else {
        return false;
    }
};

const getFirstTwoLetters = function (name) {
    if (!name) return '';
    const words = name.trim().split(' ');
    const firstLetters = words
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase());
    return firstLetters.join('');
};

const arrayToCsv = function (array) {
    return array.join(', ');
};

const getKey = function (obj) {
    return Object.keys(obj)[0];
};

const getValue = function (obj) {
    return Object.values(obj)[0];
};

const timeDaysAgo = function (timestamp) {
    const now = moment();
    const date = moment(timestamp);

    const seconds = now.diff(date, 'seconds');
    const minutes = now.diff(date, 'minutes');
    const hours = now.diff(date, 'hours');
    const days = now.diff(date, 'days');

    if (seconds < 60) return 'few seconds ago';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return `${days} days ago`;
};

const timeAgo = function (timestamp) {
    const now = moment();
    const date = moment(timestamp);

    const seconds = now.diff(date, 'seconds');
    const minutes = now.diff(date, 'minutes');
    const hours = now.diff(date, 'hours');
    const days = now.diff(date, 'days');

    if (seconds < 60) return 'few seconds ago';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return date.format('DD MMM YYYY');
};

const camelCaseToNormalString = function (string) {
    if (typeof string !== 'string') return;
    string = string ? string : '';
    return string
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (str) => str.toUpperCase());
};

const kebabCaseToNormalString = function (string) {
    string = string ? string : '';
    return string
        .split('-') 
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) 
        .join(' '); 
};

const camelCaseWithCommaToNormalString = function (string) {
    string = string ? string : '';
    return string
        .split(',')
        .map((part) =>
            part
                .trim()
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/^./, (str) => str.toUpperCase()),
        )
        .join(', ');
};

const startsWith = function (str, prefix) {
    if (!str || !prefix) return false;
    return str.toString().startsWith(prefix.toString());
}

const includes = function(str, substring) {
    if (!str || !substring) return false;
    return str.toString().includes(substring.toString());
};

const lte = function(a, b) {
    return a <= b;
};

const regexMatch = function (value, pattern) {
    let regex = new RegExp(pattern);
    return regex.test(value);
};

const json = function (value) {
    return JSON.stringify(value);
};

const expiresOn = (createdAt, months) => {
    if (!createdAt || !months || months <= 0) {
        throw new Error('Invalid input: createdAt and months must be valid');
    }
    return moment(createdAt).add(months, 'months').format('DD-MM-YYYY');
};

const truncate = (value, maxLength) => {
    if (value === null || value === undefined) return '';
    const text = value.toString();
    const limit = Number(maxLength) || 0;
    if (!limit || text.length <= limit) return text;
    return `${text.slice(0, limit)}...`;
};

module.exports = { 
    or,
    eq,
    gt,
    and,
    compareIds,
    inc,
    dec,
    formatDate,
    formatTime,
    browserDate,
    resizeCloudinaryUrl,
    neq,
    capitalizeFirstLetter,
    lowerCaseFirstLetter,
    findInArray,
    getFirstTwoLetters,
    arrayToCsv,
    getKey,
    getValue,
    timeAgo,
    timeDaysAgo,
    camelCaseToNormalString,
    kebabCaseToNormalString,
    camelCaseWithCommaToNormalString,
    regexMatch,
    json,
    expiresOn,
    startsWith,
    lte,
    includes,
    truncate,
};
