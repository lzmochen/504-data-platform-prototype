/* V2.3: bounded UI/data-consistency corrections from the 2026-09-24 review.
 * All edits remain session-only demo state. No authentication or backend is added.
 * Alarm severity, thresholds, approval workflows and role inheritance are unchanged.
 */
(() => {
  'use strict';
  const original = {
    renderPage, showEntityForm, saveEntity, doDelete, deviceBase,
    showImport, showRuleTest, showPermissions, showRoles,
    hierarchy: pages.hierarchy, users: pages['users-roles'],
    query: pages['point-query'], dashboard: pages.dashboard, dataDict: pages['data-dict']
  };
  const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
  const now = () => new Date().toLocaleString('sv-SE', {timeZone: 'Asia/Shanghai'});
  const blank = text => `<div class="empty" style="padding:38px 16px">${icon('database')}<b>${esc(text)}</b></div>`;
  const field = (label, name, value = '', required = false, type = 'text') =>
    `<div class="form-row"><label for="review-${name}">${required ? '<em>*</em>' : ''}${esc(label)}</label><input id="review-${name}" class="form-control" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${type === 'number' ? 'step="any"' : ''}></div>`;
  const choose = (label, name, value, options, required = false) =>
    `<div class="form-row"><label for="review-${name}">${required ? '<em>*</em>' : ''}${esc(label)}</label><select id="review-${name}" class="form-control" name="${name}" ${required ? 'required' : ''}>${options.map(o => {
      const [id, text] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(text)}</option>`;
    }).join('')}</select></div>`;
  const detailGrid = entries => `<div class="desc-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${entries.map(([k,v]) => `<div class="desc-item"><small>${esc(k)}</small><b style="overflow-wrap:anywhere">${esc(v ?? '—')}</b></div>`).join('')}</div>`;
  const finish = (message = '当前演示会话已更新') => { closeFloating(); renderPage(); toast('保存成功', message); };
  let sequence = 0;

  // Do not fabricate acquisition timestamps from browser refresh time.
  state.devices.forEach(d => { d.updated = '未提供采集时间'; });
  state.points.forEach(p => { p.sampledAt = null; });
  state.messages[0].sourceId = 'ALM-260917-0068';
  state.messages[0].time = `事件 ${state.alarms[0].time}`;
  state.messages[0].body = `事件 ${state.messages[0].sourceId} · 触发值 ${state.alarms[0].value}`;
  state.messages.slice(1).forEach(m => { m.time = '未提供发送时间'; });
  state.reviewLogs = [
    {id:'LOG-SAMPLE-001',time:'2026-09-18 17:36:12',user:'admin',module:'设备管理',action:'编辑设备',object:'DEV-5-001',ip:'10.54.20.16',result:'成功'},
    {id:'LOG-SAMPLE-002',time:'2026-09-18 17:32:51',user:'liming',module:'报警记录',action:'确认报警',object:'ALM-260917-0068',ip:'10.54.20.28',result:'成功'},
    {id:'LOG-SAMPLE-003',time:'2026-09-18 17:18:06',user:'liuyang',module:'测点管理',action:'批量导入',object:'504点表_0918.xlsx',ip:'10.54.20.32',result:'部分成功'},
    {id:'LOG-SAMPLE-004',time:'2026-09-18 16:52:44',user:'admin',module:'用户权限',action:'调整角色授权',object:'设备工程师',ip:'10.54.20.16',result:'成功'}
  ];
  function audit(module, action, object, before, after) {
    state.reviewLogs.unshift({id:`LOG-SESSION-${++sequence}`,time:now(),user:'admin',module,action,object,ip:'本地演示',result:'成功',before:clone(before),after:clone(after),session:true});
  }
  const fieldNames = {code:'编码',name:'名称',type:'类型',model:'型号',maker:'制造商',line:'所属产线',status:'状态',grade:'重要度',points:'测点数',updated:'数据时间',account:'账号',org:'所属组织',role:'角色',scope:'数据范围',login:'登录时间',condition:'条件',point:'关联点位',pointCode:'测点编码',unit:'单位',range:'量程',address:'DCS 地址',desc:'说明',category:'分类',value:'字典值',label:'显示名称',region:'地区',photo:'设备图片',document:'维修文档'};
  function showLog(id) {
    const log = state.reviewLogs.find(x => x.id === id);
    if (!log) return toast('未找到记录', '记录可能已移除', 'error');
    let changes = blank('历史样例未提供变更快照');
    if (log.session) {
      const before = log.before || {}, after = log.after || {};
      const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
      const show = v => v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      changes = keys.length ? table(['字段','变更前','变更后'], keys.map(k => `<tr><td>${esc(fieldNames[k] || k)}</td><td style="overflow-wrap:anywhere">${esc(show(before[k]))}</td><td style="overflow-wrap:anywhere">${esc(show(after[k]))}</td></tr>`), keys.length) : blank('本次操作没有字段变化');
    }
    openDrawer(`操作日志 · ${esc(log.id)}`, detailGrid([['操作时间',log.time],['操作人',log.user],['所属模块',log.module],['操作',log.action],['对象',log.object],['结果',log.result],['来源',log.ip]]) + `<div style="height:16px"></div>${panel('变更明细',changes)}`);
  }
  pages.logs = () => pageHead('操作日志','',btn(`${icon('download')}导出日志`,'export')) +
    toolbar(searchField('用户、对象或操作'),btn('查询','apply-filter','primary')) +
    panel('操作记录',table(['时间','用户','模块','操作','对象','来源','结果','操作'],state.reviewLogs.map(l => `<tr class="data-row"><td>${esc(l.time)}</td><td>${esc(l.user)}</td><td>${esc(l.module)}</td><td>${esc(l.action)}</td><td>${esc(l.object)}</td><td>${esc(l.ip)}</td><td>${statusTag(l.result)}</td><td><button class="action-link" data-action="review-log" data-id="${esc(l.id)}">详情</button></td></tr>`),state.reviewLogs.length),'','flush');

  // Give every basic-data row a stable identity; business dictionaries are not models.
  state.reviewMasters = {
    type:state.deviceDicts.type.map((r,i) => ({id:`TYPE-${i}`,name:r[0],code:r[1],count:r[2],status:r[3]})),
    model:state.deviceDicts.model.map((r,i) => ({id:`MODEL-${i}`,name:r[0],maker:r[1],type:r[2],status:r[3]})),
    maker:state.deviceDicts.maker.map((r,i) => ({id:`MAKER-${i}`,name:r[0],code:r[1],region:r[2],status:r[3]})),
    business:[
      {id:'DICT-0',category:'计量单位',code:'UNIT-KPA',value:'kPa',label:'千帕',scope:'压力测点',status:'启用'},
      {id:'DICT-1',category:'计量单位',code:'UNIT-C',value:'℃',label:'摄氏度',scope:'温度测点',status:'启用'},
      {id:'DICT-2',category:'设备状态',code:'DEV-ONLINE',value:'ONLINE',label:'在线',scope:'设备运行状态',status:'启用'},
      {id:'DICT-3',category:'报警等级',code:'ALM-L2',value:'LEVEL_2',label:'二级预警',scope:'告警等级',status:'启用'},
      {id:'DICT-4',category:'数据类型',code:'TYPE-FLOAT',value:'FLOAT',label:'浮点型',scope:'测点数据类型',status:'启用'}
    ]
  };
  const masterLabels = {type:'设备类型',model:'设备型号',maker:'制造商',business:'字典项'};
  function masterActions(kind,id) {
    return `<div class="actions"><button class="action-link" data-action="review-master-form" data-kind="${kind}" data-id="${esc(id)}">编辑</button><button class="action-link danger" data-action="review-master-delete" data-kind="${kind}" data-id="${esc(id)}">删除</button></div>`;
  }
  pages['device-dicts'] = () => {
    const kind = state.dictTab, rows = state.reviewMasters[kind];
    const cols = kind === 'type' ? ['类型名称','类型编码','设备数量','状态'] : kind === 'model' ? ['型号名称','制造商','设备类型','状态'] : ['制造商名称','编码','地区','状态'];
    const keys = kind === 'type' ? ['name','code','count','status'] : kind === 'model' ? ['name','maker','type','status'] : ['name','code','region','status'];
    return pageHead('设备类型、型号与制造商','',btn(`${icon('plus')}新增记录`,'review-master-form','primary',`data-kind="${kind}"`)) +
      `<div class="tabs">${Object.entries(masterLabels).filter(([k]) => k !== 'business').map(([k,v]) => `<button class="inner-tab ${k === kind ? 'active' : ''}" data-action="dict-tab" data-id="${k}">${v}</button>`).join('')}</div>` +
      toolbar(searchField('名称或编码'),btn('查询','apply-filter','primary')) + panel('基础字典',table([...cols,'操作'],rows.map(r => `<tr class="data-row">${keys.map(k => `<td>${k === 'status' ? statusTag(r[k]) : esc(r[k])}</td>`).join('')}<td>${masterActions(kind,r.id)}</td></tr>`),rows.length),'','flush');
  };
  pages['data-dict'] = () => {
    const rows = state.reviewMasters.business;
    const template = document.createElement('template');
    template.innerHTML = original.dataDict();
    const addButton = template.content.querySelector('[data-action="add-entity"]');
    addButton.dataset.action = 'review-master-form';
    addButton.dataset.kind = 'business';
    const body = template.content.querySelector('.tree-layout > div:last-child .panel-body');
    body.innerHTML = table(['分类','字典编码','字典值','显示名称','适用范围','状态','操作'],rows.map(r => `<tr class="data-row">${['category','code','value','label','scope','status'].map(k => `<td>${k === 'status' ? statusTag(r[k]) : esc(r[k])}</td>`).join('')}<td>${masterActions('business',r.id)}</td></tr>`),rows.length);
    return template.innerHTML;
  };
  function masterForm(kind,id) {
    const item = state.reviewMasters[kind]?.find(r => r.id === id) || {};
    let fields;
    if (kind === 'business') fields = choose('分类','category',item.category || '计量单位',['计量单位','设备状态','报警等级','数据类型','处理状态'],true) + field('字典编码','code',item.code,true) + field('字典值','value',item.value,true) + field('显示名称','label',item.label,true) + field('适用范围','scope',item.scope,true);
    else if (kind === 'model') fields = field('型号名称','name',item.name,true) + choose('制造商','maker',item.maker || '',[['','请选择'],...state.reviewMasters.maker.filter(r => r.status === '启用' || r.name === item.maker).map(r => r.name)],true) + choose('设备类型','type',item.type || '',[['','请选择'],...state.reviewMasters.type.filter(r => r.status === '启用' || r.name === item.type).map(r => r.name)],true);
    else fields = field(kind === 'type' ? '类型名称' : '制造商名称','name',item.name,true) + field('编码','code',item.code,true) + (kind === 'maker' ? field('地区','region',item.region,true) : '');
    fields += choose('状态','status',item.status || '启用',['启用','停用']);
    openModal(`${id ? '编辑' : '新增'}${masterLabels[kind]}`,`<form id="reviewMasterForm" class="form-grid" data-kind="${kind}" data-id="${esc(id || '')}">${fields}</form>`,btn('取消','close-floating') + btn('保存','review-master-save','primary'));
  }
  function references(kind,item) {
    if (kind === 'business') return state.points.filter(p => (item.category === '计量单位' && p.unit === item.value) || (item.category === '数据类型' && p.type === item.label)).map(p => p.code);
    const values = state.devices.filter(d => d[kind === 'type' ? 'type' : kind === 'model' ? 'model' : 'maker'] === item.name).map(d => d.code);
    if (kind !== 'model') state.reviewMasters.model.filter(m => m[kind === 'type' ? 'type' : 'maker'] === item.name).forEach(m => values.push(m.name));
    return values;
  }
  function saveMaster() {
    const form = document.getElementById('reviewMasterForm');
    if (!form.reportValidity()) return;
    const {kind,id} = form.dataset, rows = state.reviewMasters[kind], old = rows.find(x => x.id === id);
    const fd = Object.fromEntries([...new FormData(form)].map(([k,v]) => [k,String(v).trim()]));
    if (Object.values(fd).some(v => !v)) return toast('保存失败','必填字段不能只包含空格','error');
    const unique = kind === 'model' ? 'name' : 'code';
    if (rows.some(r => r.id !== id && r[unique] === fd[unique])) return toast('保存失败','编码或型号已存在','error');
    if (kind === 'business' && rows.some(r => r.id !== id && r.category === fd.category && r.value === fd.value)) return toast('保存失败','同一分类下字典值不能重复','error');
    if (kind !== 'business' && rows.some(r => r.id !== id && r.name === fd.name)) return toast('保存失败','名称已存在','error');
    const identityChanged = old && (kind === 'business' ? old.code !== fd.code || old.value !== fd.value || old.category !== fd.category : old.name !== fd.name);
    if (identityChanged && references(kind,old).length) return toast('暂不能更改标识','该记录已被样例对象引用，请先确认迁移关系','error');
    const before = clone(old), item = {...(old || {}),...fd,id:id || `MASTER-${Date.now()}-${++sequence}`};
    if (kind === 'type' && !old) item.count = 0;
    if (old) Object.assign(old,item); else rows.unshift(item);
    audit('基础管理',`${old ? '编辑' : '新增'}${masterLabels[kind]}`,item.code || item.name,before,item);
    finish();
  }
  function deleteMaster(kind,id,confirmed=false) {
    const rows = state.reviewMasters[kind], item = rows?.find(x => x.id === id);
    if (!item) return;
    const refs = references(kind,item);
    if (refs.length) return toast('不能删除','已被引用：' + refs.join('、'),'error');
    if (!confirmed) return confirmBox('删除确认',`删除 ${esc(item.label || item.name)}？`,'review-master-delete-confirm',`data-kind="${kind}" data-id="${esc(id)}"`);
    rows.splice(rows.indexOf(item),1);
    audit('基础管理',`删除${masterLabels[kind]}`,item.code || item.name,item,null);
    finish('记录已从当前演示会话移除');
  }

  // Show the selected account, not a hard-coded all-lines selection.
  pages['users-roles'] = () => {
    let i = 0;
    return original.users().replaceAll('data-action="permission-modal"', () => `data-action="review-permission" data-id="${esc(state.users[i++].account)}"`);
  };
  function permissionForm(account) {
    const user = state.users.find(u => u.account === account);
    if (!user) return;
    const options = [...new Set([user.scope,'全部产线','五期产线','四期产线','辅助系统'])];
    openModal(`数据权限授权 · ${esc(user.name)}`,`<form id="reviewPermissionForm" data-account="${esc(account)}">${detailGrid([['账号',user.account],['当前角色',user.role]])}<div style="height:16px"></div>${choose('数据权限','scope',user.scope,options,true)}</form>`,btn('取消','close-floating') + btn('保存授权','review-permission-save','primary'));
  }
  function savePermission() {
    const form = document.getElementById('reviewPermissionForm'), user = state.users.find(u => u.account === form.dataset.account);
    const before = {scope:user.scope};
    user.scope = new FormData(form).get('scope');
    audit('用户权限','调整用户数据范围',user.account,before,{scope:user.scope});
    finish();
  }
  showPermissions = () => openModal('角色权限',blank('角色权限配置与继承规则待确认'),btn('关闭','close-floating'));

  // Keep stored conditions when editing. A point change clears numerical inputs.
  function ruleParts(rule) {
    if (!rule) return [null,null,null];
    if (rule.reviewConditions) return rule.reviewConditions;
    const matches = [...rule.condition.matchAll(/(>=|<=|>|<|=)?\s*(-?\d+(?:\.\d+)?)/g)];
    const operator = matches[0]?.[1] || '>';
    return matches.map(m => ({op:m[1] || operator,value:m[2]}));
  }
  function ruleForm(id) {
    const rule = state.rules.find(r => r.id === id), parts = ruleParts(rule);
    const point = rule && (state.points.find(p => p.code === rule.pointCode) || state.points.find(p => p.name === rule.point));
    const pointOptions = [['','请选择测点'],...state.points.map(p => [p.code,`${p.name} · ${p.code} · ${p.unit}`])];
    const thresholds = parts.map((p,i) => `<div class="form-row full"><label>${parts.length === 1 ? '现有阈值条件' : ['一级预警条件','二级预警条件','三级预警条件'][i]}</label><div style="display:flex;gap:8px;align-items:center"><select class="form-control" name="op${i}" aria-label="运算符 ${i+1}">${['>','>=','<','<=','='].map(op => `<option value="${esc(op)}" ${op === (p?.op || '>') ? 'selected' : ''}>${esc(op)}</option>`).join('')}</select><input class="form-control" name="value${i}" type="number" step="any" required aria-label="阈值 ${i+1}" value="${esc(p?.value || '')}" style="flex:1;min-width:0"><b class="review-unit" style="min-width:54px">${esc(point?.unit || '—')}</b></div></div>`).join('');
    openModal(rule ? '编辑单点告警规则' : '新增单点告警规则',`<form id="reviewRuleForm" class="form-grid" data-id="${esc(id || '')}" data-count="${parts.length}">${field('规则名称','name',rule?.name || '',true)}${field('规则编号','id',rule?.id || `R-${String(state.rules.length+1).padStart(3,'0')}`,true)}${choose('关联点位','pointCode',point?.code || '',pointOptions,true)}${choose('状态','status',rule?.status || '停用',['启用','停用'])}${thresholds}<div class="form-row full"><span id="reviewRuleError" role="alert" style="color:var(--red)"></span></div></form>`,btn('取消','close-floating') + btn('保存','review-rule-save','primary'),true);
    // Preserve previous creation default; no new approval/state policy is introduced.
    if (!rule) document.querySelector('#reviewRuleForm [name="status"]').value = '启用';
  }
  function pointChanged() {
    const form = document.getElementById('reviewRuleForm');
    const point = state.points.find(p => p.code === form.elements.pointCode.value);
    form.querySelectorAll('[name^="value"]').forEach(input => { input.value = ''; });
    form.querySelectorAll('.review-unit').forEach(el => { el.textContent = point?.unit || '—'; });
    document.getElementById('reviewRuleError').textContent = point && !['浮点型','整型'].includes(point.type) ? '该测点不是数值型，不能使用当前数值阈值表单。' : '测点已切换，请重新填写阈值。';
  }
  function saveRule() {
    const form = document.getElementById('reviewRuleForm');
    if (!form.reportValidity()) return;
    const fd = Object.fromEntries(new FormData(form)), old = state.rules.find(r => r.id === form.dataset.id);
    const point = state.points.find(p => p.code === fd.pointCode);
    if (!point || !['浮点型','整型'].includes(point.type)) return toast('无法保存','当前表单仅支持数值型测点','error');
    if (!fd.name.trim() || !fd.id.trim()) return toast('无法保存','请填写规则名称和编号','error');
    if (state.rules.some(r => r !== old && r.id === fd.id.trim())) return toast('无法保存','规则编号已存在','error');
    const conditions = Array.from({length:Number(form.dataset.count)},(_,i) => ({op:fd[`op${i}`],value:fd[`value${i}`]}));
    if (conditions.some(c => !Number.isFinite(Number(c.value)))) return toast('无法保存','阈值必须为有效数字','error');
    const before = clone(old), item = {...(old || {}),id:fd.id.trim(),name:fd.name.trim(),point:point.name,pointCode:point.code,unit:point.unit,condition:conditions.map(c => `${c.op} ${c.value}`).join(' / ') + ` ${point.unit}`,reviewConditions:conditions,status:fd.status,delay:'即时',type:'单点位阈值',hits:old?.hits || 0};
    if (old) Object.assign(old,item); else state.rules.unshift(item);
    audit('单点告警规则',old ? '编辑规则' : '新增规则',item.id,before,item);
    finish();
  }
  showEntityForm = (entity,id='') => {
    if (entity === 'rule') return ruleForm(id);
    original.showEntityForm(entity,id);
    if (id && (entity === 'device' || entity === 'point')) {
      const collection = entity === 'device' ? state.devices : state.points;
      const current = collection.find(x => x.code === id);
      document.querySelector('#entityForm [name="desc"]').value = current?.desc || '';
    }
    // Avoid inventing menu policies or changing real-time status semantics here.
    if (entity === 'user') {
      const user = state.users.find(u => u.account === id), control = document.querySelector('#entityForm [name="scope"]');
      if (user && control && ![...control.options].some(o => o.value === user.scope)) control.add(new Option(user.scope,user.scope,true,true),0);
    }
  };
  const entityCollections = {device:'devices',point:'points',user:'users',rule:'rules'};
  const entityModules = {device:'设备管理',point:'测点管理',user:'用户权限',rule:'单点告警规则'};
  const entityNames = {device:'设备',point:'测点',user:'用户',rule:'规则'};
  const identity = (entity,item) => entity === 'user' ? item.account : item.code || item.id;
  saveEntity = (entity,id) => {
    const collection = entityCollections[entity];
    if (!collection) return original.saveEntity(entity,id);
    const form = document.getElementById('entityForm');
    const before = clone(state[collection].find(x => identity(entity,x) === id));
    const fields = new FormData(form), nextId = fields.get(entity === 'user' ? 'account' : 'code');
    const requiredInputs = [...form.querySelectorAll('.form-row')].filter(row => row.querySelector('label em')).map(row => row.querySelector('input,select,textarea'));
    if (requiredInputs.some(input => !String(input.value).trim())) return toast('保存失败','请填写必填字段','error');
    if (state[collection].some(x => identity(entity,x) === nextId && identity(entity,x) !== id)) return toast('保存失败','编码或账号已存在','error');
    original.saveEntity(entity,id);
    if (document.getElementById('entityForm')) return;
    const after = state[collection].find(x => identity(entity,x) === nextId);
    if (!after) return;
    for (const key of ['photo','document']) {
      if (after[key] instanceof File) {
        if (after[key].name) after[key] = after[key].name;
        else if (before && key in before) after[key] = before[key];
        else delete after[key];
      }
    }
    if (!after.desc && before && !('desc' in before)) delete after.desc;
    if (entity === 'user' && before) after.login = before.login;
    if (entity === 'device') after.updated = before?.updated || '未提供采集时间';
    audit(entityModules[entity],`${before ? '编辑' : '新增'}${entityNames[entity]}`,nextId,before,after);
    renderPage();
  };
  doDelete = (entity,id) => {
    const collection = entityCollections[entity], before = collection && clone(state[collection].find(x => identity(entity,x) === id));
    original.doDelete(entity,id);
    if (before) audit(entityModules[entity],`删除${entityNames[entity]}`,id,before,null);
  };

  // Exact static aggregate repair, not a new business definition for online rate.
  pages.hierarchy = () => original.hierarchy().replace('15,438','14,438');
  deviceBase = d => original.deviceBase(d).replace('<b>刚刚</b>',`<b>${esc(d.updated)}</b>`);
  deviceRealtime = d => {
    const points = state.points.filter(p => p.device === d.name);
    return table(['测点','样例值','状态','采集频率','采集时间','操作'],points.length ? points.map(p => `<tr class="data-row"><td>${esc(p.name)}<div class="cell-sub">${esc(p.code)}</div></td><td>${esc(p.value)} ${p.value === '--' ? '' : esc(p.unit)}</td><td>${statusTag(p.status)}</td><td>${esc(p.freq || '—')}</td><td>${esc(p.sampledAt || '未提供')}</td><td><button class="action-link" data-nav="point-query">查询数据</button></td></tr>`) : [`<tr><td colspan="6">${blank('暂无已展示测点')}</td></tr>`],d.points);
  };
  deviceHistory = () => panel('历史趋势',blank('暂无该设备的历史样例数据'));
  pages['point-query'] = () => {
    const html = original.query();
    return state.queryMode === 'realtime' ? html.replaceAll('<td>刚刚</td>','<td>未提供</td>').replace('<th>更新时间</th>','<th>采集时间</th>').replace('<th>实时值</th>','<th>样例值</th>') : html;
  };
  showAlarm = a => {
    if (!a) return toast('记录不存在','无法找到对应报警','error');
    openDrawer(`报警详情 · ${esc(a.id)}`,detailGrid([['发生时间',a.time],['报警等级',a.level],['设备',a.device],['测点',a.point],['触发值',a.value],['触发规则',a.rule],['当前状态',a.status]]) + `<div style="height:16px"></div>${panel('触发前后趋势',blank('暂无该事件对应的历史样例数据'))}<div style="display:flex;justify-content:flex-end;margin-top:16px">${a.status === '未确认' ? btn('确认报警','confirm-alarm','primary',`data-id="${esc(a.id)}"`) : ''}</div>`);
  };
  showRuleTest = r => {
    if (!state.rules.includes(r)) return original.showRuleTest(r);
    openModal(`规则试算 · ${esc(r.name)}`,detailGrid([['规则编号',r.id],['关联点位',r.point],['当前条件',r.condition],['规则状态',r.status]]) + blank('未提供该规则对应的历史样本，暂不能试算'),btn('关闭','close-floating'),true);
  };
  pages.dashboard = () => {
    let i = 0;
    return original.dashboard().replaceAll('<button class="action-link" data-nav="alarms">处理</button>', () => `<button class="action-link" data-action="view-alarm" data-id="${state.alarms[i++].id}">处理</button>`);
  };

  // Import remains an explicitly simulated wizard, with coherent strategy and counts.
  state.reviewImport = {policy:'skip'};
  function importCounts() {
    const update = state.reviewImport.policy === 'update' ? 18 : 0;
    return {add:1246,update,skip:18-update,failed:6,total:1270,accepted:1246+update};
  }
  showImport = (step=1) => {
    const counts = importCounts();
    if (step < 3) {
      original.showImport(step);
      document.querySelector('.modal-head h3').textContent = '点表导入演示';
      if (step === 1) {
        const zone = document.querySelector('.upload-zone');
        zone.querySelector('b').textContent = '使用预置点表样例';
        zone.querySelector('span').textContent = '仅演示校验与确认流程';
      } else {
        const titles = document.querySelectorAll('.metric-top > span:first-child');
        if (titles[0]) titles[0].textContent = '可新增';
        if (titles[1]) titles[1].textContent = '已有记录';
      }
      return;
    }
    openModal('点表导入演示 · 确认',choose('已有测点处理方式','reviewImportPolicy',state.reviewImport.policy,[['skip','跳过已有测点'],['update','更新已有测点']]) + `<div style="height:16px"></div><div id="reviewImportSummary">${detailGrid([['读取总数',`${counts.total} 条`],['确认导入',`${counts.accepted} 条`],['新增',`${counts.add} 条`],['更新',`${counts.update} 条`],['跳过已有',`${counts.skip} 条`],['校验失败',`${counts.failed} 条`]])}</div>`,btn('上一步','import-step','', 'data-step="2"') + btn('确认演示导入','review-import-finish','primary'),true);
  };
  function finishImport() {
    const c = importCounts();
    audit('测点管理','导入演示','504厂五期点表_20260918.xlsx',null,{策略:state.reviewImport.policy === 'skip' ? '跳过已有测点' : '更新已有测点',新增:c.add,更新:c.update,跳过已有:c.skip,校验失败:c.failed});
    openModal('导入演示结果',detailGrid([['新增',`${c.add} 条`],['更新',`${c.update} 条`],['跳过已有',`${c.skip} 条`],['校验失败',`${c.failed} 条`],['执行模式','模拟结果，未写入台账']]),btn('关闭','close-floating'),true);
  }
  function updateBadge() {
    const count = state.messages.filter(m => !m.read).length, badge = document.getElementById('notifyBadge');
    badge.textContent = count; badge.style.display = count ? '' : 'none';
  }
  renderPage = () => { original.renderPage(); updateBadge(); };

  // Capture only actions being repaired, so untouched modules retain their handlers.
  document.addEventListener('click',event => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action, id = el.dataset.id, kind = el.dataset.kind;
    const handled = ['review-master-form','review-master-save','review-master-delete','review-master-delete-confirm','review-permission','review-permission-save','review-rule-save','review-log','review-import-finish','open-message','confirm-alarm','toggle-rule','rule-enable','toggle-user'];
    const scopedRefresh = a === 'refresh' && ['dashboard','devices','device-detail','points','point-query','alarms','hierarchy'].includes(state.active);
    if (!handled.includes(a) && !scopedRefresh) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (scopedRefresh) { renderPage(); toast('页面已刷新','演示数据未重新采集'); }
    else if (a === 'review-master-form') masterForm(kind,id);
    else if (a === 'review-master-save') saveMaster();
    else if (a === 'review-master-delete' || a === 'review-master-delete-confirm') deleteMaster(kind,id,a.endsWith('-confirm'));
    else if (a === 'review-permission') permissionForm(id);
    else if (a === 'review-permission-save') savePermission();
    else if (a === 'review-rule-save') saveRule();
    else if (a === 'review-log') showLog(id);
    else if (a === 'review-import-finish') finishImport();
    else if (a === 'open-message') {
      const m = state.messages.find(x => x.id === Number(id));
      if (!m) return;
      m.read = true; m.readAt = now();
      document.querySelectorAll('.popover').forEach(p => p.remove());
      navigate(m.target);
      if (m.sourceId) showAlarm(state.alarms.find(x => x.id === m.sourceId));
      updateBadge();
    } else if (a === 'confirm-alarm') {
      const alarm = state.alarms.find(x => x.id === id);
      if (!alarm || alarm.status !== '未确认') return;
      const before = {status:alarm.status};
      alarm.status = '已确认';
      audit('报警记录','确认报警',id,before,{status:alarm.status});
      closeFloating(); renderPage(); toast('报警已确认','已记录当前会话操作日志');
    } else if (a === 'toggle-rule' || a === 'rule-enable') {
      const rule = state.rules.find(r => r.id === id);
      if (!rule) return;
      const before = {status:rule.status};
      rule.status = a === 'rule-enable' ? '启用' : rule.status === '启用' ? '停用' : '启用';
      audit('单点告警规则','调整规则状态',id,before,{status:rule.status});
      finish();
    } else if (a === 'toggle-user') {
      const user = state.users.find(u => u.account === id);
      if (!user) return;
      const before = {status:user.status};
      user.status = user.status === '启用' ? '停用' : '启用';
      audit('用户权限','调整用户状态',id,before,{status:user.status});
      finish();
    }
  },true);
  document.addEventListener('change',event => {
    if (event.target.matches('#reviewRuleForm [name="pointCode"]')) pointChanged();
    if (event.target.name === 'reviewImportPolicy') { state.reviewImport.policy = event.target.value; showImport(3); }
  });
  document.addEventListener('submit',event => {
    if (event.target.matches('#reviewMasterForm,#reviewPermissionForm,#reviewRuleForm')) event.preventDefault();
  });
  renderPage();
})();
