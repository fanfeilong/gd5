const LogEnv = {
    disable: 'disable',
    chrome: 'chrome',
    wechat: 'wechat'
};

/**
 * 简易日志
 */
class Log{
    constructor(env, contexts){
        this.m_logEnv = env;
        if(contexts!=null){
            this.m_contexts = [...contexts];
        }else{
            this.m_contexts = [];
        }
    }

    env(){
        return this.m_logEnv;
    }

    pushContext(context){
        this.m_contexts.push(context);
    }

    popContext(){
        this.m_contexts.pop();
    }

    fork(){
        return new Log(this.m_logEnv, this.m_contexts);
    }

    _prefix(tag,info){
        return `[${tag}][user]:${this.m_contexts.join(',')}, ${info}`;
    }

    i(info){
        if(this.m_logEnv===LogEnv.disable){
            return;
        }
        
        info = this._prefix('info',info);
        if(this.m_logEnv===LogEnv.chrome){
            console.log(info);
        }else{
            alert(info);
        }
    }

    w(info){
        if(this.m_logEnv===LogEnv.disable){
            return;
        }

        info = this._prefix('warn',info);
        if(this.m_logEnv===LogEnv.chrome){
            console.warn(info);
        }else{
            alert(info);
        }
        
        
    }

    e(info){
        if(this.m_logEnv===LogEnv.disable){
            return;
        }

        info = this._prefix('error',info);
        if(this.m_logEnv===LogEnv.chrome){
            console.error(info);
            console.assert(false);
        }else{
            alert(info);
        }
    }
}