export var convertCase = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    if (obj instanceof Array) {
        return obj.map((value: any) => convertCase(value));
    }

    var newObj: any = {};
    Object.keys(obj).forEach((prop: string) => {
        var key = prop.replace(/\_(.)/gim, (v) => v[1].toUpperCase());
        newObj[key] = convertCase(obj[prop]);
    });

    return newObj;
};