(function(){
      var EMAIL="ark.educationalist@gmail.com";
      var AV=document.body.getAttribute("data-av")||"/images/logo-icon.webp";
      var WA_NUM=document.body.getAttribute("data-wa")||"";

      function initReveal(){
        var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:0.12});
        document.querySelectorAll('.reveal:not(.in)').forEach(function(el,i){el.style.transitionDelay=(Math.min(i%4,3)*0.06)+'s';io.observe(el);});
      }
      function initMenu(){
        var b=document.getElementById('burger');
        var n=document.getElementById('navlinks');
        var scrim=document.getElementById('navScrim');
        var closeBtn=document.getElementById('navClose');
        if(!b||!n)return;

        function setOpen(open){
          n.classList.toggle('open',open);
          b.classList.toggle('is-open',open);
          b.setAttribute('aria-expanded',open?'true':'false');
          b.setAttribute('aria-label',open?'Close menu':'Open menu');
          document.body.classList.toggle('nav-open',open);
          if(scrim){
            if(open){scrim.hidden=false;requestAnimationFrame(function(){scrim.classList.add('show');});}
            else{scrim.classList.remove('show');scrim.hidden=true;}
          }
        }

        b.onclick=function(){setOpen(!n.classList.contains('open'));};
        if(closeBtn) closeBtn.onclick=function(){setOpen(false);};
        if(scrim) scrim.onclick=function(){setOpen(false);};
        n.querySelectorAll('a').forEach(function(a){
          a.addEventListener('click',function(){setOpen(false);});
        });
        document.addEventListener('keydown',function(e){
          if(e.key==='Escape'&&n.classList.contains('open')) setOpen(false);
        });
        window.addEventListener('resize',function(){
          if(window.matchMedia('(min-width:981px)').matches) setOpen(false);
        });
      }
      function setYear(){var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();}

      /* ---------- calculator ---------- */
      function initCalc(){
        if(!document.getElementById('estPrice'))return;
        if(document.getElementById('estPrice').dataset.ready==='1')return;
        document.getElementById('estPrice').dataset.ready='1';
        // Single-price model in PKR (solo-freelancer rates, min 100k); converted to other currencies below.
        var TYPES={website:{base:100000,incl:5,label:"Website"},webapp:{base:400000,incl:6,label:"Web app"},ecommerce:{base:250000,incl:8,label:"E-commerce"},saas:{base:900000,incl:6,label:"SaaS platform"},mvp:{base:350000,incl:5,label:"MVP / prototype"}};
        var PER_PAGE=15000;
        // platform multiplier — WordPress is the cheapest baseline, custom stacks the most
        var PLATFORM={wordpress:1,wix:1.05,squarespace:1.1,webflow:1.2,framer:1.2,shopify:1.3,custom:1.6,_label:{wordpress:"WordPress",wix:"Wix",squarespace:"Squarespace",webflow:"Webflow",framer:"Framer",shopify:"Shopify",custom:"Custom (Astro / Next.js)"}};
        var COMPLEXITY={simple:1,medium:1.3,complex:1.7,enterprise:2.4,_label:{simple:"Simple",medium:"Medium",complex:"Complex",enterprise:"Enterprise"}};
        var FEAT={auth:60000,payments:120000,api:90000,dashboard:150000,analytics:80000,cms:90000,responsive:40000,seo:60000,multilang:100000,realtime:150000};
        var FEAT_LABEL={auth:"User authentication",payments:"Payment integration",api:"Third-party API",dashboard:"Admin dashboard",analytics:"Analytics & reporting",cms:"CMS",responsive:"Mobile responsive",seo:"SEO optimization",multilang:"Multi-language",realtime:"Real-time features"};
        // Prices are in PKR; m = value_in_currency per 1 PKR (market FX). step = rounding.
        var CUR={
          PKR:{m:1,s:"₨",step:2000}, USD:{m:1/281,s:"$",step:10}, EUR:{m:1/305,s:"€",step:10},
          GBP:{m:1/356,s:"£",step:10}, AED:{m:1/76,s:"AED ",step:25}, INR:{m:1/3.37,s:"₹",step:100},
          SAR:{m:1/75,s:"SAR ",step:25}, CAD:{m:1/206,s:"C$",step:10}, AUD:{m:1/187,s:"A$",step:10}
        };
        function autoCurrency(){
          try{
            var tz=(Intl.DateTimeFormat().resolvedOptions().timeZone)||'';
            var map={'Asia/Karachi':'PKR','Asia/Dubai':'AED','Asia/Muscat':'AED','Asia/Kolkata':'INR','Asia/Calcutta':'INR','Europe/London':'GBP','Asia/Riyadh':'SAR','America/Toronto':'CAD','America/Vancouver':'CAD','America/Edmonton':'CAD'};
            if(map[tz])return map[tz];
            if(/^Europe\//.test(tz))return 'EUR';
            if(/^Australia\//.test(tz))return 'AUD';
            if(/^America\//.test(tz))return 'USD';
            if(/^Asia\//.test(tz))return 'PKR';
          }catch(e){}
          return 'PKR';
        }
        var state={type:"website",platform:"wordpress",pages:5,complexity:"simple",features:{},timeline:"standard",currency:autoCurrency()};
        var $=function(id){return document.getElementById(id);};
        function roundTo(n,s){return Math.round(n/s)*s;}
        function fmtVal(v){var c=CUR[state.currency]||CUR.USD;return c.s+roundTo(v*c.m,c.step||50).toLocaleString('en-US');}
        function compute(){
          var t=TYPES[state.type],price=t.base,extra=Math.max(0,state.pages-t.incl);
          var bd=[{l:t.label+" · base",v:fmtVal(t.base)}];
          price+=extra*PER_PAGE;
          if(extra>0)bd.push({l:extra+" extra page"+(extra>1?"s":""),v:"+"+fmtVal(extra*PER_PAGE)});
          Object.keys(state.features).forEach(function(k){if(!state.features[k])return;var r=FEAT[k];if(r){price+=r;bd.push({l:FEAT_LABEL[k],v:"+"+fmtVal(r)});}});
          var cm=COMPLEXITY[state.complexity];price*=cm;
          if(state.complexity!=="simple")bd.push({l:COMPLEXITY._label[state.complexity]+" complexity",v:"×"+cm});
          var pm=PLATFORM[state.platform];price*=pm;
          bd.push({l:PLATFORM._label[state.platform]+" platform",v:pm===1?"base rate":"×"+pm});
          if(state.timeline==="rush"){price*=1.5;bd.push({l:"Rush timeline",v:"+50%"});}
          else if(state.timeline==="flexible"){price*=0.9;bd.push({l:"Flexible timeline",v:"−10%"});}
          price=Math.max(100000,price); // floor: PKR 100k minimum
          return {price:price,scope:Math.max(0,Math.min(1,(price-100000)/(6000000-100000))),breakdown:bd};
        }
        var REDUCE=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        function animateNum(el,to){
          var from=parseFloat(el.dataset.cur||"0");el.dataset.cur=to;var finalTxt=fmtVal(to);
          cancelAnimationFrame(el._raf||0);clearTimeout(el._to||0);
          if(REDUCE||from===to){el.textContent=finalTxt;return;}
          var start=null;
          function tick(ts){if(!start)start=ts;var p=Math.min(1,(ts-start)/450),e=1-Math.pow(1-p,3);el.textContent=fmtVal(from+(to-from)*e);if(p<1)el._raf=requestAnimationFrame(tick);else el.textContent=finalTxt;}
          el._raf=requestAnimationFrame(tick);el._to=setTimeout(function(){el.textContent=finalTxt;},600);
        }
        function render(){
          var r=compute();animateNum($('estPrice'),r.price);
          var pl=$('estPlatform');if(pl)pl.textContent=PLATFORM._label[state.platform];
          $('gaugeFill').style.width=(12+r.scope*88)+"%";
          $('scopeLabel').textContent=r.scope<0.22?"Simple build":r.scope<0.48?"Standard build":r.scope<0.74?"Advanced build":"Complex build";
          $('breakdown').innerHTML=r.breakdown.map(function(b){return '<li><span>'+b.l+'</span><span>'+b.v+'</span></li>';}).join('')||'<li class="empty">Select options</li>';
          var rng=$('pageRange');rng.style.setProperty('--fill',((rng.value-rng.min)/(rng.max-rng.min)*100)+"%");
        }
        var page=document.querySelector('.calc-grid');
        page.addEventListener('click',function(e){
          var b=e.target.closest('button[data-val]');if(!b)return;
          var group=b.parentElement.getAttribute('data-group');
          if(group==='features'){var v=b.getAttribute('data-val');state.features[v]=!state.features[v];b.classList.toggle('active',state.features[v]);}
          else if(group){b.parentElement.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===b);});var val=b.getAttribute('data-val');if(group==='type')state.type=val;else if(group==='platform')state.platform=val;else if(group==='complexity')state.complexity=val;else if(group==='timeline')state.timeline=val;else if(group==='currency')state.currency=val;}
          render();
        });
        $('pageRange').addEventListener('input',function(){state.pages=+this.value;$('pageVal').textContent=this.value>=50?"50+":this.value;render();});
        $('calcQuote').addEventListener('click',function(e){
          e.preventDefault();var r=compute();
          var feats=Object.keys(state.features).filter(function(k){return state.features[k];}).map(function(k){return FEAT_LABEL[k];}).join(", ")||"none";
          var subject="Website quote request — "+TYPES[state.type].label;
          var body="Hi Abdul, I used your calculator — here's my project:\n\nProject type: "+TYPES[state.type].label+"\nPlatform: "+PLATFORM._label[state.platform]+"\nComplexity: "+COMPLEXITY._label[state.complexity]+"\nPages / screens: "+state.pages+"\nFeatures: "+feats+"\nTimeline: "+state.timeline+"\n\nEstimated price shown: "+fmtVal(r.price)+"\n\nPlease send me an exact quote.";
          window.location.href="mailto:"+EMAIL+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
        });
        $('calcChat').addEventListener('click',function(){if(window.arkOpenChat)window.arkOpenChat();});
        // reflect the auto-detected currency in the toggle
        var curWrap=document.querySelector('[data-group="currency"]');
        if(curWrap){var m=curWrap.querySelector('[data-val="'+state.currency+'"]');curWrap.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===m);});}
        render();
      }

      /* ---------- chatbot ---------- */
      function initChat(){
        var launch=document.getElementById('arkLaunch'),chat=document.getElementById('arkChat'),
            msgs=document.getElementById('arkMsgs'),chipsEl=document.getElementById('arkChips'),
            form=document.getElementById('arkForm'),input=document.getElementById('arkInput'),
            closeBtn=document.getElementById('arkClose');
        if(!launch||!chat)return;
        if(launch.dataset.ready==='1')return;
        launch.dataset.ready='1';
        var started=false,mode='menu',step=0,data={},waStep=0,waData={};
        function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
        function scroll(){msgs.scrollTop=msgs.scrollHeight;}
        function me(t){var r=document.createElement('div');r.className='ark-row me';r.innerHTML='<div class="ark-bub">'+esc(t)+'</div>';msgs.appendChild(r);scroll();}
        function typing(){var r=document.createElement('div');r.className='ark-row bot';r.id='arkT';r.innerHTML='<img src="'+AV+'" alt=""><div class="ark-bub"><span class="ark-typing"><i></i><i></i><i></i></span></div>';msgs.appendChild(r);scroll();}
        function untype(){var t=document.getElementById('arkT');if(t)t.remove();}
        function bot(html,chips,delay){typing();setTimeout(function(){untype();var r=document.createElement('div');r.className='ark-row bot';r.innerHTML='<img src="'+AV+'" alt=""><div class="ark-bub">'+html+'</div>';msgs.appendChild(r);setChips(chips||[]);scroll();},delay||520);}
        function setChips(list){chipsEl.innerHTML='';list.forEach(function(c){var b=document.createElement('button');b.className='ark-chip'+(c.send?' send':'')+(c.wa?' wa':'');b.textContent=c.label;b.onclick=function(){c.onClick?c.onClick():pick(c.val||c.label,c.label);};chipsEl.appendChild(b);});}
        var MENU=[{label:'About Abdul',val:'about'},{label:'His work',val:'work'},{label:'Services',val:'services'},{label:'Price estimate',val:'estimate'},{label:'Get a quote',val:'quote'},{label:'WhatsApp Abdul',val:'whatsapp',wa:true}];
        function answer(intent){
          if(intent==='about')return bot("<b>Abdul Rehman Khan</b> is a <b>senior CMS expert and software engineer</b> with <b>8+ years</b> in web engineering, DevOps and design. He builds on <b>any platform</b> — WordPress, Shopify, Webflow, Wix, Squarespace, Framer — plus custom Astro/Next.js, handles the <b>hosting &amp; DevOps</b> (WHM/cPanel, AWS, domains, migrations), designs the graphics, and <b>automates</b> the busywork with Claude, ChatGPT, n8n &amp; Zapier. Remote-first for the <b>USA, Canada, UAE, UK</b> and every other country.",MENU.concat([{label:'Start an enquiry',val:'quote'}]));
          if(intent==='work')return bot("He's shipped <b>90+ projects</b> — real estate (Prescott), health-tech &amp; pharma (Hepius, Galaxy Pharma), Shopify e-commerce, finance and agency sites across WordPress, Webflow, Wix &amp; custom stacks. Browse the <b>Projects</b> page — search or filter, and click any card for a full preview.",[{label:'Get a quote',val:'quote'},{label:'Services',val:'services'}]);
          if(intent==='services')return bot("Abdul offers <b>full-service delivery</b>:<ul><li><b>CMS websites</b> on any platform (WordPress, Shopify, Webflow, Wix, Squarespace, Framer + custom)</li><li><b>E-commerce</b> (WooCommerce / Shopify)</li><li><b>DevOps &amp; hosting</b> — WHM/cPanel, AWS, domains, migrations</li><li><b>AI &amp; workflow automation</b> (Claude, ChatGPT, n8n, Zapier)</li><li><b>Graphic design</b> &amp; branding</li></ul>",[{label:'Price estimate',val:'estimate'},{label:'Get a quote',val:'quote'}]);
          if(intent==='estimate'){bot("Opening the instant cost calculator — build your project and see a live estimate. 👇",[]);setTimeout(function(){close();window.location.href='/estimate';},700);return;}
          if(intent==='pricing')return bot("Projects are quoted to scope. Use the <b>calculator</b> for an instant ballpark, or share details for an exact quote.",[{label:'Price estimate',val:'estimate'},{label:'Get a quote',val:'quote'}]);
          if(intent==='quote'){startEnquiry();return;}
          if(intent==='whatsapp'){startWA();return;}
          return bot("I can tell you about Abdul's work, give a price estimate, take your details for a quote, or connect you on WhatsApp. What would you like?",MENU);
        }
        var STEPS=[
          {key:'name',q:"Perfect — let's get you a tailored quote. First, what's your <b>name</b>?",type:'text'},
          {key:'email',q:function(){return "Thanks "+esc(data.name||'')+"! What's the best <b>email</b>?";},type:'text',validate:function(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);},err:"That doesn't look like a valid email — try again?"},
          {key:'company',q:"Your <b>company or brand</b>?",type:'text',chips:[{label:'Skip',val:'—'}]},
          {key:'project',q:"What do you need built?",type:'chips',chips:[{label:'New website'},{label:'Redesign'},{label:'E-commerce store'},{label:'Web app'},{label:'Automation'},{label:'Not sure'}]},
          {key:'budget',q:"Rough <b>budget</b> range?",type:'chips',chips:[{label:'< $1k'},{label:'$1k – $3k'},{label:'$3k – $8k'},{label:'$8k+'},{label:'Not sure'}]},
          {key:'timeline',q:"And your <b>timeline</b>?",type:'chips',chips:[{label:'ASAP'},{label:'2–4 weeks'},{label:'1–3 months'},{label:'Flexible'}]},
          {key:'notes',q:"Anything else Abdul should know?",type:'text',chips:[{label:'Skip',val:'—'}]}
        ];
        function startEnquiry(){mode='enquiry';step=0;data={};askStep();}
        function startWA(){mode='wa';waStep=0;waData={};bot("Sure — let's message Abdul on <b>WhatsApp</b>. First, what's your <b>name</b>?");input.placeholder='Type your name…';}
        function waRecord(val){
          if(waStep===0){waData.name=val;waStep=1;bot("Thanks "+esc(val)+"! And your <b>message</b>?");input.placeholder='Type your message…';return;}
          waData.msg=val;mode='done';input.placeholder='Type a message…';
          var text="Hi Abdul, I'm "+waData.name+". "+waData.msg;
          var url="https://wa.me/"+WA_NUM+"?text="+encodeURIComponent(text);
          bot("Perfect — tap below to open <b>WhatsApp</b> with your message ready to send. 💬",[{label:'Open WhatsApp',wa:true,onClick:function(){window.open(url,'_blank','noopener');}},{label:'Start over',onClick:function(){answer('quote');}}]);
        }
        function askStep(){var s=STEPS[step];var q=typeof s.q==='function'?s.q():s.q;bot(q,(s.chips||[]).map(function(c){return {label:c.label,val:c.val||c.label};}));input.placeholder=s.type==='chips'?'Pick an option above…':'Type your answer…';}
        function record(val){var s=STEPS[step];if(s.validate&&!s.validate(val)){bot(s.err||"Try again?");return;}data[s.key]=val;step++;if(step<STEPS.length)askStep();else finish();}
        function finish(){mode='done';input.placeholder='Type a message…';
          var sum="Here's what I've got:<ul><li><b>Name:</b> "+esc(data.name||'')+"</li><li><b>Email:</b> "+esc(data.email||'')+"</li>"+(data.company&&data.company!=='—'?"<li><b>Company:</b> "+esc(data.company)+"</li>":"")+"<li><b>Project:</b> "+esc(data.project||'')+"</li><li><b>Budget:</b> "+esc(data.budget||'')+"</li><li><b>Timeline:</b> "+esc(data.timeline||'')+"</li>"+(data.notes&&data.notes!=='—'?"<li><b>Notes:</b> "+esc(data.notes)+"</li>":"")+"</ul>Send it to Abdul now?";
          bot(sum,[{label:'✉ Send enquiry',send:true,onClick:sendMail},{label:'Copy details',onClick:copyDetails},{label:'Start over',onClick:function(){answer('quote');}}]);}
        function body(){return "New project enquiry from your portfolio\n\nName: "+(data.name||'')+"\nEmail: "+(data.email||'')+"\nCompany: "+(data.company&&data.company!=='—'?data.company:'-')+"\nProject: "+(data.project||'')+"\nBudget: "+(data.budget||'')+"\nTimeline: "+(data.timeline||'')+"\nNotes: "+(data.notes&&data.notes!=='—'?data.notes:'-');}
        function sendMail(){var subj="Project enquiry — "+(data.name||'')+" ("+(data.project||'')+")";window.location.href="mailto:"+EMAIL+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body());bot("Opening your email app with everything filled in — just hit <b>send</b>. 🚀",[{label:'Copy details',onClick:copyDetails}]);}
        function copyDetails(){var txt="To: "+EMAIL+"\n\n"+body();if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){bot("Copied! Paste it into an email to "+EMAIL+". 📋");},function(){bot("Here it is:<br><br>"+esc(txt).replace(/\n/g,'<br>'));});}else bot("Here it is:<br><br>"+esc(txt).replace(/\n/g,'<br>'));}
        function pick(val,label){me(label);if(mode==='enquiry')record(val);else answer(val);}
        function guess(t){var s=t.toLowerCase();if(/whatsapp|wa\b/.test(s))return 'whatsapp';if(/^\s*(hire|get a quote|start an enquiry)\b/.test(s))return 'quote';if(/book.*(call|strategy)|strategy call|schedule/.test(s))return 'quote';return null;}
        // free-typed questions go to the Gemini proxy; scripted flows (quote/whatsapp) still win
        var aiHist=[];
        function botNow(html,chips){untype();var r=document.createElement('div');r.className='ark-row bot';r.innerHTML='<img src="'+AV+'" alt=""><div class="ark-bub">'+html+'</div>';msgs.appendChild(r);setChips(chips||[]);scroll();}
        function fmtAI(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}
        function askAI(t){
          aiHist.push({role:'user',text:t});
          typing();
          fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:t,history:aiHist})})
            .then(function(r){return r.json();})
            .then(function(d){
              if(d&&d.ok&&d.reply){ aiHist.push({role:'model',text:d.reply}); botNow(fmtAI(d.reply), MENU); }
              else { untype(); answer('menu'); } // no key / error → scripted help
            })
            .catch(function(){ untype(); answer('menu'); });
        }
        form.onsubmit=function(e){e.preventDefault();var t=input.value.trim();if(!t)return;input.value='';me(t);if(mode==='enquiry')record(t);else if(mode==='wa')waRecord(t);else{var g=guess(t);if(g)answer(g);else askAI(t);}};
        function open(){chat.hidden=false;launch.hidden=true;if(!started){started=true;bot("👋 Hi! I'm <b>Abdul's assistant</b>. Ask about his work, get an instant price estimate, or send him a project enquiry.",MENU,260);}setTimeout(function(){input.focus();},300);}
        function close(){chat.hidden=true;launch.hidden=false;}
        window.arkOpenChat=open;
        launch.onclick=open;closeBtn.onclick=close;
        var waBtn=document.getElementById('arkWa');
        if(waBtn)waBtn.onclick=function(){if(chat.hidden)open();startWA();};
        if(!window.__arkEsc){window.__arkEsc=true;document.addEventListener('keydown',function(e){if(e.key==='Escape'){var c=document.getElementById('arkChat');if(c&&!c.hidden){c.hidden=true;var l=document.getElementById('arkLaunch');if(l)l.hidden=false;}}});}
      }

      function initLightbox(){
        if(window.__arkLB) return; window.__arkLB=true; // bind delegated listeners once
        // NOTE: elements are re-queried on each use — the ClientRouter swaps <body>
        // on navigation, so cached references would go stale after a page transition.
        var lastFocus=null;
        function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
        function open(card){
          var lb=document.getElementById('lb'); if(!lb) return;
          var img=card.getAttribute('data-img'); if(!img) return;
          var title=card.getAttribute('data-title'),cat=card.getAttribute('data-cat'),
              platform=card.getAttribute('data-platform'),live=card.getAttribute('data-live');
          lastFocus=document.activeElement;
          var lbImg=document.getElementById('lbImg');
          lbImg.src=img; lbImg.alt=title+' — full screenshot';
          document.getElementById('lbTitle').textContent=title;
          document.getElementById('lbCat').textContent=cat;
          document.getElementById('lbTags').innerHTML='<b>'+esc(platform)+'</b><b>'+esc(cat)+'</b>';
          document.getElementById('lbActions').innerHTML=live
            ? '<a class="btn primary" href="'+esc(live)+'" target="_blank" rel="noopener">Open live site ↗</a>'
            : '<span class="lb-caseb">Private / case study — no public URL</span>';
          lb.hidden=false; lb.setAttribute('aria-hidden','false');
          document.body.style.overflow='hidden';
          var shot=document.getElementById('lbShot'); if(shot) shot.scrollTop=0;
          document.getElementById('lbClose').focus();
        }
        function close(){ var lb=document.getElementById('lb'); if(!lb) return; lb.hidden=true; lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; var i=document.getElementById('lbImg'); if(i) i.src=''; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
        document.addEventListener('click',function(e){
          if(e.target.closest('[data-live-link]')) return; // let the live link open normally
          if(e.target.closest('#lbClose')){ close(); return; }
          var card=e.target.closest('.proj[data-title]'); if(card){ open(card); return; }
          var inner=e.target.closest('#lbInner'); var lb=e.target.closest('#lb');
          if(lb && !inner) close(); // click on backdrop outside the panel
        });
        document.addEventListener('keydown',function(e){
          var lb=document.getElementById('lb');
          if(e.key==='Escape'&&lb&&!lb.hidden){ close(); return; }
          if((e.key==='Enter'||e.key===' ')){ var c=e.target.closest&&e.target.closest('.proj[data-title]'); if(c){ e.preventDefault(); open(c); } }
        });
      }
      function initPreloader(){
        if(typeof window.__arkPreHide==='function') window.__arkPreHide();
      }
      function initStackCards(){
        if(!document.querySelector('[data-stack]')) return;
        if(document.documentElement.dataset.stackBound==='1'){
          window.dispatchEvent(new Event('resize'));
          return;
        }
        document.documentElement.dataset.stackBound='1';
        var reduceMq=window.matchMedia('(prefers-reduced-motion: reduce)');
        function update(){
          var decks=document.querySelectorAll('[data-stack]');
          var reduce=reduceMq.matches;
          decks.forEach(function(deck){
            var noshrink=deck.hasAttribute('data-stack-noshrink');
            var cards=deck.querySelectorAll('[data-stack-card]');
            cards.forEach(function(card,i){
              if(reduce||noshrink||window.matchMedia('(max-width:980px)').matches){
                card.style.transform='';
                return;
              }
              var slot=card.closest('.svc-slot');
              var rect=(slot||card).getBoundingClientRect();
              var stickyPad=112;
              var stuck=Math.max(0,stickyPad-rect.top);
              var depth=Math.min(1,stuck/Math.max(160,rect.height*0.35));
              var remaining=cards.length-i-1;
              var stackedScale=Math.max(0.75,1-remaining*0.05);
              var scale=1-(1-stackedScale)*depth;
              card.style.transform='scale('+scale.toFixed(4)+')';
            });
          });
        }
        update();
        window.addEventListener('scroll',update,{passive:true});
        window.addEventListener('resize',update,{passive:true});
      }
      function initPage(){
        initPreloader();
        setYear(); initReveal(); initMenu(); initLightbox();
        var later=function(){ initCalc(); initChat(); initStackCards(); };
        if('requestIdleCallback' in window) requestIdleCallback(later,{timeout:1800});
        else setTimeout(later,1);
        var launch=document.getElementById('arkLaunch');
        if(launch && !launch.dataset.idle){
          launch.dataset.idle='1';
          launch.addEventListener('click', function(){
            later();
            if(window.arkOpenChat) window.arkOpenChat();
          }, {once:true});
        }
      }
      if (!window.__arkSiteBound) {
        window.__arkSiteBound = true;
        document.addEventListener('astro:page-load', initPage);
      }
    })();
