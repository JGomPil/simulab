/* Fondo animado de nodos, común a todos los simuladores de SimuLab UVa. */
(function(){
var c=document.getElementById('nl-bg');if(!c||!c.getContext)return;var x=c.getContext('2d'),W=0,H=0,P=[],last=0,still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function build(){W=c.width=innerWidth;H=c.height=innerHeight;var n=Math.min(60,Math.floor(W*H/20000));P=[];for(var i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.4+1})}
function draw(k){x.clearRect(0,0,W,H);for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx*k;p.y+=p.vy*k;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;x.beginPath();x.arc(p.x,p.y,p.r,0,6.2832);x.fillStyle='rgba(56,189,248,.4)';x.fill();
 for(var j=i+1;j<P.length;j++){var q=P[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.strokeStyle='rgba(99,102,241,'+((1-d/120)*.18)+')';x.lineWidth=.8;x.stroke()}}}}
function frame(t){requestAnimationFrame(frame);if(document.hidden||t-last<33)return;var k=Math.min(3,(t-last)/16.7);last=t;draw(k)}
build();draw(0);if(!still)requestAnimationFrame(frame);
addEventListener('resize',function(){if(Math.abs(innerWidth-W)>2||Math.abs(innerHeight-H)>150){build();draw(0)}else{c.width=W=innerWidth;c.height=H=innerHeight}});
})();
