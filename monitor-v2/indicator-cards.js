/* Shared-origin demo configuration; never connects to production. */
(() => {
  'use strict';
  const K=window.KPI504, slots=['uptime','running','fault'];
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const config='../v2-4/?page=indicator-rules';
  const metrics=[...document.querySelectorAll('#view-overview .metric-grid .metric')].slice(0,3);
  const original=metrics.map(el=>el.innerHTML);
  let saved=null,loadError='';
  const style=document.createElement('style');style.textContent='.metric[data-kpi-slot]{cursor:pointer}.metric[data-kpi-slot]:hover{border-color:#5495e5;box-shadow:0 6px 18px #1769e018}.metric[data-kpi-slot]:focus-visible{outline:3px solid #8bbaff}.kpi-monitor-status{position:absolute;right:12px;bottom:12px;color:#7e93a8;font-size:9px}.kpi-monitor-link{color:#1769e0;text-decoration:none}.kpi-monitor-note{color:#67819c;background:#f3f8ff;padding:12px;border-radius:7px;line-height:1.8;font-size:12px}.kpi-monitor-detail{display:grid;grid-template-columns:130px 1fr;gap:12px;font-size:13px;margin:18px 0;line-height:1.8}.kpi-monitor-detail dt{color:#7d94ab}.kpi-monitor-detail dd{color:#365e82;margin:0}';document.head.appendChild(style);
  const actions=document.querySelector('#view-overview .view-actions');
  const link=document.createElement('a');link.className='btn primary';link.href=config;link.target='_blank';link.rel='noopener';link.textContent='指标规则配置 ↗';actions.prepend(link);
  const chip=document.createElement('span');chip.className='tag';chip.textContent='样例演示';actions.prepend(chip);
  document.title='504智能监盘看板 · 指标规则联动版';
  function find(slot){const rows=saved?.records.filter(r=>r.published?.slot===slot)||[];return rows.find(r=>r.enabled)||rows[0];}
  function refresh(){
    try{saved=K.load();loadError='';}catch(error){saved=null;loadError=error.message;}
    metrics.forEach((el,index)=>{
      const slot=slots[index],r=find(slot);el.innerHTML=original[index];
      el.dataset.kpiSlot=slot;el.setAttribute('role','button');el.setAttribute('tabindex','0');
      const val=el.querySelector('.metric-value'),foot=el.querySelector('.metric-foot');
      val.classList.remove('live-value');
      if(loadError){val.textContent='—';foot.textContent='配置读取失败';}
      else if(!r){foot.textContent='原始样例 · 规则待发布';}
      else {
        el.querySelector('.metric-label').textContent=r.published.name;
        const view=K.presentation(r.published);
        val.innerHTML=r.enabled?`${view.value}<span class="metric-unit">${view.unit}</span>`:'—';
        foot.style.color=r.enabled?view.color:'#8a99aa';foot.textContent=r.enabled?view.foot:'规则已停用';
      }
      el.setAttribute('aria-label',`查看${el.querySelector('.metric-label').textContent}指标口径`);
      const status=document.createElement('span');status.className='kpi-monitor-status';status.textContent=r?`V${r.version} · 样例`:'查看口径';el.appendChild(status);
    });
  }
  function show(slot){
    const r=find(slot);
    if(!r){openModal('指标口径',`<div class="kpi-monitor-note">${E(loadError||'此卡片保留原始演示样例，尚未关联已发布计算规则。请到中台完成口径配置、样例试算与模拟发布。')}</div><div class="modal-actions"><a class="btn primary kpi-monitor-link" href="${config}" target="_blank" rel="noopener">配置指标规则 ↗</a></div>`);return;}
    const d=r.published,result=K.compute(d),view=K.presentation(d);
    openModal('指标口径 · '+E(d.name),`<div class="kpi-monitor-note">模拟发布 V${r.version} · ${r.enabled?'已启用':'已停用'} · 仅当前浏览器演示配置</div><dl class="kpi-monitor-detail"><dt>计算公式</dt><dd>${E(K.formula(d))}</dd><dt>统计范围</dt><dd>${E(d.scope)} / 剔除：${E(d.exclude.join('、')||'无')}</dd><dt>汇总方式</dt><dd>${d.aggregate==='weighted'?'分子、分母分别汇总后相除':'逐设备比率等权平均'}</dd><dt>统计窗口</dt><dd>${E(result.window?.label||'—')}</dd><dt>异常策略</dt><dd>缺失：${d.missing==='block'?'不出值':'成对剔除'} / 零分母：${d.zero==='empty'?'无有效值':'按零计算'}</dd><dt>演示试算</dt><dd>${r.enabled?view.value+view.unit:'规则已停用'} ${E(result.reason)}</dd><dt>目标 / 预警</dt><dd>${d.target===''?'未设目标':`${d.direction==='high'?'≥':'≤'} ${E(d.target)}%`} / ${d.warning===''?'未设预警':E(d.warning)+'%'}</dd><dt>负责人</dt><dd>${E(d.owner)}</dd></dl><div class="modal-actions"><button class="btn" data-close>关闭</button><a class="btn primary kpi-monitor-link" href="${config}" target="_blank" rel="noopener">编辑指标配置 ↗</a></div>`);
  }
  document.addEventListener('click',event=>{const el=event.target.closest('[data-kpi-slot]');if(el)show(el.dataset.kpiSlot);const business=event.target.closest('[data-business]');if(business){event.preventDefault();event.stopImmediatePropagation();window.open('../v2-4/','_blank','noopener');}},true);
  metrics.forEach(el=>el.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();show(el.dataset.kpiSlot);}}));
  window.addEventListener('storage',event=>{if(event.key===K.KEY)refresh();});
  window.addEventListener('focus',refresh);document.getElementById('refreshBtn').addEventListener('click',refresh);
  refresh();
})();
