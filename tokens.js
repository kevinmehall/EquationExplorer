// tokens.js
// 2007-08-05

// (c) 2006 Douglas Crockford

// Produce an array of simple token objects from a string.
// A simple token object contains these members:
//      type: 'name', 'string', 'number', 'operator'
//      value: string or number value of the token


if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

error = function (message, t) {
    t.name = "SyntaxError";
    t.message = message;
    throw t;
};



String.prototype.tokens = function (spliton) {
    var c;                      // The current character.
    var from;                   // The index of the start of the token.
    var i = 0;                  // The index of the current character.
    var length = this.length;
    var n;                      // The number value.
    var q;                      // The quote character.
    var str;                    // The string value.

    var result = [];            // An array to hold the results.

    var make = function (type, value) {

// Make a token object.

        return {
            type: type,
            value: value,
            from: from,
            to: i

        };
    };

// Begin tokenization. If the source string is empty, return nothing.

    if (!this) {
        return;
    }

    if (typeof spliton !== 'string') {
        spliton = '/+-*';
    }


// Loop through this text, one character at a time.

    c = this.charAt(i);
    while (c) {
        from = i;

// Ignore whitespace.

        if (c <= ' ') {
            i += 1;
            c = this.charAt(i);

// number.
        } else if (c=='.' || (c >= '0' && c <= '9')) {
            str = c;
            i += 1;

// Look for more digits.

            for (;;) {
                c = this.charAt(i);
                if (c < '0' || c > '9') {
                    break;
                }
                i += 1;
                str += c;
            }

// Look for a decimal fraction part.

            if (c === '.') {
                i += 1;
                str += c;
                for (;;) {
                    c = this.charAt(i);
                    if (c < '0' || c > '9') {
                        break;
                    }
                    i += 1;
                    str += c;
                }
            }

// Look for an exponent part.

            if (c === 'e' || c === 'E') {
                i += 1;
                str += c;
                c = this.charAt(i);
                if (c === '-' || c === '+') {
                    i += 1;
                    str += c;
                }
                if (c < '0' || c > '9') {
                    error("Bad exponent", make('number', str));
                }
                do {
                    i += 1;
                    str += c;
                    c = this.charAt(i);
                } while (c >= '0' && c <= '9');
            }

// Convert the string value to a number. If it is finite, then it is a good
// token.

            n = +str;
            if (isFinite(n)) {
                result.push(make('number', n));
            } else {
                error("Bad number",  make('number', str));
            }
            
        // name.

        } else if (spliton.indexOf(c) == -1) {
            str = c;
            i += 1;
            for (;;) {
                c = this.charAt(i);
                if (spliton.indexOf(c) == -1 && c>'9') {
                    str += c;
                    i += 1;
                } else break;
            }
            result.push(make('name', str));    

        } else {
            i += 1;
            if ((c <= 'z' && c >= 'a') || (c <= 'Z' && c >= 'A'))
            	result.push(make('name', c));
            else result.push(make('operator', c));
            c = this.charAt(i);
        }
    }
    return result;
};


