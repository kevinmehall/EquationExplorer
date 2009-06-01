Array.prototype.remove = function(elem) {  
	var index = this.indexOf(elem);    
	if (index !== -1) {this.splice(index, 1);}
}

function bindInputToAttr(input, o, attr, callback){
	$(input).change(function(){
		o[attr]=parseFloat($(input).val(), 10)
		callback()
	})
}

ctx=null

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
	[255, 0, 0],
	[255, 128, 0],
	[220, 220, 0],
	[0, 255, 0],
	[0, 255, 255],
	[0, 0, 255],
	[128, 0, 255],
]
colorIndex=0;
function getColor(){
	colorIndex=(colorIndex+1)%colors.length
	return colors[colorIndex]
}
tileid=0

function Equation(eqn){
	var e=this;
	this.tileid="tile-"+tileid++
	this.tile=$("<div id='"+this.tileid+"' class='equation-tile'></div>")
	this.visibilitybtn=$("<a href='#' title='Show/Hide' class='btn visibility'>&nbsp;</a>").appendTo($(this.tile))
	this.input=$(" <input class='equation' id='equation' type='text' value='' autocomplete='off' />").appendTo($(this.tile))
	this.removebtn=$("<a href='#' title='Remove' class='btn remove'>&nbsp;</a>").appendTo($(this.tile))
	
	this.explorer=$("<div class='explorer'></div>").hide().appendTo($(this.tile))
	this.exp_down=$("<a href='#' title='Decrease m' class='btn exp-down'>&nbsp;</a>").appendTo(this.explorer)
		.click(function(){
			e.m--;
			e.exp_show.val(e.m)
			e.render()
			redraw()
			return false
		})
	$(this.explorer).append(" m=")
	this.exp_show=$("<input type='text' class='exp-show' value='1'/>").appendTo(this.explorer)
	this.exp_up=$("<a href='#' title='Increase m' class='btn exp-up'>&nbsp;</a>").appendTo(this.explorer)
		.click(function(){
			e.m++;
			e.exp_show.val(e.m)
			e.render()
			redraw()
			return false
		})
	
	
	this.color=getColor()
	this.image=null
	this.visible=true
	this.m=1
	
	$(e.removebtn).click(function(){e.pre_remove(); return false})
	
	$(e.tile).css('border-color', 'rgb('+this.color[0]+','+this.color[1]+','+this.color[2]+')' )
	
	$(e.visibilitybtn).click(function(){
		e.visible=!e.visible
		if (e.visible) $(e.tile).removeClass('invisible')
		else $(e.tile).addClass('invisible')
		redraw()
		return false
	})
	
	this.pre_remove=function(){
		var fade=$(this.tile).clone()
		var cancel=false;
		$(this.tile).hide().after(fade)
		$(fade).empty().addClass('removing').fadeTo(6000, 0.01, function(){
			if (cancel) return
			$(fade).hide(500, function(){
				$(fade).remove()
			})
			e.remove()
		})
		$("<a href='#'>Undo Remove</a>").appendTo($(fade)).click(function(){
			cancel=true;
			equations.push(e)
			$(fade).remove()
			$(e.tile).show()
			redraw()
			return false;
		})
		equations.remove(this)
		redraw()
	}
	
	this.remove=function(){
		$(this.tile).remove()
		this.e=this.tile=this.visibilitybtn=this.input=this.removebtn=null;
		equations.remove(this)
		if (equations.length<8) $('#add').show()
	}
	
	$(e.input).keypress(function(){
		if (e.timer) clearTimeout(e.timer)
		e.timer=setTimeout(function(){e.render(); redraw()}, 500)
		$(e.tile).addClass('active')
	})
	
	this.render=function(){
		this.image=null;
		$(e.tile).find('.error').remove()
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
				return
			}
        		this.image=graph(ctx, gp, f,this.color[0], this.color[1], this.color[2], 4)
        	}
    		$(e.tile).removeClass('active')
	}
	
	this.isVisible=function(){
		return this.visible && this.image
	}
	
	if (eqn){ this.input.val(eqn); this.render()}
}

function addEquation(eqn){
	var e=new Equation(eqn);
	equations.push(e);
	$(e.tile).hide();
	$('#add').before(e.tile);
	$(e.tile).fadeIn('slow');
	if (equations.length>=8) $('#add').hide()
	return false;
	
}

$(function(){
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	
	if (ctx.createImageData || ctx.getImageData){
		$('#wrap').show()
		$('#browsererror').hide()
	}else return;
	
	$('#add').click(function(){addEquation(); return false});
	bindInputToAttr($('#xmin'), gp, 'xmin', redrawAll)
	bindInputToAttr($('#xmax'), gp, 'xmax', redrawAll)
	bindInputToAttr($('#ymin'), gp, 'ymin', redrawAll)
	bindInputToAttr($('#ymax'), gp, 'ymax', redrawAll)
	
	var v='x^2+y^2=m^2'
    	if (window.location.hash)
    		v=decodeURIComponent(window.location.hash.slice(1))
    	
    	addEquation(v);
    	redraw();
})

function redraw(){
    	ctx.clearRect(0,0,gp.width,gp.height)
    	drawGrid(ctx, gp)
    	
    	for (var i=0; i<equations.length; i++){
    		if (equations[i].isVisible()) ctx.drawImage(equations[i].image, 0, 0, gp.width, gp.height)
    	}
}

function redrawAll(){
	for (var i=0; i<equations.length; i++){
    		equations[i].render()
    	}
    	redraw()
}
