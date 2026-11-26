export async function onRequestPost({request,env}) {
 const db=env.PORTO_DB;
 if(!db) return Response.json({error:"قاعدة البيانات غير مربوطة"},{status:503});
 let b; try{b=await request.json()}catch{return Response.json({error:"بيانات غير صالحة"},{status:400})}
 for(const k of ["guest_name","phone","stay_type","plan","check_in","check_out"]) if(!String(b[k]??"").trim()) return Response.json({error:"يرجى استكمال البيانات المطلوبة"},{status:400});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.check_in)||!/^\d{4}-\d{2}-\d{2}$/.test(b.check_out)||b.check_out<=b.check_in) return Response.json({error:"تاريخ الإقامة غير صحيح"},{status:400});
 const adults=Number(b.adults),children=Number(b.children||0);
 if(!Number.isInteger(adults)||adults<1||adults>20||!Number.isInteger(children)||children<0||children>20) return Response.json({error:"عدد النزلاء غير صحيح"},{status:400});
 const q=await db.prepare("INSERT INTO bookings(guest_name,phone,stay_type,plan,check_in,check_out,adults,children,notes,status,paid_amount) VALUES(?,?,?,?,?,?,?,?,?,'pending',0)").bind(String(b.guest_name).trim().slice(0,100),String(b.phone).trim().slice(0,30),String(b.stay_type).slice(0,50),String(b.plan).slice(0,50),b.check_in,b.check_out,adults,children,String(b.notes||"").slice(0,1000)).run();
 return Response.json({ok:true,booking_id:q.meta.last_row_id,status:"pending"},{status:201});
}