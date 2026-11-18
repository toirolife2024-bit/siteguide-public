/* SiteGuide public viewer v0.2: no browser extension required. No site data is read or transmitted. */
(() => {
  'use strict';
  const tag=document.currentScript;
  const source=tag?.dataset.guideUrl;
  if(!source)return;
  let jsonUrl;
  try{jsonUrl=new URL(source,location.href);if(!['https:','http:'].includes(jsonUrl.protocol))return;}catch{return;}
  let store=null,activeGuide=null,currentStep=0,eligible=[],root=null,layer=null;
  const css=`
    *{box-sizing:border-box;font-family:system-ui,-apple-system,'Noto Sans JP',sans-serif}
    button{cursor:pointer}
    .helper{position:fixed;bottom:18px;right:18px;width:52px;height:52px;display:grid;place-items:center;border:0;border-radius:50%;background:#225cce;color:white;box-shadow:0 7px 30px #0a376b55;font-size:25px;font-weight:900;pointer-events:auto}
    .menu{position:fixed;bottom:79px;right:18px;max-width:min(330px,calc(100vw - 36px));min-width:240px;padding:14px;background:white;color:#1d334e;box-shadow:0 14px 38px #102a4666;border:1px solid #d3e1f0;border-radius:14px;pointer-events:auto}
    .menu h2{font-weight:800;font-size:15px;margin:0 0 10px}.menu button{display:block;width:100%;margin:5px 0;padding:9px;border-radius:9px;background:#f3f7fe;border:1px solid #deeafa;color:#1d4b88;font-size:12px;text-align:left}
    .shade{position:fixed;inset:0;background:#12274430;pointer-events:none}
    .focus{position:fixed;border:3px solid #2d78e6;border-radius:7px;box-shadow:0 0 0 4px #3475e528;pointer-events:none}
    .tip{position:fixed;width:min(315px,calc(100vw - 24px));padding:16px;background:#fff;color:#183858;border-radius:13px;box-shadow:0 14px 40px #142e4770;border:1px solid #dae5f3;pointer-events:auto}
    .tip small{display:block;color:#7690a8;font-size:11px}.tip strong{display:block;font-weight:800;font-size:17px;margin:8px 0;line-height:1.4}.tip p{white-space:pre-wrap;overflow-wrap:anywhere;color:#314b68;font-size:13px;line-height:1.6;margin:0 0 14px}
    .actions{display:flex;justify-content:flex-end;gap:7px}.actions button{padding:8px 10px;border-radius:8px;border:1px solid #cfdeec;background:#fff;color:#284e77;font-size:12px}.actions .next{background:#215bce;color:#fff;border-color:#215bce}
  `;
  const node=(t,cls='',text='')=>{const e=document.createElement(t);if(cls)e.className=cls;e.textContent=text;return e;};
  function ensureRoot(){if(root)return;const host=document.createElement('div');host.setAttribute('data-siteguide-viewer','');host.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483000;';root=host.attachShadow({mode:'open'});const style=node('style');style.textContent=css;root.append(style);layer=node('div');root.append(layer);(document.body||document.documentElement).append(host);}
  function clear(){layer?.replaceChildren();}
  function target(step){try{return document.querySelector(step.selector)}catch{return null;}}
  function visible(el){if(!el || el.closest('[hidden],[aria-hidden="true"]'))return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}
  const steps=()=>activeGuide?.steps||[];
  function stop(){activeGuide=null;currentStep=0;showHelp();}
  function move(delta){currentStep+=delta;if(currentStep>=steps().length){stop();return;}if(currentStep<0)currentStep=0;renderStep();}
  function renderStep(shouldScroll=true){if(!activeGuide)return;clear();ensureRoot();
    while(currentStep<steps().length && !visible(target(steps()[currentStep])))currentStep++;
    if(currentStep>=steps().length){stop();return;}
    const step=steps()[currentStep],el=target(step);
    if(shouldScroll)el.scrollIntoView({block:'center',behavior:'instant'});
    requestAnimationFrame(()=>{
      if(!activeGuide)return;
      clear();const r=el.getBoundingClientRect();if(!r.width||!r.height){move(1);return;}
      layer.append(node('div','shade'));
      const focus=node('div','focus');focus.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;layer.append(focus);
      const box=node('section','tip');box.setAttribute('role','dialog');box.setAttribute('aria-label','サイトの使い方');
      box.append(node('small','',`${activeGuide.title}　${currentStep+1}/${steps().length}`),node('strong','',step.title),node('p','',step.body||'こちらを確認してください。'));
      const actions=node('div','actions');
      for(const [label,handler,cls] of [ ['閉じる',stop,''], ['戻る',()=>move(-1),''], [currentStep===steps().length-1?'完了':'次へ',()=>move(1),'next'] ]){
        const b=node('button',cls,label);b.type='button';b.addEventListener('click',handler);if(label==='戻る'&&currentStep===0)b.disabled=true;actions.append(b);
      }
      box.append(actions);layer.append(box);
      const h=box.offsetHeight||175,w=box.offsetWidth||315;
      let top=step.placement==='top'?r.top-h-12:r.bottom+12;
      if(step.placement==='auto')top=r.bottom+h+12>innerHeight?r.top-h-12:r.bottom+12;
      if(top<6||top+h>innerHeight-6)top=Math.max(6,Math.min(innerHeight-h-6,r.top));
      box.style.top=top+'px';box.style.left=Math.max(6,Math.min(r.left,innerWidth-w-6))+'px';
      box.querySelector('button:last-child')?.focus({preventScroll:true});
    });
  }
  function start(g){if(!g?.steps?.length)return;activeGuide=g;currentStep=0;clear();if(g.trigger==='first'){
    try{localStorage.setItem('siteguide-seen:'+encodeURIComponent(g.origin+g.path+g.id),'1');}catch{}
  }renderStep();}
  function showHelp(){ensureRoot();clear();if(!eligible.length)return;
    const button=node('button','helper','?');button.type='button';button.setAttribute('aria-label','このページの使い方');
    button.addEventListener('click',()=>{const showing=layer.querySelector('.menu');if(showing){showing.remove();return;}
      const menu=node('section','menu');menu.append(node('h2','','このページの使い方'));for(const guide of eligible){const b=node('button','',guide.title);b.type='button';b.addEventListener('click',()=>start(guide));menu.append(b);}layer.append(menu);});
    layer.append(button);
  }
  function matching(pkg){
    if(!pkg||pkg.version!==1||pkg.origin!==location.origin||!Array.isArray(pkg.guides))return [];
    return pkg.guides.filter(g=>g && g.origin===location.origin && g.path===location.pathname && g.status==='ready' && Array.isArray(g.steps)&&g.steps.length&&g.steps.length<=30);
  }
  async function init(){
    try{
      const response=await fetch(jsonUrl,{mode:'cors',credentials:'omit',cache:'no-cache'});
      if(!response.ok)return;
      const pkg=await response.json();eligible=matching(pkg);if(!eligible.length)return;
      ensureRoot();showHelp();
      const auto=eligible.find(g=>{
        if(g.trigger!=='first')return false;
        try{return localStorage.getItem('siteguide-seen:'+encodeURIComponent(g.origin+g.path+g.id))!=='1';}catch{return true;}
      });
      if(auto)setTimeout(()=>{if(!activeGuide)start(auto);},600);
    }catch{/* Fail safely when the JSON/CDN is unavailable. */}
  }
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeGuide)stop();});
  window.addEventListener('resize',()=>{if(activeGuide)renderStep(false);});
  window.addEventListener('scroll',()=>{if(activeGuide)renderStep(false);},{capture:true,passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
