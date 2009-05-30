function make_parse(){
	var symbol_table = {};
	var token;
	var tokens;

	var original_symbol = {
	    nud: function () {
	        error("Undefined.", this);
	    },
	    led: function (left) {
	        error("Missing operator.", this);
	    }
	};

	var symbol = function (id, bp) {
	    var s = symbol_table[id];
	    bp = bp || 0;
	    if (s) {
	        if (bp >= s.lbp) {
	            s.lbp = bp;
	        }
	    } else {
	        s = Object.create(original_symbol);
	        s.id = s.value = id;
	        s.lbp = bp;
	        symbol_table[id] = s;
	    }
	    return s;
	};

	symbol("(end)");
	
	
	var itself = function () {
		return this;
	};
	
	var jux_mult=function(left){
		return {value:'*', arity:'binary', first:left, second:this}
	}
	
	symbol("(name)", 60).nud = itself;
	symbol("(name)").led=jux_mult;
	
	symbol("(literal)", 60).nud = itself;
	symbol("(literal)").led=jux_mult;

	var advance = function (id) {
	    var a, o, t, v;
	    if (id && token.id !== id) {
	        error("Expected '" + id + "'.", token);
	    }
	    if (token_nr >= tokens.length) {
	        token = symbol_table["(end)"];
	        return;
	    }
	    t = tokens[token_nr];
	    token_nr += 1;
	    v = t.value;
	    a = t.type;
	    if (a === "name") {
	        o = symbol_table["(name)"];
	    } else if (a === "operator") {
	        o = symbol_table[v];
	        if (!o) {
	            error("Unknown operator.", t);
	        }
	    } else if (a ===  "number") {
	        a = "literal";
	        o = symbol_table["(literal)"];
	    } else {
	        error("Unexpected token.", t);
	    }
	    token = Object.create(o);
	    token.value = v;
	    token.arity = a;
	    return token;
	};

	var expression = function (rbp) {
	    var left;
	    var t = token;
	    advance();
	    left = t.nud();
	    while (rbp < token.lbp) {
	        t = token;
	        advance();
	        left = t.led(left);
	    }
	    return left;
	}

	var infix = function (id, bp, led) {
	    var s = symbol(id, bp);
	    s.led = led || function (left) {
	        this.first = left;
	        this.second = expression(bp);
	        this.arity = "binary";
	        return this;
	    };
	    return s;
	}

	infix("+", 50);
	infix("-", 50);
	infix("*", 60);
	infix("/", 60);
	infix("^", 70);

	infix("=", 40);
	infix("<", 40);
	infix("<=", 40);
	infix(">", 40);
	infix(">=", 40);
	
	symbol("(").nud = function () {
	    var e = expression(0);
	    advance(")");
	    return e;
	}
	
	symbol("(", 60).led = function(left){
		var e = expression(0);
	    advance(")");
		if (fns[left.value]){
			left.arity='function';
			left.arg=e;
			return left;
		}else return {value:'*', arity:'binary', first:left, second:e}
	}
	
	symbol(")");

	
    return function (source) {
        tokens = source.tokens('=<>/+-*%^()xy');
        token_nr = 0;
        advance();
        var s = expression(0);
        advance("(end)");
        return s;
    };
}

function to_sexp(v){
	if (v.arity=='literal' || v.arity=='number' || v.arity=='name') return v.value
	else if (v.arity=='binary') 
		return '('+v.value+' '+to_sexp(v.first)+' '+to_sexp(v.second)+')';
	else if (v.arity=='function')
		return '('+v.value+' '+to_sexp(v.arg)+')';
}


function to_js(exp, bound_vars, free_vars, fns){
	function exp_to_js(v){
		if (v.arity=='literal' || v.arity=='number') return v.value
		if (v.arity=='name'){
			if (bound_vars.indexOf(v.value)!=-1) return v.value
			if (free_vars[v.value]!==undefined) return free_vars[v.value]
			else error('Undefined variable or constant', v)
		}
		else if (v.arity=='binary'){
			if (v.value=='^') 
				return 'Math.pow('+exp_to_js(v.first)+','+exp_to_js(v.second)+')'
			else 
				return '('+exp_to_js(v.first)+' '+v.value+' '+exp_to_js(v.second)+')';
		}else if (v.arity=='function')
			if (fns[v.value])
				return fns[v.value]+'('+' '+exp_to_js(v.arg)+')';
			else error('Undefined function: '+v.value, v)
	}
	return exp_to_js(exp)
}

fns = {
	'sin':'Math.sin',
	'cos':'Math.cos',
	'tan':'Math.tan',
	'round':'Math.round',
	'sqrt':'Math.sqrt',
	'abs':'Math.abs',
	'ln':'Math.log',
	'atan': 'Math.atan',
	'acos': 'Math.acos',
	'asin': 'Math.asin',
}

constants = {
	'pi':'Math.PI',
	'e':'Math.E',
}

parse = make_parse()

function compile_to_js_inequality(equation){
	var parts=equation.split('=')
	if (parts.length==1) 
		eval('function f(x, y){ return (y<'+
		to_js(parse(parts[0]), ['x', 'y'], constants, fns)
		+')}')
	else eval('function f(x, y){ return ('+
		to_js(parse(parts[0]), ['x', 'y'], constants, fns)
		+'<'+
		to_js(parse(parts[1]), ['x', 'y'], constants, fns)
		+')}')
	return f
}
