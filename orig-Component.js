
/**
 * 迷你实模式HTML组件规范
 */
class Component{
    constructor(){
        // 统一采用如下格式索引组件内ViewModal/View
        // this.state = {
        //     data: {}, // 视图展示所依赖的数据
        //     ref: {}   // 视图 HTML Element 的索引
        // };
    }

    /** virtual method */
    async componentDidMount(){
        // 组件创建后，navigate过来时会被调用
    }

    /** virtual method */
    componentDidUnMount(){
        // 组件创建后，执行goBack时会被调用
        // 1. 用来清理数据，例如重新初始化this.state.data
        // 2. 用来清理实图，例如清空this.state.ref里动态添加的 HTML Element
    }

    /** virtual method */
    componentDidAttachEvents(){
        // 组件渲染之后，在此对this.state.ref里对各 HTML Element 添加事件
    }

    /** virtual method */
    render(){
        // 组件 Mount 之后，执行的渲染动作
        // HTML Element有两种来源：
        // 1. 直接在.html里预先写好的
        //   * 将必须的 HTML Element 添加到this.state.ref 索引，供后续使用
        //   * 做必要的数据重新绑定动作，数据源在this.state.data里
        // 2. 根据 this.state.data 里的数据，动态修改HTML Element，
        //   * 包括数据绑定
        //   * HTML Element元素增减，例如List列表的展示，TODO：实现一个可用的ListView
    }
}

/**
 * 组件渲染器，支持在页面之间导航：
 * 1. 通过this.m_navigator导航，提供navigate/goBack方法
 * 2. navigate到下一个页面
 *   * 如果下一个页面是模态组件，则保留当前页面作为透视背景，否则当前页面不显示
 *   * 依次执行组件的ComponentDidMount/render/ComponentDidAttachEvents方法
 * 3. goBack到前一个页面
 *   * 执行当前页面的ComponentDidUnMount方法
 *   * 不显示当前页面
 *   * 如果当前页面是模态组件，则什么都不做，否则显示上一个页面
 * 4. pop(n) 直接弹出n个页面
 * 
 * 备注：React之类的Virtual Dom有一定的好处，但是也有很多不必要的工作，本App使用迷你简单实模式Dom操作
 * 参考：https://svelte.dev/blog/virtual-dom-is-pure-overhead
 */
class ComponentRender{
    constructor(){
        const { machId, userId, token } = getUserInfo();
        const loggerContexts = [`machId:${machId}, userId:${userId}, token:${token}`];
        this.m_logger = new Log(g_logEnv,loggerContexts);
        this.m_navigator = {
            navigate:(componentName,...args)=>{
                this._navigate(componentName,...args);
            },
            goBack:()=>{
                this._goBack();
            },
            pop:(n)=>{
                this._pop(n);
            }
        };
        this.state = null;
    }

    init({loading, home}, componentsDef){
        this.state = {
            componentState:{
                'stack': [],
                'loading': loading,
                'home': home,
                'current': null,
            },
            components:{
                
            },
        };

        for(const componentName in componentsDef){
            const componentDef = componentsDef[componentName];
            this.state.components[componentName] = {
                componentName: componentName,
                isMount: componentDef.isMount,
                isModal: componentDef.isModal,
                id: componentDef.id,
                component: new componentDef.type(this.m_navigator, this.m_logger)
            };
        }
    }

    dump(){
        const o = [];
        for(const name in this.state.components){
            const i = this.state.components[name];
            if(i.isMount) o.push(name);
        }
        console.log(o);
    }

    render(){
        const { componentState, components } = this.state;
        this._navigate(componentState.home, null, ()=>{
            this._renderPage(componentState.loading,'none');
        });
    }

    _pop(n){
        const { componentState, components } = this.state;

        if(n==null){
            n=1;
        }
        
        while(n>0){
            n--;
            this._goBack();
        }
    }

    _navigate(nextComponentName, arg, onComplete){
        const { componentState, components } = this.state;

        if(componentState.current===nextComponentName){
            this.m_logger.w(`componentInstance not change, current:${componentState.current}, nextPage:${nextComponentName}`);
            return;
        }

        const instance = components[nextComponentName];
        if(instance==null){
            this.m_logger.e(`Component:'${nextComponentName}' is not exist!`);
            return;
        }

        // hide current and push into stack
        componentState.stack.push(instance);

        if(instance.isModal){
            // 模态对话框下，上一个页面不需要隐藏，做为透明背景
        }else{
            if(componentState.current!=null){
                this._renderPage(componentState.current,'none');
            }
        }
        
        // reset current componentInstance and show nextPage
        componentState.current = nextComponentName;
        this._renderPage(nextComponentName,'block', arg, onComplete);
    }

    _goBack(){
        const { componentState, components } = this.state;

        // pop previous and show
        const previousIndex = componentState.stack.length-2;
        if(previousIndex>=0){

            const previousInstance = componentState.stack[previousIndex];
            const currentInstance = componentState.stack.pop();


            currentInstance.component.componentDidUnMount();
            this._renderPage(currentInstance.componentName,'none');
            currentInstance.isMount = false;
            
            componentState.current = previousInstance.componentName;
            
            if(!currentInstance.isModal){
                this._renderPage(componentState.current,'block');
            }else{
                // 模态情况下，上一个页面不会被隐藏，不需要重置display
            }

        }else{
            this.m_logger.w(`componentState.stack: ${JSON.stringify(componentState.stack)}`);
        }

        this.dump();
    }

    _renderPage(componentName, display, arg, onComplete){
        const { componentState, components } = this.state;
        const instance = components[componentName];
        if(instance==null){
            this.m_logger.w(`componentInstance is null, componentName:${componentName}`);
            return;
        }

        const _display = ()=>{
            // this.m_logger.i(`component is showing..., componentName:${componentName}`);
            if(onComplete){
                onComplete();
            }

            document.getElementById(instance.id).style.display=display;
        };

        // check mount state
        const component = instance.component;
        if(instance.isMount){
            // 不重复渲染，添加刷新机制
            console.log(`display:${componentName}, isMount:${instance.isMount}, ${display}`);
            _display();
            this.dump();
            return;
        }
        instance.isMount = true;


        // prepare params
        let params;
        if(arg==null){
            params = {}
        }else{
            params = arg;
        }
        let previousInstance;
        const previousIndex = componentState.stack.length-2;
        if(previousIndex>=0){
            previousInstance = componentState.stack[previousIndex];
            params.source = previousInstance.componentName;
        }

        // do mount
        // console.log(`mount:${componentName}, componentInstance:${instance.isMount}`);
        component.componentDidMount(params).then(()=>{
            // console.log(`render:${componentName}`);
            component.render();
            component.componentDidAttachEvents();
            _display();

            this.dump();
        });
    }
}

/**
 * 创建一个HTML Element
 * 1. 构造函数可方便的指定索引ref，要创建的标签tag，以及属性attributes
 * 2. 提供childList方法用于组合子元素
 * 3. 提供dom方法用于返回实际的HTML Element
 */
class Element{
    constructor(ref, tag, attributes){
        this.ref = ref;

        const e = document.createElement(tag);
        for(const attributeName in attributes){
            if(attributeName==='text'){
                e.innerText = attributes.text;
            }else{
                const a = attributes[attributeName];
                if(a!=null){
                    e[attributeName] = a;
                }
            }
        }
        this.e = e;

        if(attributes.className){
            if(this.ref.class[attributes.className]) alert('invalid construct, duplicated className');
            this.ref.class[attributes.className] = e;
        }

        if(attributes.id){
            if(this.ref.id[attributes.id]) alert('invalid construct, duplicated id');
            this.ref.id[attributes.id] = e;
        }
    }

    childList(list){
        for(const e of list){
            if(e!=null){
                this.e.appendChild(e.dom());
            }
        }
        return this;
    }

    dom(){
        return this.e;
    }
}

/**
 * 
 * 可组合的层次HTML Element创建方法，例如:
 * 
 * ```
 * const d = new D();
 * d.div({className:`container`,id:`home`}).childList([
 *   d.div({className:`head`, text:`标题`}),
 *   d.div({className:`body`}).childList([
 *     d.img({id:`logo`}),
 *     d.div({id:`desc`,  text:`描述`})
 *   ])
 * ]);
 * 
 * const [ref, root] = d.get();
 * ```
 * 1. root就是局部根HTML Element
 * 2. 则可以通过ref.class.container，ref.id.home来索引对象
 * 3. 暂时要求className不能重复，可改进
 * 
 */
class D{
    constructor(){
        // 假设一次构造过程中，className和id都不重复
        this.ref =  {class:{},id:{}};
        this.root= null;
    }

    div(options){
        return this._create('div', options);
    }

    img(options){
        return this._create('img', options);
    }

    b(options){
        return this._create('b',options);
    }

    s(options){
        return this._create('s',options);
    }

    li(options){
        return this._create('li', options);
    }

    ul(options){
        return this._create('ul', options);
    }

    _create(tag, options){
        const e = new Element(this.ref, tag, options);
        if(this.root==null) this.root = e;
        return e;
    }

    get(){
        return [this.ref, this.root.dom()];
    }

    static clear(e){
        if(e==null) return;
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }
}