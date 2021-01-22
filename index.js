const errors = [];

class Block {
    constructor(lvl){
        this.level = lvl;
    }
    parent = null;
    length = 0;
    lines = [];
    children = [];
    addChild = (obj) => {
        this.children.push(obj);
        obj.parent = this;
        ++this.length;
    }
}


const parse = (str) => {
    const regLevel = new RegExp("^([\\s\\-]+)");
    const invalidLine = new RegExp("^\\-\\-\\-|^\\.\\.\\.|^\\s*#.*|^\\s*$");

    let lines = str.split("\n");
    let temp;

    let level = 0;
    let curLevel = 0;
    
    let blocks = [];
    
    let result = new Block(-1);
    let currentBlock = new Block(0);

    result.addChild(currentBlock);

    let levels = [];
    let line = "";
    
    blocks.push(currentBlock);
    levels.push(level);
    
    let len = lines.length;
    for(let i = 0; i < len; i++) {
        line = lines[i];
        
        if(line.match(invalidLine)) {
            continue;
        }
    
        if(temp = regLevel.exec(line)) {
            level = temp[1].length;
        } else
            level = 0;
        
        if(level > curLevel) {
            let oldBlock = currentBlock;
            currentBlock = new Block(level);
            oldBlock.addChild(currentBlock);
            blocks.push(currentBlock);
            levels.push(level);
        } else if(level < curLevel) {                
            let added = false;

            let k = levels.length - 1;
            for(; k >= 0; --k) {
                if(levels[k] == level) {
                    currentBlock = new Block(level);
                    blocks.push(currentBlock);
                    levels.push(level);
                    if(blocks[k].parent!= null)
                        blocks[k].parent.addChild(currentBlock);
                    added = true;
                    break;
                }
            }
            
            if(!added) {
                throw ("Error: Invalid indentation at line " + i + ": " + line);
            }
        }
        
        currentBlock.lines.push(line.trim());
        curLevel = level;
    }
    
    return result;
}

const processValue = (val) => {
    const dashesString = new RegExp("^\\s*\\\"([^\\\"]*)\\\"\\s*$");
    const quotesString = new RegExp("^\\s*\\\'([^\\\']*)\\\'\\s*$");
    const float = new RegExp("^[+-]?[0-9]+\\.[0-9]+(e[+-]?[0-9]+(\\.[0-9]+)?)?$");
    const integer = new RegExp("^[+-]?[0-9]+$");
    const array = new RegExp("\\[\\s*(.*)\\s*\\]");
    const map = new RegExp("\\{\\s*(.*)\\s*\\}");
    const key_value = new RegExp("([a-z0-9_-][ a-z0-9_-]*):( .+)", "i");
    const single_key_value = new RegExp("^([a-z0-9_-][ a-z0-9_-]*):( .+?)$", "i");
        
    val = val.trim();
    let temp = null;

    if(val == 'true') {
        return true;
    } else if(val == 'false') {
        return false;
    } else if(val == '.NaN') {
        return Number.NaN;
    } else if(val == 'null') {
        return null;
    } else if(val == '.inf') {
        return Number.POSITIVE_INFINITY;
    } else if(val == '-.inf') {
        return Number.NEGATIVE_INFINITY;
    } else if(temp = val.match(dashesString)) {
        return temp[1];
    } else if(temp = val.match(quotesString)) {
        return temp[1];
    } else if(temp = val.match(float)) {
        return parseFloat(temp[0]);
    } else if(temp = val.match(integer)) {
        return parseInt(temp[0]);
    } else if(!isNaN(temp = Date.parse(val))) {
        return new Date(temp);
    } else if(temp = val.match(single_key_value)) {
        let res = {};
        res[temp[1]] = processValue(temp[2]);
        return res;
    } else if(temp = val.match(array)){
        let count = 0, c = ' ';
        let res = [];
        let content = "";
        let str = false;
        for(let j = 0, len = temp[1].length; j < len; ++j) {
            c = temp[1][j];
            if(c == '\'' || c == '"') {
                if(str === false) {
                    str = c;
                    content += c;
                    continue;
                } else if((c == '\'' && str == '\'') || (c == '"' && str == '"')) {
                    str = false;
                    content += c;
                    continue;
                }
            } else if(str === false && (c == '[' || c == '{')) {
                count++;
            } else if(str === false && (c == ']' || c == '}')) {
                count--;
            } else if(str === false && count == 0 && c == ',') {
                res.push(processValue(content));
                content = "";
                continue;
            }
            
            content += c;
        }
        
        if(content.length > 0)
            res.push(processValue(content));
        return res;

    } else if(temp = val.match(map)){
        let count = 0, c = ' ';
        const res = [];
        let content = "";
        let str = false;
        let lenJ = temp[1].length;
        for(let j = 0; j < lenJ; ++j) {
            c = temp[1][j];
            if(c == '\'' || c == '"') {
                if(str === false) {
                    str = c;
                    content += c;
                    continue;
                } else if((c == '\'' && str == '\'') || (c == '"' && str == '"')) {
                    str = false;
                    content += c;
                    continue;
                }
            } else if(str === false && (c == '[' || c == '{')) {
                ++count;
            } else if(str === false && (c == ']' || c == '}')) {
                --count;
            } else if(str === false && count == 0 && c == ',') {
                res.push(content);
                content = "";
                continue;
            }
            
            content += c;
        }
        
        if(content.length > 0)
            res.push(content);
            
        let newRes = {};
        for(let j = 0, len = res.length; j < len; ++j) {
            if(temp = res[j].match(key_value)) {
                newRes[temp[1]] = processValue(temp[2]);
            }
        }
        
        return newRes;
    } else 
        return val;
}

const foldedStyleScalar = (block) => {
    let lines = block.lines;
    let children = block.children;
    let str = lines.join(" ");
    let chunks = [str];
    for(let i = 0, len = children.length; i < len; ++i) {
        chunks.push(foldedStyleScalar(children[i]));
    }
    return chunks.join("\n");
}

const literalStyleScalar = (block) => {
    let lines = block.lines;
    let children = block.children;
    let str = lines.join("\n");
    for(let i = 0, len = children.length; i < len; ++i) {
        str += literalStyleScalar(children[i]);
    }
    return str;
}

const objectTransform = (blocks) => {
    const key = new RegExp("([a-z0-9_-][ a-z0-9_-]+):( .+)?", "i");
    const item = new RegExp("^-\\s+");
    const reference_blocks = [];
    let temp = null;
    let res = {};
    let lines = null;
    let children = null;
    let currentObj = null;
    
    let level = -1;
    
    let processedBlocks = [];
    
    let isMap = true;
    
    for(let j = 0, len = blocks.length; j < len; ++j) {
        
        if(level != -1 && level != blocks[j].level)
            continue;
    
        processedBlocks.push(j);
    
        level = blocks[j].level;
        lines = blocks[j].lines;
        children = blocks[j].children;
        currentObj = null;
        
        for(let i = 0, len = lines.length; i < len; ++i) {
            let line = lines[i];

            if(temp = line.match(key)) {
                let key = temp[1];
                
                if(key[0] == '-') {
                    key = key.replace(item, "");
                    if (isMap) { 
                        isMap = false;
                        if (typeof(res.length) === "undefined") {
                            res = [];
                        } 
                    }
                    if(currentObj != null) res.push(currentObj);
                    currentObj = {};
                    isMap = true;
                }
                
                if(typeof temp[2] != "undefined") {
                    let value = temp[2].trim();
                    if(value[0] == '&') {
                        let nb = objectTransform(children);
                        if(currentObj != null) currentObj[key] = nb;
                        else res[key] = nb;
                        reference_blocks[value.substr(1)] = nb;
                    } else if(value[0] == '|') {
                        if(currentObj != null) currentObj[key] = literalStyleScalar(children.shift());
                        else res[key] = literalStyleScalar(children.shift());
                    } else if(value[0] == '*') {
                        let v = value.substr(1);
                        let no = {};
                        
                        if(typeof reference_blocks[v] == "undefined") {
                            throw("Reference '" + v + "' not found!");
                        } else {
                            for(let k in reference_blocks[v]) {
                                no[k] = reference_blocks[v][k];
                            }
                            
                            if(currentObj != null) currentObj[key] = no;
                            else res[key] = no;
                        }
                    } else if(value[0] == '>') {
                        if(currentObj != null) currentObj[key] = foldedStyleScalar(children.shift());
                        else res[key] = foldedStyleScalar(children.shift());
                    } else {
                        if(currentObj != null) currentObj[key] = processValue(value);
                        else res[key] = processValue(value);
                    }
                } else {
                    if(currentObj != null) currentObj[key] = objectTransform(children);
                    else res[key] = objectTransform(children);                        
                }
            } else if(line.match(/^-\s*$/)) {
                if (isMap) { 
                    isMap = false;
                    if (typeof(res.length) === "undefined") {
                        res = [];
                    } 
                }
                if(currentObj != null) res.push(currentObj);
                currentObj = {};
                isMap = true;
                continue;
            } else if(temp = line.match(/^-\s*(.*)/)) {
                if(currentObj != null) 
                    currentObj.push(processValue(temp[1]));
                else {
                    if (isMap) { 
                        isMap = false;
                        if (typeof(res.length) === "undefined") {
                            res = [];
                        } 
                    }
                    res.push(processValue(temp[1]));
                }
                continue;
            }
        }
        
        if(currentObj != null) {
            if (isMap) { 
                isMap = false;
                if (typeof(res.length) === "undefined") {
                    res = [];
                } 
            }
            res.push(currentObj);
        }
    }
    
    for(let j = processedBlocks.length - 1; j >= 0; --j) {
        blocks.splice.call(blocks, processedBlocks[j], 1);
    }

    return res;
}
    
const deleteComments = (src) => {
    let lines = src.split("\n");
    let comment_indicator = new RegExp("([^\\\'\\\"#]+([\\\'\\\"][^\\\'\\\"]*[\\\'\\\"])*)*(#.*)?");

    let comment;
    for(let i in lines) {
        if(comment = lines[i].match(comment_indicator)) {
            if(typeof comment[3] !== "undefined") {
                lines[i] = comment[0].substr(0, comment[0].length - comment[3].length);
            }
        }
    }
    
    return lines.join("\n");
}

const parseYAML = (file) => {
    let str = deleteComments(file)

    let blocks = parse(str);

    let result = objectTransform(blocks.children);
    
    return result;
}


module.exports = parseYAML;