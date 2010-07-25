﻿window.eventHandlers.click['show-frame'] = function(event)
{
  var frame = stop_at.getFrame(event.target['ref-id']);
  if (frame)
  {
    topCell.showView(views['inspection'].id);
    messages.post('active-inspection-type', {inspection_type: 'frame'});
    messages.post('frame-selected', {frame_index: event.target['ref-id']});
    if (event.type == 'click')
    {
      helpers.setSelected(event);
      if (views.js_source.isvisible())
      {
        if (frame.script_id)
        {
          var plus_lines = views.js_source.getMaxLines() <= 10
            ? views.js_source.getMaxLines() / 2 >> 0
            : 10;
          views.js_source.showLine(frame.script_id, frame.line - plus_lines);
          views.js_source.showLinePointer(frame.line, frame.id == 0);
        }
        else
        {
          views.js_source.clearView();
        }
      }
    }
  }
  else
  {
    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "missing frame in 'show-frame' handler");
  }
};

window.eventHandlers.click['expand-value'] = function(event, target)
{
  var
  val = target.parentNode.getElementsByTagName('value')[0],
  text_content = val.textContent;

  val.textContent = val.getAttribute('data-value');
  val.setAttribute('data-value', text_content);
  if (target.style.backgroundPosition)
  {
    target.style.removeProperty('background-position');
  }
  else
  {
    target.style.backgroundPosition = '0px -11px';
  }
};

window.eventHandlers.click['examine-object-2'] = function(event, target)
{
  var
  parent = target.parentNode,
  parent_parent = parent.parentNode,
  obj_id = parseInt(parent.getAttribute('obj-id')),
  depth = parseInt(parent.getAttribute('depth')),
  rt_id = parseInt(parent_parent.getAttribute('rt-id')),
  data_id = parent_parent.getAttribute('data-id'),
  data = null,
  examine_object = parent.getElementsByTagName('examine-objects')[0];

  if (window[data_id])
  {
    if (examine_object) // is unfolded
    {
      if (!target.disabled)
      {
        window[data_id].clearData(rt_id, obj_id, depth, parent.getElementsByTagName('key')[0].textContent);
        parent.removeChild(examine_object);
        target.style.removeProperty("background-position");
      }
    }
    else
    {
      if (data = window[data_id].getData(rt_id, obj_id, depth, arguments))
      {
        if (data.length)
        {
          examine_object = parent_parent.cloneNode(false);
          examine_object.innerHTML = window[data_id].prettyPrint(data, depth,
            settings['inspection'].get("hide-default-properties"), window[data_id].filter_type);
          parent.appendChild(examine_object);
          target.style.backgroundPosition = "0px -11px";
        }
        else
        {
          target.disabled = true;
        }
      }
    }
  }
};

window.eventHandlers.click['show-scripts'] = function(event)
{
  var runtime_id = event.target.getAttribute('runtime_id');
  var scripts = runtimes.getScripts(runtime_id);
  var scripts_container = event.target.parentNode.getElementsByTagName('ul')[0];
  var script = null, i = 0;

  if (scripts_container)
  {
    event.target.parentNode.removeChild(scripts_container);
    event.target.style.removeProperty('background-position');
    runtimes.setUnfolded(runtime_id, 'script', false);
  }
  else
  {
    scripts_container = ['ul'];
    for ( ; script = scripts[i]; i++)
    {
      scripts_container.push(templates.scriptLink(script));
    }
    scripts_container.splice(scripts_container.length, 0, 'runtime-id', runtime_id);
    event.target.parentNode.render(scripts_container);
    event.target.style.backgroundPosition = '0 -11px';
    runtimes.setUnfolded(runtime_id, 'script', true);
  }
};

window.eventHandlers.click['show-stylesheets'] = function(event, target)
{
  var rt_id = target.getAttribute('runtime_id');
  // stylesheets.getStylesheets will call this function again if data is not avaible
  // handleGetAllStylesheets in stylesheets will
  // set for this reason __call_count on the event object
  var sheets = stylesheets.getStylesheets(rt_id, arguments);
  if (sheets)
  {
    var container = event.target.parentNode.getElementsByTagName('ul')[0];
    var sheet = null, i = 0;
    if (container)
    {
      target.parentNode.removeChild(container);
      target.style.removeProperty('background-position');
      runtimes.setUnfolded(rt_id, 'css', false);
    }
    else
    {
      container = ['ul'];
      for ( ; sheet = sheets[i]; i++)
      {
        container.push(templates.sheetLink(sheet, i));
      }
      container.splice(container.length, 0, 'runtime-id', rt_id);
      event.target.parentNode.render(container);
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setUnfolded(rt_id, 'css', true);
    }
  }
};

window.eventHandlers.click['display-stylesheet'] = function(event, target)
{
  var index = parseInt(target.getAttribute('index'));
  var rt_id = target.parentNode.getAttribute('runtime-id');
  // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
  // handleGetRulesWithIndex in stylesheets will
  // set for this reason __call_count on the event object
  var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);

  if (rules)
  {
    stylesheets.setSelectedSheet(rt_id, index, rules);
    topCell.showView(views.stylesheets.id);
    helpers.setSelected(event);
  }
};

window.eventHandlers.click['show-runtimes'] = function(event)
{
  var window_id = event.target.parentNode.getAttribute('window_id');
  var rts = runtimes.getRuntimes(window_id);
  var runtime_container = event.target.parentNode.getElementsByTagName('ul')[0];
  var rt = null, i = 0;
  var template_type = event.target.parentNode.parentNode.getAttribute('template-type');

  if (runtime_container)
  {
    event.target.parentNode.removeChild(runtime_container);
    event.target.style.removeProperty('background-position');
    runtimes.setWindowUnfolded(window_id, false);
  }
  else
  {
    event.target.parentNode.render(templates.runtimes(rts, template_type));
    event.target.style.backgroundPosition = '0 -11px';
    runtimes.setWindowUnfolded(window_id, true);
  }
};

window.eventHandlers.click['display-script'] = function(event)
{
  var script_id = event.target.getAttribute('script-id');

  if (script_id)
  {
    runtimes.setSelectedScript(script_id);
    views.runtimes.updateSelectedScript(event.target, script_id);
    topCell.showView(views.js_source.id);
  }
  else
  {
    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
      "missing script id in window.eventHandlers.click['display-script']")
  }
};

window.eventHandlers.click['continue'] = function(event)
{
  views.js_source.clearLinePointer();
  views.callstack.clearView();
  views.inspection.clearView();
  stop_at.__continue(event.target.id.slice(9));
};

window.eventHandlers.click['set-stop-at'] = function(event)
{
  stop_at.setUserStopAt(event.target.value, event.target.checked);
};

window.eventHandlers.click['set-break-point'] = function(event)
{
  var line = parseInt(event.target.parentElement.children[0].value);
  var script_id = views.js_source.getCurrentScriptId();

  if (line)
  {
    if (runtimes.hasBreakpoint(script_id, line))
    {
      runtimes.removeBreakpoint(script_id, line);
      views.js_source.removeBreakpoint(line);
    }
    else
    {
      runtimes.setBreakpoint(script_id, line);
      views.js_source.addBreakpoint(line);
    }
  }
};

window.eventHandlers.click['get-children'] = function(event)
{
  var container = event.target.parentNode;
  var level = (parseInt(container.style.marginLeft) || 0) / 16;
  var level_next = (container.nextSibling && parseInt(container.nextSibling.style.marginLeft) || 0) / 16;
  var ref_id = parseInt(container.getAttribute('ref-id'));

  if (level_next > level)
  {
    dom_data.closeNode(ref_id);
  }
  else
  {
    dom_data.getChildernFromNode(ref_id, event.ctrlKey ? 'subtree' : 'children');
  }
};

window.eventHandlers.click['spotlight-node'] = function(event, current_target)
{
  var obj_id = parseInt(current_target.getAttribute('ref-id'));
  if (obj_id)
  {
    hostspotlighter.spotlight(obj_id,
      settings.dom.get('scroll-into-view-on-spotlight') && obj_id != dom_data.getCurrentTarget());
    dom_data.setCurrentTarget(obj_id);
    views['dom'].updateTarget(current_target, obj_id);
  }
};

window.eventHandlers.click['create-all-runtimes'] = function()
{
  services['ecmascript-debugger'].createAllRuntimes();
};

window.eventHandlers.click['update-global-scope'] = function(event)
{
  window.eventHandlers.click['show-frame']({'target': { 'ref-id': 0 } });
};

window.eventHandlers.click['dom-inspection-export'] = function(event)
{
  export_data.data = views['dom'].exportMarkup();
  topCell.showView('export_data');
};

window.eventHandlers.click['inspect-object-link'] = function(event, target)
{
  var rt_id = parseInt(target.getAttribute('rt-id'));
  var obj_id = parseInt(target.getAttribute('obj-id'));
  messages.post('active-inspection-type', {inspection_type: 'object'});
  // if that works it should be just inspection
  topCell.showView(views.inspection.id);
  messages.post('object-selected', {rt_id: rt_id, obj_id: obj_id});
};

window.eventHandlers.click['dom-resource-link'] = function(event, target)
{
  window.eventHandlers.dblclick['edit-dom'].delay(arguments.callee.execute, event, target);
};

window.eventHandlers.click['dom-resource-link'].execute = function(event, target)
{
  var
  url = target.textContent,
  rt_id = target.parentNode.parentNode.parentNode.getAttribute('rt-id')
    // for the case of dom tree-style
    || target.parentNode.parentNode.parentNode.parentNode.getAttribute('rt-id');
  // TODO use the exec service to open new link when it's ready
  window.open(helpers.resolveURLS(runtimes.getURI(rt_id), url.slice(1, url.length - 1)), "_blank");
};

window.eventHandlers.click['show-color-picker'] = function(event, target)
{
  window.views['color-selector'].show_color_picker(event);
  
};

var ColorPickerView = function(id, name, container_class)
{

  this.createView = function(container){};
  this.show_in_views_menu = true;
  this.window_top = 20;
  this.window_left = 20;
  this.window_width = 376;
  this.window_height = 242;
  this.window_resizable = false;
  this.window_statusbar = false;
  this.cp_old_color = '';
  this.cp_style_prop = '';
  this.cp_rt_id = 0;
  this.cp_rule_id = 0;
  this.cp_color_sample = null;
  this.cp_value_container = null;
  
  this.cp_cb = function(color)
  {
    this.cp_value_container.firstChild.nodeValue = color.hhex;
    this.cp_color_sample.style.backgroundColor = color.hhex;
    var script = 
      "rule.style.setProperty(\"" + this.cp_style_prop + "\", \"" + color.hhex + "\", null)";
      services['ecmascript-debugger'].requestEval(0,
          [this.cp_rt_id, 0, 0, script, [["rule", this.cp_rule_id]]]);
  }
  this.cp_cb_bound = this.cp_cb.bind(this);
  
  this.createView = function(container)
  {
    var color_picker = new ColorPicker(this.cp_cb_bound, this.cp_old_color);
    container.render(color_picker.render());
  }
  this.show_color_picker = function(event)
  {
    var target = event.target, cur_ele = target.parentNode;
    this.cp_color_sample = target;
    this.cp_old_color = target.style.backgroundColor;
    this.cp_value_container = cur_ele;
    this.cp_target_container = cur_ele.parentNode;
    this.cp_style_prop = cur_ele.parentNode.getElementsByTagName('key')[0].textContent;
    cur_ele = cur_ele .parentNode.parentNode;
    this.cp_rule_id = parseInt(cur_ele.getAttribute('rule-id'));
    this.cp_rt_id = parseInt(cur_ele.parentNode.getAttribute('rt-id'));
    this.cp_fade_ele = viewport.render(['div', 'class', 'black-50']);
    this.cp_target_container.addClass('color-picker-target-element');
    UIWindowBase.showWindow(this.id);
  }
  
  this.ondestroy = function()
  {
    this.cp_fade_ele.parentNode.removeChild(this.cp_fade_ele);
    this.cp_target_container.removeClass('color-picker-target-element');
  };
  this.init(id, name, container_class);
}
ColorPickerView.prototype = ViewBase;
new ColorPickerView('color-selector', 'Color Picker', 'color-selector');


