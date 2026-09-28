/* Public, fictional KPI configuration demo. No production APIs or executable formulas. */
(function (root) {
  'use strict';
  const KEY = '504-kpi-demo-v1';
  const DAY = 86400000;
  const END = '2026-09-28';
  const fields = {
    on: {label:'开机时长', unit:'分钟', source:'state'},
    run: {label:'有效运行时长', unit:'分钟', source:'state'},
    total: {label:'统计时长', unit:'分钟', source:'state'},
    planned: {label:'计划运行时长', unit:'分钟', source:'state'},
    faulty: {label:'故障设备标记', unit:'台', source:'register'},
    device: {label:'设备计数', unit:'台', source:'register'}
  };
  const scopes = ['全厂','四期产线','五期产线','辅助系统'];
  const statuses = ['运行','停机','检修','离线'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const date = value => new Date(value + 'T00:00:00Z');
  const iso = value => value.toISOString().slice(0,10);
  const shift = (value, days) => iso(new Date(date(value).getTime() + days * DAY));
  function windowFor(rule, offset=0) {
    let end = rule.end || END, start = end;
    if (rule.period === 'week') start = shift(end, -((date(end).getUTCDay()+6)%7));
    if (rule.period === 'month') start = end.slice(0,7)+'-01';
    const length = Math.round((date(end)-date(start))/DAY)+1;
    if (offset) { end=shift(start,-1); start=shift(end,1-length); }
    return {start,end,length,label:`${start} 00:00 — ${shift(end,1)} 00:00（左闭右开，北京时间）`};
  }
  function makeRule(id, name, numerator, denominator, extra={}) {
    return {id,name,numerator,denominator,source:fields[numerator].source,scope:'全厂',exclude:[],period:'day',
      end:END,aggregate:'weighted',missing:'block',zero:'empty',decimals:1,direction:'high',target:'',warning:'',
      comparison:'points',foot:'change',slot:'',confirmed:false,owner:'系统管理员',...extra};
  }
  const seeds = [
    makeRule('KPI-001','全厂开机率','on','total',{slot:'uptime'}),
    makeRule('KPI-002','综合运行率','run','on',{slot:'running',target:'95',foot:'target'}),
    makeRule('KPI-003','设备故障率','faulty','device',{slot:'fault',direction:'low',decimals:2})
  ];
  // Deterministic fictional devices. Count indicators use one latest snapshot per device.
  const samples = [];
  for(let d=0;d<70;d++) for(let i=0;i<24;i++) {
    const day=shift(END,-d), line=scopes[1+Math.floor(i/8)];
    const status=i===22?'离线':i===23?'检修':i===20?'停机':'运行';
    const total=1440, on= Math.round(total*(.95+((i+d)%8)*.004));
    samples.push({deviceId:`DEMO-${String(i+1).padStart(3,'0')}`,day,line,status,
      on:status==='离线'?null:on,run:Math.round(on*(.93+((i+d)%5)*.009)),total,planned:1440,
      faulty:((i+d)%23===0)?1:0,device:1});
  }
  function errors(rule, existing=[]) {
    const out=[];
    if(!/^[A-Z][A-Z0-9_-]{2,39}$/.test(rule.id||''))out.push('指标编码须为 3–40 位大写字母、数字、下划线或短横线');
    if(!(rule.name||'').trim() || rule.name.length>40)out.push('指标名称必填，且不超过 40 字');
    if(existing.some(x=>x.draft.id!==rule.id&&x.draft.name.trim()===rule.name.trim()))out.push('指标名称已存在');
    const n=fields[rule.numerator], d=fields[rule.denominator];
    if(!n||!d||n.unit!==d.unit||n.source!==rule.source||d.source!==rule.source)out.push('分子、分母必须来自同一数据源且单位一致');
    if(rule.numerator===rule.denominator)out.push('分子与分母不能相同');
    if(!scopes.includes(rule.scope))out.push('请选择有效统计范围');
    if(!Array.isArray(rule.exclude)||rule.exclude.some(s=>!statuses.includes(s))||rule.exclude.length===4)out.push('至少保留一种设备状态');
    for(const [key,allowed] of Object.entries({period:['day','week','month'],aggregate:['weighted','average'],missing:['block','exclude'],zero:['empty','zero'],direction:['high','low'],comparison:['points','relative','none'],foot:['change','target'],slot:['','uptime','running','fault']})) {
      if(!allowed.includes(rule[key]))out.push('配置项无效：'+key);
    }
    if(!/^2026-09-(0[1-9]|[12]\d)$/.test(rule.end)||rule.end>END)out.push('演示统计截止日须在 2026-09-01 至 2026-09-28 之间');
    if(!Number.isInteger(+rule.decimals)||+rule.decimals<0||+rule.decimals>3)out.push('小数位须为 0–3');
    for(const key of ['target','warning']) if(rule[key]!==''&&(!Number.isFinite(+rule[key])||+rule[key]<0||+rule[key]>100))out.push((key==='target'?'目标值':'预警值')+'须为 0–100');
    if(rule.warning!==''&&rule.target==='')out.push('配置预警值前，请先填写目标值');
    if(rule.target!==''&&rule.warning!==''&&((rule.direction==='high'&&+rule.warning>=+rule.target)||(rule.direction==='low'&&+rule.warning<=+rule.target)))out.push('预警值须在目标值的未达标一侧');
    if(rule.foot==='target'&&rule.target==='')out.push('选择显示目标值时必须填写目标值');
    if(!(rule.owner||'').trim())out.push('口径负责人必填');
    return out;
  }
  function compute(rule, rows=samples, offset=0) {
    const invalid=errors(rule);
    if(invalid.length)return {value:null,reason:invalid[0],count:0,skipped:0,parts:[]};
    const window=windowFor(rule,offset);
    let selected=rows.filter(x=>x.day>=window.start&&x.day<=window.end);
    if(fields[rule.numerator].unit==='台') {
      const latest=new Map();selected.forEach(x=>{if(!latest.has(x.deviceId)||latest.get(x.deviceId).day<x.day)latest.set(x.deviceId,x);});
      selected=[...latest.values()];
    }
    selected=selected.filter(x=>(rule.scope==='全厂'||x.line===rule.scope)&&!rule.exclude.includes(x.status));
    const base={window,count:selected.length,skipped:0,parts:[],numerator:0,denominator:0,value:null,reason:''};
    if(!selected.length)return {...base,reason:'统计范围内无样例记录'};
    const valid=[];
    for(const x of selected){
      const n=x[rule.numerator],d=x[rule.denominator];
      if(n==null||d==null||!Number.isFinite(n)||!Number.isFinite(d)||n<0||d<0){base.skipped++;continue;}
      if(n>d)return {...base,reason:'存在分子大于分母的记录，请检查口径'};
      valid.push(x);
    }
    if(base.skipped&&rule.missing==='block')return {...base,reason:`${base.skipped} 条记录缺失或无效，按规则不出值`};
    if(!valid.length)return {...base,reason:'剔除异常后无有效样例'};
    const grouped=new Map();
    valid.forEach(x=>{const p=grouped.get(x.deviceId)||{id:x.deviceId,line:x.line,n:0,d:0};p.n+=x[rule.numerator];p.d+=x[rule.denominator];grouped.set(x.deviceId,p);});
    base.parts=[...grouped.values()];base.numerator=base.parts.reduce((s,p)=>s+p.n,0);base.denominator=base.parts.reduce((s,p)=>s+p.d,0);
    if(base.parts.some(p=>!p.d)&&rule.aggregate==='average'&&rule.zero==='empty')return {...base,reason:'存在设备分母为零，按规则不出值'};
    if(!base.denominator&&rule.zero==='empty')return {...base,reason:'分母为零，按规则不出值'};
    base.value=rule.aggregate==='weighted'?(base.denominator?base.numerator/base.denominator*100:0):base.parts.reduce((s,p)=>s+(p.d?p.n/p.d*100:0),0)/base.parts.length;
    return base;
  }
  function presentation(rule, result=compute(rule), previous=compute(rule,samples,1)) {
    const blank=result.value==null, v=result.value, dp=+rule.decimals;
    let color='#1769e0',status='未设目标';
    if(blank){status='无有效值';color='#8291a6';}
    else if(rule.target!==''){
      const ok=rule.direction==='high'?v>=+rule.target:v<=+rule.target;
      const warn=rule.warning!==''&&(rule.direction==='high'?v<+rule.warning:v>+rule.warning);
      status=ok?'达标':warn?'预警':'未达标';color=ok?'#13a66a':warn?'#df4350':'#e58a18';
    }
    let comparison='未开启对比';
    if(rule.comparison!=='none') {
      if(blank||previous.value==null)comparison='无可比数据';
      else if(rule.comparison==='relative'&&!previous.value)comparison='上期为零，无法计算增幅';
      else {const delta=rule.comparison==='points'?v-previous.value:(v-previous.value)/Math.abs(previous.value)*100;
        comparison=`${delta>0?'↑':delta<0?'↓':'—'} ${Math.abs(delta).toFixed(dp)}${rule.comparison==='points'?' 个百分点':'%'} ${rule.period==='day'?'较昨日':'较上一等长周期'}`;}
    }
    return {value:blank?'—':v.toFixed(dp),unit:blank?'':'%',color,status,comparison,
      foot:rule.foot==='target'?`目标 ${rule.direction==='high'?'≥':'≤'} ${Number(rule.target).toFixed(dp)}%`:comparison};
  }
  function initial(){return {schema:1,revision:0,records:seeds.map(draft=>({draft:clone(draft),enabled:false,published:null,version:0,history:[]}))};}
  function load(){
    try {const raw=root.localStorage?.getItem(KEY);if(!raw)return initial();const data=JSON.parse(raw);
      if(data.schema!==1||!Array.isArray(data.records)||data.records.some(r=>!r.draft?.id||!Array.isArray(r.history)||errors(r.draft).length||(r.published&&errors(r.published).length)))throw Error('指标演示数据格式不兼容');
      return data;
    }catch(error){throw Error('无法读取指标演示配置：'+error.message);}
  }
  function save(data){data.revision=(data.revision||0)+1;try {root.localStorage.setItem(KEY,JSON.stringify(data));}catch(error){throw Error('浏览器无法保存配置，请检查存储权限或空间');}}
  function log(record,action,before,after){record.history.unshift({time:new Date().toISOString(),action,user:'系统管理员（演示）',version:record.version,before:clone(before),after:clone(after)});}
  function formula(rule){return `${fields[rule.numerator]?.label||'—'} ÷ ${fields[rule.denominator]?.label||'—'} × 100%`;}
  root.KPI504={KEY,END,fields,scopes,statuses,samples,clone,makeRule,errors,compute,presentation,windowFor,initial,load,save,log,formula};
  if(typeof module!=='undefined')module.exports=root.KPI504;
})(typeof window!=='undefined'?window:globalThis);
