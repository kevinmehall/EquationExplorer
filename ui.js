/* (C)2016 Kevin Mehall (http://kevinmehall.net) and Keegan Mehall
 * Licensed under the terms of the GNU GPLv2 or greater
 * This file is part of EquationExplorer (http://labs.kevinmehall.net/equationexplorer/
 */

/* EquationExplorer user interface */

Array.prototype.remove = function(elem) {  
	var index = this.indexOf(elem)
	if (index !== -1) {this.splice(index, 1)}
}

function bindInputToAttr(input, o, attr, callback){
	$(input).change(function(){
		o[attr]=parseFloat($(input).val(), 10)
		callback()
	})
}

gp={
	aa:64.0,
	width:600,
	height:600,
	xmin:-10,
	xmax:10,
	ymin:-10,
	ymax:10,
}
equations=[]

colors=[
	[255, 0, 255],
	[128, 0, 255],
	[0, 0, 255],
	[0, 255, 255],
	[0, 255, 0],
	[220, 220, 0],
	[255, 128, 0],
	[255, 0, 0],
]

vectorExample = true
parametricExample = true
implicitExample = true

function getColor(){
	return colors.pop()
}

//Vector
function compile_vector_function(equation, m){
	c=Object.create(constants)
	c.m=m
	eval('function f(x, y, i, j){ return ('+
		to_js(parse(equation), ['x', 'y', 'i', 'j'], c, fns)
		+')}')
	return function(x,y){
		return [f(x,y,1,0), f(x,y,0,1)]
	}
}

function draw_vector_field(gp, fn, r, g, b, scale){
	var canvas=document.createElement('canvas');
	canvas.width=gp.width;
	canvas.height=gp.height;
	var ctx = canvas.getContext('2d');
	ctx.strokeStyle='rgb('+r+','+g+','+b+')'

	var xstretch = (gp.xmax-gp.xmin)/gp.width
	var ystretch = (gp.ymax-gp.ymin)/gp.height

	ctx.scale(1.0/xstretch, -1.0/ystretch)
	ctx.translate(-gp.xmin, -gp.ymax)
	ctx.lineWidth = 2*(gp.xmax-gp.xmin)/gp.width



	for (var x=gp.xmin; x<=gp.xmax; x+= (gp.xmax-gp.xmin)/20){
		for (var y=gp.ymin; y<=gp.ymax; y+= (gp.ymax-gp.ymin)/20){
			var pt = fn(x,y)
			if (!(pt[0] || pt[1])) continue
			ctx.beginPath()
			ctx.moveTo(x, y)
			ctx.lineTo(x+pt[0]*scale, y+pt[1]*scale)
			ctx.stroke()
			ctx.save()
			ctx.translate(x+pt[0]*scale, y+pt[1]*scale)
			ctx.scale(xstretch, ystretch)
			ctx.rotate(Math.atan2(pt[1] * xstretch, pt[0]* ystretch))
			ctx.lineWidth=2
			ctx.moveTo(-6, 3)
			ctx.lineTo(0, 0)
			ctx.lineTo(-6, -3)
			ctx.stroke()
			ctx.restore()
		}
	}
	return canvas
}

//Parametric
function compile_parametric_function(equation, m){
	c=Object.create(constants)
	c.m=m
	eval('function f(t, i, j){ return ('+
		to_js(parse(equation), ['t', 'i', 'j'], c, fns)
		+')}')
	return function(t){
		return [f(t,1,0), f(t,0,1)]
	}
}

function draw_parametric_graph(gp, fn, r, g, b, tmin, tmax){
    
	var canvas=document.createElement('canvas');
	canvas.width=gp.width;
	canvas.height=gp.height;
	var ctx = canvas.getContext('2d');
	ctx.strokeStyle='rgb('+r+','+g+','+b+')'

	var xstretch = (gp.xmax-gp.xmin)/gp.width
	var ystretch = (gp.ymax-gp.ymin)/gp.height

	ctx.scale(1.0/xstretch, -1.0/ystretch)
	ctx.translate(-gp.xmin, -gp.ymax)
	ctx.lineWidth = 4*(gp.xmax-gp.xmin)/gp.width

	var step = (tmax-tmin)/10000;

	ctx.beginPath()
	if(step !== 0){
		for (var t=tmin; t<=tmax; t+=step){
			var pt = fn(t)
			ctx.lineTo(pt[0], pt[1])
		}
	}
	ctx.stroke()
	return canvas
}



function reuseColor(c){
	colors.push(c)
}

function Equation(eqn, type, window){
	this.color=getColor()
	this.image=null
	this.visible=true
	this.error=false
	this.m=1
	var e=this // so we can access `this` in closures where `this` is rebound to the element on which an event fired 
	this.type = type;

	
	this.tile=$("<div class='equation-tile'></div>")
		.css('border-color', 'rgb('+this.color[0]+','+this.color[1]+','+this.color[2]+')' )
	
	this.visibilitybtn=$("<div title='Show/Hide' class='btn visibility'>&nbsp;</div>")
		.appendTo(this.tile)
		.click(function(){
			e.visible=!e.visible
			if (e.visible) $(e.tile).removeClass('invisible')
			else $(e.tile).addClass('invisible')
			redraw()
		})
	
	this.input=$(" <input class='equation' id='equation' type='text' value='' autocomplete='off' />")
		.appendTo($(this.tile))
		.keyup(function(evt){
			var charCode = (evt.which) ? evt.which : event.keyCode
			if (	charCode == 8 // backspace
			  || (charCode >= 46 && charCode <= 90) // alphanum
			  || (charCode >= 96 && charCode <= 111) // numpad
			  || (charCode == 187 || charCode == 189 || charCode == 191) // equals, minus, slash
			  ){
				
				if (e.timer) clearTimeout(e.timer)
				e.timer=setTimeout(function(){e.render(); redraw()}, 500)
				$(e.tile).addClass('active')
			}
		})
	
	this.removebtn=$("<div title='Remove' class='btn remove'>&nbsp;</div>")
		.appendTo(this.tile)
		.click(function(){e.pre_remove(); return false})
	
	
	this.explorer=$("<div class='explorer'></div>")
		.hide()
		.appendTo(this.tile)
		
	this.exp_down=$("<div title='Decrease m' class='btn exp-down'>&nbsp;</div>")
		.appendTo(this.explorer)
		.click(function(){
			e.set_m(e.m-1)
		})
		
	$(this.explorer).append(" m=")
	this.exp_show=$("<input type='text' class='exp-show' value='1'/>")
		.appendTo(this.explorer)
		.change(function(){
			e.set_m(parseInt($(e.exp_show).val(), 10))	
		})
	
	this.exp_up=$("<div title='Increase m' class='btn exp-up'>&nbsp;</div>").appendTo(this.explorer)
		.click(function(){
			e.set_m(e.m+1)
		}) 
		
	if (type !== 'implicit'){
		this.equation_settings=$("<div class='equation_settings'></div>")
			.appendTo(this.tile)
		if (type === 'vector'){
			e.scale = window;
			$(this.equation_settings).append("scale=")
			this.scale_input = $("<input type='text' value='"+e.scale+"'0.1'/>")
				.appendTo(this.equation_settings)
				.change(function(){
					e.scale=parseFloat($(e.scale_input).val())
					e.image=null
					redraw()	
				})
		}
		if (type === 'parametric'){
			e.tmin = window[0];
			e.tmax = window[1];
			$(this.equation_settings).append("tmin=")
			this.tmin_input = $("<input type='text' value='"+e.tmin+"'/>")
				.appendTo(this.equation_settings)
				.change(function(){
					e.tmin=parseFloat($(this).val())
					e.image=null
					redraw()	
				})
			$(this.equation_settings).append("tmax=")
			this.tmax_input = $("<input type='text' value='"+e.tmax+"'/>")
				.appendTo(this.equation_settings)
				.change(function(){
					e.tmax=parseFloat($(this).val())
					e.image=null
					redraw()	
				})
			
		}
	}
	
	//begin temporary identifier
	this.type_label = $("<div class='equation_settings'></div>")
		.appendTo(this.tile)
	$(this.equation_settings).append(type)
	//end temporary identifier
	
	this.pre_remove=function(){
		var fade=$(this.tile).clone()
		var cancel=false
		$(this.tile).hide().after(fade)
		$(fade).empty().addClass('removing').fadeTo(6000, 0.01, function(){
			if (cancel) return
			$(fade).hide(500, function(){
				$(fade).remove()
			})
			e.remove()
		})
		$("<a href='javascript: return false'>Undo removal</a>").appendTo($(fade)).click(function(){
			cancel=true
			equations.push(e)
			$(fade).remove()
			$(e.tile).show()
			redraw()
		})
		equations.remove(this)
		redraw()
	}
	
	this.remove=function(){
		$(this.tile).remove()
		this.e=this.tile=this.visibilitybtn=this.input=this.removebtn=null
		equations.remove(this)
		if (spaceAvailable() === 1){
			$('#add-implicit').show();
		} else if(spaceAvailable() === 2){
			$('#add-implicit').show();
			$('#add-vector').show();
			$('#add-parametric').show();
		}
		
		reuseColor(this.color)
	}
	
	this.render=function(){
		this.image=null
		$(e.tile).find('.error').remove()
		this.error=false
		var v=this.input.val()
		
		if (v.indexOf('m')!=-1){
			$(this.explorer).show()
		}else{
			$(this.explorer).hide()
		}
		
		if (this.visible && v.length){
			try{
				if (type === 'vector'){
					var fn = compile_vector_function(v, this.m)
					this.image = draw_vector_field(gp, fn, this.color[0], this.color[1], this.color[2], this.scale)
				}else if (type === 'parametric'){
				var fn = compile_parametric_function(v, this.m)
				this.image = draw_parametric_graph(gp, fn, this.color[0], this.color[1], this.color[2], this.tmin, this.tmax)
				}else {
					var f=compile_to_js_inequality(v, this.m)
					this.image=graph(gp, f,this.color[0], this.color[1], this.color[2], 4)
				}
			}catch(err){
				$("<div class='error'></div>").text(err.message).appendTo(e.tile)
				$(e.tile).removeClass('active')
				this.error=true
				return
			}
   
        	}
    		$(e.tile).removeClass('active')
	}
	
	this.isVisible=function(){
		return this.visible && !this.error
	}
	
	this.set_m=function(val, rd){
		this.m=val
		this.exp_show.val(val)
		this.image=null
		if (rd!==false) redraw()
	}
	
	this.serialize = function(){
		s = type.charAt(0) + '|';
		if (!this.visible) s += '!';
		s += $(this.input).val()
		if ($(this.input).val().indexOf('m')!=-1) s+='@'+this.m
		if(type === 'parametric'){
			s += '|' + '['+this.tmin+','+this.tmax+']';
		} else if(type === 'vector'){
			s += '|' + this.scale;
		}
		
		return s
	}
	
	if (eqn){
		if (eqn[0]=='!'){
			this.visible=false
			eqn=eqn.slice(1)
			$(this.tile).addClass('invisible')
		}
		eqn=eqn.split('@')
		if (eqn.length>1){
			this.set_m(parseInt(eqn[1], 10), false)
		}
		this.input.val(eqn[0])
	}
}

var spaceAvailable = function(){ //0 if no space, 1 if space for implicit, 2 if space for any
	if(equations.length < 5){
		return 2;
	}
	if(equations.length >= 8){
		return 0;
	}
	var numberImplicit = 0;
	for(var i = 0; i<equations.length; i++){
		if(equations[i].type === 'implicit'){
			numberImplicit += 1
		} 
	}
	var spaceIndex = 24 - (equations.length*4 - numberImplicit);
	if(spaceIndex >= 4){
		return 2;
	}
	if(spaceIndex === 3){
		return 1;
	}
	return 0;
}

function addEquation(eqn, type, window){
	if (type === 'implicit'){
		if(implicitExample === true && !eqn){
			eqn = 'x^2+y^2=m^2@5'
			implicitExample = false
		}
		if(!window){
			window = 0.1; // actually the scale
		}
	}
	if (type === 'vector'){
		if(vectorExample === true && !eqn){
			eqn = 'xi+yj'
			vectorExample = false
		}
		if(!window){
			window = 0.1; // actually the scale
		}
	}
	if (type === 'parametric'){
		if(parametricExample === true && !eqn){
			eqn = 't(i*sin(t)+j*cos(t))'
			parametricExample = false
		}
		if(!window){
			window = [0,10]; //tmin, tmax
		}	
	}
	var e=new Equation(eqn, type, window)
	equations.push(e)
	$(e.tile).hide()
	$('#add-implicit').before(e.tile)
	$(e.tile).fadeIn('slow')
	if (spaceAvailable() === 0){
		$('#add-implicit').hide();
		$('#add-vector').hide();
		$('#add-parametric').hide();
	} else if(spaceAvailable() === 1){
		$('#add-vector').hide();
		$('#add-parametric').hide();
	}
	redraw()
	return false
}

$(function(){
	setTimeout(analytics, 1000)
	canvas = document.getElementById('canvas')
	ctx = canvas.getContext('2d')
	
	if (ctx.createImageData || ctx.getImageData){
		$('#wrap').show()
		$('#browsererror').hide()
		$('#loading').hide()
	}else{
		$('#browsererror').show()
		$('#loading').hide()
		return
	}
	
	$('#add-implicit').click(function(){addEquation('', 'implicit'); return false})
	$('#add-vector').click(function(){addEquation('', 'vector'); return false})
	$('#add-parametric').click(function(){addEquation('', 'parametric'); return false})
	bindInputToAttr($('#xmin'), gp, 'xmin', redrawAll)
	bindInputToAttr($('#xmax'), gp, 'xmax', redrawAll)
	bindInputToAttr($('#ymin'), gp, 'ymin', redrawAll)
	bindInputToAttr($('#ymax'), gp, 'ymax', redrawAll)
	$('#zoom-in').click(function(){zoom(-0.5)})
	$('#zoom-out').click(function(){zoom(0.5)})
	
    if (window.location.hash){
		loadState(decodeURI(window.location.hash.slice(1))		)
    }else{
    	addEquation('x^2+y^2=m^2', 'implicit')
    	equations[0].set_m(5, false)
    	redraw()
    }
})

function redraw(){
	ctx.clearRect(0,0,gp.width,gp.height)
	drawGrid(ctx, gp)
	
	for (var i=0; i<equations.length; i++){
		if (equations[i].isVisible()){
			if (!equations[i].image) equations[i].render()
			if (equations[i].image) ctx.drawImage(equations[i].image, 0, 0, gp.width, gp.height)
		}
	}
	var v = encodeURI(serializeAll())
	window.location.hash = v;
	$('#linkto').attr('href', '#'+v)
}

function redrawAll(){
	for (var i=0; i<equations.length; i++){
    	equations[i].render()
    }
    redraw()
}


function calcScale(scale, val){
	var v=Math.pow(10, Math.round((Math.log(Math.abs(val))/Math.LN10+scale)*10)/10)
	return (val<0)?-1*v:v;
}

function zoom(scale){
	gp.xmin=calcScale(scale, gp.xmin)
	gp.xmax=calcScale(scale, gp.xmax)
	gp.ymin=calcScale(scale, gp.ymin)
	gp.ymax=calcScale(scale, gp.ymax)
	redrawAll()
	$('#xmin').val(gp.xmin)
	$('#xmax').val(gp.xmax)
	$('#ymin').val(gp.ymin)
	$('#ymax').val(gp.ymax)
}

function serializeAll(){	
	s='['+[gp.xmin,gp.xmax,gp.ymin,gp.ymax].join(',')+']'
	for (var i=0; i<equations.length; i++){
		s+= '&';
		s+=equations[i].serialize()
	}
	return s
}

function loadState(state){
	if(state.charAt(0) !== '['){
		//Convert old url hash to new url hash
		var vOld = state.split('|');
		var newState = vOld[vOld.length - 1];
		for(var i = 0; i<vOld.length-1; i++){
			newState += '&';
			newState += 'i' + '|' + vOld[i];
		}
		state = newState;
		location.hash = state;
	}
	
	var v=state.split('&')
	
	for (var i=0; i<equations.length; i++) equations[i].tile.remove()
	equations=[]
	
	var a=v[0].slice(1, -1).split(',');
	gp.xmin=parseFloat(a[0], 10);
	gp.xmax=parseFloat(a[1], 10);
	gp.ymin=parseFloat(a[2], 10);
	gp.ymax=parseFloat(a[3], 10);
	$('#xmin').val(gp.xmin);
	$('#xmax').val(gp.xmax);
	$('#ymin').val(gp.ymin);
	$('#ymax').val(gp.ymax);
	
	
	for (var i=1; i<v.length; i++){
		if (v[i]) {
			var type;
			var window;
			var visible = true;
			var x = v[i].split('|')
			if(x[0] === 'i'){
				type = 'implicit';
				window = null;
			}else if(x[0] === 'v'){
				type = 'vector';
				window = parseFloat(x[2]);
			}else if(x[0] === 'p'){
				type = 'parametric';
				window = x[2].slice(1, -1).split(',');
				for(var j = 0; j<window.length;j++){
					window[j] = parseFloat(window[j]);
				}
			}
			
			addEquation(x[1], type, window);
		}
	}
	redraw()
}

function analytics(){
	var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
	$(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E")).appendTo($('body'))
	setTimeout(
	function(){
	var pageTracker = _gat._getTracker("UA-7069941-3");
	pageTracker._trackPageview();
	}, 4000)
}
