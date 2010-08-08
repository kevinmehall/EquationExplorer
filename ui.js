/* (C)2009 Kevin Mehall (http://kevinmehall.net)
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
function getColor(){
	return colors.pop()
}
function reuseColor(c){
	colors.push(c)
}

function Equation(eqn){
	this.color=getColor()
	this.image=null
	this.visible=true
	this.error=false
	this.m=1
	var e=this // so we can access `this` in closures where `this` is rebound to the element on which an event fired 

	
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
		if (equations.length<8) $('#add').show()
		reuseColor(this.color)
	}
	
	this.render=function(){
		this.image=null
		$(e.tile).find('.error').remove()
		this.error=false
		var v=this.input.val()
		if (this.visible && v.length){
			try{
				var f=compile_to_js_inequality(v, this.m)
				if (v.indexOf('m')!=-1){
					$(this.explorer).show()
				}else{
					$(this.explorer).hide()
				}
			}catch(err){
				$("<div class='error'></div>").text(err.message).appendTo(e.tile)
				$(e.tile).removeClass('active')
				this.error=true
				return
			}
        		this.image=graph(gp, f,this.color[0], this.color[1], this.color[2], 4)
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
	
	this.serialize=function(){
		s=$(this.input).val()
		if (s.indexOf('m')!=-1) s+='@'+this.m
		if (!this.visible) s="!"+s
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

function addEquation(eqn){
	var e=new Equation(eqn)
	equations.push(e)
	$(e.tile).hide()
	$('#add').before(e.tile)
	$(e.tile).fadeIn('slow')
	if (equations.length>=8) $('#add').hide()
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
	
	$('#add').click(function(){addEquation(); return false})
	bindInputToAttr($('#xmin'), gp, 'xmin', redrawAll)
	bindInputToAttr($('#xmax'), gp, 'xmax', redrawAll)
	bindInputToAttr($('#ymin'), gp, 'ymin', redrawAll)
	bindInputToAttr($('#ymax'), gp, 'ymax', redrawAll)
	$('#zoom-in').click(function(){zoom(-0.5)})
	$('#zoom-out').click(function(){zoom(0.5)})
	
    if (window.location.hash){
		loadState(decodeURI(window.location.hash.slice(1)))
    }else{
    	addEquation('x^2+y^2=m^2')
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
	var v=encodeURI(serializeAll())
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
	s=""
	for (var i=0; i<equations.length; i++){
		s+=equations[i].serialize()+'|'
	}
	s+='['+[gp.xmin,gp.xmax,gp.ymin,gp.ymax].join(',')+']'
	return s
}

function loadState(state){
	for (var i=0; i<equations.length; i++) equations[i].tile.remove()
	equations=[]
	var v=state.split('|')
	for (var i=0; i<v.length; i++){
		if (v[i].length>2 && v[i][0]=='['){
			var a=v[i].slice(1, -1).split(',')
			gp.xmin=parseFloat(a[0], 10)
			gp.xmax=parseFloat(a[1], 10)
			gp.ymin=parseFloat(a[2], 10)
			gp.ymax=parseFloat(a[3], 10)
			$('#xmin').val(gp.xmin)
			$('#xmax').val(gp.xmax)
			$('#ymin').val(gp.ymin)
			$('#ymax').val(gp.ymax)
		}else if (v[i]) addEquation(v[i])
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
