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
	this.error=false
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
	
	$(e.input).keypress(function(evt){
		var charCode = (evt.which) ? evt.which : event.keyCode
		if (charCode<32 && charCode != 8 && charCode != 13) return; // ignore events that do not change input 
		if (e.timer) clearTimeout(e.timer)
		e.timer=setTimeout(function(){e.render(); redraw()}, 500)
		$(e.tile).addClass('active')
	})
	
	this.render=function(){
		this.image=null;
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
        		this.image=graph(ctx, gp, f,this.color[0], this.color[1], this.color[2], 4)
        	}
    		$(e.tile).removeClass('active')
	}
	
	this.isVisible=function(){
		return this.visible && !this.error
	}
	
	this.serialize=function(){
		s=$(this.input).val()
		if (s.indexOf('m')!=-1) s+='@'+this.m
		if (!this.visible) s="!"+s
		return s
	}
	
	if (eqn){
		if (eqn[0]=='!'){ this.visible=false; eqn=eqn.slice(1); $(this.tile).addClass('invisible') }
		var eqn=eqn.split('@')
		if (eqn.length>1){this.m=parseInt(eqn[1], 10); $(this.exp_show).val(this.m); $(this.explorer).show()}
		this.input.val(eqn[0])
	}
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
	
    if (window.location.hash){
		loadState(decodeURI(window.location.hash.slice(1)))
    }else{
    	addEquation('x^2+y^2=m^2');
    	redraw();
    }
})

lastHashState=''
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
	if (lastHashState.slice(1)!=v){
		 window.location.hash=v
	}
	lastHashState=window.location.hash
}

function redrawAll(){
	for (var i=0; i<equations.length; i++){
    	equations[i].render()
    }
    redraw()
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
	colorIndex=0
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
