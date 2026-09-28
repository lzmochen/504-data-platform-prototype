/* KPI prototype extension; isolated from the preserved V2.3 state. */
(() => {
  'use strict';
  const K=window.KPI504, E=esc;
  let data, storageError='', filter='', statusFilter='all', editor=null, editorRevision=0, lastTrial=null;
  try{data=K.load();}catch(error){data=K.initial();storageError=error.message;}
  const group={id:'statistics',label:'统计分析',icon:'chart',pages:[{id:'indicators',label:'指标统计'},{id:'indicator-rules',label:'指标定义与规则配置'}]};
  menuGroups.splice(menuGroups.findIndex(g=>g.id==='message'),0,group);
  group.pages.forEach(p=>pageMeta[p.id]={...p,parent:group.label,group:group.id,icon:group.icon});
  document.title='504数据中台 · V2.4指标配置版';
  document.querySelector('.demo-flag').textContent='V2.4指标配置版';
  const periods={day:'日',week:'周（周一开始）',month:'月'};
  const binding={uptime:'开机率卡片',running:'运行率卡片',fault:'故障率卡片','':'不绑定看板'};
  const labels={id:'指标编码',name:'指标名称',source:'数据来源',numerator:'分子',denominator:'分母',scope:'统计范围',exclude:'剔除状态',period:'统计周期',end:'统计截止日',aggregate:'汇总方式',missing:'缺失数据处理',zero:'零分母处理',decimals:'小数位',direction:'达标方向',target:'目标值',warning:'预警值',comparison:'对比方式',foot:'卡片辅助值',slot:'看板绑定',confirmed:'口径确认',owner:'负责人',enabled:'启用状态'};
  const pretty=(key,value)=>({source:{state:'设备状态时长样例',register:'设备状态快照样例'},aggregate:{weighted:'分子分母分别汇总',average:'设备比率等权平均'},missing:{block:'有缺失则不出值',exclude:'成对剔除缺失记录'},zero:{empty:'显示无有效值',zero:'按零计算'},direction:{high:'不低于目标',low:'不高于目标'},comparison:{points:'百分点差',relative:'相对变化率',none:'不对比'},foot:{change:'周期对比',target:'目标值'},slot:binding,period:periods}[key]?.[value] ?? (key==='numerator'||key==='denominator'?K.fields[value]?.label:null) ?? (Array.isArray(value)?value.join('、')||'不剔除':typeof value==='boolean'?(value?'是':'否'):String(value??'—')||'未设置'));
  const action=(text,name,id='',primary=false)=>`<button type="button" class="${primary?'btn primary':'kpi-link'}" data-kpi="${name}" data-id="${E(id)}">${text}</button>`;
  const record=id=>data.records.find(r=>r.draft.id===id);
  const effective=r=>r.published&&r.enabled?r.published:null;
  const status=r=>!r.published?'草稿':!r.enabled?'已停用':JSON.stringify(r.draft)!==JSON.stringify(r.published)?'已发布·有草稿':'已发布';
  const badge=r=>tag(status(r),r.published&&r.enabled?'green':'gray');
  const top=()=>`<div class="kpi-topline">${tag('演示配置','blue')}${tag('样例截止 2026-09-28','gray')}<span>当前浏览器保存 · 无生产连接</span></div>`;
  function readLatest(){data=K.load();return data;}
  function persist(next){K.save(next);data=next;}
  function error(message){const box=document.getElementById('kpiError');if(box)box.textContent=message;else toast('操作未完成',message,'error');}
  function card(rule,info='',click='edit',result){
    const view=K.presentation(rule,result), tint=view.status==='达标'?'#e8f8f0':'#edf5ff';
    return `<article class="kpi-statcard" style="--tint:${tint}"><h3>${E(rule.name)}</h3><div class="kpi-number">${view.value}<span>${view.unit}</span></div><p style="color:${view.color}">${E(view.foot)}</p><div class="kpi-meta"><span>${E(info)}</span>${action(click==='edit'?'配置规则':'查看口径',click,rule.id)}</div></article>`;
  }
  function rulesPage(){
    editor=null;
    const rows=data.records.filter(r=>(!filter||(r.draft.name+' '+r.draft.id).toLowerCase().includes(filter.toLowerCase()))&&(statusFilter==='all'||(statusFilter==='draft'?!r.published:statusFilter==='enabled'?!!effective(r):r.published&&!r.enabled)));
    return pageHead('指标定义与规则配置','',`<a class="btn" href="../monitor-v2/" target="_blank" rel="noopener">查看监盘看板 ↗</a>${action('＋ 新增指标','new','',true)}`)+top()+`<div id="kpiError" class="kpi-error">${E(storageError)}</div>
      <div class="kpi-statcards">${data.records.slice(0,3).map(r=>card(r.draft,'草稿样例试算')).join('')}</div>
      <div class="kpi-filter"><input class="field" id="kpiSearch" aria-label="指标名称或编码" placeholder="搜索指标名称或编码" value="${E(filter)}"><select class="field" id="kpiStatus" aria-label="发布状态">${[['all','全部状态'],['draft','草稿'],['enabled','已发布'],['disabled','已停用']].map(([v,t])=>`<option value="${v}" ${statusFilter===v?'selected':''}>${t}</option>`).join('')}</select><span class="count">共 ${rows.length} 项</span></div>
      <section class="panel"><div class="panel-head"><div class="panel-title">指标规则</div><div class="panel-actions">${tag('百分比指标','blue')}</div></div><div class="table-wrap"><table class="kpi-table"><thead><tr><th>指标名称 / 编码</th><th>计算口径</th><th>统计范围 / 周期</th><th>确认 / 发布状态</th><th>看板绑定</th><th>操作</th></tr></thead><tbody>${rows.map(r=>`<tr><td><span class="kpi-name">${E(r.draft.name)}</span><span class="kpi-code">${E(r.draft.id)}</span></td><td class="kpi-rule-summary">${E(K.formula(r.draft))}<br><span class="kpi-code">${E(pretty('aggregate',r.draft.aggregate))}</span></td><td>${E(r.draft.scope)}<br><span class="kpi-code">${periods[r.draft.period]} · 北京时间</span></td><td>${tag(r.draft.confirmed?'演示已确认':'待客户确认',r.draft.confirmed?'blue':'orange')}<div style="margin-top:6px">${badge(r)}${r.version?` <span class="kpi-code">V${r.version}</span>`:''}</div></td><td>${E(binding[r.draft.slot])}</td><td><div class="kpi-actions">${action('编辑','edit',r.draft.id)}${action('复制','copy',r.draft.id)}${action('试算','trial',r.draft.id)}${action('模拟发布','publish',r.draft.id)}${r.published?action(r.enabled?'停用':'启用','toggle',r.draft.id):''}${action('记录','history',r.draft.id)}</div></td></tr>`).join('')||'<tr><td colspan="6" class="kpi-empty">没有匹配的指标</td></tr>'}</tbody></table></div></section>`;
  }
  function statsPage(){
    editor=null;
    const published=data.records.filter(r=>r.published);
    return pageHead('指标统计','',action('指标定义与规则配置','list','',true)+`<a class="btn" href="../monitor-v2/" target="_blank" rel="noopener">监盘看板 ↗</a>`)+top()+
      `<div class="kpi-statcards">${published.filter(r=>r.enabled).map(r=>card(r.published,`模拟发布 V${r.version}`,'definition')).join('')}</div>`+
      panel('已发布指标',published.length?`<div class="table-wrap"><table class="kpi-table"><thead><tr><th>指标</th><th>有效值</th><th>达标情况</th><th>统计范围</th><th>周期 / 版本</th><th>操作</th></tr></thead><tbody>${published.map(r=>{const v=K.presentation(r.published);return `<tr><td>${E(r.published.name)}</td><td>${r.enabled?v.value+v.unit:'—'}</td><td>${tag(r.enabled?v.status:'已停用',r.enabled&&v.status==='达标'?'green':'gray')}</td><td>${E(r.published.scope)}</td><td>${periods[r.published.period]} / V${r.version}</td><td>${action('计算详情','published-trial',r.draft.id)}　${action('查看口径','definition',r.draft.id)}</td></tr>`;}).join('')}</tbody></table></div>`:'<div class="kpi-empty">暂无已发布规则，请先完成样例试算并模拟发布。</div>');
  }
  pages['indicator-rules']=rulesPage;pages.indicators=statsPage;
  function input(label,key,value,type='text',extra=''){return `<label class="kpi-field">${label}<input name="${key}" type="${type}" value="${E(value)}" ${extra}></label>`;}
  function select(label,key,value,options){return `<label class="kpi-field">${label}<select name="${key}">${options.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];return `<option value="${E(v)}" ${String(value)===String(v)?'selected':''}>${E(t)}</option>`;}).join('')}</select></label>`;}
  function block(step,title,body){return `<section class="kpi-form-block"><div class="kpi-block-head"><span class="kpi-step">${step}</span>${title}</div><div class="kpi-form-grid">${body}</div></section>`;}
  function editorPage(rule,isNew=false){
    editor={rule:K.clone(rule),isNew};editorRevision=data.revision;lastTrial=null;
    const available=Object.entries(K.fields).filter(([,v])=>v.source===rule.source).map(([v,f])=>[v,f.label+'（'+f.unit+'）']);
    return pageHead(isNew?'新增指标':'编辑指标 · '+E(rule.name),'',`<button class="btn" data-kpi="cancel">返回列表</button>`)+top()+`<div id="kpiError" class="kpi-error"></div><form id="kpiForm"><div class="kpi-editor"><div>
      ${block('01','基本信息',input('指标名称 *','name',rule.name,'text','required maxlength="40"')+input('指标编码 *','id',rule.id,'text',`required ${isNew?'':'readonly'} pattern="[A-Z][A-Z0-9_-]{2,39}" maxlength="40"`)+input('口径负责人 *','owner',rule.owner,'text','required maxlength="40"')+select('绑定看板卡片','slot',rule.slot,Object.entries(binding)))}
      ${block('02','计算规则',select('数据来源','source',rule.source,[['state','设备状态时长 · 演示样例'],['register','设备状态快照 · 演示样例']])+select('统计范围','scope',rule.scope,K.scopes)+select('分子','numerator',rule.numerator,available)+select('分母','denominator',rule.denominator,available)+`<div class="kpi-formula kpi-full" id="kpiFormula">${E(K.formula(rule))}</div>`+select('汇总方式','aggregate',rule.aggregate,[['weighted','分子、分母分别汇总后相除'],['average','逐设备计算比率后等权平均']])+select('缺失 / 无效数据','missing',rule.missing,[['block','存在缺失则不出值'],['exclude','成对剔除缺失记录']])+select('分母为零','zero',rule.zero,[['empty','显示无有效值'],['zero','按零计算']])+`<div class="kpi-field"><span>剔除设备状态</span><div class="kpi-checks">${K.statuses.map(s=>`<label><input type="checkbox" name="exclude" value="${s}" ${rule.exclude.includes(s)?'checked':''}>${s}</label>`).join('')}</div></div>`)}
      ${block('03','统计周期',select('统计周期','period',rule.period,Object.entries(periods))+input('样例统计截止日','end',rule.end,'date','min="2026-09-01" max="2026-09-28" required')+`<div class="kpi-note kpi-full" id="kpiWindow">${E(K.windowFor(rule).label)}</div>`)}
      ${block('04','目标与展示',select('达标方向','direction',rule.direction,[['high','不低于目标（越高越好）'],['low','不高于目标（越低越好）']])+input('目标值（%，可留空）','target',rule.target,'number','min="0" max="100" step="0.001"')+input('预警值（%，可留空）','warning',rule.warning,'number','min="0" max="100" step="0.001"')+select('小数位','decimals',rule.decimals,[['0','0 位'],['1','1 位'],['2','2 位'],['3','3 位']])+select('周期对比','comparison',rule.comparison,[['points','百分点差（本期 − 上期）'],['relative','相对变化率（本期 − 上期）/ 上期'],['none','不对比']])+select('卡片辅助值','foot',rule.foot,[['change','周期对比'],['target','目标值']])+`<div class="kpi-note kpi-full">配色：达标绿 / 未达标橙 / 超出预警红。无有效值显示“—”。预警仅用于卡片展示。</div>`)}
      ${block('05','口径确认',`<div class="kpi-checks kpi-full"><label><input type="checkbox" name="confirmed" ${rule.confirmed?'checked':''}>演示口径确认（不代表客户正式确认）</label></div>`)}
      </div><aside class="kpi-side"><div><div class="kpi-block-head">卡片预览</div><div id="kpiPreview">${card(rule,'未发布预览','definition')}</div></div><section class="kpi-form-block"><div class="kpi-block-head">试算概要</div><div id="kpiTrialSummary" class="kpi-note">点击“样例试算”查看有效样本、计算过程和异常处理结果。</div><div style="padding:16px">${action('样例试算','form-trial','',true)}</div></section></aside></div><div class="kpi-footer"><button class="btn" type="button" data-kpi="cancel">取消</button><button class="btn" type="button" data-kpi="form-trial">样例试算</button><button class="btn primary" type="submit">保存草稿</button></div></form>`;
  }
  function edit(rule,isNew=false){navigate('indicator-rules');document.getElementById('content').innerHTML=editorPage(rule,isNew);document.querySelector('.content').scrollTop=0;}
  function formValue(){const f=document.getElementById('kpiForm');const fd=new FormData(f);return {...editor.rule,...Object.fromEntries(fd),decimals:+fd.get('decimals'),name:String(fd.get('name')).trim(),id:String(fd.get('id')).trim(),owner:String(fd.get('owner')).trim(),exclude:fd.getAll('exclude'),confirmed:fd.has('confirmed')};}
  function refreshPreview(){
    const r=formValue();document.getElementById('kpiFormula').textContent=K.formula(r);
    if(r.end)document.getElementById('kpiWindow').textContent=K.windowFor(r).label;
    const issues=K.errors(r);document.getElementById('kpiPreview').innerHTML=issues.length?`<div class="kpi-note">${E(issues[0])}</div>`:card(r,'未发布预览','definition');
    if(!issues.length)document.getElementById('kpiError').textContent='';
    lastTrial=null;document.getElementById('kpiTrialSummary').textContent='配置已变化，请重新试算。';
  }
  function trialMarkup(rule,scenario='normal'){
    let rows=K.clone(K.samples);
    if(scenario==='empty')rows=[];
    if(scenario==='zero')rows.forEach(x=>{x[rule.numerator]=0;x[rule.denominator]=0;});
    if(scenario==='missing')rows.forEach(x=>{x[rule.numerator]=null;});
    const result=K.compute(rule,rows), view=K.presentation(rule,result,K.compute(rule,rows,1));
    return `<div class="kpi-topline">${tag('固定演示样例','blue')}${tag(K.fields[rule.numerator]?.unit==='台'?'按设备去重，取期内最新快照':'按设备汇总期内时长','gray')}</div><div class="kpi-formula">${E(K.formula(rule))}</div><dl class="kpi-detail"><dt>统计窗口</dt><dd>${E(result.window?.label||'—')}</dd><dt>样本行数</dt><dd>${result.count} 条 / 缺失或无效 ${result.skipped} 条</dd><dt>分子 / 分母</dt><dd>${result.numerator??'—'} / ${result.denominator??'—'} ${E(K.fields[rule.numerator]?.unit||'')}</dd><dt>汇总方式</dt><dd>${E(pretty('aggregate',rule.aggregate))}</dd><dt>试算结果</dt><dd><b style="color:${view.color};font-size:23px" id="kpiTrialValue">${view.value}${view.unit}</b>　${E(result.reason||view.status)}</dd><dt>周期对比</dt><dd>${E(view.comparison)}</dd></dl><div class="kpi-table-scroll"><table class="kpi-table"><thead><tr><th>样例设备</th><th>范围</th><th>分子</th><th>分母</th><th>设备比率</th></tr></thead><tbody>${result.parts.map(p=>`<tr><td>${E(p.id)}</td><td>${E(p.line)}</td><td>${p.n}</td><td>${p.d}</td><td>${p.d?(p.n/p.d*100).toFixed(+rule.decimals)+'%':rule.zero==='zero'?'0%':'—'}</td></tr>`).join('')||'<tr><td colspan="5" class="kpi-empty">无可计算明细</td></tr>'}</tbody></table></div>`;
  }
  let modalRule=null;
  function trial(rule){modalRule=K.clone(rule);openModal('样例试算 · '+E(rule.name),`<div class="kpi-tabs">${[['normal','常规样例'],['empty','无数据'],['missing','全部缺失'],['zero','零分母']].map(([v,t])=>`<button data-kpi="scenario" data-id="${v}" class="${v==='normal'?'active':''}">${t}</button>`).join('')}</div><div id="kpiTrialBody">${trialMarkup(rule)}</div>`,btn('关闭','close-floating'),true);}
  function definition(r){const rule=r.published||r.draft;openModal('指标口径 · '+E(rule.name),`<div class="kpi-topline">${badge(r)}${tag(r.published?`V${r.version}`:'未发布草稿','blue')}</div><dl class="kpi-detail">${Object.keys(labels).filter(k=>k in rule).map(k=>`<dt>${labels[k]}</dt><dd>${E(pretty(k,rule[k]))}</dd>`).join('')}</dl>`,btn('关闭','close-floating'))}
  function history(r){openModal('修改记录 · '+E(r.draft.name),`<div class="kpi-history">${r.history.map(h=>{const keys=[...new Set([...Object.keys(h.before||{}),...Object.keys(h.after||{})])].filter(k=>JSON.stringify(h.before?.[k])!==JSON.stringify(h.after?.[k]));return `<article><header><b>${E(h.action)} · V${h.version}</b><span>${new Date(h.time).toLocaleString('zh-CN')}</span></header><table><thead><tr><th>配置项</th><th>修改前</th><th>修改后</th></tr></thead><tbody>${keys.map(k=>`<tr><td>${E(labels[k]||k)}</td><td>${E(pretty(k,h.before?.[k]))}</td><td>${E(pretty(k,h.after?.[k]))}</td></tr>`).join('')||'<tr><td colspan="3">配置内容不变</td></tr>'}</tbody></table></article>`;}).join('')||'<div class="kpi-empty">暂无修改记录</div>'}</div>`,btn('关闭','close-floating'),true);}
  function publish(id){
    readLatest();const r=record(id), issues=K.errors(r.draft,data.records);
    if(issues.length)return error(issues.join('；'));
    if(!r.draft.confirmed)return error('口径尚未确认：请先编辑并勾选“演示口径确认”。');
    const conflict=data.records.find(x=>x.draft.id!==id&&effective(x)?.slot&&x.published.slot===r.draft.slot);
    if(r.draft.slot&&conflict)return error(`该看板卡片已绑定“${conflict.published.name}”，请更换绑定或停用原规则。`);
    const v=K.compute(r.draft);if(v.value==null)return error('无法发布：'+v.reason+'。请调整规则并重新试算。');
    openModal('确认模拟发布',`<div class="kpi-formula">${E(K.formula(r.draft))}</div><dl class="kpi-detail"><dt>指标</dt><dd>${E(r.draft.name)}</dd><dt>样例试算值</dt><dd>${K.presentation(r.draft).value}%</dd><dt>发布版本</dt><dd>V${r.version+1}</dd><dt>看板绑定</dt><dd>${E(binding[r.draft.slot])}</dd></dl><div class="kpi-note">仅更新当前浏览器中的演示配置；不会修改生产系统或其他客户浏览器。草稿发布后替换该指标的演示生效版本。</div>`,btn('取消','close-floating')+action('确认模拟发布','confirm-publish',id,true));
    modalRule={revision:data.revision,id};
  }
  function changeState(id){readLatest();const r=record(id);if(!r.published)return;
    if(!r.enabled&&r.published.slot&&data.records.some(x=>x.draft.id!==id&&effective(x)?.slot===r.published.slot))return error('卡片已绑定其他启用规则，无法启用。');
    openModal(r.enabled?'确认停用':'确认启用',`<div class="kpi-note">${E(r.published.name)}：${r.enabled?'停用后，看板对应卡片显示“规则已停用”，不继续显示旧值。':'启用的是上次发布版本，未发布草稿不会生效。'}</div>`,btn('取消','close-floating')+action(r.enabled?'确认停用':'确认启用','confirm-toggle',id,true));modalRule={revision:data.revision,id};}
  document.addEventListener('click',event=>{
    const old=event.target.closest('[data-action="indicator-def"],[data-action="open-bigscreen"]');
    if(old){event.preventDefault();event.stopImmediatePropagation();if(old.dataset.action==='indicator-def')navigate('indicator-rules');else window.open('../monitor-v2/','_blank','noopener');return;}
    const button=event.target.closest('[data-kpi]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();const id=button.dataset.id,a=button.dataset.kpi;
    try {
      if(a==='list'){navigate('indicator-rules');return;}
      if(a==='new'){readLatest();const used=new Set(data.records.map(r=>r.draft.id));let n=4;while(used.has('KPI-'+String(n).padStart(3,'0')))n++;edit(K.makeRule('KPI-'+String(n).padStart(3,'0'),'','on','total'),true);return;}
      if(a==='edit'||a==='copy'){readLatest();const r=K.clone(record(id).draft);if(a==='copy'){r.id='KPI-'+Date.now().toString(36).toUpperCase();r.name=r.name.slice(0,32)+'（副本）';r.slot='';r.confirmed=false;}edit(r,a==='copy');return;}
      if(a==='cancel'){if(editor&&JSON.stringify(formValue())!==JSON.stringify(editor.rule))openModal('放弃未保存修改？','<div class="kpi-note">已保存草稿和已发布版本不会受到影响。</div>',btn('继续编辑','close-floating')+action('放弃修改','discard','',true));else navigate('indicator-rules');return;}
      if(a==='discard'){closeFloating();navigate('indicator-rules');return;}
      if(a==='form-trial'){const rule=formValue();const issues=K.errors(rule,data.records);if(issues.length)return error(issues.join('；'));lastTrial=K.compute(rule);document.getElementById('kpiTrialSummary').textContent=`${lastTrial.count} 条样例 / ${lastTrial.skipped} 条缺失或无效 / 结果 ${K.presentation(rule,lastTrial).value}${lastTrial.value==null?'':'%'}`;trial(rule);return;}
      if(a==='scenario'){button.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));document.getElementById('kpiTrialBody').innerHTML=trialMarkup(modalRule,id);return;}
      if(a==='trial'||a==='published-trial'){readLatest();const r=record(id);trial(a==='trial'?r.draft:r.published);return;}
      if(a==='definition'){if(editor){const r=formValue();definition({draft:r,published:null,enabled:false});}else definition(record(id));return;}
      if(a==='history'){history(record(id));return;}
      if(a==='publish'){publish(id);return;}
      if(a==='toggle'){changeState(id);return;}
      if(a==='confirm-publish'||a==='confirm-toggle'){
        readLatest();if(data.revision!==modalRule.revision)throw Error('另一页面已更新配置，请关闭弹窗后重试。');
        const next=K.clone(data),r=next.records.find(x=>x.draft.id===id);
        if(a==='confirm-publish'){const before=r.published;r.version++;r.published=K.clone(r.draft);r.enabled=true;K.log(r,'模拟发布',before,r.published);}
        else {const before=r.enabled;r.enabled=!r.enabled;K.log(r,r.enabled?'启用':'停用',{enabled:before},{enabled:r.enabled});}
        persist(next);closeFloating();renderPage();toast('演示配置已更新','同一浏览器中的新版看板将同步读取');return;
      }
    }catch(err){error(err.message);}
  },true);
  document.addEventListener('submit',event=>{
    if(!event.target.matches('form#kpiForm'))return;event.preventDefault();
    try{const rule=formValue(),isNew=editor.isNew;readLatest();if(data.revision!==editorRevision)throw Error('另一页面已更新配置，请返回列表后重新编辑。');
      const issues=K.errors(rule,data.records);if(isNew&&record(rule.id))issues.push('指标编码已存在');if(issues.length)throw Error(issues.join('；'));
      const next=K.clone(data);let r=next.records.find(x=>x.draft.id===rule.id);
      if(isNew){r={draft:rule,enabled:false,published:null,version:0,history:[]};next.records.push(r);K.log(r,'新增草稿',null,rule);}else{K.log(r,'保存草稿',r.draft,rule);r.draft=rule;}
      persist(next);navigate('indicator-rules');toast('草稿已保存','未发布草稿不会改变看板指标');
    }catch(err){error(err.message);}
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='kpiSearch'){filter=event.target.value;const position=event.target.selectionStart;renderPage();const field=document.getElementById('kpiSearch');field.focus();field.setSelectionRange(position,position);}
    else if(event.target.closest('#kpiForm')&&event.target.tagName==='INPUT')refreshPreview();
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='kpiStatus'){statusFilter=event.target.value;renderPage();return;}
    if(!event.target.closest('#kpiForm'))return;
    if(event.target.name==='source'){
      const source=event.target.value,f=document.getElementById('kpiForm'),options=Object.entries(K.fields).filter(([,x])=>x.source===source);
      for(const key of ['numerator','denominator'])f.elements[key].innerHTML=options.map(([v,x])=>`<option value="${v}">${x.label}（${x.unit}）</option>`).join('');
      f.elements.numerator.value=source==='state'?'on':'faulty';f.elements.denominator.value=source==='state'?'total':'device';
    }
    if(event.target.name!=='confirmed')document.getElementById('kpiForm').elements.confirmed.checked=false;
    refreshPreview();
  });
  window.addEventListener('storage',event=>{if(event.key!==K.KEY)return;try{if(editor){error('其他页面已更新配置，保存前请返回列表重新编辑。');return;}readLatest();if(['indicators','indicator-rules'].includes(state.active))renderPage();}catch(err){error(err.message);}});
  const initialNav=new URLSearchParams(location.search).get('page');
  renderNav();if(['indicators','indicator-rules'].includes(initialNav))navigate(initialNav);else renderPage();
})();
