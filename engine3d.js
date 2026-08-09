// ═══════════════════════════════════════════════════════════════════
//  Corn Maze — moteur de rendu 3D (Three.js)
//  Remplace le lancer de rayons. Lit l'état du jeu via window.GAME3D
//  et n'y touche jamais : la logique du jeu reste inchangée.
// ═══════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BASE   = 'Models/';
const CELL   = 3.6;      // largeur d'une case en 3D
const WALL_H = 2.9;      // hauteur des murs
const EYE    = 1.62;     // hauteur des yeux
const THICK  = 0.30;     // épaisseur d'un panneau de brique
const SINK   = 0.05;     // enfoncement du maïs
const LAYERS = 3;        // plants de maïs empilés par case (compense le débord réduit)
const SNUG   = { 'briques':1.04, 'buissons':1.22, 'maïs':1.14 };

const G = () => window.GAME3D;

let renderer, scene, camera, ground, cloudLayer, cloudMat, skyline, skyMat, rainPts, rainGeo;
let sun, hemi;
const RAW = {}, TEX = {}, P = {};
const live = new Map();
const critters = [], puffs = [];
let curTheme = null, curWeather = null, radius = 8, lastCell = '';
let started = false;

// ── Utilitaires ────────────────────────────────────────────────────
const rnd = (r,c,s)=>{ let h=(r*374761393+c*668265263+s*2246822519)^0x5bf03635;
  h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967295; };
// ATTENTION : dans le jeu, MAP vaut 0 pour un MUR et non-zéro pour un couloir
const isWall = (r,c)=>{ const g=G(); if(!g||!g.MAP||!g.COLS) return true;
  if(!(r>=0)||!(c>=0)||r>=g.ROWS||c>=g.COLS) return true;
  return g.MAP[r*g.COLS+c]===0; };
const cx = c => (c+0.5)*CELL;
const cz = r => (r+0.5)*CELL;

// ── Textures générées (sols, ciel, ville, bestioles) ───────────────
function groundTex(kind){
  const S=512,c=document.createElement('canvas');c.width=c.height=S;
  const g=c.getContext('2d');
  const noise=(n,fn)=>{for(let i=0;i<n;i++)fn(Math.random()*S,Math.random()*S);};
  if(kind==='bitume'){
    g.fillStyle='#3c3c40';g.fillRect(0,0,S,S);
    noise(5200,(x,y)=>{const v=40+Math.random()*55;
      g.fillStyle=`rgba(${v},${v},${v+3},.5)`;g.fillRect(x,y,2+Math.random()*3,2+Math.random()*3);});
    for(let i=0;i<26;i++){const x=Math.random()*S,y=Math.random()*S,r=18+Math.random()*54;
      const gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(20,20,22,.5)');gr.addColorStop(1,'rgba(20,20,22,0)');
      g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
    g.strokeStyle='rgba(16,16,18,.85)';
    for(let i=0;i<14;i++){g.lineWidth=.8+Math.random()*2.2;g.beginPath();
      let x=Math.random()*S,y=Math.random()*S;g.moveTo(x,y);
      for(let k=0;k<7;k++){x+=(Math.random()-.5)*90;y+=(Math.random()-.5)*90;g.lineTo(x,y);}g.stroke();}
    for(let i=0;i<7;i++){const x=Math.random()*S,y=Math.random()*S,r=9+Math.random()*17;
      g.fillStyle='rgba(14,14,16,.75)';g.beginPath();g.ellipse(x,y,r,r*.7,Math.random()*3,0,7);g.fill();
      g.fillStyle='rgba(90,90,94,.35)';g.beginPath();g.ellipse(x-2,y-2,r*.6,r*.4,0,0,7);g.fill();}
  } else if(kind==='pelouse'){
    g.fillStyle='#4a7c33';g.fillRect(0,0,S,S);
    for(let i=0;i<30;i++){const x=Math.random()*S,y=Math.random()*S,r=30+Math.random()*70;
      const gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,Math.random()>.5?'rgba(96,150,60,.35)':'rgba(48,86,32,.35)');
      gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
    for(let i=0;i<4200;i++){const x=Math.random()*S,y=Math.random()*S,l=3+Math.random()*7,
      a=-1.57+(Math.random()-.5),v=70+Math.random()*90;
      g.strokeStyle=`rgba(${(v*.5)|0},${v+30},${(v*.35)|0},.75)`;g.lineWidth=.8+Math.random();
      g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
    for(let i=0;i<26;i++){const x=Math.random()*S,y=Math.random()*S;
      g.fillStyle='rgba(245,245,232,.9)';
      for(let p=0;p<5;p++){const a=p/5*6.28;g.beginPath();
        g.arc(x+Math.cos(a)*2.2,y+Math.sin(a)*2.2,1.5,0,7);g.fill();}
      g.fillStyle='#f0c93c';g.beginPath();g.arc(x,y,1.3,0,7);g.fill();}
  } else {
    g.fillStyle='#8a6238';g.fillRect(0,0,S,S);
    noise(6000,(x,y)=>{const v=95+Math.random()*60;
      g.fillStyle=`rgba(${v},${(v*.7)|0},${(v*.45)|0},.55)`;g.fillRect(x,y,2+Math.random()*3,2+Math.random()*3);});
    for(let y=0;y<S;y+=26){
      g.strokeStyle='rgba(70,48,26,.45)';g.lineWidth=3+Math.random()*3;g.beginPath();g.moveTo(0,y);
      for(let x=0;x<=S;x+=32)g.lineTo(x,y+(Math.random()-.5)*9);g.stroke();
      g.strokeStyle='rgba(168,132,84,.3)';g.lineWidth=2;g.beginPath();g.moveTo(0,y+5);
      for(let x=0;x<=S;x+=32)g.lineTo(x,y+5+(Math.random()-.5)*8);g.stroke();}
    for(let i=0;i<130;i++){const x=Math.random()*S,y=Math.random()*S,r=1+Math.random()*2.6;
      g.fillStyle=`rgba(${140+Math.random()*50|0},${125+Math.random()*40|0},${105+Math.random()*35|0},.8)`;
      g.beginPath();g.ellipse(x,y,r,r*.75,Math.random()*3,0,7);g.fill();}
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(150,150);   // sol de 600 m → tuile de 4 m
  t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function cloudTex(dark){
  const S=512,c=document.createElement('canvas');c.width=c.height=S;
  const g=c.getContext('2d');g.clearRect(0,0,S,S);
  const col=dark?'176,182,194':'255,255,255', amax=dark?.55:.40;
  const off=[[0,0],[S,0],[-S,0],[0,S],[0,-S],[S,S],[-S,-S],[S,-S],[-S,S]];
  for(let i=0;i<(dark?58:34);i++){
    const x=Math.random()*S,y=Math.random()*S,r=34+Math.random()*78,a=amax*(.5+Math.random()*.5);
    for(const[ox,oy]of off){
      const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);
      gr.addColorStop(0,`rgba(${col},${a})`);
      gr.addColorStop(.55,`rgba(${col},${a*.45})`);
      gr.addColorStop(1,`rgba(${col},0)`);
      g.fillStyle=gr;g.beginPath();g.arc(x+ox,y+oy,r,0,7);g.fill();}
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(9,9);   // sinon les nuages sont étirés à l'infini
  t.colorSpace=THREE.SRGBColorSpace;return t;
}
function puffTex(dark){
  const S=256,c=document.createElement('canvas');c.width=c.height=S;
  const g=c.getContext('2d');g.clearRect(0,0,S,S);
  const col=dark?'186,192,204':'255,255,255';
  for(const[bx,by,br]of [[128,150,58],[86,158,42],[172,158,44],[112,124,40],[152,126,36],[128,108,30]]){
    const gr=g.createRadialGradient(bx,by-br*0.2,0,bx,by,br);
    gr.addColorStop(0,`rgba(${col},${dark?.95:.92})`);
    gr.addColorStop(.6,`rgba(${col},${dark?.6:.55})`);
    gr.addColorStop(1,`rgba(${col},0)`);
    g.fillStyle=gr;g.beginPath();g.arc(bx,by,br,0,7);g.fill();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function skylineTex(dark){
  const W=2048,H=512,c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d');g.clearRect(0,0,W,H);
  const baseY=H*0.965;
  const layers=[
    {c1:dark?'#5a6473':'#9fb2c6',c2:dark?'#6a7484':'#b3c4d6',hmin:40,hmax:105,w:[40,86],al:.45,win:0},
    {c1:dark?'#454e5f':'#7d92ad',c2:dark?'#525b6d':'#8fa3bc',hmin:60,hmax:150,w:[46,98],al:.65,win:.16},
    {c1:dark?'#333b4b':'#5d7091',c2:dark?'#3d4557':'#6d80a0',hmin:80,hmax:200,w:[50,110],al:.85,win:.3},
    {c1:dark?'#252b38':'#425270',c2:dark?'#2d3444':'#4c5c78',hmin:70,hmax:240,w:[56,124],al:1,win:.42}];
  for(const L of layers){
    g.globalAlpha=L.al;let x=-50;
    while(x<W+50){
      const w=L.w[0]+Math.random()*(L.w[1]-L.w[0]);
      const h=L.hmin+Math.random()*(L.hmax-L.hmin), top=baseY-h;
      const grd=g.createLinearGradient(0,top,0,baseY);
      grd.addColorStop(0,L.c2);grd.addColorStop(1,L.c1);
      g.fillStyle=grd;
      const shape=Math.random();
      if(shape<.12){g.fillRect(x,top+16,w,h+30);g.fillRect(x+w*.2,top,w*.6,22);}
      else if(shape<.2){g.fillRect(x,top+18,w,h+30);
        g.beginPath();g.moveTo(x,top+20);g.lineTo(x+w/2,top-6);g.lineTo(x+w,top+20);g.closePath();g.fill();}
      else g.fillRect(x,top,w,h+30);
      if(Math.random()<.2){g.fillRect(x+w/2-1.5,top-24,3,26);}
      if(Math.random()<.07){g.fillRect(x+w*.3,top-20,w*.4,16);
        g.fillRect(x+w*.44,top-4,4,8);g.fillRect(x+w*.54,top-4,4,8);}
      if(L.win>0){
        for(let wy=top+13;wy<baseY-12;wy+=13)
          for(let wx=x+6;wx<x+w-8;wx+=11)
            if(Math.random()<L.win){
              g.fillStyle=Math.random()<.74?'rgba(255,218,132,.92)':'rgba(168,208,255,.75)';
              g.fillRect(wx,wy,4.5,6.5);}
      }
      x+=w+1+Math.random()*9;
    }
  }
  g.globalAlpha=1;
  const gr=g.createLinearGradient(0,baseY-190,0,baseY);
  gr.addColorStop(0,'rgba(255,255,255,0)');
  gr.addColorStop(.45,dark?'rgba(150,161,177,.35)':'rgba(150,200,230,.30)');
  gr.addColorStop(1,dark?'rgba(140,151,166,.96)':'rgba(150,206,235,.96)');
  g.fillStyle=gr;g.fillRect(0,baseY-190,W,195);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function critterTex(kind){
  const S=64,c=document.createElement('canvas');c.width=c.height=S;
  const g=c.getContext('2d');g.clearRect(0,0,S,S);
  if(kind==='ant'){
    g.fillStyle='#221a12';
    g.beginPath();g.ellipse(32,16,6,8,0,0,7);g.fill();
    g.beginPath();g.ellipse(32,32,5,7,0,0,7);g.fill();
    g.beginPath();g.ellipse(32,50,8,11,0,0,7);g.fill();
    g.strokeStyle='#221a12';g.lineWidth=2.4;
    for(const[y,dy]of[[22,-8],[32,0],[42,8]]){
      g.beginPath();g.moveTo(28,y);g.lineTo(12,y+dy);g.stroke();
      g.beginPath();g.moveTo(36,y);g.lineTo(52,y+dy);g.stroke();}
    g.lineWidth=1.8;
    g.beginPath();g.moveTo(30,10);g.lineTo(24,2);g.stroke();
    g.beginPath();g.moveTo(34,10);g.lineTo(40,2);g.stroke();
  } else if(kind==='rat'){
    g.strokeStyle='#6d635e';g.lineWidth=2.6;g.beginPath();
    g.moveTo(14,40);g.quadraticCurveTo(2,34,6,20);g.stroke();
    g.fillStyle='#5b5450';
    g.beginPath();g.ellipse(32,38,17,10,0,0,7);g.fill();
    g.beginPath();g.ellipse(50,32,8,7,0,0,7);g.fill();
    g.beginPath();g.moveTo(56,30);g.lineTo(62,34);g.lineTo(55,36);g.closePath();g.fill();
    g.beginPath();g.arc(46,25,4.5,0,7);g.fill();
    g.strokeStyle='#4a443f';g.lineWidth=3;
    for(const bx of [24,32,40]){g.beginPath();g.moveTo(bx,46);g.lineTo(bx-1,52);g.stroke();}
    g.fillStyle='#221d1a';g.beginPath();g.arc(52,30,1.7,0,7);g.fill();
  } else {
    g.fillStyle='#2b3240';
    g.beginPath();g.moveTo(32,34);
    g.quadraticCurveTo(18,18,4,24);g.quadraticCurveTo(18,28,30,38);
    g.quadraticCurveTo(46,28,60,24);g.quadraticCurveTo(46,18,32,34);g.fill();
    g.beginPath();g.ellipse(32,36,5,7,0,0,7);g.fill();
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function butterflyTex(c1,c2){
  const S=64,c=document.createElement('canvas');c.width=c.height=S;
  const g=c.getContext('2d');g.clearRect(0,0,S,S);
  const wing=(sx)=>{g.save();g.translate(32,32);g.scale(sx,1);
    g.fillStyle=c1;g.beginPath();g.moveTo(0,-2);
    g.quadraticCurveTo(24,-26,28,-8);g.quadraticCurveTo(24,2,2,2);g.fill();
    g.fillStyle=c2;g.beginPath();g.moveTo(0,2);
    g.quadraticCurveTo(20,8,22,22);g.quadraticCurveTo(12,22,1,6);g.fill();g.restore();};
  wing(1);wing(-1);
  g.strokeStyle='#241c14';g.lineWidth=2.6;
  g.beginPath();g.moveTo(32,16);g.lineTo(32,46);g.stroke();
  g.lineWidth=1.4;
  g.beginPath();g.moveTo(32,18);g.quadraticCurveTo(26,8,22,7);g.stroke();
  g.beginPath();g.moveTo(32,18);g.quadraticCurveTo(38,8,42,7);g.stroke();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

const GT={}, CLOUD={}, PUFF={}, SKYL={}, CT={}, BFLY=[];

// ── Préparation des modèles ────────────────────────────────────────
function prep(key,mode,snug,sink,size){
  const src=RAW[key];if(!src)return null;
  snug=snug||1;sink=sink||0;
  const o=src.clone();o.scale.set(1,1,1);o.position.set(0,0,0);o.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(o);const s=new THREE.Vector3();b.getSize(s);
  if(mode==='wall')       o.scale.set(CELL*snug/s.x, WALL_H/s.y, THICK/s.z);
  else if(mode==='block') o.scale.set(CELL*snug/s.x, WALL_H*(1+sink)/s.y, CELL*snug/s.z);
  else if(mode==='prop')  {const k=(size||CELL*0.4)/s.x;o.scale.set(k,k,k);}
  else if(mode==='banner'){const k=CELL/s.x;o.scale.set(k,k,k);}
  o.updateMatrixWorld(true);
  const b2=new THREE.Box3().setFromObject(o);const c2=new THREE.Vector3();b2.getCenter(c2);
  const h=b2.max.y-b2.min.y;const w=new THREE.Group();
  o.position.set(-c2.x, -b2.min.y - h*sink, -c2.z);
  w.add(o);w.userData.h=h;return w;
}
function makeGrass(height){
  const t=TEX.herbe;if(!t)return null;
  const g=new THREE.Group();
  const ratio=(t.image&&t.image.width)?t.image.width/t.image.height:1.25;
  const h=height,w=h*ratio;
  const mat=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.45,side:THREE.DoubleSide});
  for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
    p.position.y=h/2;p.rotation.y=i*Math.PI/3;g.add(p);}
  return g;
}
function makeEgout(d){
  const t=TEX.egout;if(!t)return null;
  const g=new THREE.Group();
  const m=new THREE.Mesh(new THREE.PlaneGeometry(d,d),
    new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.4,
      polygonOffset:true,polygonOffsetFactor:-2}));
  m.rotation.x=-Math.PI/2;m.position.y=.03;g.add(m);return g;
}

function rebuildProtos(theme){
  P.tag  = prep('mur_tag','wall',SNUG['briques']);
  P.vide = prep('mur_vide','wall',SNUG['briques']);
  P.buis = prep('buisson','block',SNUG['buissons'],0);
  P.corn = prep('mais','block',SNUG['maïs'],SINK);
  P.pud  = prep('flaque','prop',1,0,CELL*.7);
  P.fin  = prep('finish','banner');
  P.cof  = prep('coffre','prop',1,0,CELL*.45);
  P.cai  = prep('cailloux','prop',1,0,CELL*.35);
  P.spr  = prep('spray','prop',1,0,CELL*.2);
}

// ── Contenu d'une case ─────────────────────────────────────────────
function cellContent(r,c){
  const g=G(); if(!g) return null;
  const theme=curTheme, ville=(theme==='briques'), rain=(curWeather==='rain');
  const grp=new THREE.Group();
  const x=cx(c), z=cz(r);

  if(isWall(r,c)){
    if(ville){
      const faces=[[-1,0,0],[1,0,Math.PI],[0,-1,Math.PI/2],[0,1,-Math.PI/2]];
      let n=0;
      faces.forEach(([dr,dc,ry],i)=>{
        if(isWall(r+dr,c+dc)) return;          // face interne : inutile
        const src=(rnd(r,c,1+i*13)<0.25)?P.tag:P.vide; if(!src) return;
        const p=src.clone();
        p.rotation.y=ry;
        if(rnd(r,c,7777+i*7)<0.25) p.rotation.y+=Math.PI;
        p.position.set(x+dc*(CELL/2-THICK/2), 0, z+dr*(CELL/2-THICK/2));
        grp.add(p);n++;
      });
      return n?grp:null;
    }
    if(theme==='buissons'){
      if(!P.buis) return null;
      const m=P.buis.clone();
      m.rotation.y=Math.floor(rnd(r,c,31)*4)*Math.PI/2;
      m.position.set(x,0,z);grp.add(m);return grp;
    }
    if(!P.corn) return null;
    const m=new THREE.Group();
    for(let L=0;L<LAYERS;L++){
      const cp=P.corn.clone();
      cp.rotation.y=rnd(r,c,31+L*17)*Math.PI*2;
      cp.scale.multiplyScalar(1-L*.04);
      cp.position.set((rnd(r,c,61+L*7)-.5)*CELL*.30,0,(rnd(r,c,83+L*7)-.5)*CELL*.30);
      m.add(cp);
    }
    m.position.set(x,0,z);grp.add(m);return grp;
  }

  // ── case libre ──
  if(r===g.exitY && c===g.exitX && P.fin){
    const f=P.fin.clone();
    // L'arche doit BARRER le couloir d'accès, pas le longer : on regarde
    // par où le joueur peut arriver et on l'oriente face à lui.
    const nsOpen = !isWall(r-1,c) || !isWall(r+1,c);   // couloir nord-sud
    const ewOpen = !isWall(r,c-1) || !isWall(r,c+1);   // couloir est-ouest
    let ry;
    if(nsOpen && !ewOpen)      ry = 0;                 // on arrive selon Z
    else if(ewOpen && !nsOpen) ry = Math.PI/2;         // on arrive selon X
    else ry = (Math.abs(1-c) > Math.abs(1-r)) ? Math.PI/2 : 0;  // croisement : face au départ
    f.rotation.y = ry;
    f.position.set(x, WALL_H*.98-f.userData.h, z);
    grp.add(f);
  }
  const hb=g.hiddenBonus;
  if(hb && hb.x===c && hb.y===r && P.cof){
    const k=P.cof.clone();k.rotation.y=rnd(r,c,17)*6.28;k.position.set(x,0,z);grp.add(k);
  }
  if(rnd(r,c,555)<=0.45){
    const q=rnd(r,c,888);
    const jx=(rnd(r,c,13)-.5)*CELL*.45, jz=(rnd(r,c,29)-.5)*CELL*.45;
    let o=null;
    if(ville){
      if(rain && q<.26 && P.pud) o=P.pud.clone();
      else if(q<.46){
        let ok=true;
        for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)
          if((dr||dc) && !isWall(r+dr,c+dc) && rnd(r+dr,c+dc,888)<.46 && rnd(r+dr,c+dc,555)<=0.45) ok=false;
        o = ok ? makeEgout(CELL*.55) : (P.spr?P.spr.clone():null);
      }
      else if(q<.62 && P.spr) o=P.spr.clone();
    } else {
      if(rain && q<.22 && P.pud) o=P.pud.clone();
      else if(q<.62) o=makeGrass(CELL*(theme==='buissons'?.30:.24));
      else if(P.cai) o=P.cai.clone();
    }
    if(o){
      o.rotation.y=rnd(r,c,911)*Math.PI*2;
      o.scale.multiplyScalar(.8+rnd(r,c,404)*.5);
      o.position.set(x+jx,0,z+jz);grp.add(o);
    }
  }
  return grp.children.length?grp:null;
}

function updateZone(){
  const g=G(); if(!g) return;
  const pc=Math.floor(g.px), pr=Math.floor(g.py);
  const need=new Set();
  for(let r=pr-radius;r<=pr+radius;r++)for(let c=pc-radius;c<=pc+radius;c++){
    if(r<0||c<0||r>=g.ROWS||c>=g.COLS) continue;
    const k=r+','+c; need.add(k);
    if(!live.has(k)){ const o=cellContent(r,c); if(o){scene.add(o);live.set(k,o);} else live.set(k,null); }
  }
  for(const [k,o] of live){ if(!need.has(k)){ if(o) scene.remove(o); live.delete(k); } }
}
function clearWorld(){ for(const [,o] of live) if(o) scene.remove(o); live.clear(); }

// ── Animaux ────────────────────────────────────────────────────────
function clearCritters(){ critters.forEach(o=>scene.remove(o.obj)); critters.length=0; }
function spawnCritters(){
  clearCritters();
  const g=G(); if(!g) return;
  const nature=(curTheme!=='briques'), rain=(curWeather==='rain');
  const kind=nature?'ant':'rat', size=nature?0.26:0.55, n=nature?14:8;
  for(let i=0;i<n;i++){
    let obj;
    if(nature){
      obj=new THREE.Group();
      const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size*1.5),
        new THREE.MeshBasicMaterial({map:CT.ant,transparent:true,alphaTest:.35,depthWrite:false}));
      m.rotation.x=-Math.PI/2;m.position.y=0.04;obj.add(m);
    } else {
      obj=new THREE.Sprite(new THREE.SpriteMaterial({map:CT.rat,transparent:true,depthWrite:false}));
      obj.scale.set(size,size*0.66,1);obj.center.set(0.5,0);
    }
    scene.add(obj);
    critters.push({obj,kind,size,a:Math.random()*6.28,
      sp:(nature?0.010:0.020)+Math.random()*0.010,t:Math.random()*100,placed:false});
  }
  if(nature && !rain){
    for(let i=0;i<6;i++){
      const s=new THREE.Sprite(new THREE.SpriteMaterial({
        map:BFLY[(Math.random()*BFLY.length)|0],transparent:true,depthWrite:false}));
      const sz=0.34+Math.random()*0.16;s.scale.set(sz,sz,1);scene.add(s);
      critters.push({obj:s,kind:'bfly',size:sz,a:Math.random()*6.28,
        sp:0.012+Math.random()*0.010,t:Math.random()*100,placed:false,
        base:0.7+Math.random()*0.9,ph:Math.random()*6.28});
    }
  }
  for(let i=0;i<4;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:CT.bird,transparent:true,
      depthWrite:false,opacity:.85,fog:false}));
    s.scale.set(1.6,1.6,1);scene.add(s);
    critters.push({obj:s,kind:'bird',r:14+Math.random()*16,
      a:Math.random()*6.28,sp:0.004+Math.random()*0.004,h:11+Math.random()*7});
  }
}
function freeAt(x,z){ return !isWall(Math.floor(z/CELL), Math.floor(x/CELL)); }
function updateCritters(wx,wz){
  const now=performance.now();
  for(const k of critters){
    if(k.kind==='bird'){
      k.a+=k.sp;
      k.obj.position.set(wx+Math.cos(k.a)*k.r, k.h+Math.sin(k.a*2)*0.7, wz+Math.sin(k.a)*k.r);
      const f=1+Math.sin(now*0.012+k.a*3)*0.25;k.obj.scale.set(1.6,1.6*f,1);
      continue;
    }
    if(k.kind==='bfly'){
      if(!k.placed||Math.hypot(k.obj.position.x-wx,k.obj.position.z-wz)>CELL*5){
        const ang=Math.random()*6.28,d=CELL*(1+Math.random()*2.5);
        const nx=wx+Math.cos(ang)*d,nz=wz+Math.sin(ang)*d;
        if(freeAt(nx,nz)){k.obj.position.set(nx,k.base,nz);k.placed=true;}
        continue;
      }
      k.t++;
      if(k.t>25+Math.random()*45){k.a+=(Math.random()-0.5)*2.0;k.t=0;}
      const nx=k.obj.position.x+Math.cos(k.a)*k.sp, nz=k.obj.position.z+Math.sin(k.a)*k.sp;
      if(freeAt(nx,nz)){k.obj.position.x=nx;k.obj.position.z=nz;} else k.a+=2.4;
      k.obj.position.y=k.base+Math.sin(now*0.003+k.ph)*0.28;
      const flap=0.35+Math.abs(Math.sin(now*0.018+k.ph))*0.65;
      k.obj.scale.set(k.size*flap,k.size,1);
      continue;
    }
    if(!k.placed||Math.hypot(k.obj.position.x-wx,k.obj.position.z-wz)>CELL*6){
      const ang=Math.random()*6.28,d=CELL*(1.5+Math.random()*2.5);
      const nx=wx+Math.cos(ang)*d,nz=wz+Math.sin(ang)*d;
      if(freeAt(nx,nz)){k.obj.position.set(nx,0,nz);k.placed=true;}
      continue;
    }
    k.t+=1;
    if(k.t>60+Math.random()*90){k.a+=(Math.random()-0.5)*1.6;k.t=0;}
    const nx=k.obj.position.x+Math.cos(k.a)*k.sp, nz=k.obj.position.z+Math.sin(k.a)*k.sp;
    if(freeAt(nx,nz)){k.obj.position.x=nx;k.obj.position.z=nz;} else k.a+=2.2;
    if(k.kind==='ant') k.obj.rotation.y=-k.a+Math.PI/2;
    else{
      const cr=Math.cos(k.a)*(wz-k.obj.position.z)-Math.sin(k.a)*(wx-k.obj.position.x);
      k.obj.scale.x=(cr>0?1:-1)*k.size;
      k.obj.position.y=Math.abs(Math.sin(now*0.012))*0.03;
    }
  }
}

// ── Ambiance ───────────────────────────────────────────────────────
function applyWeather(){
  const g=G(); if(!g) return;
  const rain=(curWeather==='rain');
  const sky=rain?0x8c97a6:0x87CEEB;
  scene.background=new THREE.Color(sky);
  const far=Math.min(radius*CELL-CELL*1.15, (g.MAX_DEPTH||20)*CELL);
  scene.fog=new THREE.Fog(sky, far*(rain?0.45:0.58), far*(rain?0.90:1.0));
  sun.intensity=rain?.55:1.2; hemi.intensity=rain?.8:1.0;
  cloudMat.map=rain?CLOUD.sombre:CLOUD.clair; cloudMat.needsUpdate=true;
  cloudLayer.position.y=rain?20:26;
  skyMat.map=rain?SKYL.sombre:SKYL.clair; skyMat.needsUpdate=true;
  rainPts.visible=rain;
  puffs.forEach(p=>{p.obj.material.map=rain?PUFF.sombre:PUFF.clair;
    p.obj.material.needsUpdate=true;p.h=rain?11+Math.random()*8:15+Math.random()*12;});
}

// ── Cycle de vie ───────────────────────────────────────────────────
export function buildLevel(){
  if(!started) return;
  const g=G(); if(!g) return;
  curTheme = g.themeName;
  curWeather = g.weather;
  radius = (curTheme==='briques') ? 8 : 6;
  ground.material.map = (curTheme==='briques')?GT.bitume:(curTheme==='buissons'?GT.pelouse:GT.terre);
  ground.material.needsUpdate = true;
  skyline.visible = (curTheme==='briques');
  rebuildProtos(curTheme);
  clearWorld();
  applyWeather();
  updateZone();
  spawnCritters();
  lastCell = Math.floor(g.px)+','+Math.floor(g.py);
}

export function render(){
  if(!started) return false;
  const g=G(); if(!g||!g.MAP) return false;

  // le thème ou la météo a changé (nouveau niveau, défi du jour…)
  if(g.themeName!==curTheme || g.weather!==curWeather) buildLevel();

  const wx=g.px*CELL, wz=g.py*CELL;
  const key=Math.floor(g.px)+','+Math.floor(g.py);
  // scène vide alors qu'une partie tourne : le niveau a démarré avant le moteur
  if(live.size===0 && g.MAP && g.COLS){ buildLevel(); }
  else if(key!==lastCell){ lastCell=key; updateZone(); }

  camera.position.set(wx, EYE, wz);
  camera.rotation.set(0, -g.pAngle-Math.PI/2, 0, 'YXZ');

  const now=performance.now();
  cloudMat.map.offset.x = now*0.0000075;
  cloudMat.map.offset.y = now*0.0000042;
  cloudLayer.position.x=wx; cloudLayer.position.z=wz;
  skyline.position.x=wx;   skyline.position.z=wz;
  for(const p of puffs){
    p.a+=p.sp*16;
    p.obj.position.set(wx+Math.cos(p.a)*p.r, p.h, wz+Math.sin(p.a)*p.r);
  }
  if(curWeather==='rain'){
    const arr=rainGeo.attributes.position.array;
    for(let i=0;i<arr.length/3;i++){
      arr[i*3+1]-=0.45;
      if(arr[i*3+1]<0){arr[i*3+1]=15;arr[i*3]=(Math.random()-.5)*26;arr[i*3+2]=(Math.random()-.5)*26;}
    }
    rainGeo.attributes.position.needsUpdate=true;
    rainPts.position.set(wx,0,wz);
  }
  updateCritters(wx,wz);
  renderer.render(scene,camera);
  return true;
}

export function resize(){
  if(!renderer) return;
  const cv=renderer.domElement;
  const w=cv.clientWidth||window.innerWidth, h=cv.clientHeight||window.innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
}

// ── Démarrage ──────────────────────────────────────────────────────
export async function init(canvas){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(75,1,0.05,420);
  hemi=new THREE.HemisphereLight(0xffffff,0x6b8f3a,1.0);scene.add(hemi);
  sun=new THREE.DirectionalLight(0xfff2d0,1.2);sun.position.set(5,12,4);scene.add(sun);

  GT.bitume=groundTex('bitume');GT.pelouse=groundTex('pelouse');GT.terre=groundTex('terre');
  CLOUD.clair=cloudTex(false);CLOUD.sombre=cloudTex(true);
  PUFF.clair=puffTex(false);PUFF.sombre=puffTex(true);
  SKYL.clair=skylineTex(false);SKYL.sombre=skylineTex(true);
  CT.ant=critterTex('ant');CT.rat=critterTex('rat');CT.bird=critterTex('bird');
  BFLY.push(butterflyTex('#f5a623','#e8741e'),butterflyTex('#6ec6f0','#3f8fd0'),
            butterflyTex('#f2e06a','#e2b33c'));

  ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),
    new THREE.MeshStandardMaterial({map:GT.bitume,roughness:.95}));
  ground.rotation.x=-Math.PI/2;scene.add(ground);

  cloudMat=new THREE.MeshBasicMaterial({map:CLOUD.clair,transparent:true,
    depthWrite:false,fog:false,side:THREE.DoubleSide});
  cloudLayer=new THREE.Mesh(new THREE.PlaneGeometry(420,420),cloudMat);
  cloudLayer.rotation.x=Math.PI/2;cloudLayer.position.y=26;scene.add(cloudLayer);

  skyMat=new THREE.MeshBasicMaterial({map:SKYL.clair,transparent:true,
    side:THREE.BackSide,depthWrite:false,fog:false});
  skyline=new THREE.Mesh(new THREE.CylinderGeometry(150,150,86,52,1,true),skyMat);
  skyline.position.y=40;skyline.renderOrder=-20;skyline.visible=false;scene.add(skyline);

  for(let i=0;i<14;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:PUFF.clair,transparent:true,
      depthWrite:false,fog:false,opacity:.9}));
    const size=22+Math.random()*34;s.scale.set(size,size*0.55,1);s.renderOrder=-10;
    scene.add(s);
    puffs.push({obj:s,a:Math.random()*6.28,r:34+Math.random()*70,
      h:15+Math.random()*12,sp:0.00006+Math.random()*0.00009,size});
  }

  const RN=460;
  rainGeo=new THREE.BufferGeometry();
  const rp=new Float32Array(RN*3);
  for(let i=0;i<RN;i++){rp[i*3]=(Math.random()-.5)*26;rp[i*3+1]=Math.random()*15;
    rp[i*3+2]=(Math.random()-.5)*26;}
  rainGeo.setAttribute('position',new THREE.BufferAttribute(rp,3));
  rainPts=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xbcd4e6,size:.14,
    transparent:true,opacity:.55,fog:false,depthWrite:false}));
  rainPts.visible=false;scene.add(rainPts);

  // chargement des modèles hébergés à côté du jeu
  const loader=new GLTFLoader();
  const files={mur_tag:'mur_tag.glb',mur_vide:'mur_vide.glb',buisson:'buisson.glb',
    mais:'mais.glb',finish:'finish.glb',flaque:'flaque.glb',coffre:'coffre.glb',
    cailloux:'cailloux.glb',spray:'spray.glb'};
  await Promise.all(Object.entries(files).map(([k,f])=>new Promise(res=>{
    loader.load(BASE+f, g=>{RAW[k]=g.scene;res();}, undefined, e=>{console.warn('3D:',f,e);res();});
  })));
  const texLoader=new THREE.TextureLoader();
  await Promise.all([['herbe','herbe.webp'],['egout','egout.webp']].map(([k,f])=>new Promise(res=>{
    texLoader.load(BASE+f, t=>{t.colorSpace=THREE.SRGBColorSpace;TEX[k]=t;res();},undefined,()=>res());
  })));

  if(!RAW.mur_tag && !RAW.buisson && !RAW.mais) throw new Error('aucun modèle chargé');

  started=true;
  resize();
  buildLevel();
  return true;
}
