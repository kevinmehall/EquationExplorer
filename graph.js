function graph(ctx, gp, f, r, g, b, lw){
	var width=gp.width;
	var height=gp.height;
	var xmin=gp.xmin;
	var xmax=gp.xmax;
	var ymin=gp.ymin;
	var ymax=gp.ymax;
	var aa=gp.aa;
	
	var canvas=document.createElement('canvas');
	canvas.width=width;
	canvas.height=height;
	var ctx = canvas.getContext('2d');
	var imgd = ctx.createImageData(width,height);
	var pix = imgd.data;
	var stride = width*4;
	var xpixstep = (xmax-xmin)/(width)
	var ypixstep = -(ymax-ymin)/(height)
	
	var x=0; var y=0; var i=0; var vx=xmin; var vy=ymax;
	var sign=f(vx, vy);
	
	while (i<pix.length){
		pix[i  ] = r;
		pix[i+1] = g;
		pix[i+2] = b;
		
		vx+=xpixstep;
		var nsign=f(vx, vy);
		
		if (sign!=nsign){
			for (var wx=vx-xpixstep; wx+=xpixstep/aa; wx<vx) 
				if (f(wx, vy)!=sign) break;
				
			var px=i+3;
			var offset=lw/2+(wx-vx)/xpixstep
			if (x+offset>=width) offset=width-x
			for (; offset>0; offset--){
				if (offset>=1) pix[px]=255
				else pix[px]=offset*255
				px+=4
			}
			var px=i-1;
			var offset=lw/2+(vx-wx)/xpixstep
			if (x-offset<0) offset=x
			for (; offset>0; offset--){
				if (offset>=1) pix[px]=255;
				else pix[px]=offset*255;
				px-=4
			}
		}
		
		sign=nsign;
		i+=4;
		x+=1	
		if (x==width){ x=0; y+=1; vx=xmin; vy+=ypixstep; sign=f(vx, vy)};
	}
	var x=0; var y=0; var i=0; var vx=xmin; var vy=ymax;
	var sign=f(vx, vy);
	while (i<pix.length){
		
		var nsign=f(vx, vy);
		
		if (sign!=nsign){
			for (var wy=vy-ypixstep; wy+=ypixstep/aa; wy<vy) 
				if (f(vx, wy)!=sign) break;
				
			var py=i+3;
			var offset=lw/2+(wy-vy)/ypixstep
			if (y+offset>height) offset=height-y
			for (; offset>0; offset--){
				if (offset>=1) pix[py]=255
				else pix[py]=Math.max(offset*255, pix[py]);
				py+=stride
			}
			var py=i+3-stride;
			var offset=lw/2+(vy-wy)/ypixstep
			if (y-offset<0) offset=y
			for (; offset>0; offset--){
				if (offset>=1) pix[py]=255;
				else pix[py]=Math.max(offset*255, pix[py]);
				py-=stride 
			}
		}
		vy+=ypixstep;
		sign=nsign;
		i+=stride;
		y+=1	
		if (y==height){ y=0; x+=1; vy=ymax, vx+=xpixstep; i=x*4; sign=f(vx, vy);};
	}
	
	ctx.putImageData(imgd, 0,0);
	return canvas;
}

function drawGrid(ctx, gp){
	var xpixstep = (gp.xmax-gp.xmin)/(gp.width)
	var ypixstep = -(gp.ymax-gp.ymin)/(gp.height)
	
	
	function x2px(x){ return (x-gp.xmin)/xpixstep }
	function y2py(y){ return (y+gp.ymin)/ypixstep }
	ctx.strokeStyle='rgba(0,0,255,0.3)'
	
	for (var x=Math.round(gp.xmin); x<gp.xmax; x++){
		if (x==0) ctx.lineWidth=4
		else ctx.lineWidth=1
		ctx.beginPath()
		ctx.moveTo(x2px(x), y2py(gp.ymax))
		ctx.lineTo(x2px(x), y2py(gp.ymin))
		ctx.stroke()
	}
	
	for (var y=Math.round(gp.ymin); y<gp.ymax; y++){
		if (y==0) ctx.lineWidth=4
		else ctx.lineWidth=1
		ctx.beginPath()
		ctx.moveTo(x2px(gp.xmin), y2py(y))
		ctx.lineTo(x2px(gp.xmax), y2py(y))
		ctx.stroke()
	}
}
