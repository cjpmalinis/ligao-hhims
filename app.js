
const cfg=window.HHIMS_CONFIG||{};
const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes("YOUR_PROJECT")&&cfg.SUPABASE_PUBLISHABLE_KEY&&!cfg.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_PUBLISHABLE");
const db=configured?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY):null;
const $=id=>document.getElementById(id);
let profile=null,households=[],members=[];
const BARANGAYS=["ABELLA", "ALLANG", "AMTIC", "BACONG", "BAGUMBAYAN", "BALANAC", "BALIGANG", "BARAYONG", "BASAG", "BATANG", "BAY", "BINANOWAN", "BINATAGAN", "BOBONSURAN", "BONGA", "BUSAC", "BUSAY", "CABARIAN", "CALZADA", "CATBURAWAN", "CAVASI", "CULLIAT", "DUNAO", "FRANCIA", "GUILID", "HERRERA", "LAYON", "MACALIDONG", "MAHABA", "MALAMA", "MAONON", "NABONTON", "NASISI", "OMA-OMA", "PALAPAS", "PANDAN", "PAULBA", "PAULOG", "PINAMANIQUIAN", "PINIT", "RANAO-RANAO", "SAN VICENTE", "STA. CRUZ", "TAGPO", "TAMBO", "TANDARURA", "TASTAS", "TINAGO", "TINAMPO", "TIONGSON", "TOMOLIN", "TUBURAN", "TULA-TULA GRANDE", "TULA-TULA PEQUEÑO", "TUPAZ"];

function age(ds){if(!ds)return "";const d=new Date(ds+"T00:00:00"),t=new Date();let a=t.getFullYear()-d.getFullYear();const m=t.getMonth()-d.getMonth();if(m<0||(m===0&&t.getDate()<d.getDate()))a--;return a}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]))}
function full(p){return [p.last_name,p.first_name,p.middle_name,p.ext_name].filter(Boolean).join(" ")}
function tags(p){let a=[];if(p.senior_citizen||age(p.birthdate)>=60)a.push("Senior");if(p.pwd)a.push("PWD");if(p.four_ps)a.push("4Ps");if(p.pregnant)a.push("Pregnant");if(p.lactating)a.push("Lactating");if(p.medical_condition)a.push("Medical");return a.map(x=>`<span class="badge">${x}</span>`).join(" ")}
function personPayload(prefix,relationship){
 return {relationship_to_head:relationship,last_name:$(prefix+"Last").value.trim().toUpperCase(),first_name:$(prefix+"First").value.trim().toUpperCase(),
 middle_name:$(prefix+"Middle").value.trim().toUpperCase()||null,ext_name:$(prefix+"Ext").value.trim().toUpperCase()||null,
 birthdate:$(prefix+"Birthdate").value||null,sex:$(prefix+"Sex").value||null,civil_status:$(prefix+"Civil").value.trim()||null,
 educational_attainment:$(prefix+"Education").value.trim()||null,occupation:$(prefix+"Occupation").value.trim()||null,
 employment_address:$(prefix+"Employment").value.trim()||null,senior_citizen:$(prefix+"Senior").checked||age($(prefix+"Birthdate").value)>=60,
 pwd:$(prefix+"Pwd").checked,pregnant:$(prefix+"Pregnant").checked,lactating:$(prefix+"Lactating").checked,
 medical_condition:$(prefix+"Medical").checked,four_ps:$(prefix+"FourPs").checked}
}
function fillPerson(prefix,p){
 $(prefix+"Last").value=p.last_name||"";$(prefix+"First").value=p.first_name||"";$(prefix+"Middle").value=p.middle_name||"";$(prefix+"Ext").value=p.ext_name||"";
 $(prefix+"Birthdate").value=p.birthdate||"";$(prefix+"Sex").value=p.sex||"";$(prefix+"Civil").value=p.civil_status||"";$(prefix+"Education").value=p.educational_attainment||"";
 $(prefix+"Occupation").value=p.occupation||"";$(prefix+"Employment").value=p.employment_address||"";$(prefix+"Senior").checked=!!p.senior_citizen;$(prefix+"Pwd").checked=!!p.pwd;
 $(prefix+"Pregnant").checked=!!p.pregnant;$(prefix+"Lactating").checked=!!p.lactating;$(prefix+"Medical").checked=!!p.medical_condition;$(prefix+"FourPs").checked=!!p.four_ps;
}
async function boot(){
 if(!configured){$("configWarning").classList.remove("hidden");return}
 $("configWarning").classList.add("hidden");
 const {data:{session}}=await db.auth.getSession();
 if(session)await enterApp(session.user);
 db.auth.onAuthStateChange(async(_event,session)=>{if(session)await enterApp(session.user);else leaveApp()});
}
async function enterApp(user){
 const {data:p,error}=await db.from("profiles").select("*").eq("id",user.id).single();
 if(error||!p||!p.is_active){await db.auth.signOut();$("loginMessage").textContent="Your account is not active or has no profile.";return}
 profile=p;$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("sessionBox").classList.remove("hidden");
 $("userName").textContent=p.full_name||user.email;$("userRole").textContent=p.role.toUpperCase();
 $("scopeNote").textContent=p.role==="admin"?"Admin: add, edit, delete, import and export across all 55 barangays.":"User: add, edit, import and export across all 55 barangays. Delete is Admin-only.";
 setupBarangays();if(p.role==="admin"){$("adminPanel").classList.remove("hidden");await loadUsers()}await loadData()
}
function leaveApp(){profile=null;households=[];members=[];$("loginView").classList.remove("hidden");$("appView").classList.add("hidden");$("sessionBox").classList.add("hidden");$("adminPanel").classList.add("hidden")}
function setupBarangays(){const o=BARANGAYS.map(b=>`<option value="${b}">${b}</option>`).join("");$("barangayFilter").innerHTML='<option value="">All 55 Barangays</option>'+o;$("hhBarangay").innerHTML='<option value="">Select Barangay</option>'+o}
async function loadData(){
 const [hh,mm]=await Promise.all([db.from("households").select("*").order("created_at",{ascending:false}),db.from("household_members").select("*")]);
 if(hh.error)return alert(hh.error.message);if(mm.error)return alert(mm.error.message);households=hh.data||[];members=mm.data||[];render()
}
function render(){
 let q=$("searchInput").value.toLowerCase(),b=$("barangayFilter").value,hf=$("headFilter").value;
 const visible=households.filter(h=>{const people=members.filter(m=>m.household_id===h.id),head=people.find(m=>m.is_household_head);const hay=[h.household_code,h.barangay,h.purok,...people.map(full)].join(" ").toLowerCase();let ok=(!q||hay.includes(q))&&(!b||h.barangay===b);if(hf==="senior")ok=ok&&head&&(head.senior_citizen||age(head.birthdate)>=60);if(hf==="pwd")ok=ok&&head&&head.pwd;if(hf==="4ps")ok=ok&&head&&head.four_ps;return ok});
 $("householdList").innerHTML=visible.length?visible.map(h=>{const people=members.filter(m=>m.household_id===h.id).sort((a,b)=>Number(b.is_household_head)-Number(a.is_household_head)),head=people.find(m=>m.is_household_head)||{};
 const rows=people.map(p=>`<tr><td>${esc(p.family_number||1)}</td><td><strong>${esc(full(p))}</strong></td><td>${esc(p.relationship_to_head)}</td><td>${age(p.birthdate)}</td><td>${esc(p.sex)}</td><td>${esc(p.occupation)}</td><td>${tags(p)}</td><td>${p.is_household_head?'<span class="hh-meta">Edit via Household</span>':`<button class="small-btn" onclick="editMember('${p.id}')">Edit</button>${profile.role==="admin"?` <button class="small-btn delete" onclick="deleteMember('${p.id}')">Delete</button>`:""}`}</td></tr>`).join("");
 return `<article class="household-card"><div class="household-head"><div><div class="hh-code">${esc(h.household_code)}</div><div class="hh-name">${esc(full(head)||"No Household Head")}</div><div class="hh-meta">${esc(h.barangay)}${h.purok?` • Purok ${esc(h.purok)}`:""} • ${h.number_of_families||1} family/families • ${people.length} person(s)</div></div><div class="actions"><button class="btn primary" onclick="openMember('${h.id}')">+ Add Member</button><button class="btn ghost" onclick="editHousehold('${h.id}')">Edit Household</button>${profile.role==="admin"?`<button class="btn danger" onclick="deleteHousehold('${h.id}')">Delete Household</button>`:""}</div></div><div class="members"><table><thead><tr><th>Family No.</th><th>Name</th><th>Relationship to HH Head</th><th>Age</th><th>Sex</th><th>Occupation</th><th>Tags</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></article>`}).join(""):'<div class="empty">No households found.</div>';
 $("statHouseholds").textContent=households.length;$("statPersons").textContent=members.length;$("statBarangays").textContent=new Set(households.map(h=>h.barangay)).size;$("statSeniors").textContent=members.filter(p=>p.senior_citizen||age(p.birthdate)>=60).length;$("statPwd").textContent=members.filter(p=>p.pwd).length;$("stat4ps").textContent=members.filter(p=>p.four_ps).length
}
async function loadUsers(){const {data}=await db.from("profiles").select("email,full_name,role,is_active").order("full_name");$("usersBody").innerHTML=(data||[]).map(u=>`<tr><td>${esc(u.full_name)}</td><td>${esc(u.email)}</td><td>${esc(u.role)}</td><td>All 55 Barangays</td><td>${u.is_active?"Active":"Disabled"}</td></tr>`).join("")}
$("loginForm").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("email").value,password:$("password").value});if(error)$("loginMessage").textContent=error.message};
$("logoutBtn").onclick=()=>db.auth.signOut();$("refreshBtn").onclick=loadData;$("searchInput").oninput=render;$("barangayFilter").onchange=render;$("headFilter").onchange=render;

$("addHouseholdBtn").onclick=()=>{$("householdForm").reset();$("householdEditId").value="";$("hhFamilies").value=1;$("householdDialog").showModal()};
window.editHousehold=id=>{const h=households.find(x=>x.id===id),head=members.find(m=>m.household_id===id&&m.is_household_head);$("householdForm").reset();$("householdEditId").value=id;$("hhBarangay").value=h.barangay;$("hhPurok").value=h.purok||"";$("hhFamilies").value=h.number_of_families||1;$("hhOwnership").value=h.house_ownership||"";$("hhResidence").value=h.length_of_residence||"";$("hhInterviewee").value=h.interviewee||"";fillPerson("head",head);$("householdDialog").showModal()};
$("householdForm").onsubmit=async e=>{e.preventDefault();const id=$("householdEditId").value;const h={barangay:$("hhBarangay").value,purok:$("hhPurok").value.trim()||null,number_of_families:Number($("hhFamilies").value)||1,house_ownership:$("hhOwnership").value.trim()||null,length_of_residence:$("hhResidence").value.trim()||null,interviewee:$("hhInterviewee").value.trim()||null};
 if(id){let r=await db.from("households").update(h).eq("id",id);if(r.error)return alert(r.error.message);const head=members.find(m=>m.household_id===id&&m.is_household_head);r=await db.from("household_members").update(personPayload("head","HOUSEHOLD HEAD")).eq("id",head.id);if(r.error)return alert(r.error.message)}
 else{h.created_by=profile.id;const {data,error}=await db.from("households").insert(h).select().single();if(error)return alert(error.message);const head={...personPayload("head","HOUSEHOLD HEAD"),household_id:data.id,is_household_head:true,family_number:1,created_by:profile.id};const r=await db.from("household_members").insert(head);if(r.error)return alert(r.error.message)}
 $("householdDialog").close();await loadData()
};
window.deleteHousehold=async id=>{if(profile.role!=="admin")return alert("Only Admin can delete.");const h=households.find(x=>x.id===id);if(!confirm(`Delete ${h.household_code} and all its members?`))return;const {error}=await db.from("households").delete().eq("id",id);if(error)return alert(error.message);await loadData()};

window.openMember=id=>{const h=households.find(x=>x.id===id);$("memberForm").reset();$("memberHouseholdId").value=id;$("memberEditId").value="";$("memberFamilyNo").value=1;$("memberContext").textContent=`${h.household_code} • ${h.barangay}`;$("memberDialog").showModal()};
window.editMember=id=>{const p=members.find(x=>x.id===id),h=households.find(x=>x.id===p.household_id);$("memberForm").reset();$("memberHouseholdId").value=p.household_id;$("memberEditId").value=p.id;$("memberFamilyNo").value=p.family_number||1;$("memberRelation").value=p.relationship_to_head||"";fillPerson("member",p);$("memberContext").textContent=`${h.household_code} • ${h.barangay}`;$("memberDialog").showModal()};
$("memberForm").onsubmit=async e=>{e.preventDefault();const id=$("memberEditId").value;const p={...personPayload("member",$("memberRelation").value.trim().toUpperCase()),household_id:$("memberHouseholdId").value,is_household_head:false,family_number:Number($("memberFamilyNo").value)||1};let r;if(id)r=await db.from("household_members").update(p).eq("id",id);else{p.created_by=profile.id;r=await db.from("household_members").insert(p)}if(r.error)return alert(r.error.message);$("memberDialog").close();await loadData()};
window.deleteMember=async id=>{if(profile.role!=="admin")return alert("Only Admin can delete.");const p=members.find(x=>x.id===id);if(!confirm(`Delete ${full(p)}?`))return;const {error}=await db.from("household_members").delete().eq("id",id);if(error)return alert(error.message);await loadData()};

function rowsForExcel(){return households.flatMap(h=>members.filter(m=>m.household_id===h.id).map(p=>({"Household ID":h.household_code,"Barangay":h.barangay,"Prk":h.purok||"","No. of Family":h.number_of_families||1,"Family Number":p.family_number||1,"LAST NAME":p.last_name||"","FIRST NAME":p.first_name||"","MIDDLE NAME":p.middle_name||"","EXT. NAME":p.ext_name||"","Rel't to HH Head":p.relationship_to_head||"","Birthdate":p.birthdate||"","Age":age(p.birthdate),"Sex":p.sex||"","Civil Status":p.civil_status||"","Educ. Attn't":p.educational_attainment||"","Occupation":p.occupation||"","Employment Address":p.employment_address||"","Senior Citizen":p.senior_citizen?"YES":"","PWD":p.pwd?"YES":"","Pregnant":p.pregnant?"YES":"","Lactating":p.lactating?"YES":"","With Medical Condition":p.medical_condition?"YES":"","4Ps Benes.":p.four_ps?"YES":"","House Ownership":h.house_ownership||"","Length of Residence":h.length_of_residence||"","Name of Interviewee":h.interviewee||"","Is Household Head":p.is_household_head?"YES":"NO"})))}
$("exportExcelBtn").onclick=()=>{const rows=rowsForExcel(),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"Master Household Data");XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.filter(r=>r["Is Household Head"]==="YES")),"Household Heads");XLSX.writeFile(wb,"Ligao_City_HHIMS_Export.xlsx")};
function yes(v){return ["yes","y","true","1"].includes(String(v??"").trim().toLowerCase())}
$("importExcelFile").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});if(!rows.length)return alert("No rows found.");if(!confirm(`Import ${rows.length} Excel rows?`))return;const groups={};for(const r of rows){const code=String(r["Household ID"]||"").trim();if(code)(groups[code]??=[]).push(r)}
 for(const [code,rs] of Object.entries(groups)){const first=rs[0],headRow=rs.find(r=>yes(r["Is Household Head"])||String(r["Rel't to HH Head"]).toUpperCase().includes("HOUSEHOLD HEAD"))||first;let h=households.find(x=>x.household_code===code),hid;const hp={household_code:code,barangay:String(first["Barangay"]||"").trim().toUpperCase(),purok:String(first["Prk"]||"").trim()||null,number_of_families:Number(first["No. of Family"]||1)||1,house_ownership:String(first["House Ownership"]||"").trim()||null,length_of_residence:String(first["Length of Residence"]||"").trim()||null,interviewee:String(first["Name of Interviewee"]||"").trim()||null,created_by:profile.id};
 if(h){hid=h.id;let r=await db.from("households").update(hp).eq("id",hid);if(r.error)throw r.error}else{const r=await db.from("households").insert(hp).select().single();if(r.error)throw r.error;hid=r.data.id}
 let r=await db.from("household_members").delete().eq("household_id",hid);if(r.error&&profile.role!=="admin")throw new Error("Importing over an existing household requires Admin delete permission. For User accounts, import only new Household IDs.");
 const payloads=rs.map(x=>({household_id:hid,family_number:Number(x["Family Number"]||1)||1,is_household_head:x===headRow,relationship_to_head:x===headRow?"HOUSEHOLD HEAD":String(x["Rel't to HH Head"]||"").trim().toUpperCase(),last_name:String(x["LAST NAME"]||"").trim().toUpperCase(),first_name:String(x["FIRST NAME"]||"").trim().toUpperCase(),middle_name:String(x["MIDDLE NAME"]||"").trim().toUpperCase()||null,ext_name:String(x["EXT. NAME"]||"").trim().toUpperCase()||null,birthdate:String(x["Birthdate"]||"").trim()||null,sex:String(x["Sex"]||"").trim().toUpperCase()||null,civil_status:String(x["Civil Status"]||"").trim()||null,educational_attainment:String(x["Educ. Attn't"]||"").trim()||null,occupation:String(x["Occupation"]||"").trim()||null,employment_address:String(x["Employment Address"]||"").trim()||null,senior_citizen:yes(x["Senior Citizen"]),pwd:yes(x["PWD"]),pregnant:yes(x["Pregnant"]),lactating:yes(x["Lactating"]),medical_condition:yes(x["With Medical Condition"]),four_ps:yes(x["4Ps Benes."]),created_by:profile.id}));
 r=await db.from("household_members").insert(payloads);if(r.error)throw r.error}
 alert("Excel import completed.");await loadData()}catch(err){alert("Import failed: "+(err.message||err))}e.target.value=""};

$("closeHousehold").onclick=$("cancelHousehold").onclick=()=>$("householdDialog").close();$("closeMember").onclick=$("cancelMember").onclick=()=>$("memberDialog").close();
boot();
