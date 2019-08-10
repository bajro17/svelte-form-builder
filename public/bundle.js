
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    class HtmlTag {
        constructor(html, anchor = null) {
            this.e = element('div');
            this.a = anchor;
            this.u(html);
        }
        m(target, anchor = null) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(target, this.n[i], anchor);
            }
            this.t = target;
        }
        u(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        p(html) {
            this.d();
            this.u(html);
            this.m(this.t, this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/ListOfFields.svelte generated by Svelte v3.7.1 */
    const { console: console_1 } = globals;

    const file = "src/ListOfFields.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.l = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.l = list[i];
    	return child_ctx;
    }

    // (54:0) {#each list as l}
    function create_each_block_1(ctx) {
    	var li, t0_value = ctx.l, t0, li_id_value, t1, input, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			attr(li, "class", "list-group-item");
    			attr(li, "id", li_id_value = ctx.l);
    			add_location(li, file, 54, 0, 1118);
    			attr(input, "type", "hidden");
    			add_location(input, file, 55, 0, 1188);
    			dispose = listen(li, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			insert(target, t1, anchor);
    			insert(target, input, anchor);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.list) && t0_value !== (t0_value = ctx.l)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.list) && li_id_value !== (li_id_value = ctx.l)) {
    				attr(li, "id", li_id_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    				detach(t1);
    				detach(input);
    			}

    			dispose();
    		}
    	};
    }

    // (62:0) {#each olist as l,i}
    function create_each_block(ctx) {
    	var div, label, t0_value = ctx.l.label, t0, label_for_value, t1, html_tag, raw_value = ctx.l.text, t2, dispose;

    	function dragstart_handler(...args) {
    		return ctx.dragstart_handler(ctx, ...args);
    	}

    	function drop_handler(...args) {
    		return ctx.drop_handler(ctx, ...args);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = space();
    			attr(label, "for", label_for_value = ctx.l.label);
    			add_location(label, file, 64, 0, 1394);
    			html_tag = new HtmlTag(raw_value, t2);
    			attr(div, "draggable", true);
    			add_location(div, file, 62, 0, 1263);

    			dispose = [
    				listen(div, "dragstart", dragstart_handler),
    				listen(div, "drop", drop_handler),
    				listen(div, "dragover", dragover)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, t0);
    			append(div, t1);
    			html_tag.m(div);
    			append(div, t2);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.olist) && t0_value !== (t0_value = ctx.l.label)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.olist) && label_for_value !== (label_for_value = ctx.l.label)) {
    				attr(label, "for", label_for_value);
    			}

    			if ((changed.olist) && raw_value !== (raw_value = ctx.l.text)) {
    				html_tag.p(raw_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function create_fragment(ctx) {
    	var ul, t0, div, t1, textarea;

    	var each_value_1 = ctx.list;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var each_value = ctx.olist;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			textarea = element("textarea");
    			attr(ul, "class", "list-group");
    			add_location(ul, file, 52, 0, 1076);
    			attr(div, "id", "wrap");
    			add_location(div, file, 60, 0, 1226);
    			attr(textarea, "name", "");
    			attr(textarea, "id", "");
    			attr(textarea, "cols", "30");
    			attr(textarea, "rows", "10");
    			textarea.value = ctx.nestooo;
    			add_location(textarea, file, 71, 0, 1475);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			insert(target, t0, anchor);
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert(target, t1, anchor);
    			insert(target, textarea, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.list) {
    				each_value_1 = ctx.list;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_1.length;
    			}

    			if (changed.olist) {
    				each_value = ctx.olist;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.nestooo) {
    				textarea.value = ctx.nestooo;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}

    			destroy_each(each_blocks_1, detaching);

    			if (detaching) {
    				detach(t0);
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t1);
    				detach(textarea);
    			}
    		}
    	};
    }

    function inputText(l) {
        return '<input type="text" name="'+l+'" id="'+l+'">';
    }

    function dragstart (ev, item) {
          ev.dataTransfer.setData("item", item);
         
    	}

    function dragover (ev) {
    		ev.preventDefault();
    		ev.dataTransfer.dropEffect = 'move';
    	}

    function instance($$self, $$props, $$invalidate) {
    	let { list = [] } = $$props;

      let olist = [];

      let nestooo;

      let position = 0;
      function add(l) {
          $$invalidate('olist', olist = olist.concat({ label: l, text: inputText(l), position: position}));
          position += 1;
          
      }
    	function drop (ev, m) {
    		ev.preventDefault();
            var i = ev.dataTransfer.getData("item");
            var temp = olist[i].position;
            olist[i].position = olist[m].position; $$invalidate('olist', olist);
            
            olist[m].position = temp; $$invalidate('olist', olist);
            olist.sort((a,b) => a.position > b.position ? 1 : -1);
            $$invalidate('nestooo', nestooo = "");
            var tt = document.querySelectorAll("#wrap > div");
            tt.forEach(element => {
                $$invalidate('nestooo', nestooo += element.innerHTML);
            });
            console.log(nestooo);

        }

    	const writable_props = ['list'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<ListOfFields> was created with unknown prop '${key}'`);
    	});

    	function click_handler({ l }) {
    		return add(l);
    	}

    	function dragstart_handler({ i }, event) {
    		return dragstart(event, i);
    	}

    	function drop_handler({ i }, event) {
    		return drop(event,i);
    	}

    	$$self.$set = $$props => {
    		if ('list' in $$props) $$invalidate('list', list = $$props.list);
    	};

    	$$self.$$.update = ($$dirty = { olist: 1 }) => {
    		if ($$dirty.olist) { $$invalidate('olist', olist); }
    		if ($$dirty.olist) { console.log(olist); }
    	};

    	return {
    		list,
    		olist,
    		nestooo,
    		add,
    		drop,
    		click_handler,
    		dragstart_handler,
    		drop_handler
    	};
    }

    class ListOfFields extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["list"]);
    	}

    	get list() {
    		throw new Error("<ListOfFields>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set list(value) {
    		throw new Error("<ListOfFields>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.7.1 */

    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	var h1, t_1, current;

    	var list = new ListOfFields({
    		props: { list: ["email","first_name","last_name"] },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Fields";
    			t_1 = space();
    			list.$$.fragment.c();
    			add_location(h1, file$1, 10, 0, 83);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			insert(target, t_1, anchor);
    			mount_component(list, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    				detach(t_1);
    			}

    			destroy_component(list, detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
