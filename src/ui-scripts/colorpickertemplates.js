﻿(function()
{

  /**
    * Templates with svg_ prefix are meant to be used as part
    * of an other svg template, e.g. the svg root element must already exist.
    */
  var get_id = (function()
  {
    var id_count = 0;
    return function()
    {
      return "svg-uid-" + (++id_count);
    };
  })();

  this.color_picker_inputs = function(z_axis, disable_alpha)
  {

    const COLORSPACE = 0, Z = 4;

    var
    set_checked = function(colorspace)
    {
      if (colorspace[COLORSPACE][Z] == z_axis)
        colorspace.push('checked')
      return colorspace;
    },
    shv_inputs =
    [
      ['s-v-h', 'h', 'h:', 'number', '°', '0', '360'],
      ['h-v-s', 's', 's:', 'number', '%', '0', '100'],
      ['h-s-v', 'v', 'v:', 'number', '%', '0', '100'],
    ].map(set_checked),
    rgb_inputs =
    [
      ['b-g-r', 'r', 'r:', 'number', null, '0', '255'],
      ['b-r-g', 'g', 'g:', 'number', null, '0', '255'],
      ['r-g-b', 'b', 'b:', 'number', null, '0', '255'],
    ].map(set_checked),
    alpha_input =
    ["tr",
       ["td", ""],
       ["td", "α: "],
       ["td",
         ["input",
          'name', 'alpha',
          'type', 'number',
          'min', '0',
          'max', '1',
          'step', '0.05',
          'class', 'color-picker-number',
          'disabled', disable_alpha
         ]
       ]
    ];

    return (
    ['form',
      ['table',
        shv_inputs.map(this.color_picker_inputs_row, this),
        ['tr', ['td', 'class', 'color-picker-spacer', 'colspan', '3']],
        rgb_inputs.map(this.color_picker_inputs_row, this),
        ['tr', ['td', 'class', 'color-picker-spacer', 'colspan', '3']],
        alpha_input,
        'class', 'color-picker-inputs'
      ]
    ]);
  };

  this.color_picker_inputs_row = function(input, index)
  {
    const
    COLOR_SPACE = 0,
    METHOD = 1,
    LABEL = 2,
    TYPE = 3,
    UNITS = 4,
    MIN = 5,
    MAX = 6,
    CHECKED = 7;

    var id = 'color-picker-input-' + input[METHOD];

    return (
    ['tr',
      ['td',
        input[COLOR_SPACE] ?
        ['input',
          'type', 'radio',
          'name', 'color-space',
          'value', input[COLOR_SPACE]
        ].concat(input[CHECKED] ? ['checked', 'checked'] : []) :
        []
      ],
      ['td',
        ['label',
            input[LABEL],
         'for', id
        ]
      ],
      ['td',
        ['input',
          'name', input[METHOD],
          'type', input[TYPE],
          'class', 'color-picker-' + input[TYPE],
          'id', id,
        ].concat(input[MIN] ? ['min', input[MIN], 'max', input[MAX]] : []),
        input[UNITS] ? ["span", " " + input[UNITS], "class", "color-picker-input-unit"]
                     : ""
      ]
    ])
  }

  this.slider_focus_catcher = function()
  {
    return (
    ['input', 'style', 'display: block; ' +
                       'position:absolute; ' +
                       'left: -1000px; ' +
                       'top:0; ' +
                       'width: 10px;'
    ]);
  }

  this.color_picker_popup = function(existing_color, cp_class, cp_2d_class,
                                     cp_1d_class, cp_old_class, cp_new_class,
                                     z_axis, disable_alpha)
  {
    return (
      ['div',
        ['div',
          ['canvas', 'class', 'cp-canvas'],
          'data-handler', 'onxy',
          'class', cp_2d_class
        ],
        ['div',
          ['canvas', 'class', 'cp-canvas'],
          'data-handler', 'onz',
          'class', cp_1d_class
        ],
        window.templates.color_picker_inputs(z_axis, disable_alpha),
        ["input", "name", "hex", "class", "color-picker-text"],
        ["div",
          ['div',
            'class', cp_old_class,
            'data-color', 'cancel',
            'style', 'background-color:' + existing_color.rgba
          ],
          ['div', 'class', cp_new_class],
         "class", "color-picker-color-alpha-bg"
        ],
        window.templates.color_picker_palette_dropdown(),
        ["div",
          ["button",
             "Cancel",
           "class", "container-button ui-button",
           "handler", "color-picker-cancel"
          ],
          ["button",
             "OK",
           "class", "container-button ui-button",
           "handler", "color-picker-ok"
          ],
         "class", "color-picker-controls"
        ],
       'class', cp_class
      ]
    );
  };

  this.color_picker_palette_dropdown = function()
  {
    if (window.cls && cls.ColorPalette)
    {
      var MAX_PALETTE_ITEMS = 16;
      var palette = cls.ColorPalette.get_instance().get_color_palette().slice(0, MAX_PALETTE_ITEMS);
      var colors = palette.map(function(item) { return item.color; });
      // Show 16 small squares with palette colors (possibly repeated)
      for (var i = 0; colors.length < MAX_PALETTE_ITEMS; i++)
      {
        colors.push(colors[i % MAX_PALETTE_ITEMS]);
      }

      return ([
        "div",
        "class", "color-picker-palette-dropdown",
        "data-tooltip", "color-palette"
      ]);
    }
    return [];
  };

  this.color_picker_palette = function()
  {
    if (window.cls && cls.ColorPalette)
    {
      var palette = cls.ColorPalette.get_instance().get_color_palette();
      return (
      ['div',
        this.color_picker_palette_item_add(),
        palette.map(this.color_picker_palette_item, this),
       'class', 'color-picker-palette',
       'data-menu', 'color-picker-palette'
      ]);
    }
    return [];
  };

  this.color_picker_palette_item_add = function()
  {
    return ([
      "span",
      "handler", "add-color-picker-color",
      "class", "color-picker-palette-item-add ui-control ui-button"
    ]);
  }

  this.color_picker_palette_item = function(item)
  {
    return (
    ['span',
      'data-color', item.color,
      'data-color-id', String(item.id),
      'handler', 'set-color-picker-color',
      'style', 'background-color: #' + item.color,
      'class', 'color-picker-palette-item']);
  }

  this.slider = function(slider_base_class, slider_class, slider_template)
  {
    return (
    ['div',
      ['div',
        slider_template || [],
        'class', slider_class
      ],
      'class', slider_base_class
    ]);
  }

  this.pointer = function(pointer_class)
  {
    return (
    ['div',
      'class', pointer_class
    ]);
  }

}).apply(window.templates || (window.templates = {}));
