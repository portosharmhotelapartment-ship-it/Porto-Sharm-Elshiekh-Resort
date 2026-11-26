let lang='ar';
const languageButton=document.getElementById('language');
languageButton.addEventListener('click',()=>{lang=lang==='ar'?'en':'ar';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-ar]').forEach(el=>{const value=el.dataset[lang];if(value)el.textContent=value;});languageButton.textContent=lang==='ar'?'EN':'عربي';});
document.getElementById('year').textContent=new Date().getFullYear();
const menu=document.getElementById('menu-toggle');menu.addEventListener('click',()=>document.querySelector('nav').classList.toggle('open'));
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('nav').classList.remove('open')));
document.querySelectorAll('[data-choice]').forEach(a=>a.addEventListener('click',()=>{const select=document.getElementById('stay-type');select.value=a.dataset.choice;select.dispatchEvent(new Event('change',{bubbles:true}));}));
document.getElementById('booking-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,status=document.getElementById('status'),data=Object.fromEntries(new FormData(form));data.adults=Number(data.adults);data.children=Number(data.children||0);if(data.check_out<=data.check_in){status.textContent=lang==='ar'?'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.':'Check-out must be after check-in.';return;}status.textContent=lang==='ar'?'جارٍ إرسال الطلب...':'Sending request...';try{const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed');const stayTypeLabel=({premium:'الشاليهات المميزة',standard:'الشاليهات الفاخرة','Hotel Accommodation':'الإقامة الفندقية'})[data.stay_type]||data.stay_type;
const message=lang==='ar'?[
'طلب حجز جديد - منتجع بورتو شرم',
'رقم الطلب: '+result.booking_id,
'اسم العميل: '+data.guest_name,
'رقم الهاتف: '+data.phone,
'نوع الإقامة: '+stayTypeLabel,
'خطة الإقامة: '+({Daily:'يومي',Monthly:'شهري','Half Board':'نصف إقامة','Room Only':'غرفة فقط'})[data.plan]||data.plan,
'تاريخ الوصول: '+data.check_in,
'تاريخ المغادرة: '+data.check_out,
'عدد البالغين: '+data.adults,
'عدد الأطفال: '+data.children,
'ملاحظات: '+(data.notes||'لا يوجد')
].join('\\n'):[
'New booking request - Porto Sharm Resort',
'Booking reference: '+result.booking_id,
'Guest name: '+data.guest_name,
'Phone: '+data.phone,
'Accommodation: '+stayTypeLabel,
'Plan: '+data.plan,
'Check-in: '+data.check_in,
'Check-out: '+data.check_out,
'Adults: '+data.adults,
'Children: '+data.children,
'Notes: '+(data.notes||'None')
].join('\\n');const whatsappUrl='https://wa.me/201061307181?text='+encodeURIComponent(message);status.textContent=lang==='ar'?'تم تسجيل طلبك بنجاح برقم '+result.booking_id+'، جارٍ فتح واتساب لإرسال التفاصيل.':'Your booking request was saved. Opening WhatsApp to send the details.';form.reset();window.location.href=whatsappUrl;}catch(error){status.textContent=lang==='ar'?'نموذج الحجز يحتاج تفعيل قاعدة البيانات أولاً. يمكنك التواصل معنا عبر واتساب.':'The booking form needs its database configured first. Please contact us on WhatsApp.';}});

async function loadResortMedia(){try{const response=await fetch('/api/media-gallery');if(!response.ok)throw new Error('Media unavailable');const {groups}=await response.json();const makeGallery=(items,alt)=>items.map(item=>`<img src="${item.url}" alt="${alt}" loading="lazy" decoding="async">`).join('');const makeCarousel=(slot,items,alt)=>{if(!slot||!items.length)return;slot.classList.remove('media-slot');slot.innerHTML=`<div class="photo-carousel"><div class="photo-carousel-track">${makeGallery(items,alt)}</div><button class="photo-arrow photo-prev" type="button" aria-label="الصورة السابقة">‹</button><button class="photo-arrow photo-next" type="button" aria-label="الصورة التالية">›</button><div class="photo-counter">1 / ${items.length}</div></div>`;slot.querySelectorAll('.photo-carousel-track img').forEach(img=>{img.style.setProperty('object-fit','contain','important');img.style.setProperty('width','100%','important');img.style.setProperty('height','100%','important');img.style.setProperty('max-height','none','important');});const track=slot.querySelector('.photo-carousel-track');const counter=slot.querySelector('.photo-counter');const update=()=>{const index=Math.round(track.scrollLeft/track.clientWidth);counter.textContent=(index+1)+' / '+items.length;};slot.querySelector('.photo-prev').addEventListener('click',()=>track.scrollBy({left:-track.clientWidth,behavior:'smooth'}));slot.querySelector('.photo-next').addEventListener('click',()=>track.scrollBy({left:track.clientWidth,behavior:'smooth'}));track.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});};document.querySelectorAll('.stay-card').forEach(card=>{const slot=card.querySelector('.stay-photo');if(!slot)return;const key=card.id==='hotel'?'hotel':card.id==='premium'?'premium':'standard';makeCarousel(slot,groups[key]||[],card.querySelector('h3')?.textContent||'Porto Sharm accommodation');});const general=groups.general||[];const gallery=document.querySelector('.gallery-grid');if(gallery&&general.length){gallery.classList.add('photo-carousel-host');makeCarousel(gallery,general,'Porto Sharm Resort facilities and views');}const intro=document.querySelector('.intro-media');if(intro&&general.length)intro.innerHTML=makeGallery(general.slice(0,1),'Porto Sharm Resort');const wide=document.querySelector('.wide-media');if(wide&&general.length>1)wide.innerHTML=makeGallery(general.slice(1,2),'Porto Sharm Resort facilities');const hero=groups.hero||[];const heroSection=document.querySelector('.porto-landing');if(heroSection&&hero.length){const image=document.createElement('img');image.className='hero-photo';image.src=hero[0].url;image.alt='Porto Sharm Resort';image.loading='eager';heroSection.prepend(image);}}catch(error){console.warn('Resort media could not be loaded',error);}}
loadResortMedia();

async function loadManagedStayTypes(){try{const [stayResponse,mediaResponse]=await Promise.all([fetch("/api/stay-types"),fetch("/api/media-gallery")]);if(!stayResponse.ok||!mediaResponse.ok)return;const {stays=[]}=await stayResponse.json();const media=(await mediaResponse.json()).groups||{};const section=document.querySelector("#stays .section-wrap");if(!section)return;section.querySelectorAll(".managed-stay-card").forEach(x=>x.remove());const oldPremium=document.getElementById("premium"),oldStandard=document.getElementById("standard");if(oldPremium)oldPremium.remove();if(oldStandard)oldStandard.remove();const bookingSelect=document.getElementById("stay-type");[...bookingSelect.options].filter(o=>o.value!=="Hotel Accommodation").forEach(o=>o.remove());const before=section.querySelector(".check-times");stays.forEach((s,i)=>{const card=document.createElement("article");card.className="stay-card managed-stay-card"+(i%2?" reverse":"");card.id="stay-"+s.slug;const imgs=media.stays?.[s.slug]||[];const details=(s.details||[]).map(x=>"<li>"+safeText(x)+"</li>").join("");const capacity=s.capacity_ar?'<p class="capacity-note">'+safeText(s.capacity_ar)+'</p>':"";card.innerHTML='<div class="stay-photo media-slot" data-slot="صور '+safeText(s.name_ar)+'"><span class="slot-icon">＋</span><b>صور '+safeText(s.name_ar)+'</b></div><div class="stay-info"><p class="eyebrow">CHALET ACCOMMODATION · '+String(i+2).padStart(2,"0")+'</p><h3>'+safeText(s.name_ar)+'</h3><p>'+safeText(s.description_ar||"")+'</p><ul class="stay-details">'+details+'</ul>'+capacity+'<div class="rates"><div><b>'+safeText(s.daily_price)+' جنيه</b><span>لليلة · للشاليه</span></div><div><b>'+safeText(s.monthly_price)+' جنيه</b><span>للشهر · للشاليه</span></div></div><a class="button-primary" href="#booking" data-choice="'+safeText(s.slug)+'">اطلب حجز '+safeText(s.name_ar)+'</a></div>';section.insertBefore(card,before);if(imgs.length){const slot=card.querySelector(".stay-photo");slot.classList.remove("media-slot");const html=imgs.map(x=>'<img src="'+x.url+'" alt="'+safeText(s.name_ar)+'" loading="lazy">').join("");slot.innerHTML='<div class="photo-carousel"><div class="photo-carousel-track">'+html+'</div><button class="photo-arrow photo-prev" type="button" aria-label="الصورة السابقة">‹</button><button class="photo-arrow photo-next" type="button" aria-label="الصورة التالية">›</button><div class="photo-counter">1 / '+imgs.length+'</div></div>';slot.querySelectorAll("img").forEach(img=>img.style.setProperty("object-fit","contain","important"));const track=slot.querySelector(".photo-carousel-track"),counter=slot.querySelector(".photo-counter");const update=()=>counter.textContent=(Math.round(track.scrollLeft/track.clientWidth)+1)+" / "+imgs.length;slot.querySelector(".photo-prev").onclick=()=>track.scrollBy({left:-track.clientWidth,behavior:"smooth"});slot.querySelector(".photo-next").onclick=()=>track.scrollBy({left:track.clientWidth,behavior:"smooth"});track.addEventListener("scroll",()=>requestAnimationFrame(update),{passive:true});}const opt=document.createElement("option");opt.value=s.slug;opt.textContent=s.name_ar;bookingSelect.appendChild(opt);});bookingSelect.dispatchEvent(new Event("change",{bubbles:true}));document.querySelectorAll('[data-choice]').forEach(a=>a.addEventListener('click',()=>{bookingSelect.value=a.dataset.choice;bookingSelect.dispatchEvent(new Event('change',{bubbles:true}));}));}catch(e){console.warn("Managed accommodation could not load",e)}}
function safeText(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
loadManagedStayTypes();

// Keep meal plans appropriate to the selected accommodation type.
const bookingStaySelect=document.getElementById("stay-type");
const bookingPlanSelect=document.querySelector('#booking-form select[name="plan"]');
function updateBookingPlans(){
 const hotel=bookingStaySelect.value==="Hotel Accommodation";
 const current=bookingPlanSelect.value;
 const plans=hotel
  ? [{value:"Half Board",ar:"نصف إقامة",en:"Half Board"},{value:"Room Only",ar:"غرفة فقط",en:"Room Only"}]
  : [{value:"Daily",ar:"يومي",en:"Daily"},{value:"Monthly",ar:"شهري",en:"Monthly"}];
 bookingPlanSelect.innerHTML=plans.map(p=>'<option value="'+p.value+'">'+(lang==="ar"?p.ar:p.en)+'</option>').join("");
 if(plans.some(p=>p.value===current))bookingPlanSelect.value=current;
}
bookingStaySelect.addEventListener("change",updateBookingPlans);
updateBookingPlans();

