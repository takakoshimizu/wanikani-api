// Converts an object with snake_case keys to camelCase
export var convertCase = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    if (obj instanceof Array) {
        return obj.map((value: any) => convertCase(value));
    }

    let newObj: any = {};
    Object.keys(obj).forEach((prop: string) => {
        let key = prop.replace(/\_(.)/gim, (v) => v[1].toUpperCase());
        newObj[key] = convertCase(obj[prop]);
    });

    return newObj;
};