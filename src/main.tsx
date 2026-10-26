import React, {useEffect, useMemo, useRef, useState} from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays, ChevronDown, GripVertical, ImagePlus, LayoutGrid, List,
  MessageSquare, Plus, RotateCcw, Sparkles, Trash2, Users, X, Layers3, Pencil
} from "lucide-react";
import "./styles.css";
import { supabase } from "./supabase";

type Status = "Idea" | "Production" | "In Review" | "Approved" | "Published";
type Media = { id:string; url:string; name:string };
type Post = {
  id:string; media:Media[]; caption:string; date:string; time:string;
  status:Status; comments:string[]; assignee:string; kind:"post"|"carousel";
};

const uid = () => Math.random().toString(36).slice(2,9);

const starter: Post[] = [
  {id:uid(),media:[{id:uid(),url:"https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",name:"product.jpg"}],caption:"Science and well-being in balance.",date:"2026-10-27",time:"13:00",status:"Approved",comments:["Visual approved for the feed."],assignee:"Lucas",kind:"post"},
  {id:uid(),media:[{id:uid(),url:"https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=80",name:"lab.jpg"}],caption:"Formulations developed with care.",date:"2026-10-29",time:"18:00",status:"In Review",comments:[],assignee:"Bruna",kind:"post"},
  {id:uid(),media:[{id:uid(),url:"https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80",name:"lifestyle.jpg"}],caption:"Routine, balance, and consistency.",date:"2026-10-31",time:"12:00",status:"Production",comments:[],assignee:"Katia",kind:"post"},
  {id:uid(),media:[{id:uid(),url:"https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80",name:"science.jpg"}],caption:"Knowledge behind every choice.",date:"2026-11-02",time:"19:30",status:"Idea",comments:[],assignee:"Lucas",kind:"post"},
  {id:uid(),media:[{id:uid(),url:"https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",name:"detail.jpg"}],caption:"Details that make a difference.",date:"2026-11-04",time:"14:00",status:"Approved",comments:[],assignee:"Bruna",kind:"post"},
  {id:uid(),media:[{id:uid(),url:"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",name:"white.jpg"}],caption:"Minimalism, confidence, and clarity.",date:"2026-11-06",time:"11:00",status:"In Review",comments:[],assignee:"Katia",kind:"post"},
];

type Client = {id:string; name:string; handle:string; initials:string; logo?:string};
const initialClients:Client[] = [
  {id:"solaris", name:"Solaris", handle:"@solaris", initials:"SO"},
  {id:"buena", name:"Buena Leche", handle:"@buenaleche.studio", initials:"BL"},
  {id:"cliente3", name:"New Client", handle:"@client", initials:"NC"},
];

function App(){
  const [clientList,setClientList]=useState<Client[]>(initialClients);
  const [client,setClient]=useState<Client>(initialClients[0]);
  const [postsByClient,setPostsByClient]=useState<Record<string,Post[]>>({
    solaris: starter,
    buena: [],
    cliente3: []
  });
  const posts=postsByClient[client.id]||[];
  const setPosts=(next:Post[]|((prev:Post[])=>Post[]))=>{
    setPostsByClient(all=>{
      const current=all[client.id]||[];
      const value=typeof next==="function"?(next as (p:Post[])=>Post[])(current):next;
      return {...all,[client.id]:value};
    });
  };
  const [selected,setSelected]=useState<Post|null>(null);
  const [view,setView]=useState<"grid"|"calendar"|"list">("grid");
  const [history,setHistory]=useState<Post[][]>([]);
  const [dragId,setDragId]=useState<string|null>(null);
  const [layoutOpen,setLayoutOpen]=useState(false);
  const [layoutChoice,setLayoutChoice]=useState<"balanced"|"checkerboard"|"gradient">("balanced");
  const [uploadNotice,setUploadNotice]=useState("");
  const fileRef=useRef<HTMLInputElement>(null);
  const logoRef=useRef<HTMLInputElement>(null);
  const [phoneOpen,setPhoneOpen]=useState(false);
  const [cloudReady,setCloudReady]=useState(false);
  const [clientModal,setClientModal]=useState<"new"|"edit"|null>(null);
  const [clientName,setClientName]=useState("");
  const [clientHandle,setClientHandle]=useState("");
  const [logoTargetId,setLogoTargetId]=useState<string|null>(null);
  const sidebarLogoRef=useRef<HTMLInputElement>(null);

  const loadCloudData=async()=>{
    const {data:clientRows,error:ce}=await supabase.from("clients").select("*").order("created_at");
    if(ce){console.error(ce);return;}
    let rows=clientRows||[];
    if(rows.length===0){
      const seed=initialClients.map(c=>({name:c.name,instagram_handle:c.handle}));
      const {data:created,error}=await supabase.from("clients").insert(seed).select();
      if(created) rows=created;
      if(error) console.error(error);
    }
    const mapped:Client[]=rows.map((r:any)=>({id:r.id,name:r.name,handle:r.instagram_handle||"",initials:r.name.split(/\s+/).map((x:string)=>x[0]).join("").slice(0,2).toUpperCase(),logo:r.logo_url||undefined}));
    setClientList(mapped);
    if(mapped.length) setClient(mapped[0]);

    const {data:postRows}=await supabase.from("posts").select("*, post_media(*)").order("feed_position");
    const by:Record<string,Post[]>={};
    mapped.forEach(c=>by[c.id]=[]);
    (postRows||[]).forEach((r:any)=>{
      const media=(r.post_media||[]).sort((a:any,b:any)=>a.slide_position-b.slide_position).map((m:any)=>({id:m.id,url:m.public_url,name:m.file_name||""}));
      const p:Post={id:r.id,media,caption:r.caption||"",date:r.scheduled_date||new Date().toISOString().slice(0,10),time:(r.scheduled_time||"12:00").slice(0,5),status:({idea:"Idea",production:"Production",in_review:"In Review",approved:"Approved",published:"Published"} as any)[r.status]||"Idea",comments:[],assignee:r.assignee||"",kind:r.post_type==="carousel"?"carousel":"post"};
      (by[r.client_id] ||= []).push(p);
    });
    setPostsByClient(by);
    setCloudReady(true);
  };

  useEffect(()=>{loadCloudData()},[]);

  const uploadMedia=async(file:File, clientId:string, postId:string, slide=0)=>{
    const ext=file.name.split(".").pop()||"jpg";
    const path=`${clientId}/${postId}/${Date.now()}-${slide}.${ext}`;
    const {error}=await supabase.storage.from("feed-media").upload(path,file,{upsert:false});
    if(error) throw error;
    const {data}=supabase.storage.from("feed-media").getPublicUrl(path);
    const {data:row,error:me}=await supabase.from("post_media").insert({post_id:postId,storage_path:path,public_url:data.publicUrl,file_name:file.name,slide_position:slide}).select().single();
    if(me) throw me;
    return {id:row.id,url:data.publicUrl,name:file.name};
  };

  const updateClientLogo=async(files:FileList|null, targetId=client.id)=>{
    const f=files?.[0]; if(!f)return;
    try{
      const target=clientList.find(c=>c.id===targetId) || client;
      const ext=f.name.split(".").pop()||"jpg";
      const path=`logos/${targetId}-${Date.now()}.${ext}`;
      const {error}=await supabase.storage.from("feed-media").upload(path,f);
      if(error) throw error;
      const {data}=supabase.storage.from("feed-media").getPublicUrl(path);
      const {error:dbError}=await supabase.from("clients").update({logo_url:data.publicUrl,updated_at:new Date().toISOString()}).eq("id",targetId);
      if(dbError) throw dbError;
      const updated={...target,logo:data.publicUrl};
      setClientList(list=>list.map(c=>c.id===targetId?updated:c));
      if(client.id===targetId) setClient(updated);
    }catch(e){console.error(e);alert("Could not upload client logo.");}
  };

  const openNewClient=()=>{setClientName("");setClientHandle("");setClientModal("new")};
  const openEditClient=(c:Client)=>{setClient(c);setClientName(c.name);setClientHandle(c.handle);setClientModal("edit")};
  const saveClient=async()=>{
    const name=clientName.trim(); if(!name)return;
    const handle=(clientHandle.trim()||`@${name.toLowerCase().replace(/[^a-z0-9]+/g,".").replace(/^\.|\.$/g,"")}`);
    const normalized=handle.startsWith("@")?handle:`@${handle}`;
    try{
      if(clientModal==="new"){
        const {data:r,error}=await supabase.from("clients").insert({name,instagram_handle:normalized}).select().single();
        if(error) throw error;
        const created:Client={id:r.id,name:r.name,handle:r.instagram_handle||normalized,initials:name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase(),logo:r.logo_url||undefined};
        setClientList(list=>[...list,created]); setPostsByClient(all=>({...all,[created.id]:[]})); setClient(created); setSelected(null); setHistory([]);
      }else{
        const {data:r,error}=await supabase.from("clients").update({name,instagram_handle:normalized,updated_at:new Date().toISOString()}).eq("id",client.id).select().single();
        if(error) throw error;
        const updated:Client={...client,name:r.name,handle:r.instagram_handle||normalized,initials:name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()};
        setClient(updated); setClientList(list=>list.map(c=>c.id===updated.id?updated:c));
      }
      setClientModal(null);
    }catch(e){console.error(e);alert("Could not save client. Check the browser console for details.");}
  };

  const deleteClient=async(c:Client)=>{
    const ok=window.confirm(`Are you sure you want to permanently delete "${c.name}" and all of its content? This action cannot be undone.`);
    if(!ok)return;
    try{
      const {data:clientPosts,error:postsReadError}=await supabase.from("posts").select("id").eq("client_id",c.id);
      if(postsReadError) throw postsReadError;
      const postIds=(clientPosts||[]).map((p:any)=>p.id);
      let paths:string[]=[];
      if(postIds.length){
        const {data:mediaRows,error:mediaReadError}=await supabase.from("post_media").select("storage_path").in("post_id",postIds);
        if(mediaReadError) throw mediaReadError;
        paths=(mediaRows||[]).map((m:any)=>m.storage_path).filter(Boolean);
        if(paths.length){
          const {error:storageError}=await supabase.storage.from("feed-media").remove(paths);
          if(storageError) throw storageError;
        }
        const {error:mediaDeleteError}=await supabase.from("post_media").delete().in("post_id",postIds);
        if(mediaDeleteError) throw mediaDeleteError;
        const {error:postsDeleteError}=await supabase.from("posts").delete().eq("client_id",c.id);
        if(postsDeleteError) throw postsDeleteError;
      }
      if(c.logo){
        try{
          const marker="/feed-media/";
          const ix=c.logo.indexOf(marker);
          if(ix>=0){
            const logoPath=decodeURIComponent(c.logo.slice(ix+marker.length));
            if(logoPath) await supabase.storage.from("feed-media").remove([logoPath]);
          }
        }catch(logoError){console.warn("Logo cleanup skipped",logoError);}
      }
      const {error:clientDeleteError}=await supabase.from("clients").delete().eq("id",c.id);
      if(clientDeleteError) throw clientDeleteError;
      const remaining=clientList.filter(x=>x.id!==c.id);
      setClientList(remaining);
      setPostsByClient(all=>{const copy={...all};delete copy[c.id];return copy;});
      setSelected(null);setHistory([]);setClientModal(null);
      if(client.id===c.id && remaining.length)setClient(remaining[0]);
      if(client.id===c.id && remaining.length===0){
        setClient({id:"",name:"No client",handle:"",initials:""});
      }
    }catch(e){console.error(e);alert("Could not permanently delete this client. Check the browser console for details.");}
  };

  const commit=(next:Post[])=>{ setHistory(h=>[...h.slice(-14),posts]); setPosts(next); };
  const update=(p:Post)=>{ const n=posts.map(x=>x.id===p.id?p:x); setPosts(n); setSelected(p); };
  const remove=async(id:string)=>{
    const post=posts.find(p=>p.id===id);
    if(!post)return;
    if(!window.confirm(`Delete this ${post.kind==="carousel"?"carousel":"post"} permanently? This cannot be undone.`))return;
    try{
      const {data:mediaRows,error:mediaReadError}=await supabase.from("post_media").select("storage_path").eq("post_id",id);
      if(mediaReadError) throw mediaReadError;
      const paths=(mediaRows||[]).map((m:any)=>m.storage_path).filter(Boolean);
      if(paths.length){
        const {error:storageError}=await supabase.storage.from("feed-media").remove(paths);
        if(storageError) throw storageError;
      }
      const {error:mediaDeleteError}=await supabase.from("post_media").delete().eq("post_id",id);
      if(mediaDeleteError) throw mediaDeleteError;
      const {error:postDeleteError}=await supabase.from("posts").delete().eq("id",id);
      if(postDeleteError) throw postDeleteError;
      setPosts(posts.filter(p=>p.id!==id));
      setSelected(null);
      setHistory([]);
    }catch(e){console.error(e);alert("Could not permanently delete this content. Check the browser console for details.");}
  };
  const undo=()=>{const prev=history.at(-1); if(prev){setPosts(prev);setHistory(history.slice(0,-1));}}

  const addFiles=async(fs:FileList|null, carousel=false)=>{
    if(!fs || fs.length===0)return;
    const files=Array.from(fs);
    try{
      if(carousel){
        const {data:p,error}=await supabase.from("posts").insert({client_id:client.id,caption:"",post_type:"carousel",status:"idea",scheduled_date:new Date().toISOString().slice(0,10),scheduled_time:"12:00",feed_position:posts.length}).select().single();
        if(error) throw error;
        const media=[]; for(let i=0;i<files.length;i++) media.push(await uploadMedia(files[i],client.id,p.id,i));
        const post:Post={id:p.id,media,caption:"",date:p.scheduled_date,time:"12:00",status:"Idea",comments:[],assignee:"",kind:"carousel"};
        setPosts(prev=>[...prev,post]); setSelected(post);
      }else{
        const created:Post[]=[];
        for(let i=0;i<files.length;i++){
          const {data:p,error}=await supabase.from("posts").insert({client_id:client.id,caption:"",post_type:"post",status:"idea",scheduled_date:new Date().toISOString().slice(0,10),scheduled_time:"12:00",feed_position:posts.length+i}).select().single();
          if(error) throw error;
          const media=await uploadMedia(files[i],client.id,p.id,0);
          created.push({id:p.id,media:[media],caption:"",date:p.scheduled_date,time:"12:00",status:"Idea",comments:[],assignee:"",kind:"post"});
        }
        setPosts(prev=>[...prev,...created]);
        setUploadNotice(`${created.length} image${created.length===1?"":"s"} uploaded and saved`);
        window.setTimeout(()=>setUploadNotice(""),3000);
      }
    }catch(e){console.error(e);alert("Upload failed. Check the browser console for details.");}
  };

  const brightnessHint=(p:Post)=>{
    // Stable visual proxy for the MVP. In the collaborative version this can be
    // replaced by real image color/luminance analysis in the backend.
    const key=(p.media[0]?.name||p.id);
    return [...key].reduce((a,c)=>a+c.charCodeAt(0),0)%101;
  };

  const arrangeBy=(strategy:"balanced"|"checkerboard"|"gradient")=>{
    const locked = new Map<number,Post>();
    posts.forEach((p,i)=>{ if(p.status==="Published") locked.set(i,p); });
    const movable=posts.filter(p=>p.status!=="Published");

    let ordered=[...movable];
    if(strategy==="gradient"){
      ordered.sort((a,b)=>brightnessHint(b)-brightnessHint(a));
    } else if(strategy==="checkerboard"){
      const sorted=[...ordered].sort((a,b)=>brightnessHint(a)-brightnessHint(b));
      const dark=sorted.slice(0,Math.ceil(sorted.length/2));
      const light=sorted.slice(Math.ceil(sorted.length/2)).reverse();
      ordered=[];
      while(dark.length||light.length){
        if(light.length) ordered.push(light.shift()!);
        if(dark.length) ordered.push(dark.shift()!);
      }
    } else {
      const sorted=[...ordered].sort((a,b)=>brightnessHint(a)-brightnessHint(b));
      const thirds=[sorted.filter((_,i)=>i%3===0),sorted.filter((_,i)=>i%3===1),sorted.filter((_,i)=>i%3===2)];
      ordered=[];
      while(thirds.some(x=>x.length)){
        for(const bucket of [thirds[1],thirds[2],thirds[0]]) if(bucket.length) ordered.push(bucket.shift()!);
      }
    }

    let cursor=0;
    const result=posts.map((_,i)=>locked.get(i) ?? ordered[cursor++]);
    commit(result);
    setLayoutOpen(false);
  };

  const previewFor=(strategy:"balanced"|"checkerboard"|"gradient")=>{
    const movable=posts.filter(p=>p.status!=="Published");
    let ordered=[...movable];
    if(strategy==="gradient") ordered.sort((a,b)=>brightnessHint(b)-brightnessHint(a));
    if(strategy==="checkerboard"){
      const sorted=[...ordered].sort((a,b)=>brightnessHint(a)-brightnessHint(b));
      const a=sorted.slice(0,Math.ceil(sorted.length/2)), b=sorted.slice(Math.ceil(sorted.length/2)).reverse(); ordered=[];
      while(a.length||b.length){if(b.length)ordered.push(b.shift()!);if(a.length)ordered.push(a.shift()!);}
    }
    if(strategy==="balanced"){
      const sorted=[...ordered].sort((a,b)=>brightnessHint(a)-brightnessHint(b));
      ordered=[...sorted.filter((_,i)=>i%3===1),...sorted.filter((_,i)=>i%3===2),...sorted.filter((_,i)=>i%3===0)];
    }
    let c=0;
    return posts.map(p=>p.status==="Published"?p:ordered[c++]).slice(0,9);
  };

  const dropOn=(target:string)=>{
    if(!dragId||dragId===target)return;
    const arr=[...posts], from=arr.findIndex(p=>p.id===dragId), to=arr.findIndex(p=>p.id===target);
    if(from<0||to<0)return;
    // Published posts are protected. For all other posts, dragging swaps positions.
    if(arr[from].status==="Published"||arr[to].status==="Published"){setDragId(null);return;}
    [arr[from],arr[to]]=[arr[to],arr[from]];
    commit(arr); setDragId(null);
  };

  const ordered=useMemo(()=>posts,[posts]);

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brandmark">BL</div><div><b>Buena Leche</b><span>Content Studio</span></div></div>
      <div className="side-label">CLIENTS</div>
      {clientList.map(c=><div key={c.id} className={"client "+(client.id===c.id?"active":"")} onClick={()=>{setClient(c);setSelected(null);setHistory([]);}}>
        <button className="avatar avatar-button" onClick={e=>{e.stopPropagation();setLogoTargetId(c.id);sidebarLogoRef.current?.click()}} title={`Upload ${c.name} logo`}>{c.logo?<img src={c.logo}/>:c.initials}<span className="avatar-camera">+</span></button>
        <button className="client-main" onClick={e=>{e.stopPropagation();setClient(c);setSelected(null);setHistory([])}}><b>{c.name}</b><small>{c.handle}</small></button>
        <div className="client-actions"><button className="client-edit" onClick={e=>{e.stopPropagation();openEditClient(c)}} title="Edit client"><Pencil size={13}/></button><button className="client-delete" onClick={e=>{e.stopPropagation();deleteClient(c)}} title="Delete client"><Trash2 size={13}/></button></div>
      </div>)}
      <input ref={sidebarLogoRef} hidden type="file" accept="image/*" onChange={e=>{if(logoTargetId)updateClientLogo(e.target.files,logoTargetId);e.currentTarget.value=""}}/>
      <button className="new-client" onClick={openNewClient}><Plus size={16}/> New client</button>
      <div className="side-bottom"><Users size={17}/> Team <span>3</span></div>
    </aside>

    <main>
      <header>
        <div><div className="eyebrow">CLIENT / SOCIAL MEDIA · V9 CLOUD</div><h1>{client.name}</h1><p>{client.handle} · Visual planning, multi-upload and cloud persistence</p></div>
        <div className="header-actions">
          <button className="ghost" onClick={undo} disabled={!history.length}><RotateCcw size={17}/> Undo</button>
          <button className="magic" onClick={()=>setLayoutOpen(true)}><Sparkles size={17}/> Arrange Best Layout</button>
          <button className="primary" onClick={()=>fileRef.current?.click()}><Plus size={17}/> Upload Multiple Posts</button>
          <input ref={fileRef} hidden type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*" onChange={e=>{addFiles(e.target.files); e.currentTarget.value="";}}/>
        </div>
      </header>

      <section className="toolbar">
        <div className="tabs">
          <button className={view==="grid"?"on":""} onClick={()=>setView("grid")}><LayoutGrid size={16}/> Feed</button>
          <button className={view==="calendar"?"on":""} onClick={()=>setView("calendar")}><CalendarDays size={16}/> Calendar</button>
          <button className={view==="list"?"on":""} onClick={()=>setView("list")}><List size={16}/> List</button>
        </div>
        <div className="legend"><span><i className="dot idea"/>Idea</span><span><i className="dot review"/>In Review</span><span><i className="dot approved"/>Approved</span></div>
      </section>

      {view==="grid" && <section className="workspace">
        <div className="phone">
          <div className="ig-head"><button className="ig-avatar editable-avatar" onClick={()=>logoRef.current?.click()} title="Upload client logo">{client.logo?<img src={client.logo}/>:client.initials}<span className="avatar-edit">+</span></button>
          <input ref={logoRef} hidden type="file" accept="image/*" onChange={e=>{updateClientLogo(e.target.files,client.id);e.currentTarget.value=""}}/><div><b>{client.handle.replace("@","")}</b><small>{posts.length} posts planejados</small></div><button>•••</button></div>
          <div className="feed">
            {ordered.map((p,i)=><article key={p.id} draggable={p.status!=="Published"} onDragStart={()=>p.status!=="Published"&&setDragId(p.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropOn(p.id)} onClick={()=>setSelected(p)} className={"tile "+(p.status==="Published"?"locked":"")} title={p.status==="Published"?"Published posts are locked":"Drag to swap position"}>
              <img src={p.media[0]?.url}/>
              <div className="tile-top"><span>{i+1}</span>{p.kind==="carousel"&&<Layers3 size={17}/>}</div>
              <div className="tile-bottom"><span className={"status "+p.status.toLowerCase().replace(" ","-")}>{p.status}</span>{p.comments.length>0&&<span><MessageSquare size={13}/>{p.comments.length}</span>}</div>
            </article>)}
            <button className="add-tile" onClick={()=>fileRef.current?.click()}><ImagePlus/><span>Add</span></button>
          </div>
        </div>

        <aside className="phone-preview-wrap">
          <div className="preview-label"><span>LIVE MOBILE PREVIEW</span><button onClick={()=>setPhoneOpen(true)}>Open preview</button></div>
          <button className="iphone-shell" onClick={()=>setPhoneOpen(true)} aria-label="Open Instagram mobile preview">
            <div className="iphone-screen">
              <div className="dynamic-island"></div>
              <div className="mobile-ig-top"><b>‹</b><strong>{client.handle.replace("@","")}</strong><span>•••</span></div>
              <div className="mobile-profile">
                <div className="mobile-avatar">{client.logo?<img src={client.logo}/>:client.initials}</div>
                <div className="mobile-stats"><b>{posts.length}</b><small>posts</small></div>
                <div className="mobile-stats"><b>—</b><small>followers</small></div>
                <div className="mobile-stats"><b>—</b><small>following</small></div>
              </div>
              <div className="mobile-bio"><b>{client.name}</b><span>Brand profile preview</span></div>
              <div className="mobile-actions"><span>Following</span><span>Message</span></div>
              <div className="mobile-tabs"><b>▦</b><span>▣</span><span>♙</span></div>
              <div className="mobile-grid">{posts.map(p=><img key={p.id} src={p.media[0]?.url}/>)}</div>
            </div>
          </button>
        </aside>
      </section>}

      {view==="calendar" && <CalendarView posts={posts} onSelect={setSelected}/>}
      {view==="list" && <ListView posts={posts} onSelect={setSelected}/>}
    </main>

    {uploadNotice && <div className="upload-toast"><ImagePlus size={16}/><span>{uploadNotice}</span></div>}

    
    {clientModal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setClientModal(null)}}>
      <div className="client-modal">
        <div className="client-modal-head"><div><span>CLIENT PROFILE</span><h2>{clientModal==="new"?"Create new client":"Edit client"}</h2><p>{clientModal==="new"?"Create an independent Instagram workspace for this brand.":"Update the brand name and Instagram username at any time."}</p></div><button onClick={()=>setClientModal(null)}><X size={18}/></button></div>
        <label>Client / Brand name<input autoFocus value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Solaris"/></label>
        <label>Instagram username<input value={clientHandle} onChange={e=>setClientHandle(e.target.value)} placeholder="@brand.username" onKeyDown={e=>{if(e.key==="Enter")saveClient()}}/></label>
        <div className="client-modal-actions"><button className="cancel-layout" onClick={()=>setClientModal(null)}>Cancel</button><button className="apply-layout" onClick={saveClient}>{clientModal==="new"?<Plus size={16}/>:<Pencil size={15}/>} {clientModal==="new"?"Create Client":"Save Changes"}</button></div>
      </div>
    </div>}

    {phoneOpen && <div className="phone-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPhoneOpen(false)}}>
      <div className="phone-modal-card">
        <button className="close-phone" onClick={()=>setPhoneOpen(false)}><X/></button>
        <div className="iphone-shell iphone-large">
          <div className="iphone-screen scrollable-phone">
            <div className="dynamic-island"></div>
            <div className="mobile-ig-top sticky"><b>‹</b><strong>{client.handle.replace("@","")}</strong><span>•••</span></div>
            <div className="mobile-profile">
              <div className="mobile-avatar">{client.logo?<img src={client.logo}/>:client.initials}</div>
              <div className="mobile-stats"><b>{posts.length}</b><small>posts</small></div>
              <div className="mobile-stats"><b>—</b><small>followers</small></div>
              <div className="mobile-stats"><b>—</b><small>following</small></div>
            </div>
            <div className="mobile-bio"><b>{client.name}</b><span>Brand profile preview</span></div>
            <div className="mobile-actions"><span>Following</span><span>Message</span></div>
            <div className="mobile-tabs"><b>▦</b><span>▣</span><span>♙</span></div>
            <div className="mobile-grid">{posts.map(p=><img key={p.id} src={p.media[0]?.url}/>)}</div>
          </div>
        </div>
      </div>
    </div>}

    {layoutOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setLayoutOpen(false)}}>
      <div className="layout-modal">
        <div className="layout-modal-head"><div><span>SMART LAYOUT</span><h2>Choose a feed direction</h2><p>Published posts stay locked. Select a visual strategy for upcoming content.</p></div><button onClick={()=>setLayoutOpen(false)}><X size={19}/></button></div>
        <div className="layout-options">
          {([
            ["balanced","Balanced","Spread similar tones apart for an even, editorial composition."],
            ["checkerboard","Checkerboard","Alternate light and dark content for stronger visual rhythm."],
            ["gradient","Gradient Flow","Move from lighter to deeper tones in a smooth visual sequence."]
          ] as const).map(([key,title,desc])=><button key={key} className={"layout-option "+(layoutChoice===key?"selected":"")} onClick={()=>setLayoutChoice(key)}>
            <div className="mini-grid">{previewFor(key).map((p,i)=><img key={i} src={p.media[0]?.url}/>)}</div>
            <div className="option-copy"><div><b>{title}</b>{layoutChoice===key&&<span>Selected</span>}</div><p>{desc}</p></div>
          </button>)}
        </div>
        <div className="layout-note"><span>🔒</span><div><b>Published content is protected</b><p>Only upcoming posts will move. You can use Undo after applying a layout.</p></div></div>
        <div className="layout-actions"><button className="cancel-layout" onClick={()=>setLayoutOpen(false)}>Cancel</button><button className="apply-layout" onClick={()=>arrangeBy(layoutChoice)}><Sparkles size={16}/> Apply Layout</button></div>
      </div>
    </div>}

    {selected && <Editor post={selected} onClose={()=>setSelected(null)} onUpdate={update} onDelete={()=>remove(selected.id)} onAddCarousel={fs=>{
      if(!fs?.length)return; const m=[...fs].map(f=>({id:uid(),url:URL.createObjectURL(f),name:f.name}));
      update({...selected,media:[...selected.media,...m],kind:"carousel"});
    }}/>}
  </div>
}

function Editor({post,onClose,onUpdate,onDelete,onAddCarousel}:{post:Post,onClose:()=>void,onUpdate:(p:Post)=>void,onDelete:()=>void,onAddCarousel:(f:FileList|null)=>void}){
  const [comment,setComment]=useState("");
  return <div className="drawer">
    <div className="drawer-head"><div><span>CONTENT</span><h2>{post.kind==="carousel"?"Carousel":"Post"}</h2></div><button onClick={onClose}><X/></button></div>
    <div className="slides">
      {post.media.map((m,i)=><div className="slide" key={m.id}><img src={m.url}/><span>{i+1}</span></div>)}
      <label className="slide add"><Plus/><input hidden type="file" multiple accept="image/*" onChange={e=>onAddCarousel(e.target.files)}/></label>
    </div>
    <label>Caption<textarea value={post.caption} placeholder="Write the caption..." onChange={e=>onUpdate({...post,caption:e.target.value})}/></label>
    <div className="row"><label>Date<input type="date" value={post.date} onChange={e=>onUpdate({...post,date:e.target.value})}/></label><label>Time<input type="time" value={post.time} onChange={e=>onUpdate({...post,time:e.target.value})}/></label></div>
    <div className="row"><label>Status<select value={post.status} onChange={e=>onUpdate({...post,status:e.target.value as Status})}>{["Idea","Production","In Review","Approved","Published"].map(s=><option>{s}</option>)}</select></label><label>Assignee<select value={post.assignee} onChange={e=>onUpdate({...post,assignee:e.target.value})}>{["Lucas","Bruna","Katia"].map(s=><option>{s}</option>)}</select></label></div>
    <div className="comments"><h3>Comments <span>{post.comments.length}</span></h3>{post.comments.map((c,i)=><div className="comment" key={i}><b>{i%2?"Bruna":"Lucas"}</b><p>{c}</p></div>)}
      <div className="commentbox"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment..."/><button onClick={()=>{if(comment.trim()){onUpdate({...post,comments:[...post.comments,comment.trim()]});setComment("")}}}>Send</button></div>
    </div>
    <button className="delete" onClick={onDelete}><Trash2 size={16}/> Delete content</button>
  </div>
}

function CalendarView({posts,onSelect}:{posts:Post[],onSelect:(p:Post)=>void}){
  const days=Array.from({length:35},(_,i)=>i+1);
  return <section className="calendar"><div className="cal-title"><h2>October / November 2026</h2><button>Today</button></div><div className="week">{["MON","TUE","WED","THU","FRI","SAT","SUN"].map(x=><b>{x}</b>)}</div><div className="cal-grid">{days.map((d,i)=><div className="day"><span>{d>31?d-31:d}</span>{posts.filter(p=>Number(p.date.slice(-2))===(d>31?d-31:d)).slice(0,2).map(p=><button onClick={()=>onSelect(p)}><img src={p.media[0]?.url}/><small>{p.time}</small></button>)}</div>)}</div></section>
}

function ListView({posts,onSelect}:{posts:Post[],onSelect:(p:Post)=>void}){
  return <section className="listview"><div className="listhead"><span>Content</span><span>Date</span><span>Status</span><span>Assignee</span></div>{posts.map(p=><button className="listrow" onClick={()=>onSelect(p)}><span className="contentcell"><img src={p.media[0]?.url}/><span><b>{p.caption||"No caption"}</b><small>{p.kind==="carousel"?`${p.media.length} slides`:"Post"}</small></span></span><span>{p.date} · {p.time}</span><span><i className={"status "+p.status.toLowerCase().replace(" ","-")}>{p.status}</i></span><span>{p.assignee}</span></button>)}</section>
}

createRoot(document.getElementById("root")!).render(<App/>);
