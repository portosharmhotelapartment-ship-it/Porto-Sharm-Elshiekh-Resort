export async function onRequestPost({request,env}) {
 if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET) return Response.json({error:"Admin secrets are not configured"},{status:503});
 let body; try{body=await request.json()}catch{return Response.json({error:"Invalid request"},{status:400})}
 if(typeof body.password!=="string"||body.password.length>200||body.password!==env.ADMIN_PASSWORD) return Response.json({error:"كلمة المرور غير صحيحة"},{status:401});
 const expires=Math.floor(Date.now()/1000)+60*60*8;
 const payload=btoa(JSON.stringify({exp:expires}));
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload));
 const token=payload+"."+btoa(String.fromCharCode(...new Uint8Array(sig)));
 return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":`porto_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800` }});
}
