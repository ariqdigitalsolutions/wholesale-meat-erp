function env(name){ return process.env[name] || ''; }
function json(res,status,body){ res.statusCode=status; res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); }
function base(){ return env('SUPABASE_URL').replace(/\/$/,''); }
async function req(path, options={}){
  const r=await fetch(`${base()}${path}`,{...options,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,'Content-Type':'application/json',...(options.headers||{})}});
  const t=await r.text(); let d=null; try{d=t?JSON.parse(t):null}catch{d=t;}
  if(!r.ok){const e=new Error('Request failed');e.status=r.status;e.details=d;throw e;} return d;
}
async function userFromToken(token){
  if(!token) return null;
  const r=await fetch(`${base()}/auth/v1/user`,{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:`Bearer ${token}`}});
  if(!r.ok)return null; return await r.json();
}
async function profile(id){const rows=await req(`/rest/v1/erp_profiles?select=id,email,full_name,role,active,company_id,branch_id&id=eq.${encodeURIComponent(id)}&limit=1`);return rows?.[0]||null;}
module.exports=async function(req0,res){
 if(req0.method!=='POST' && req0.method!=='GET') return json(res,405,{error:'Method not allowed'});
 try{
  const token=String(req0.headers.authorization||'').replace(/^Bearer\s+/i,'');
  const auth=await userFromToken(token); if(!auth)return json(res,401,{error:'Your session has expired. Please sign in again.'});
  const me=await profile(auth.id); if(!me||!me.active||!me.company_id)return json(res,403,{error:'Your ERP account is not provisioned.'});
  if(req0.method==='GET'){
    const branches=await req(`/rest/v1/erp_branches?select=id,company_id,branch_code,branch_name,address,city,phone,email,active,is_head_office&company_id=eq.${encodeURIComponent(me.company_id)}&order=is_head_office.desc,branch_name.asc`);
    return json(res,200,{companyId:me.company_id,currentBranchId:me.branch_id,branches});
  }
  const body=typeof req0.body==='string'?JSON.parse(req0.body||'{}'):(req0.body||{});
  if(me.role!=='Admin') return json(res,403,{error:'Only Admin can manage branches.'});
  const action=body.action||'create';
  if(action==='create'){
    const code=String(body.branchCode||'').trim().toUpperCase(), name=String(body.branchName||'').trim();
    if(!code||!name)return json(res,400,{error:'Branch code and branch name are required.'});
    const created=await req('/rest/v1/erp_branches',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({company_id:me.company_id,branch_code:code,branch_name:name,address:String(body.address||''),city:String(body.city||''),phone:String(body.phone||''),email:String(body.email||''),active:true,is_head_office:false,created_by:auth.id})});
    return json(res,200,{branch:created?.[0]||created});
  }
  if(action==='update'){
    const id=String(body.id||''); if(!id)return json(res,400,{error:'Branch ID is required.'});
    const target=(await req(`/rest/v1/erp_branches?select=id&company_id=eq.${encodeURIComponent(me.company_id)}&id=eq.${encodeURIComponent(id)}&limit=1`))?.[0];
    if(!target)return json(res,404,{error:'Branch not found.'});
    const patch={}; ['branchCode','branchName','address','city','phone','email','active'].forEach(k=>{if(body[k]!==undefined)patch[{branchCode:'branch_code',branchName:'branch_name',address:'address',city:'city',phone:'phone',email:'email',active:'active'}[k]]=body[k];});
    await req(`/rest/v1/erp_branches?id=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(me.company_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
    return json(res,200,{success:true});
  }
  if(action==='switchUserBranch'){
    const userId=String(body.userId||''), branchId=String(body.branchId||'');
    const b=(await req(`/rest/v1/erp_branches?select=id&company_id=eq.${encodeURIComponent(me.company_id)}&id=eq.${encodeURIComponent(branchId)}&active=eq.true&limit=1`))?.[0];
    const p=(await req(`/rest/v1/erp_profiles?select=id&company_id=eq.${encodeURIComponent(me.company_id)}&id=eq.${encodeURIComponent(userId)}&limit=1`))?.[0];
    if(!b||!p)return json(res,404,{error:'User or branch not found.'});
    await req(`/rest/v1/erp_profiles?id=eq.${encodeURIComponent(userId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({branch_id:branchId,updated_at:new Date().toISOString()})});
    await req('/rest/v1/erp_user_branches',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:userId,branch_id:branchId,is_default:true,active:true})});
    return json(res,200,{success:true,branchId});
  }
  return json(res,400,{error:'Unknown branch action.'});
 }catch(e){console.error(e);return json(res,e.status||500,{error:'Branch operation could not be completed.'});}
};
