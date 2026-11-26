import { allowRequest } from "../_shared/rate-limit.js";
export async function onRequestPost({request,env}) {
 const db=env.PORTO_DB;
 if(!db) return Response.json({error:"قاعدة البيانات غير مربوطة"},{status:503,headers:{"Cache-Control":"no-store"}});
 const length=Number(request.headers.get("Content-Length")||0);
 if(length>12000) return Response.json({error:"حجم الطلب أكبر من المسموح"},{status:413});
 let gate;
 try { gate=await allowRequest(db,"public-booking",request,10,3600); }
 catch { return Response.json({error:"تعذر استقبال الطلب حاليًا، حاول لاحقًا"},{status:503,headers:{"Cache-Control":"no-store"}}); }
 if(!gate.allowed) return Response.json({error:"تم إرسال طلبات كثيرة من هذا الاتصال. حاول مرة أخرى لاحقًا."},{status:429,headers:{"Retry-After":String(gate.retryAfter),"Cache-Control":"no-store"}});
 let b; try{b=await request.json()}catch{return Response.json({error:"بيانات غير صالحة"},{status:400})}
 if(!b||typeof b!=="object"||Array.isArray(b)) return Response.json({error:"بيانات غير صالحة"},{status:400});
 for(const k of ["guest_name","phone","stay_type","plan","check_in","check_out"]) if(typeof b[k]!=="string"||!b[k].trim()) return Response.json({error:"يرجى استكمال البيانات المطلوبة"},{status:400});
 if(b.guest_name.trim().length>100||b.phone.trim().length>30||b.stay_type.length>50||b.plan.length>50||String(b.notes||"").length>1000) return Response.json({error:"بعض البيانات أطول من المسموح"},{status:400});
 // Enforce accommodation-specific plans on the server as well as in the form.
 const hotelType="Hotel Accommodation";
 let allowedStayTypes=["premium","standard"];
 try {
  const configured=await db.prepare("SELECT setting_value FROM site_settings WHERE setting_key='stay_types'").first();
  if(configured?.setting_value){const parsed=JSON.parse(configured.setting_value);if(Array.isArray(parsed))allowedStayTypes=parsed.filter(x=>x&&x.active!==false&&typeof x.slug==="string").map(x=>x.slug);}
 } catch { return Response.json({error:"تعذر التحقق من نوع الإقامة"},{status:503,headers:{"Cache-Control":"no-store"}}); }
 const isHotel=b.stay_type===hotelType;
 if(!isHotel&&!allowedStayTypes.includes(b.stay_type)) return Response.json({error:"نوع الإقامة غير متاح"},{status:400});
 const validPlan=isHotel?["Half Board","Room Only"]:["Daily","Monthly"];
 if(!validPlan.includes(b.plan)) return Response.json({error:isHotel?"اختر نصف إقامة أو غرفة فقط للإقامة الفندقية":"نصف الإقامة متاحة للإقامة الفندقية فقط. اختر يومي أو شهري للشاليه."},{status:400});

 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.check_in)||!/^\d{4}-\d{2}-\d{2}$/.test(b.check_out)||b.check_out<=b.check_in) return Response.json({error:"تاريخ الإقامة غير صحيح"},{status:400});
 // Check manually maintained inventory; never decrement it when a request is submitted.
 try {
  const calendarRow=await db.prepare("SELECT setting_value FROM site_settings WHERE setting_key='availability_calendar'").first();
  if(calendarRow?.setting_value){const cal=JSON.parse(calendarRow.setting_value),key=isHotel?"hotel":b.stay_type,total=Number(cal.inventory?.[key]||0);if(total>0){for(let d=new Date(b.check_in+"T00:00:00");d<new Date(b.check_out+"T00:00:00");d.setDate(d.getDate()+1)){const date=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"),blocked=Number(cal.days?.[date]?.[key]?.blocked||0);if(total-blocked<1)return Response.json({error:"لا توجد وحدات متاحة في أحد تواريخ الإقامة المحددة. اختر تواريخ أخرى أو تواصل مع الإدارة."},{status:409,headers:{"Cache-Control":"no-store"}});}}}
 } catch { return Response.json({error:"تعذر التحقق من التوافر حاليًا"},{status:503,headers:{"Cache-Control":"no-store"}}); }
 const adults=Number(b.adults),children=Number(b.children||0);
 if(!Number.isInteger(adults)||adults<1||adults>20||!Number.isInteger(children)||children<0||children>20) return Response.json({error:"عدد النزلاء غير صحيح"},{status:400});
 const q=await db.prepare("INSERT INTO bookings(guest_name,phone,stay_type,plan,check_in,check_out,adults,children,notes,status,paid_amount) VALUES(?,?,?,?,?,?,?,?,?,'pending',0)").bind(b.guest_name.trim(),b.phone.trim(),b.stay_type.trim(),b.plan.trim(),b.check_in,b.check_out,adults,children,String(b.notes||"").trim()).run();
 return Response.json({ok:true,booking_id:q.meta.last_row_id,status:"pending"},{status:201,headers:{"Cache-Control":"no-store"}});
}
