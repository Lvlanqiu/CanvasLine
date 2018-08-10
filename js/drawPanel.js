/**
 * canvas手写签名
 * @author: Lv lanqiu 2018-08-10
 * */
(function(global){
	var totalLine = [];//历史笔画
	var linePixels = [];//当前笔画
	
	/**
	 * @param obj['el']: 包含canvas的元素
	 * @param obj['cHeight']: canvas默认高度
	 * @param obj['clearBtn']: 清除按钮
	 * @param obj['saveBtn']: 保存按钮
	 * @param obj['linewidth']: 笔触宽度 (可选)
	 * @param obj['color']: 笔触颜色 (可选)
	 * @param obj['bgcolor']: 画布背景色  (可选)
	 * 
	 * */
	global.drawFlexLine = function(obj,callback){
		//设置笔触和画布的默认值
		var _this = this;
		_this.mousePressed = false;
		_this.linewidth = 3;
		_this.color = "#000000";
		_this.bgcolor = "#FFFFFF";
		_this.cHeight = 180;
		if(obj){ 
			for(var i in obj){
				_this[i] = obj[i];
			}
		}else{
			return;
		}
		//生成canvas的dom,并加载到其父容器中;宽度占满屏幕，高度自定义
		var Ratio = 1;//缩放比率
		_this.canvas = document.createElement("canvas");
		_this.canvas.width = _this.el.clientWidth*Ratio;
		_this.canvas.height = _this.el.clientWidth*Ratio;
		_this.canvas.setAttribute('id',"myCanvas")
		_this.canvas.setAttribute('style',"width:100%;height:auto;")
		_this.el.appendChild(_this.canvas);
		var height = _this.canvas.offsetTop;
		//初始化canvas的上下文
		if(_this.canvas.getContext("2d")){
			_this.ctx = _this.canvas.getContext('2d')
		}else{
			console.log("***不支持canvas***")
			return;
		}
		_this.canvas.getContext('2d').imageSmoothingEnabled = true;
		//初始化画布属性
		//_this.ctx.scale(devicePixelRatio,devicePixelRatio);//横纵放大画布
		_this.ctx.fillStyle = _this.bgcolor;
		_this.ctx.fillRect(0,0,_this.canvas.width,_this.canvas.height);
		//初始话笔触属性
		_this.ctx.strokeStyle = _this.color;
		_this.ctx.lineWidth = _this.linewidth;
		_this.ctx.lineCap = "round";
		_this.ctx.lineJoin="round";
		
		//开始绘制
		_this.canvas.addEventListener('touchstart',function(e){
			 if (e.targetTouches.length == 1) {//判断是单点触控
			 	e.preventDefault();// 阻止浏览器默认事件，重要
			 	if(!_this.mousePressed){
			 		linePixels = [];
			 		_this.mousePressed = true;
				 	_this.ctx.beginPath();
				 	var p = getCanvasPos(_this.canvas,e,1);
				 	_this.ctx.moveTo(p.x, p.y);
				 	linePixels.push(p);
			 	}
			 }
		},false)
		
		//绘制中
		_this.canvas.addEventListener('touchmove',function(e){
			if (e.targetTouches.length == 1) {
			 	e.preventDefault(); 
			 	if(_this.mousePressed){
			 		_this.mousePressed =true;
			 		var p = getCanvasPos(_this.canvas,e,0);
			 		linePixels.push(p);
			 		_this.ctx.lineTo(p.x, p.y);
			 		_this.ctx.stroke(); 
			 	}
			 }
		},false)
		
		//绘制结束
		_this.canvas.addEventListener('touchend',function(e){
			//if (e.targetTouches.length == 0) {
			 	event.preventDefault(); 
				drawLine(_this.ctx,_this.canvas);
			 	_this.ctx.closePath();
			 	_this.mousePressed = false; 
			//}
		},false)
		
		//清除画布
		_this.clearBtn.addEventListener("tap",function(e){
			clearDraw(_this.ctx, _this.canvas);
		},false);
		
		//撤销上一笔
		if(_this.prevBtn){
			_this.prevBtn.addEventListener("tap",function(e){
				drawLine(_this.ctx,_this.canvas,'cancel');
			},false);
		}
		
		//保存
		_this.saveBtn.addEventListener("tap",function(e){
			if(totalLine.length<=0){
				return callback(null,'err')
			}
			var imgBase64 = _this.canvas.toDataURL('image/png');
			clearDraw(_this.ctx, _this.canvas);
			return callback(imgBase64);
		},false);
			
	}
	
	/**
	 * @description 获得画布坐标点
	 * @param canvas: canva的HTMLObj对象
	 * @param evt: touchstart、touchmove的事件
	 * @param len: 1|0，记录当前点是start（1）点还是move（0）点
	 * */
	var getCanvasPos = function(canvas, evt, len) {
	    var rect = canvas.getBoundingClientRect();
	    var x, y;
	    if (evt.targetTouches) {
	        x = evt.targetTouches[0].clientX;
	        y = evt.targetTouches[0].clientY;
	    } else {
	        x = evt.clientX;
	        y = evt.clientY;
	    }
	    return {
	        x: (x - rect.left) * (canvas.width / rect.width),
	        y: (y - rect.top) * (canvas.height / rect.height),
	        len: len
	    }
	}
	
	
	/**
	 * @description 二次贝塞尔曲线，绘制平滑曲线
	 * @param tmp_ctx: canva的上下文
	 * @param canvas: canva的HTMLObj对象
	 * @param type: 按钮类型 cancel：撤销
	 * */
	var drawLine = function(tmp_ctx,canvas,type){
		if(type=='cancel'){
			//撤销  删除最后一笔的点集
			if(totalLine.length>0)
				totalLine.splice(totalLine.length-1,1)
		}else{
			totalLine.push(linePixels);
		}
		tmp_ctx.fillRect(0,0,canvas.width,canvas.height);
		totalLine.forEach(function(item,i){
			tmp_ctx.beginPath();
			if(item.length>0){
				tmp_ctx.moveTo(item[0].x, item[0].y); 
				if(item.length<4){
					tmp_ctx.closePath(); 
					return;
				}
				for (var i = 1; i < item.length - 2; i++) {
					if(item[i+1].len==1){
						tmp_ctx.moveTo(item[i].x, item[i].y)
					}else{
						var c = (item[i].x + item[i + 1].x) / 2;
						var d = (item[i].y + item[i + 1].y) / 2;
						tmp_ctx.quadraticCurveTo(item[i].x, item[i].y, c, d); 
					}
				}
				// For the last 2 points
				tmp_ctx.quadraticCurveTo(
				    item[i].x,
				    item[i].y,
				    item[i + 1].x,
				    item[i + 1].y
				);
				tmp_ctx.stroke(); 
				tmp_ctx.closePath();
			}else{
				//删除空白点集合
				totalLine.splice(i,1)
			}
		})
		linePixels = [];
	}
	
	var clearDraw = function(_ctx,_canvas){
		_ctx.fillRect(0,0,_canvas.width,_canvas.height)
		totalLine = [];
		linePixels = [];
	}
	//mui.plusReady(function () {
		//默认竖屏
		//plus.screen.lockOrientation('landscape');
		//默认横屏
		//plus.screen.lockOrientation('portrait-primary');
		//判断手机横竖屏状态：   
		//window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function() {   
		//	if (window.orientation === 180 || window.orientation === 0) {    
		//		alert('竖屏状态！');   
		//	}    
		//	if (window.orientation === 90 || window.orientation === -90 ){    
		//		alert('横屏状态！');   
		//	}     
		//}, false);
	//});
})(window)
