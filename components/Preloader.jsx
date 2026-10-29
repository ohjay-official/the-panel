// First-load screen. The bar and percentage follow real loading milestones:
// the document parsed, the fonts ready, and every asset loaded. A short script right
// after this markup drives it, so it works before React has started.
const BOOT_JS = `(function(){
var b=document.getElementById('boot'),bar=document.getElementById('bootBar'),pct=document.getElementById('bootPct');
if(!b||!bar||!pct)return;
var target=0.12,shown=0,finished=false;
function set(t){if(t>target)target=t;}
if(document.readyState!=='loading')set(0.4);else document.addEventListener('DOMContentLoaded',function(){set(0.4);});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){set(0.75);});else set(0.75);
if(document.readyState==='complete')set(1);else window.addEventListener('load',function(){set(1);});
setTimeout(function(){set(1);},6000);
function tick(){
  shown+=(target-shown)*0.14; if(target-shown<0.004)shown=target;
  bar.style.transform='scaleX('+shown+')';
  pct.textContent='LOADING '+Math.round(shown*100)+'%';
  if(shown>=1&&!finished){finished=true;setTimeout(function(){b.classList.add('done');document.documentElement.setAttribute('data-loaded','1');},280);return;}
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();`;

export default function Preloader() {
  return (
    <>
      <div className="boot" id="boot" aria-hidden="true" suppressHydrationWarning>
        <div className="bar">
          <i id="bootBar" suppressHydrationWarning />
        </div>
        <p id="bootPct" suppressHydrationWarning>
          LOADING 0%
        </p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT_JS }} />
    </>
  );
}
