class Debug {
    static COLORS = {
        '0': '\x1b[30m',
        '1': '\x1b[34m',
        '2': '\x1b[32m',
        '3': '\x1b[36m',
        '4': '\x1b[31m',
        '5': '\x1b[35m',
        '6': '\x1b[33m',
        '7': '\x1b[37m',
        '8': '\x1b[90m',
        '9': '\x1b[94m',
        'a': '\x1b[92m',
        'b': '\x1b[96m',
        'c': '\x1b[91m',
        'd': '\x1b[95m',
        'e': '\x1b[93m',
        'f': '\x1b[97m',
        'r': '\x1b[0m'
    };

    static format(text) {
        return text.replace(/&([0-9a-fr])/gi, (_, code) => this.COLORS[code.toLowerCase()] || '') + '\x1b[0m';
    }

    static good(message) {
        console.log(this.format(`&a[ GOOD ] &r${message}`));
    }

    static warn(message) {
        console.log(this.format(`&e[ WARN ] &r${message}`));
    }

    static error(message) {
        console.log(this.format(`&c[ ERRO ] &r${message}`));
    }
}

module.exports = Debug